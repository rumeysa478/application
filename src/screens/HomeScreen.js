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
  ScrollView,
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
import { getUserProfile } from '../services/userService';
import LivingWidget from '../components/LivingWidget';
import THEME from '../theme/theme';

export default function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [profile, setProfile] = useState(null);
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

  // Ekran her odaklandığında listeyi ve profili güncelle
  const loadData = useCallback(async () => {
    try {
      const [habitsData, profileData] = await Promise.all([
        getHabits(),
        getUserProfile(),
      ]);
      setHabits(habitsData);
      setProfile(profileData);
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Erteleme (Snooze) Mantığı (Maksimum 3 kez)
  const handleSnooze = async (item) => {
    if (!isWithinActiveHours(item)) {
      Alert.alert(
        '💤 Uyku Modu',
        `"${item.title}" şu an aktif çalışma saatleri (${getTodayHoursText(item)}) dışındadır. Uyku vaktinde bildirimler sessize alınır.`
      );
      return;
    }

    const currentSnooze = item.snoozeCount || 0;

    if (currentSnooze < 3) {
      try {
        const isMedication = item.type === 'medication';
        const snoozeMins = isMedication ? 15 : (Number(item.snoozeMinutes) || 30);
        const updated = await snoozeHabit(item.id);
        const { fact } = await scheduleSnoozeNotification(item, snoozeMins);
        await loadData();

        const remaining = 3 - (updated ? updated.snoozeCount : currentSnooze + 1);

        Alert.alert(
          `⏳ ${snoozeMins} Dakika Ertelendi`,
          `Hatırlatma ${snoozeMins} dakika sonraya planlandı.\n\nKalan erteleme hakkınız: ${remaining}/3\n\n💡 Biliyor muydunuz?\n"${fact.fact}"`
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

    const isMedication = item.type === 'medication';
    const proofTargetText = isMedication ? 'ilaç kutusu veya tablet' : 'su bardağı';

    Alert.alert(
      '🚨 ZORUNLU KANIT MODU!',
      `3 erteleme hakkınız doldu! Telefonunuz bir ${proofTargetText} fotoğrafı çekip yapay zekâya onaylatana kadar titremeye devam edecektir.`,
      [
        {
          text: '📸 Hemen Kanıtla & Sustur',
          onPress: () => handleOpenProofCamera(item, 'mandatory'),
        },
      ],
      { cancelable: false }
    );
  };

  // Kamera Kanıt Ekranına Yönlendirme (Zorunlu veya Ek Kanıt)
  const handleOpenProofCamera = (item, proofType = 'mandatory') => {
    const isMedication = item.type === 'medication';
    navigation.navigate('CameraProof', {
      habitId: item.id,
      habitTitle: item.title,
      habitType: isMedication ? 'medication' : 'water',
      portionLiters: Number(item.portionLiters) || 0.25,
      proofType,
      zeroSnooze: (item.snoozeCount || 0) === 0,
      onTime: isWithinActiveHours(item),
    });
  };

  // Her An Hızlı Kanıt Ekle
  const handleQuickProof = () => {
    const waterHabit = habits.find((h) => h.type === 'water' || !h.type) || habits[0];
    if (waterHabit) {
      handleOpenProofCamera(waterHabit, 'extra');
    } else {
      navigation.navigate('AddHabit');
    }
  };

  // Alışkanlık Düzenleme Ekranına Yönlendirme
  const handleEditHabit = (item) => {
    navigation.navigate('EditHabit', { habit: item });
  };

  // Alışkanlığı Sıfırla
  const handleReset = async (item) => {
    const isMedication = item.type === 'medication';
    const textTarget = isMedication ? 'ilaç dozlarını' : 'su tüketimini';

    Alert.alert(
      'Bugünü Sıfırla',
      `"${item.title}" için bugünkü ${textTarget} sıfırlayıp baştan başlatmak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await resetHabit(item.id);
            await loadData();
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
        'Bildirim merkezini / kilit ekranınızı kontrol edin.'
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

  const getTodayHoursText = (item) => {
    if (!item?.daysConfig) return '09:00 - 23:00';
    const dayKey = DAY_KEYS[new Date().getDay()];
    const setting = item.daysConfig[dayKey];
    if (!setting || !setting.active) return 'Bugün Pasif';
    return `${setting.startHour || '09:00'} - ${setting.endHour || '23:00'}`;
  };

  const renderHabitCard = ({ item }) => {
    const isMedication = item.type === 'medication';
    const maxSnooze = item.maxSnooze || 3;
    const currentSnooze = item.snoozeCount || 0;
    const remainingSnooze = Math.max(0, maxSnooze - currentSnooze);
    const isAlertActive = activeAlertHabit && activeAlertHabit.id === item.id;

    // Su değişkenleri
    const targetLiters = Number(item.dailyTargetLiters) || 2.5;
    const currentIntake = Number(item.todayIntakeLiters || 0);

    // İlaç değişkenleri
    const targetDoses = Number(item.targetDoses || (item.medicationTimes?.length || 1));
    const currentDoses = Number(item.dosesToday || 0);

    // İlerleme ve Tamamlanma
    const percentage = isMedication
      ? Math.min(100, Math.round((currentDoses / targetDoses) * 100))
      : Math.min(100, Math.round((currentIntake / targetLiters) * 100));

    const isGoalCompleted = isMedication
      ? currentDoses >= targetDoses
      : currentIntake >= targetLiters;

    const isWorkingHours = isWithinActiveHours(item);
    const snoozeDurationText = isMedication ? '15 dk' : '30 dk';

    return (
      <View
        style={[
          styles.card,
          isMedication ? styles.medCard : styles.waterCard,
          isAlertActive && styles.cardInAlert,
        ]}
      >
        {/* Kart Başlığı ve Eylem İkonları */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeftGroup}>
            {/* Dairesel İkon Rozeti */}
            <View
              style={[
                styles.iconCircle,
                isMedication ? styles.medIconCircle : styles.waterIconCircle,
              ]}
            >
              <Text style={styles.iconCircleEmoji}>
                {isMedication ? '💊' : '💧'}
              </Text>
            </View>

            <View style={styles.titleInfoColumn}>
              <Text style={styles.cardHeadline}>
                {isMedication ? 'İLAÇ İÇ' : 'SU İÇ'}
              </Text>
              <Text style={styles.intervalSubtext}>
                {isMedication
                  ? `günde ${targetDoses} doz • ${item.title}`
                  : `hedef: ${targetLiters.toFixed(2)} L • ${item.title}`}
              </Text>
            </View>
          </View>

          {/* Dairesel Aksiyon İkonları (Düzenle & Sil) */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.actionCircleBtn,
                isMedication ? styles.medActionCircle : styles.waterActionCircle,
              ]}
              onPress={() => handleEditHabit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionCircleText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionCircleBtn,
                isMedication ? styles.medActionCircle : styles.waterActionCircle,
              ]}
              onPress={() => handleDelete(item.id, item.title)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionCircleText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Çift Tonlu İlerleme Çubuğu & Metrikler */}
        <View style={styles.progressSection}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>
              {isMedication
                ? `günlük ilaç tüketimi: ${currentDoses} / ${targetDoses}`
                : `günlük su tüketimi: ${currentIntake.toFixed(2)} / ${targetLiters.toFixed(2)} L`}
            </Text>
            <Text
              style={[
                styles.percentText,
                isMedication ? styles.medPercentText : styles.waterPercentText,
              ]}
            >
              %{percentage}
            </Text>
          </View>

          {/* İlerleme Çubuğu Kanalı (Track) ve Dolgusu (Fill) */}
          <View
            style={[
              styles.progressTrack,
              isMedication ? styles.medProgressTrack : styles.waterProgressTrack,
            ]}
          >
            <View
              style={[
                styles.progressFill,
                isMedication ? styles.medProgressFill : styles.waterProgressFill,
                { width: `${percentage}%` },
              ]}
            />
          </View>
        </View>

        {/* Bilgilendirme Rozetleri (Hap Formatında) */}
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.pillBadge,
              isMedication ? styles.medPillBadge : styles.waterPillBadge,
            ]}
          >
            <Text
              style={[
                styles.pillBadgeText,
                isMedication ? styles.medPillBadgeText : styles.waterPillBadgeText,
              ]}
            >
              {isWorkingHours
                ? `${getTodayHoursText(item)}`
                : `💤 uyku modu (${getTodayHoursText(item)})`}
            </Text>
          </View>

          {item.lastProofAt && (
            <View
              style={[
                styles.pillBadge,
                isMedication ? styles.medPillBadge : styles.waterPillBadge,
              ]}
            >
              <Text
                style={[
                  styles.pillBadgeText,
                  isMedication ? styles.medPillBadgeText : styles.waterPillBadgeText,
                ]}
              >
                son kanıt: {formatProofTime(item.lastProofAt)}
              </Text>
            </View>
          )}

          {!isGoalCompleted && (
            <View
              style={[
                styles.pillBadge,
                isMedication ? styles.medSnoozeBadge : styles.waterSnoozeBadge,
              ]}
            >
              <Text
                style={[
                  styles.pillBadgeText,
                  isMedication ? styles.medSnoozeBadgeText : styles.waterSnoozeBadgeText,
                ]}
              >
                ertele: {currentSnooze}/{maxSnooze}
              </Text>
            </View>
          )}

          {isGoalCompleted && (
            <View style={[styles.pillBadge, styles.completedPillBadge]}>
              <Text style={styles.completedPillBadgeText}>
                ✓ tamamlandı! 🎉
              </Text>
            </View>
          )}
        </View>

        {/* Alt Aksiyon Butonları (Tam Pill & Güneş Sarısı Zemin) */}
        <View style={styles.actionButtonsRow}>
          {/* ⭐📸 Kanıt Ekle Butonu */}
          <TouchableOpacity
            style={styles.actionButtonYellow}
            activeOpacity={0.8}
            onPress={() =>
              handleOpenProofCamera(
                item,
                isAlertActive ? 'mandatory' : isGoalCompleted ? 'extra' : 'mandatory'
              )
            }
          >
            <Text style={styles.actionTextOrange}>⭐📸 kanıt ekle</Text>
          </TouchableOpacity>

          {/* ⏳ Ertele Butonu veya Sıfırla */}
          {isGoalCompleted ? (
            <TouchableOpacity
              style={styles.actionButtonYellow}
              activeOpacity={0.8}
              onPress={() => handleReset(item)}
            >
              <Text style={styles.actionTextBrown}>🔄 sıfırla</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButtonYellow,
                remainingSnooze === 0 && styles.actionButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSnooze(item)}
              disabled={remainingSnooze === 0}
            >
              <Text
                style={[
                  styles.actionTextBrown,
                  remainingSnooze === 0 && styles.actionTextDisabled,
                ]}
              >
                {remainingSnooze === 0
                  ? '🚨 hak bitti'
                  : `⏳ ertele (${snoozeDurationText})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 6.1 Üst Bar (Header & Top Chrome) */}
      <View style={styles.topHeader}>
        {/* Sol: Siyah Dairesel Avatar Çerçevesi */}
        <TouchableOpacity
          style={styles.avatarCircleBlack}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.avatarEmoji}>{profile?.avatar || '🌟'}</Text>
        </TouchableOpacity>

        {/* Merkez: HabiTime Başlığı */}
        <View style={styles.centerBrand}>
          <Text style={styles.brandTitle}>HabiTime</Text>
          <View style={styles.scorePillSmall}>
            <Text style={styles.scorePillSmallText}>🪙 {profile?.totalScore || 0}</Text>
            {profile?.isDoublePointsActiveToday && (
              <Text style={styles.multiplierBadgeText}>🔥 2x</Text>
            )}
          </View>
        </View>

        {/* Sağ: İki Dairesel #00C2CB Buton (Pazar & Yarışma) */}
        <View style={styles.headerRightCircles}>
          <TouchableOpacity
            style={styles.cyanCircleBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('WidgetShop')}
          >
            <Text style={styles.circleBtnIcon}>🛒</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cyanCircleBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={styles.circleBtnIcon}>🏆</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Aktif Titreşim / Zorunlu Mod Üst Bildirim Şeridi */}
      {activeAlertHabit && (
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerContent}>
            <Text style={styles.alertBannerTitle}>
              🚨 ZORUNLU MOD: Titreşim Aktif!
            </Text>
            <Text style={styles.alertBannerSubtitle}>
              "{activeAlertHabit.title}" için 3 erteleme bitti. Fotoğraf onaylanana kadar titreşim devam eder.
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

      {/* Alışkanlıklar ve Maskot Listesi */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00C2CB']}
            tintColor="#00C2CB"
          />
        }
        ListHeaderComponent={
          <>
            {/* 6.2 Yaşayan Çiçek / Şifa Maskotu Kartı */}
            <LivingWidget
              activeWidgetId={
                profile?.activeWidgetId ||
                (habits.some((h) => h.type === 'medication') &&
                !habits.some((h) => h.type === 'water' || !h.type)
                  ? 'healer_tier_1'
                  : 'flower_tier_1')
              }
              healthPercent={profile?.widgetHealth || 65}
              progressPercent={
                Math.min(
                  100,
                  Math.round(
                    ((habits.find((h) => h.type === 'water' || !h.type)?.todayIntakeLiters || 0) /
                      (habits.find((h) => h.type === 'water' || !h.type)?.dailyTargetLiters || 2.5)) *
                      100
                  )
                )
              }
              totalIntake={habits.find((h) => h.type === 'water' || !h.type)?.todayIntakeLiters || 0}
              targetIntake={habits.find((h) => h.type === 'water' || !h.type)?.dailyTargetLiters || 2.5}
              dosesToday={habits.find((h) => h.type === 'medication')?.dosesToday || 0}
              targetDoses={
                habits.find((h) => h.type === 'medication')?.targetDoses ||
                habits.find((h) => h.type === 'medication')?.medicationTimes?.length ||
                2
              }
              onOpenShop={() => navigation.navigate('WidgetShop')}
              onQuickWater={handleQuickProof}
            />

            {/* Hızlı Aksiyon & Araç Çubuğu */}
            <View style={styles.quickBar}>
              <TouchableOpacity
                style={styles.quickProofPill}
                onPress={handleQuickProof}
                activeOpacity={0.8}
              >
                <Text style={styles.quickProofPillText}>⭐📸 her an kanıt ekle (+250ml)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickToolBtn}
                onPress={handleTestNotification}
                activeOpacity={0.8}
              >
                <Text style={styles.quickToolBtnText}>🔔 Bildirim</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickToolBtn}
                onPress={() => setShowApiKeyModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickToolBtnText}>🔑 AI</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>Henüz alışkanlık eklenmedi</Text>
            <Text style={styles.emptySubtitle}>
              Sağ alttaki (+) butonuna basarak ilk Su veya İlaç alışkanlığınızı ekleyin.
            </Text>
          </View>
        }
      />

      {/* FAB: Yeni Alışkanlık Ekle Butonu */}
      <TouchableOpacity
        style={styles.fabButton}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddHabit')}
      >
        <Text style={styles.fabButtonText}>+</Text>
      </TouchableOpacity>

      {/* Gemini API Anahtarı Modalı */}
      <Modal
        visible={showApiKeyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔑 Gemini Vision API</Text>
            <Text style={styles.modalSubtitle}>
              Yapay zekâ ile su kabı ve ilaç doğrulaması için Google AI Studio anahtarınızı girin.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="AIzaSy..."
              placeholderTextColor="#94A3B8"
              value={inputApiKey}
              onChangeText={setInputApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalTestBtn}
                onPress={handleTestKey}
                disabled={isTestingKey}
              >
                <Text style={styles.modalTestText}>
                  {isTestingKey ? 'Test...' : 'Test Et'}
                </Text>
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
    backgroundColor: '#FFFFFF', // Saf beyaz tuval
  },

  // 6.1 Header & Top Chrome
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  avatarCircleBlack: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  centerBrand: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  scorePillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  scorePillSmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  multiplierBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EA580C',
  },
  headerRightCircles: {
    flexDirection: 'row',
    gap: 8,
  },
  cyanCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    backgroundColor: '#00C2CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnIcon: {
    fontSize: 18,
  },

  // Hızlı Araç Çubuğu
  quickBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  quickProofPill: {
    flex: 2,
    backgroundColor: '#FFD166',
    borderRadius: 9999,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickProofPillText: {
    color: '#FF8500',
    fontSize: 13,
    fontWeight: '900',
  },
  quickToolBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickToolBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },

  // Liste
  listContent: {
    paddingBottom: 100,
  },

  // Alışkanlık Kartları Ortak
  card: {
    borderRadius: 28,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  waterCard: {
    backgroundColor: '#99E5F2', // Pastel Gökyüzü Camgöbeği
  },
  medCard: {
    backgroundColor: '#F8A5A5', // Pastel Mercan Gül
  },
  cardInAlert: {
    borderWidth: 3,
    borderColor: '#EF4444',
  },

  // Kart Başlık Satırı
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  waterIconCircle: {
    backgroundColor: '#00C2CB',
  },
  medIconCircle: {
    backgroundColor: '#F87171',
  },
  iconCircleEmoji: {
    fontSize: 22,
  },
  titleInfoColumn: {
    flex: 1,
  },
  cardHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  intervalSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    opacity: 0.75,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterActionCircle: {
    backgroundColor: '#00C2CB',
  },
  medActionCircle: {
    backgroundColor: '#F87171',
  },
  actionCircleText: {
    fontSize: 15,
  },

  // İlerleme Çubuğu ve Metrikler
  progressSection: {
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  percentText: {
    fontSize: 15,
    fontWeight: '900',
  },
  waterPercentText: {
    color: '#0096C7',
  },
  medPercentText: {
    color: '#F59E0B',
  },

  // Çift Tonlu İlerleme Çubuğu
  progressTrack: {
    height: 18,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  waterProgressTrack: {
    backgroundColor: '#003B73', // Derin Gece Mavisi
  },
  medProgressTrack: {
    backgroundColor: '#881337', // Koyu Vişne Bordosu
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  waterProgressFill: {
    backgroundColor: '#38BDF8', // Parlak Elektrik Camgöbeği
  },
  medProgressFill: {
    backgroundColor: '#FF6B6B', // Canlı Mercan Kırmızısı
  },

  // Bilgilendirme Rozetleri
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  pillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  waterPillBadge: {
    backgroundColor: '#56CFE1',
  },
  waterPillBadgeText: {
    color: '#003B73',
  },
  medPillBadge: {
    backgroundColor: '#F87171',
  },
  medPillBadgeText: {
    color: '#450A0A',
  },
  waterSnoozeBadge: {
    backgroundColor: '#E0AAFF',
  },
  waterSnoozeBadgeText: {
    color: '#7E22CE',
  },
  medSnoozeBadge: {
    backgroundColor: '#FB923C',
  },
  medSnoozeBadgeText: {
    color: '#7C2D12',
  },
  completedPillBadge: {
    backgroundColor: '#C7F974',
  },
  completedPillBadgeText: {
    color: '#15803D',
  },

  // Eylem Butonları (Güneş Sarısı Zeminli Pill)
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonYellow: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFD166',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionTextOrange: {
    color: '#FF8500',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  actionTextBrown: {
    color: '#78350F',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  actionTextDisabled: {
    color: '#991B1B',
  },

  // FAB
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 9999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabButtonText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    marginTop: -2,
  },

  // Alert Banner
  alertBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertBannerContent: {
    flex: 1,
    marginRight: 10,
  },
  alertBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  alertBannerSubtitle: {
    color: '#FEE2E2',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  alertBannerButton: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  alertBannerButtonText: {
    color: '#FF8500',
    fontWeight: '900',
    fontSize: 13,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  modalTestBtn: {
    backgroundColor: '#00C2CB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  modalTestText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '700',
  },
  modalSaveBtn: {
    backgroundColor: '#FFD166',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  modalSaveText: {
    color: '#FF8500',
    fontWeight: '900',
  },
});
