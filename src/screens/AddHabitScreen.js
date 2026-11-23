import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { saveHabit, DEFAULT_DAYS_CONFIG } from '../services/storage';
import { scheduleHabitNotification } from '../services/notifications';
import { getUserProfile } from '../services/userService';
import TimePickerModal from '../components/TimePickerModal';

const PRESET_INTERVALS = [15, 30, 45, 60, 120, 180];
const WATER_SUGGESTIONS = ['💧 2.5L Günlük Su Hedefi', '🌊 Sabah Suyu (Büyük Bardak)', '🏃 Antrenman & Spor Suyu', '💦 Masa Başı Su Takibi'];
const MED_SUGGESTIONS = ['💊 Sabah Vitamini', '💊 Akşam Antibiyotiği', '💊 Tansiyon İlacı', '💊 Ağrı Kesici', '💊 Demir İlacı'];
const PRESET_TARGETS = [1.5, 2.0, 2.5, 3.0, 3.5];
const PRESET_PORTIONS = [0.2, 0.25, 0.33, 0.5];
const PRESET_MED_TIMES = ['08:00', '12:00', '18:00', '21:00'];

const DAY_LABELS = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar',
};

export default function AddHabitScreen({ navigation }) {
  const [habitType, setHabitType] = useState('water'); // 'water' | 'medication'
  const [title, setTitle] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [dailyTargetLiters, setDailyTargetLiters] = useState('2.5');
  const [portionLiters, setPortionLiters] = useState('0.25');
  // İlaç saatleri
  const [medicationTimes, setMedicationTimes] = useState(['09:00', '21:00']);
  const [daysConfig, setDaysConfig] = useState(DEFAULT_DAYS_CONFIG);
  const [showDaysEditor, setShowDaysEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendedTarget, setRecommendedTarget] = useState(null);

  // Alarm Saati Seçici Modal Durumu
  const [pickerModal, setPickerModal] = useState({
    visible: false,
    dayKey: null,
    field: null,
    title: '',
    initialTime: '09:00',
    mode: 'dayHour', // 'dayHour' | 'medicationDose'
  });

  // Profilde kayıtlı bilimsel su önerisini çek ve varsayılan olarak ata
  useEffect(() => {
    getUserProfile().then((p) => {
      if (p && p.recommendedLiters) {
        setDailyTargetLiters(p.recommendedLiters.toString());
        setRecommendedTarget(p.recommendedLiters);
      }
    });
  }, []);

  const openTimePicker = (dayKey, field) => {
    const currentVal =
      daysConfig[dayKey]?.[field] || (field === 'startHour' ? '09:00' : '23:00');
    const dayName = DAY_LABELS[dayKey] || '';
    const fieldName = field === 'startHour' ? 'Başlama Saati' : 'Bitiş Saati';
    setPickerModal({
      visible: true,
      dayKey,
      field,
      initialTime: currentVal,
      title: `${dayName} - ${fieldName}`,
      mode: 'dayHour',
    });
  };

  const openAddMedicationTimePicker = () => {
    setPickerModal({
      visible: true,
      dayKey: null,
      field: null,
      initialTime: '08:00',
      title: 'İlaç Doz Saati Ekle',
      mode: 'medicationDose',
    });
  };

  const handleConfirmTime = (timeStr) => {
    if (pickerModal.mode === 'medicationDose') {
      if (!medicationTimes.includes(timeStr)) {
        setMedicationTimes((prev) => [...prev, timeStr].sort());
      }
    } else if (pickerModal.dayKey && pickerModal.field) {
      updateDaySetting(pickerModal.dayKey, pickerModal.field, timeStr);
    }
    setPickerModal((prev) => ({ ...prev, visible: false }));
  };

  const removeMedicationTime = (timeToRemove) => {
    if (medicationTimes.length <= 1) {
      Alert.alert('Uyarı', 'En az bir ilaç doz saati bulunmalıdır.');
      return;
    }
    setMedicationTimes((prev) => prev.filter((t) => t !== timeToRemove));
  };

  const addPresetMedTime = (timeStr) => {
    if (!medicationTimes.includes(timeStr)) {
      setMedicationTimes((prev) => [...prev, timeStr].sort());
    }
  };

  const updateDaySetting = (dayKey, field, value) => {
    setDaysConfig((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const applyHoursToAllDays = (sourceDayKey) => {
    const source = daysConfig[sourceDayKey];
    if (!source) return;

    const newConfig = {};
    Object.keys(daysConfig).forEach((key) => {
      newConfig[key] = {
        ...daysConfig[key],
        startHour: source.startHour,
        endHour: source.endHour,
      };
    });

    setDaysConfig(newConfig);
    Alert.alert(
      'Uygulandı',
      `${DAY_LABELS[sourceDayKey]} saatleri (${source.startHour} - ${source.endHour}) haftanın tüm günlerine kopyalandı.`
    );
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Eksik Bilgi', 'Lütfen alışkanlık adını girin.');
      return;
    }

    const isMedication = habitType === 'medication';

    if (isMedication) {
      if (!medicationTimes || medicationTimes.length === 0) {
        Alert.alert('Eksik Bilgi', 'Lütfen en az bir ilaç doz saati ekleyin.');
        return;
      }
    } else {
      const minutes = parseInt(intervalMinutes, 10);
      if (isNaN(minutes) || minutes <= 0) {
        Alert.alert('Geçersiz Süre', 'Lütfen 0\'dan büyük geçerli bir dakika değeri girin.');
        return;
      }

      const targetLiters = parseFloat(dailyTargetLiters);
      if (isNaN(targetLiters) || targetLiters <= 0) {
        Alert.alert('Geçersiz Hedef', 'Lütfen geçerli bir günlük su hedefi girin.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const newHabit = await saveHabit({
        title: trimmedTitle,
        type: habitType,
        intervalMinutes: isMedication ? null : parseInt(intervalMinutes, 10),
        dailyTargetLiters: isMedication ? null : parseFloat(dailyTargetLiters),
        portionLiters: isMedication ? null : (parseFloat(portionLiters) || 0.25),
        medicationTimes: isMedication ? medicationTimes : null,
        targetDoses: isMedication ? medicationTimes.length : null,
        daysConfig,
      });

      // Hatırlatma bildirimini planla
      try {
        await scheduleHabitNotification(newHabit);
      } catch (notifErr) {
        console.warn('Bildirim planlanamadı:', notifErr);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Hata', 'Alışkanlık kaydedilirken bir sorun oluştu.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Alışkanlık Türü Seçimi: Su vs. İlaç */}
        <View style={styles.typeSelectorContainer}>
          <TouchableOpacity
            style={[
              styles.typeTabButton,
              habitType === 'water' && styles.typeTabButtonActive,
            ]}
            onPress={() => {
              setHabitType('water');
              if (!title || title.includes('İlaç') || title.includes('Vitamini')) {
                setTitle('💧 Günlük Su Hedefi');
              }
            }}
          >
            <Text
              style={[
                styles.typeTabText,
                habitType === 'water' && styles.typeTabTextActive,
              ]}
            >
              💧 Su Takibi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeTabButton,
              habitType === 'medication' && styles.typeTabButtonActive,
            ]}
            onPress={() => {
              setHabitType('medication');
              if (!title || title.includes('Su')) {
                setTitle('💊 Sabah Vitamini');
              }
            }}
          >
            <Text
              style={[
                styles.typeTabText,
                habitType === 'medication' && styles.typeTabTextActive,
              ]}
            >
              💊 İlaç Takibi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Alışkanlık Adı Alanı */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {habitType === 'medication' ? '💊 İlaç Adı / Açıklaması' : 'Alışkanlık Adı'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              habitType === 'medication'
                ? 'Örn: Sabah Vitamini, Antibiyotik...'
                : 'Örn: 2.5L Günlük Su Hedefi...'
            }
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          <View style={styles.suggestionsRow}>
            {(habitType === 'medication' ? MED_SUGGESTIONS : WATER_SUGGESTIONS).map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.suggestionChip}
                onPress={() => setTitle(item)}
              >
                <Text style={styles.suggestionChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ================= SU ALIŞKANLIĞI ALANLARI ================= */}
        {habitType === 'water' && (
          <>
            {/* Günlük Su Hedefi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>💧 Günlük Su Hedefi (Litre)</Text>
              <Text style={styles.helperText}>
                Fotoğraf çekip su içtikçe bar dolar. Günlük hedef dolmadan gün tamamlandı sayılmaz:
              </Text>

              <View style={styles.chipsRow}>
                {PRESET_TARGETS.map((target) => {
                  const isSelected = dailyTargetLiters === target.toString();
                  return (
                    <TouchableOpacity
                      key={target}
                      style={[styles.chipButton, isSelected && styles.chipButtonActive]}
                      onPress={() => setDailyTargetLiters(target.toString())}
                    >
                      <Text
                        style={[
                          styles.chipButtonText,
                          isSelected && styles.chipButtonTextActive,
                        ]}
                      >
                        {target} L
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  keyboardType="numeric"
                  value={dailyTargetLiters}
                  onChangeText={(t) => setDailyTargetLiters(t.replace(/[^0-9.]/g, ''))}
                />
                <Text style={styles.suffixText}>Litre / gün</Text>
              </View>

              {recommendedTarget && (
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>
                    ✨ Profilinize (EFSA/WHO rehberi) göre önerilen hedef: {recommendedTarget} L
                  </Text>
                </View>
              )}
            </View>

            {/* Bir Bardak/Doğrulama Miktarı */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>🥛 Tek Seferlik Bardak Miktarı</Text>
              <View style={styles.chipsRow}>
                {PRESET_PORTIONS.map((portion) => {
                  const isSelected = portionLiters === portion.toString();
                  return (
                    <TouchableOpacity
                      key={portion}
                      style={[styles.chipButton, isSelected && styles.chipButtonActive]}
                      onPress={() => setPortionLiters(portion.toString())}
                    >
                      <Text
                        style={[
                          styles.chipButtonText,
                          isSelected && styles.chipButtonTextActive,
                        ]}
                      >
                        {portion * 1000} ml
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Hatırlatma Sıklığı */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>⏱️ Hatırlatma Sıklığı (Dakika)</Text>
              <View style={styles.chipsRow}>
                {PRESET_INTERVALS.map((mins) => {
                  const isSelected = intervalMinutes === mins.toString();
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.chipButton, isSelected && styles.chipButtonActive]}
                      onPress={() => setIntervalMinutes(mins.toString())}
                    >
                      <Text
                        style={[
                          styles.chipButtonText,
                          isSelected && styles.chipButtonTextActive,
                        ]}
                      >
                        {mins >= 60 ? `${mins / 60} saat` : `${mins} dk`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Çalışma Saatleri & Uyku Koruması (Haftalık Gün Bazlı) */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.toggleSectionBtn}
                onPress={() => setShowDaysEditor(!showDaysEditor)}
              >
                <Text style={styles.toggleSectionText}>
                  📅 Çalışma ve Uyku Saatleri (09:00 - 23:00) {showDaysEditor ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.helperText}>
                Belirlediğiniz saatler dışında uygulama uyku modundadır; gece yarısı rahatsız edilmezsiniz.
              </Text>

              {showDaysEditor && (
                <View style={styles.daysListContainer}>
                  <View style={styles.daysHeaderRow}>
                    <Text style={styles.daysHeaderTitle}>Haftalık Gün Ayarları</Text>
                    <TouchableOpacity
                      style={styles.applyAllBtn}
                      onPress={() => applyHoursToAllDays('monday')}
                    >
                      <Text style={styles.applyAllBtnText}>Pzt'yi Tümüne Uygula</Text>
                    </TouchableOpacity>
                  </View>

                  {Object.keys(daysConfig).map((dayKey) => {
                    const day = daysConfig[dayKey];
                    return (
                      <View key={dayKey} style={styles.dayCard}>
                        <View style={styles.dayHeader}>
                          <Text style={styles.dayName}>{DAY_LABELS[dayKey]}</Text>
                          <View style={styles.switchRow}>
                            <Text style={day.active ? styles.activeStatus : styles.passiveStatus}>
                              {day.active ? 'Aktif' : 'Pasif'}
                            </Text>
                            <Switch
                              value={day.active}
                              onValueChange={(val) => updateDaySetting(dayKey, 'active', val)}
                              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                              thumbColor={day.active ? '#4F46E5' : '#F1F5F9'}
                            />
                          </View>
                        </View>

                        {day.active && (
                          <View style={styles.hoursRow}>
                            <View style={styles.hourInputGroup}>
                              <Text style={styles.hourLabel}>Başla:</Text>
                              <TouchableOpacity
                                style={styles.timeSelectButton}
                                onPress={() => openTimePicker(dayKey, 'startHour')}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.timeSelectButtonText}>
                                  ⏰ {day.startHour || '09:00'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.hourSeparator}>—</Text>
                            <View style={styles.hourInputGroup}>
                              <Text style={styles.hourLabel}>Bitir:</Text>
                              <TouchableOpacity
                                style={styles.timeSelectButton}
                                onPress={() => openTimePicker(dayKey, 'endHour')}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.timeSelectButtonText}>
                                  ⏰ {day.endHour || '23:00'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {/* ================= İLAÇ ALIŞKANLIĞI ALANLARI ================= */}
        {habitType === 'medication' && (
          <>
            {/* İlaç Doz Saatleri */}
            <View style={styles.formGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>⏰ İlaç Alınacak Saatler</Text>
                <TouchableOpacity
                  style={styles.addDoseButton}
                  onPress={openAddMedicationTimePicker}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addDoseButtonText}>+ Saat Ekle</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.helperText}>
                Günde {medicationTimes.length} doz planlandı. Her doz saatinde kanıt fotoğrafı çekildiğinde günlük hedef tamamlanır:
              </Text>

              {/* Seçili Doz Saatleri */}
              <View style={styles.dosePillsRow}>
                {medicationTimes.map((doseTime) => (
                  <View key={doseTime} style={styles.dosePill}>
                    <Text style={styles.dosePillText}>⏰ {doseTime}</Text>
                    <TouchableOpacity
                      onPress={() => removeMedicationTime(doseTime)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.dosePillDelete}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Hızlı Ekleme Hazır Saatleri */}
              <Text style={styles.quickAddLabel}>Hızlı Ekle:</Text>
              <View style={styles.chipsRow}>
                {PRESET_MED_TIMES.map((timeStr) => {
                  const isAdded = medicationTimes.includes(timeStr);
                  return (
                    <TouchableOpacity
                      key={timeStr}
                      style={[styles.chipButton, isAdded && styles.chipButtonActive]}
                      onPress={() => (isAdded ? removeMedicationTime(timeStr) : addPresetMedTime(timeStr))}
                    >
                      <Text
                        style={[
                          styles.chipButtonText,
                          isAdded && styles.chipButtonTextActive,
                        ]}
                      >
                        {isAdded ? `✓ ${timeStr}` : `+ ${timeStr}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* İlacın Alınacağı Günler */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>📅 İlacın Alınacağı Günler</Text>
              <Text style={styles.helperText}>
                Bu ilacı haftanın hangi günlerinde almanız gerekiyorsa aktif bırakın:
              </Text>

              <View style={styles.medDaysGrid}>
                {Object.keys(daysConfig).map((dayKey) => {
                  const day = daysConfig[dayKey];
                  return (
                    <TouchableOpacity
                      key={dayKey}
                      style={[
                        styles.medDayChip,
                        day.active && styles.medDayChipActive,
                      ]}
                      onPress={() => updateDaySetting(dayKey, 'active', !day.active)}
                    >
                      <Text
                        style={[
                          styles.medDayChipText,
                          day.active && styles.medDayChipTextActive,
                        ]}
                      >
                        {DAY_LABELS[dayKey].substring(0, 3)}
                      </Text>
                      <Text
                        style={[
                          styles.medDayStatusText,
                          day.active && styles.medDayStatusTextActive,
                        ]}
                      >
                        {day.active ? '✓' : '—'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* İlaç Özel Erteleme Kuralı Bilgisi */}
            <View style={styles.medSnoozeBanner}>
              <Text style={styles.medSnoozeTitle}>⏳ 15 Dakika Erteleme Kuralı</Text>
              <Text style={styles.medSnoozeText}>
                İlaç alışkanlıklarında kritik zamanlama nedeniyle erteleme süresi sabit 15 dakikadır (Su için 30 dk). Maksimum 3 erteleme hakkınız bulunur.
              </Text>
            </View>
          </>
        )}

        {/* Habitime Kuralı Bilgi Kartı */}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleCardTitle}>
            {habitType === 'medication' ? '💡 Vision AI İlaç Doğrulama' : '💡 Yapay Zekâ Destekli Doğrulama'}
          </Text>
          <Text style={styles.ruleCardBody}>
            {habitType === 'medication'
              ? `• Hatırlatma saatinde kamerayla ilaç kutusunu, hap blisterini veya tabletinizi gösterin.\n• Vision AI ilacı doğruladığında doz tamamlandı kaydedilir.\n• Fotoğraflar cihazda kalıcı olarak saklanmaz, yalnızca doğrulama zamanı işlenir.`
              : `• Hatırlatma geldiğinde kamerayla su bardağınızı veya mataranızı gösterin.\n• Vision AI su kabını doğruladığında su hanenize eklenir.\n• Günlük hedef litreye ulaşana kadar takip devam eder!`}
          </Text>
        </View>

        {/* Kaydet Butonu */}
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting
              ? 'Kaydediliyor...'
              : habitType === 'medication'
              ? '✓ İlaç Takibini Başlat'
              : '✓ Su Alışkanlığını Başlat'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Standart Alarm Saati ve Dakika Seçici Modalı */}
      <TimePickerModal
        visible={pickerModal.visible}
        initialTime={pickerModal.initialTime}
        title={pickerModal.title}
        onConfirm={handleConfirmTime}
        onClose={() => setPickerModal((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  suggestionChipText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chipButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  chipButtonTextActive: {
    color: '#FFFFFF',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 90,
    fontSize: 15,
    color: '#0F172A',
    textAlign: 'center',
  },
  suffixText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  toggleSectionBtn: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 6,
  },
  toggleSectionText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 14,
  },
  daysListContainer: {
    marginTop: 4,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  daysHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  applyAllBtn: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  applyAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStatus: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  passiveStatus: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  hourInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hourLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  hourInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    width: 60,
    textAlign: 'center',
  },
  hourSeparator: {
    fontSize: 12,
    color: '#94A3B8',
  },
  timeSelectButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSelectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  recBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  recBadgeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  ruleCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  ruleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  ruleCardBody: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Tür Seçici Segment
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 6,
  },
  typeTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  typeTabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeTabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  // İlaç Doz Saatleri
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addDoseButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addDoseButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  dosePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  dosePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#818CF8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  dosePillText: {
    color: '#3730A3',
    fontSize: 14,
    fontWeight: '700',
  },
  dosePillDelete: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 2,
  },
  quickAddLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  // İlaç Günleri Grid
  medDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  medDayChip: {
    flex: 1,
    minWidth: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  medDayChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  medDayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  medDayChipTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  medDayStatusText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '700',
  },
  medDayStatusTextActive: {
    color: '#4F46E5',
  },
  // İlaç Erteleme Bilgi Kutusu
  medSnoozeBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  medSnoozeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  medSnoozeText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
});
