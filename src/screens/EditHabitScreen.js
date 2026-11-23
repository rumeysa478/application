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

const PRESET_INTERVALS = [15, 30, 45, 60, 120, 180];
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

export default function EditHabitScreen({ route, navigation }) {
  const { habit } = route.params || {};

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

  // Günlük Çalışma Saatleri (Haftalık Ayarlar)
  const [daysConfig, setDaysConfig] = useState(
    habit?.daysConfig || DEFAULT_DAYS_CONFIG
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        intervalMinutes: minutes,
        dailyTargetLiters: targetLiters,
        portionLiters: portion,
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
        {/* Alışkanlık Adı */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Alışkanlık Adı</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

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
                      <Text style={styles.hourLabel}>Bitiş:</Text>
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
});
