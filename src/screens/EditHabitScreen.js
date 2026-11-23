import React, { useState } from 'react';
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
import { updateHabit, DEFAULT_DAYS_CONFIG } from '../services/storage';
import TimePickerModal from '../components/TimePickerModal';

const PRESET_INTERVALS = [15, 30, 45, 60, 120, 180];
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

export default function EditHabitScreen({ route, navigation }) {
  const { habit } = route.params || {};
  const isMedication = habit?.type === 'medication';

  const [title, setTitle] = useState(habit?.title || '');
  const [intervalMinutes, setIntervalMinutes] = useState(
    (habit?.intervalMinutes || 60).toString()
  );
  const [dailyTargetLiters, setDailyTargetLiters] = useState(
    (habit?.dailyTargetLiters || 2.5).toString()
  );
  const [portionLiters, setPortionLiters] = useState(
    (habit?.portionLiters || 0.25).toString()
  );
  // İlaç Doz Saatleri
  const [medicationTimes, setMedicationTimes] = useState(
    habit?.medicationTimes && habit.medicationTimes.length > 0
      ? habit.medicationTimes
      : ['09:00', '21:00']
  );

  // Günlük Çalışma Saatleri (Haftalık Ayarlar)
  const [daysConfig, setDaysConfig] = useState(
    habit?.daysConfig || DEFAULT_DAYS_CONFIG
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Standart Alarm Saat Seçici Modal Durumu
  const [pickerModal, setPickerModal] = useState({
    visible: false,
    dayKey: null,
    field: null,
    title: '',
    initialTime: '09:00',
    mode: 'dayHour', // 'dayHour' | 'medicationDose'
  });

  const openTimePicker = (dayKey, field) => {
    const currentVal =
      daysConfig[dayKey]?.[field] || (field === 'startHour' ? '09:00' : '23:00');
    const dayName = DAY_LABELS[dayKey] || '';
    const fieldName = field === 'startHour' ? 'Başlangıç Saati' : 'Bitiş Saati';
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

  // Gün ayarını güncelle
  const updateDaySetting = (dayKey, field, value) => {
    setDaysConfig((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  // Bir günün saatlerini tüm günlere kopyala
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

  const handleUpdate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Eksik Bilgi', 'Lütfen alışkanlık adını girin.');
      return;
    }

    if (isMedication) {
      if (!medicationTimes || medicationTimes.length === 0) {
        Alert.alert('Eksik Bilgi', 'Lütfen en az bir ilaç doz saati ekleyin.');
        return;
      }

      try {
        setIsSubmitting(true);
        await updateHabit({
          ...habit,
          title: trimmedTitle,
          type: 'medication',
          medicationTimes,
          targetDoses: medicationTimes.length,
          snoozeMinutes: 15,
          daysConfig,
        });

        Alert.alert('Güncellendi', 'İlaç alışkanlığı ayarları başarıyla kaydedildi!', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      } catch (error) {
        Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const minutes = parseInt(intervalMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Geçersiz Süre', 'Lütfen geçerli bir tekrar dakikası girin.');
      return;
    }

    const targetLiters = parseFloat(dailyTargetLiters);
    if (isNaN(targetLiters) || targetLiters <= 0) {
      Alert.alert('Geçersiz Hedef', 'Lütfen 0\'dan büyük bir günlük su hedefi girin.');
      return;
    }

    const portion = parseFloat(portionLiters) || 0.25;

    try {
      setIsSubmitting(true);
      await updateHabit({
        ...habit,
        title: trimmedTitle,
        type: 'water',
        intervalMinutes: minutes,
        dailyTargetLiters: targetLiters,
        portionLiters: portion,
        snoozeMinutes: 30,
        daysConfig,
      });

      Alert.alert('Güncellendi', 'Alışkanlık ayarları başarıyla kaydedildi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
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
        {/* Alışkanlık Türü Rozeti */}
        <View style={styles.typeBadgeRow}>
          <View style={[styles.typeBadge, isMedication ? styles.typeBadgeMed : styles.typeBadgeWater]}>
            <Text style={[styles.typeBadgeText, isMedication ? styles.typeBadgeTextMed : styles.typeBadgeTextWater]}>
              {isMedication ? '💊 İlaç Alışkanlığı Düzenleme' : '💧 Su Alışkanlığı Düzenleme'}
            </Text>
          </View>
        </View>

        {/* Alışkanlık / İlaç Adı */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {isMedication ? '💊 İlaç Adı' : 'Alışkanlık Adı'}
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        {/* ================= SU ALANLARI ================= */}
        {!isMedication && (
          <>
            {/* Günlük Su Hedefi */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>💧 Günlük Su Hedefi (Litre)</Text>
              <Text style={styles.helperText}>
                Günün alışkanlığı ancak bu hedef litre tamamlandığında "Bitti" sayılır.
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
            </View>

            {/* Tek Seferlik Bardak/Porsiyon Boyutu */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>🥛 Bir Doğrulamada Eklenen Su (Porsiyon)</Text>
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

            {/* Tekrar Sıklığı */}
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

            {/* Haftalık Çalışma Saatleri & Gün Bazlı Kural */}
            <View style={styles.formGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>📅 Haftalık Çalışma ve Uyku Saatleri</Text>
                <TouchableOpacity
                  style={styles.applyAllBtn}
                  onPress={() => applyHoursToAllDays('monday')}
                >
                  <Text style={styles.applyAllBtnText}>Pzt'yi Tümüne Uygula</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Uygulama bu saatler dışında uyku modunda kalır ve alarm çalmaz:
              </Text>

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
                          <Text style={styles.hourLabel}>Başlangıç:</Text>
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
                          <Text style={styles.hourLabel}>Bitiş:</Text>
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
          </>
        )}

        {/* ================= İLAÇ ALANLARI ================= */}
        {isMedication && (
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
                Günde {medicationTimes.length} doz planlandı. Seçilen saatlerdeki dozlar kamerayla doğrulandığında günün ilaç görevi biter:
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
                Haftanın hangi günlerinde bu ilacı alacağınızı belirleyin:
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

            {/* İlaç Özel Erteleme Bilgisi */}
            <View style={styles.medSnoozeBanner}>
              <Text style={styles.medSnoozeTitle}>⏳ 15 Dakika Erteleme Kuralı</Text>
              <Text style={styles.medSnoozeText}>
                İlaç alışkanlıklarında erteleme süresi sabit 15 dakikadır. Maksimum 3 erteleme hakkı dolduğunda zorunlu mod başlar.
              </Text>
            </View>
          </>
        )}

        {/* Güncelle Butonu */}
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleUpdate}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Kaydediliyor...' : '✓ Değişiklikleri Kaydet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Alarm Saati Seçici Modalı */}
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  applyAllBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  applyAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStatus: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  passiveStatus: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  hourInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hourLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  hourInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    width: 65,
    textAlign: 'center',
  },
  hourSeparator: {
    fontSize: 14,
    color: '#94A3B8',
  },
  timeSelectButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSelectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  // Tür Rozeti
  typeBadgeRow: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  typeBadgeWater: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  typeBadgeMed: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  typeBadgeTextWater: {
    color: '#1D4ED8',
  },
  typeBadgeTextMed: {
    color: '#6D28D9',
  },
  // İlaç Doz Saatleri
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
  // İlaç Günleri
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
  // İlaç Erteleme Bilgisi
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
