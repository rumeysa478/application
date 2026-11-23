import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getHabits,
  deleteHabit,
  snoozeHabit,
  resetHabit,
  isWithinActiveHours,
  DAY_KEYS,
} from '../services/storage';
import {
  requestNotificationPermissions,
  scheduleSnoozeNotification,
  sendInstantNotification,
} from '../services/notifications';
import {
  startPersistentVibration,
  stopVibration,
} from '../services/vibration';
import { getStoredApiKey, setStoredApiKey, testApiKey } from '../services/visionAi';

export default function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAlertHabit, setActiveAlertHabit] = useState(null);

  // Gemini API Anahtarı Modalı
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);

  // Bildirim izinlerini kontrol et
  useEffect(() => {
    requestNotificationPermissions();
    getStoredApiKey().then((k) => setInputApiKey(k || ''));

    return () => {
      stopVibration();
    };
  }, []);

  const handleTestKey = async () => {
    setIsTestingKey(true);
    const result = await testApiKey(inputApiKey);
    setIsTestingKey(false);
    if (result.success) {
      Alert.alert(
        '✓ Bağlantı Başarılı',
        `API anahtarı doğrulandı!\nAktif Kullanılacak Model: ${result.model}`
      );
    } else {
      Alert.alert('Bağlantı Hatası', result.error || 'API anahtarı geçersiz.');
    }
  };

  const handleSaveApiKey = async () => {
    await setStoredApiKey(inputApiKey);
    const result = await testApiKey(inputApiKey);
    setShowApiKeyModal(false);
    if (result.success) {
      Alert.alert('Kaydedildi', `API Anahtarı kaydedildi ve model bağlandı (${result.model})!`);
    } else {
      Alert.alert('Kaydedildi', 'API Anahtarı kaydedildi.');
    }
  };

  // Ekran her odaklandığında listeyi güncelle
  const loadHabits = useCallback(async () => {
    try {
      const data = await getHabits();
      setHabits(data);
    } catch (error) {
      console.error('Alışkanlıklar yüklenemedi:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  // Erteleme (Snooze) Mantığı (Maksimum 3 kez)
  const handleSnooze = async (item) => {
    // Uyku saatinde ise uyar
    if (!isWithinActiveHours(item)) {
      Alert.alert(
        '💤 Uyku Modu',
        `"${item.title}" şu an aktif çalışma saatleri (${getTodayHoursText(item)}) dışındadır. Uyku vaktinde bildirimler ve alarmlar sessize alınır.`
      );
      return;
    }

    const currentSnooze = item.snoozeCount || 0;

    if (currentSnooze < 3) {
      try {
        const updated = await snoozeHabit(item.id);
        const { fact } = await scheduleSnoozeNotification(item, 30);
        await loadHabits();

        const remaining = 3 - (updated ? updated.snoozeCount : currentSnooze + 1);

        Alert.alert(
          '⏳ 30 Dakika Ertelendi',
          `Hatırlatma 30 dakika sonraya planlandı.\n\nKalan erteleme hakkınız: ${remaining}/3\n\n💡 Biliyor muydunuz?\n"${fact.fact}"`
        );
      } catch (error) {
        Alert.alert('Hata', 'Erteleme işlemi gerçekleştirilemedi.');
        console.error(error);
      }
    } else {
      triggerZorunluMod(item);
    }
  };

  // Zorunlu Mod (Titreşimli Alarm) Tetikleyici
  const triggerZorunluMod = (item) => {
    setActiveAlertHabit(item);
    startPersistentVibration();

    Alert.alert(
      '🚨 ZORUNLU MOD BAŞLATILDI!',
      `"${item.title}" için 3/3 erteleme hakkınız doldu!\n\nKamera ile su bardağı kanıtı onaylanana kadar titreşim uyarısı devam edecektir.`,
      [
        {
          text: '📸 Kanıt Fotoğrafı Çek',
          onPress: () => handleOpenProofCamera(item),
        },
      ]
    );
  };

  // Kamera Kanıt Ekranına Yönlendirme
  const handleOpenProofCamera = (item) => {
    stopVibration();
    if (activeAlertHabit && activeAlertHabit.id === item.id) {
      setActiveAlertHabit(null);
    }
    navigation.navigate('CameraProof', {
      habitId: item.id,
      habitTitle: item.title,
      portionLiters: item.portionLiters || 0.25,
    });
  };

  // Alışkanlık Düzenleme Ekranına Yönlendirme
  const handleEditHabit = (item) => {
    navigation.navigate('EditHabit', { habit: item });
  };

  // Alışkanlığı Sıfırla
  const handleReset = async (item) => {
    Alert.alert(
      'Bugünü Sıfırla',
      `"${item.title}" için bugünkü su tüketimini sıfırlayıp baştan başlatmak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await resetHabit(item.id);
            await loadHabits();
          },
        },
      ]
    );
  };

  // Alışkanlık Silme
  const handleDelete = (id, title) => {
    Alert.alert(
      'Alışkanlığı Sil',
      `"${title}" alışkanlığını silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (activeAlertHabit && activeAlertHabit.id === id) {
              stopVibration();
              setActiveAlertHabit(null);
            }
            const updated = await deleteHabit(id);
            setHabits(updated);
          },
        },
      ]
    );
  };

  // Anında Bildirim Testi
  const handleTestNotification = async () => {
    try {
      await sendInstantNotification('Habitime Su Hatırlatıcısı');
      Alert.alert(
        '🔔 Bildirim Gönderildi',
        'Bildirim merkezini / kilit ekranınızı kontrol edin. Rastgele bir "Biliyor muydunuz?" bilgisi içerir.'
      );
    } catch (error) {
      Alert.alert('Bildirim Hatası', 'Bildirim izni verilmemiş olabilir.');
    }
  };

  // Tarih ve saat biçimlendirme
  const formatProofTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Bugünün çalışma saatini metin olarak al
  const getTodayHoursText = (item) => {
    if (!item?.daysConfig) return '09:00 - 23:00';
    const dayKey = DAY_KEYS[new Date().getDay()];
    const setting = item.daysConfig[dayKey];
    if (!setting || !setting.active) return 'Bugün Pasif';
    return `${setting.startHour || '09:00'} - ${setting.endHour || '23:00'}`;
  };

  const renderHabitCard = ({ item }) => {
    const maxSnooze = item.maxSnooze || 3;
    const currentSnooze = item.snoozeCount || 0;
    const remainingSnooze = Math.max(0, maxSnooze - currentSnooze);
    const isAlertActive = activeAlertHabit && activeAlertHabit.id === item.id;

    // Su İlerleme Hesaplaması
    const targetLiters = Number(item.dailyTargetLiters) || 2.5;
    const currentIntake = Number(item.todayIntakeLiters || 0);
    const percentage = Math.min(100, Math.round((currentIntake / targetLiters) * 100));
    const isGoalCompleted = currentIntake >= targetLiters;

    // Çalışma saati kontrolü
    const isWorkingHours = isWithinActiveHours(item);

    // Erteleme durumuna göre rozet rengi
    const snoozeBadgeColor =
      remainingSnooze === 0
        ? '#EF4444' // Kırmızı
        : remainingSnooze === 1
        ? '#F59E0B' // Turuncu
        : '#10B981'; // Yeşil

    return (
      <View style={[styles.card, isAlertActive && styles.cardInAlert]}>
        {/* Kart Başlığı ve Eylem İkonları */}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.habitTitle}>{item.title}</Text>
            <Text style={styles.intervalText}>
              ⏱️ Her {item.intervalMinutes} dk • Hedef: {targetLiters} L / gün
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleEditHabit(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.actionIconText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleDelete(item.id, item.title)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.actionIconText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Günlük Su İlerleme Çubuğu */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              💧 Günlük Su Tüketimi:{' '}
              <Text style={styles.progressBold}>
                {currentIntake.toFixed(2)} / {targetLiters.toFixed(2)} L
              </Text>
            </Text>
            <Text
              style={[
                styles.percentageText,
                isGoalCompleted && styles.percentageTextSuccess,
              ]}
            >
              %{percentage}
            </Text>
          </View>

          {/* İlerleme Çubuğu */}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percentage}%` },
                isGoalCompleted && styles.progressBarFillCompleted,
              ]}
            />
          </View>
        </View>

        {/* Bilgilendirme Rozetleri */}
        <View style={styles.badgesRow}>
          {/* Çalışma Saati Rozeti */}
          <View
            style={[
              styles.badge,
              isWorkingHours ? styles.activeHoursBadge : styles.sleepHoursBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isWorkingHours
                  ? styles.activeHoursBadgeText
                  : styles.sleepHoursBadgeText,
              ]}
            >
              {isWorkingHours
                ? `🕒 ${getTodayHoursText(item)}`
                : `💤 Uyku Modu (${getTodayHoursText(item)})`}
            </Text>
          </View>

          {/* Erteleme Rozeti */}
          {!isGoalCompleted && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: snoozeBadgeColor + '20',
                  borderColor: snoozeBadgeColor,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: snoozeBadgeColor }]}>
                ⏳ Erteleme: {currentSnooze}/{maxSnooze}
              </Text>
            </View>
          )}

          {/* Hedef Tamamlandı Rozeti */}
          {isGoalCompleted && (
            <View style={[styles.badge, styles.completedBadge]}>
              <Text style={styles.completedBadgeText}>
                ✓ Günlük Hedefe Ulaşıldı! 🎉
              </Text>
            </View>
          )}

          {/* Son Doğrulama Saati */}
          {item.lastProofAt && (
            <View style={[styles.badge, styles.timeBadge]}>
              <Text style={styles.timeBadgeText}>
                ✓ Son Kanıt: {formatProofTime(item.lastProofAt)}
              </Text>
            </View>
          )}

          {/* Zorunlu Mod Rozeti */}
          {isAlertActive && (
            <View style={[styles.badge, styles.alertBadge]}>
              <Text style={styles.alertBadgeText}>🚨 ZORUNLU MOD AKTİF</Text>
            </View>
          )}
        </View>

        {/* Aksiyon Butonları */}
        {isGoalCompleted ? (
          <View style={styles.completedActionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.kanitlaButton]}
              activeOpacity={0.8}
              onPress={() => handleOpenProofCamera(item)}
            >
              <Text style={styles.kanitlaButtonText}>
                📸 Ekstra Su Ekle (+{Math.round((item.portionLiters || 0.25) * 1000)}ml)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetSmallButton}
              activeOpacity={0.8}
              onPress={() => handleReset(item)}
            >
              <Text style={styles.resetSmallButtonText}>🔄 Sıfırla</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtonsRow}>
            {/* Kanıtla Butonu -> Kamera Ekranını Açar */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.kanitlaButton,
                isAlertActive && styles.kanitlaAlertButton,
              ]}
              activeOpacity={0.7}
              onPress={() => handleOpenProofCamera(item)}
            >
              <Text style={styles.kanitlaButtonText}>
                {isAlertActive
                  ? '📸 Sustur & Fotoğraf Çek'
                  : `📸 Kanıtla (+${Math.round((item.portionLiters || 0.25) * 1000)}ml)`}
              </Text>
            </TouchableOpacity>

            {/* Ertele Butonu */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                remainingSnooze === 0
                  ? styles.erteleDisabledButton
                  : styles.erteleButton,
              ]}
              activeOpacity={0.7}
              onPress={() => handleSnooze(item)}
            >
              <Text
                style={[
                  styles.erteleButtonText,
                  remainingSnooze === 0 && styles.erteleDisabledButtonText,
                ]}
              >
                {remainingSnooze === 0 ? '🚨 Hak Bitti' : '⏳ Ertele (30 dk)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Aktif Titreşim / Zorunlu Mod Üst Bildirim Şeridi */}
      {activeAlertHabit && (
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerContent}>
            <Text style={styles.alertBannerTitle}>
              🚨 ZORUNLU MOD: Titreşim Aktif!
            </Text>
            <Text style={styles.alertBannerSubtitle}>
              "{activeAlertHabit.title}" için 3 erteleme bitti. Su bardağı fotoğrafı onaylanana kadar devam eder.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.alertBannerButton}
            onPress={() => handleOpenProofCamera(activeAlertHabit)}
          >
            <Text style={styles.alertBannerButtonText}>📸 Kanıtla</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Test ve Hızlı Eylem Çubuğu */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={handleTestNotification}
        >
          <Text style={styles.quickButtonText}>🔔 Bildirim Testi</Text>
        </TouchableOpacity>

        {habits.length > 0 && !activeAlertHabit && (
          <TouchableOpacity
            style={[styles.quickButton, styles.quickButtonDanger]}
            onPress={() => triggerZorunluMod(habits[0])}
          >
            <Text style={[styles.quickButtonText, styles.quickButtonDangerText]}>
              🚨 Alarm Testi
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.quickButton, styles.quickButtonAi]}
          onPress={() => setShowApiKeyModal(true)}
        >
          <Text style={[styles.quickButtonText, styles.quickButtonAiText]}>
            🔑 AI Anahtarı
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alışkanlık Listesi */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💧</Text>
            <Text style={styles.emptyTitle}>Henüz alışkanlık eklemediniz</Text>
            <Text style={styles.emptySubtitle}>
              Günlük su hedefinizi belirlemek ve yapay zekâ doğrulamasıyla takip etmek için aşağıdaki "+" butonuna dokunun.
            </Text>
          </View>
        }
      />

      {/* Sağ alttaki Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddHabit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Gemini API Anahtarı Modalı */}
      <Modal
        visible={showApiKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔑 Gemini Vision API Anahtarı</Text>
            <Text style={styles.modalSubtitle}>
              Google AI Studio'dan aldığınız ücretsiz Gemini API anahtarını girerek su bardağı/kabı doğrulamasını gerçek yapay zekâ ile gerçekleştirebilirsiniz.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="AIzaSy..."
              placeholderTextColor="#94A3B8"
              value={inputApiKey}
              onChangeText={setInputApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalTestBtn}
                onPress={handleTestKey}
                disabled={isTestingKey}
              >
                {isTestingKey ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Text style={styles.modalTestText}>⚡ Test Et</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApiKeyModal(false)}
              >
                <Text style={styles.modalCancelText}>Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.modalSaveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  alertBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  alertBannerContent: {
    flex: 1,
    marginRight: 10,
  },
  alertBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  alertBannerSubtitle: {
    color: '#FEE2E2',
    fontSize: 12,
    marginTop: 2,
  },
  alertBannerButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertBannerButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  quickBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  quickButtonDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  quickButtonDangerText: {
    color: '#B91C1C',
  },
  quickButtonAi: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  quickButtonAiText: {
    color: '#15803D',
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardInAlert: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  habitTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  intervalText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    padding: 4,
  },
  actionIconText: {
    fontSize: 15,
  },
  progressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#475569',
  },
  progressBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3B82F6',
  },
  percentageTextSuccess: {
    color: '#10B981',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressBarFillCompleted: {
    backgroundColor: '#10B981',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeHoursBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  activeHoursBadgeText: {
    color: '#166534',
  },
  sleepHoursBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  sleepHoursBadgeText: {
    color: '#64748B',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  completedBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  timeBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  timeBadgeText: {
    color: '#475569',
  },
  alertBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  alertBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  completedActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kanitlaButton: {
    backgroundColor: '#4F46E5',
  },
  kanitlaAlertButton: {
    backgroundColor: '#DC2626',
  },
  kanitlaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  erteleButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  erteleButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  erteleDisabledButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  erteleDisabledButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  resetSmallButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  resetSmallButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 34,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  modalTestBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalTestText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
