import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  getUserProfile,
  updateUserProfile,
  calculateRecommendedWater,
} from '../services/userService';

const AVATARS = ['🌟', '💧', '🌿', '🚀', '🎯', '🌸', '⚡', '🧸', '🌊', '👑'];

export default function ProfileScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🌟');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [customLiters, setCustomLiters] = useState('2.5');
  const [friendCode, setFriendCode] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getUserProfile().then((p) => {
      if (p) {
        setUsername(p.username || '');
        setAvatar(p.avatar || '🌟');
        setAge(p.age ? String(p.age) : '');
        setHeight(p.height ? String(p.height) : '');
        setWeight(p.weight ? String(p.weight) : '');
        setCustomLiters(p.recommendedLiters ? String(p.recommendedLiters) : '2.5');
        setFriendCode(p.friendCode || '');
        setTotalScore(p.totalScore || 0);
      }
    });
  }, []);

  // Yaş, boy veya kilo değiştikçe önerilen suyu dinamik hesapla
  const recommendedWater = calculateRecommendedWater(weight, age, height);

  const handleApplyRecommended = () => {
    setCustomLiters(String(recommendedWater));
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir kullanıcı adı girin.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserProfile({
        username: username.trim(),
        avatar,
        age: age ? parseInt(age, 10) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        recommendedLiters: parseFloat(customLiters) || 2.5,
      });

      Alert.alert('Kaydedildi', 'Profiliniz ve su hedefiniz başarıyla güncellendi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Hata', 'Profil kaydedilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Seçimi */}
        <View style={styles.avatarSection}>
          <View style={styles.currentAvatarCircle}>
            <Text style={styles.currentAvatarText}>{avatar}</Text>
          </View>
          <Text style={styles.avatarHint}>Profil İkonunuzu Seçin</Text>

          <View style={styles.avatarsRow}>
            {AVATARS.map((av) => (
              <TouchableOpacity
                key={av}
                style={[styles.avatarChoice, avatar === av && styles.avatarChoiceSelected]}
                onPress={() => setAvatar(av)}
              >
                <Text style={styles.avatarChoiceText}>{av}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Kullanıcı Adı */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Kullanıcı adınız..."
            maxLength={30}
          />
        </View>

        {/* Arkadaş Kodu & Puan Bilgisi */}
        <View style={styles.infoCardsRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Arkadaş Davet Kodun</Text>
            <Text style={styles.infoValue}>{friendCode}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Toplam Skor</Text>
            <Text style={styles.infoValueScore}>🪙 {totalScore}</Text>
          </View>
        </View>

        {/* KİŞİSEL BİLGİLER (İSTEĞE BAĞLI) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📋 Kişisel Bilgiler (İsteğe Bağlı)</Text>
          <Text style={styles.sectionSubtitle}>
            EFSA ve WHO standartlarına uygun günlük su hedefinizi otomatik hesaplamak için bu bilgileri girebilirsiniz:
          </Text>

          <View style={styles.rowInputs}>
            <View style={styles.smallInputGroup}>
              <Text style={styles.smallLabel}>Yaş</Text>
              <TextInput
                style={styles.smallInput}
                value={age}
                onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
                placeholder="25"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.smallInputGroup}>
              <Text style={styles.smallLabel}>Boy (cm)</Text>
              <TextInput
                style={styles.smallInput}
                value={height}
                onChangeText={(t) => setHeight(t.replace(/[^0-9]/g, ''))}
                placeholder="175"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.smallInputGroup}>
              <Text style={styles.smallLabel}>Kilo (kg)</Text>
              <TextInput
                style={styles.smallInput}
                value={weight}
                onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
                placeholder="70"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          {/* Dinamik Öneri Kutusu */}
          <View style={styles.calcBox}>
            <View style={styles.calcLeft}>
              <Text style={styles.calcTitle}>Bilimsel Önerilen Su Hedefi:</Text>
              <Text style={styles.calcReference}>
                Kilo başına ~33 ml/kg formülüne dayanır.
              </Text>
            </View>
            <View style={styles.calcRight}>
              <Text style={styles.calcValue}>{recommendedWater} L</Text>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyRecommended}
              >
                <Text style={styles.applyBtnText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Günlük Hedef Litre (Özelleştirilebilir) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>💧 Günlük Su Hedefiniz (Litre)</Text>
          <Text style={styles.helperText}>
            Önerilen değeri kullanabilir veya dilediğiniz gibi değiştirebilirsiniz:
          </Text>

          <View style={styles.litersInputRow}>
            <TextInput
              style={styles.litersInput}
              value={customLiters}
              onChangeText={(t) => setCustomLiters(t.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.litersSuffix}>Litre / gün</Text>
          </View>
        </View>

        {/* Kaydet Butonu */}
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Kaydediliyor...' : '✓ Profili Kaydet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currentAvatarText: {
    fontSize: 42,
  },
  avatarHint: {
    fontSize: 13,
    color: '#000000',
    marginBottom: 10,
    fontWeight: '800',
  },
  avatarsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  avatarChoice: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChoiceSelected: {
    borderWidth: 2.5,
    borderColor: '#00C2CB',
    backgroundColor: '#CCFBF1',
  },
  avatarChoiceText: {
    fontSize: 20,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
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
  infoCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
    marginTop: 2,
  },
  infoValueScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  smallInputGroup: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '600',
  },
  calcBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLeft: {
    flex: 1,
    marginRight: 8,
  },
  calcTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  calcReference: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 2,
  },
  calcRight: {
    alignItems: 'flex-end',
  },
  calcValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
  },
  applyBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  litersInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  litersInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#4F46E5',
    width: 100,
    textAlign: 'center',
  },
  litersSuffix: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FFD166',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FF8500',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
