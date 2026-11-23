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
import { saveHabit, DEFAULT_DAYS_CONFIG } from '../services/storage';
import { scheduleHabitNotification } from '../services/notifications';

const PRESET_INTERVALS = [15, 30, 45, 60, 120, 180];
const SUGGESTIONS = ['💧 Su İç (Günlük Hedef)', '💊 Sabah İlacı', '🚶 Egzersiz Yap', '📖 Kitap Oku'];
const PRESET_TARGETS = [1.5, 2.0, 2.5, 3.0, 3.5];
const PRESET_PORTIONS = [0.2, 0.25, 0.33, 0.5];

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
  const [title, setTitle] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [dailyTargetLiters, setDailyTargetLiters] = useState('2.5');
  const [portionLiters, setPortionLiters] = useState('0.25');
  const [daysConfig, setDaysConfig] = useState(DEFAULT_DAYS_CONFIG);
  const [showDaysEditor, setShowDaysEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const portion = parseFloat(portionLiters) || 0.25;

    try {
      setIsSubmitting(true);
      const newHabit = await saveHabit({
        title: trimmedTitle,
        intervalMinutes: minutes,
        dailyTargetLiters: targetLiters,
        portionLiters: portion,
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
        {/* Alışkanlık Adı Alanı */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Alışkanlık Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 2.5L Günlük Su Hedefi..."
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map((item) => (
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
                          <TextInput
                            style={styles.hourInput}
                            value={day.startHour}
                            placeholder="09:00"
                            maxLength={5}
                            onChangeText={(val) =>
                              updateDaySetting(dayKey, 'startHour', val)
                            }
                          />
                        </View>
                        <Text style={styles.hourSeparator}>—</Text>
                        <View style={styles.hourInputGroup}>
                          <Text style={styles.hourLabel}>Bitir:</Text>
                          <TextInput
                            style={styles.hourInput}
                            value={day.endHour}
                            placeholder="23:00"
                            maxLength={5}
                            onChangeText={(val) =>
                              updateDaySetting(dayKey, 'endHour', val)
                            }
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Habitime Kuralı Bilgi Kartı */}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleCardTitle}>💡 Yapay Zekâ Destekli Doğrulama</Text>
          <Text style={styles.ruleCardBody}>
            • Hatırlatma geldiğinde kamerayla su bardağınızı veya mataranızı gösterin.{'\n'}
            • Vision AI su kabını doğruladığında su hanenize eklenir.{'\n'}
            • Günlük hedef litreye ulaşana kadar takip devam eder!
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
            {isSubmitting ? 'Kaydediliyor...' : '✓ Alışkanlığı Başlat'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
});
