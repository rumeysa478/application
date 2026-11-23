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
} from 'react-native';
import { saveHabit } from '../services/storage';

const PRESET_INTERVALS = [15, 30, 45, 60, 120, 180];
const SUGGESTIONS = ['💧 Su İç', '💊 İlaç Al', '🚶 Egzersiz Yap', '📖 Kitap Oku'];

export default function AddHabitScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      setIsSubmitting(true);
      await saveHabit({
        title: trimmedTitle,
        intervalMinutes: minutes,
      });
      // Başarıyla kaydedildi, ana ekrana dön
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
            placeholder="Örn: 2 Bardak Su İç, Vitamin Al..."
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          {/* Hızlı Öneri Etiketleri */}
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

        {/* Hatırlatma Sıklığı */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Hatırlatma Sıklığı (Dakika)</Text>
          <Text style={styles.helperText}>
            Uygulamanın kaç dakikada bir bildirim göndereceğini seçin:
          </Text>

          {/* Hızlı Seçim Butonları */}
          <View style={styles.intervalGrid}>
            {PRESET_INTERVALS.map((mins) => {
              const isSelected = intervalMinutes === mins.toString();
              return (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.intervalButton,
                    isSelected && styles.intervalButtonActive,
                  ]}
                  onPress={() => setIntervalMinutes(mins.toString())}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      isSelected && styles.intervalButtonTextActive,
                    ]}
                  >
                    {mins >= 60 ? `${mins / 60} saat` : `${mins} dk`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Özel Süre Girişi */}
          <View style={styles.customIntervalContainer}>
            <Text style={styles.customIntervalLabel}>Veya özel süre girin:</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                keyboardType="numeric"
                value={intervalMinutes}
                onChangeText={(text) => setIntervalMinutes(text.replace(/[^0-9]/g, ''))}
                maxLength={4}
              />
              <Text style={styles.minuteSuffix}>dakika</Text>
            </View>
          </View>
        </View>

        {/* Habitime Kuralı Bilgi Kartı */}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleCardTitle}>💡 Habitime Çalışma Prensibi</Text>
          <Text style={styles.ruleCardBody}>
            • Belirlediğiniz sürede bildirim alırsınız.{'\n'}
            • En fazla <Text style={styles.boldText}>3 kez (30'ar dk)</Text> erteleme hakkınız vardır.{'\n'}
            • Erteleme bittiğinde <Text style={styles.boldText}>kanıt fotoğrafı</Text> çekene kadar uyarılar durmaz!
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
            {isSubmitting ? 'Kaydediliyor...' : '✓ Alışkanlığı Kaydet'}
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
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  suggestionChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  suggestionChipText: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '500',
  },
  intervalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  intervalButton: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  intervalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },
  customIntervalContainer: {
    marginTop: 4,
  },
  customIntervalLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: 100,
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
  },
  minuteSuffix: {
    marginLeft: 10,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  ruleCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
  },
  ruleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  ruleCardBody: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
