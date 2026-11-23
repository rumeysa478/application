import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getHabits,
  deleteHabit,
  snoozeHabit,
  completeHabit,
  resetHabit,
} from '../services/storage';
import {
  requestNotificationPermissions,
  scheduleSnoozeNotification,
  sendInstantNotification,
} from '../services/notifications';
import {
  startPersistentVibration,
  stopVibration,
  isVibrationActive,
} from '../services/vibration';

export default function HomeScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAlertHabit, setActiveAlertHabit] = useState(null);

  // Bildirim izinlerini kontrol et
  useEffect(() => {
    requestNotificationPermissions();

    // Bileşen unmount olursa titreşimi durdur
    return () => {
      stopVibration();
    };
  }, []);

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
    const currentSnooze = item.snoozeCount || 0;

    if (currentSnooze < 3) {
      try {
        // Erteleme sayacını 1 artır ve kaydet
        const updated = await snoozeHabit(item.id);

        // 30 dakikalık (veya test için zamanlanmış) bildirimi planla
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
      // 3 erteleme hakkı doldu! Zorunlu modu ve titreşimi başlat
      triggerZorunluMod(item);
    }
  };

  // Zorunlu Mod (Titreşimli Alarm) Tetikleyici
  const triggerZorunluMod = (item) => {
    setActiveAlertHabit(item);
    startPersistentVibration();

    Alert.alert(
      '🚨 ZORUNLU MOD BAŞLATILDI!',
      `"${item.title}" için 3/3 erteleme hakkınız doldu!\n\nKanıt fotoğrafı çekilene kadar sürekli titreşim uyarısı devam edecektir. Durdurmak için kanıt butonuna basın.`,
      [
        {
          text: '🔕 Titreşimi Sustur / Kanıtla',
          onPress: () => handleProof(item),
        },
      ]
    );
  };

  // Kanıtla / Görevi Tamamla Mantığı
  const handleProof = async (item) => {
    // Eğer titreşim çalışıyorsa durdur
    stopVibration();
    setActiveAlertHabit(null);

    try {
      // Görevi tamamlandı olarak işaretle ve sayacı sıfırla
      await completeHabit(item.id);
      await loadHabits();

      Alert.alert(
        '🎉 Tebrikler!',
        `"${item.title}" alışkanlığı başarıyla tamamlandı ve onaylandı! Erteleme haklarınız sıfırlandı.\n\n(Bir sonraki aşamada buraya doğrudan Kamera ile fotoğraf kanıtı doğrulaması eklenecektir.)`
      );
    } catch (error) {
      console.error('Tamamlama hatası:', error);
    }
  };

  // Alışkanlığı Tekrar Başlat
  const handleReset = async (item) => {
    await resetHabit(item.id);
    await loadHabits();
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
      await sendInstantNotification('Habitime Hatırlatıcısı');
      Alert.alert(
        '🔔 Bildirim Gönderildi',
        'Bildirim merkezini / kilit ekranınızı kontrol edin. Rastgele bir "Biliyor muydunuz?" bilgisi içerir.'
      );
    } catch (error) {
      Alert.alert('Bildirim Hatası', 'Bildirim izni verilmemiş olabilir.');
    }
  };

  const renderHabitCard = ({ item }) => {
    const maxSnooze = item.maxSnooze || 3;
    const currentSnooze = item.snoozeCount || 0;
    const remainingSnooze = Math.max(0, maxSnooze - currentSnooze);
    const isAlertActive = activeAlertHabit && activeAlertHabit.id === item.id;

    // Erteleme durumuna göre rozet rengi
    const snoozeBadgeColor =
      remainingSnooze === 0
        ? '#EF4444' // Kırmızı (Hak kalmadı!)
        : remainingSnooze === 1
        ? '#F59E0B' // Turuncu
        : '#10B981'; // Yeşil

    return (
      <View style={[styles.card, isAlertActive && styles.cardInAlert]}>
        {/* Kart Başlığı ve Silme Butonu */}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.habitTitle}>{item.title}</Text>
            <Text style={styles.intervalText}>
              ⏱️ Her {item.intervalMinutes} dakikada bir
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.title)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Bilgilendirme Rozetleri */}
        <View style={styles.badgesRow}>
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
              ⏳ Erteleme: {currentSnooze}/{maxSnooze} (Kalan: {remainingSnooze})
            </Text>
          </View>

          {item.isCompleted && (
            <View style={[styles.badge, styles.completedBadge]}>
              <Text style={styles.completedBadgeText}>✓ Tamamlandı</Text>
            </View>
          )}

          {isAlertActive && (
            <View style={[styles.badge, styles.alertBadge]}>
              <Text style={styles.alertBadgeText}>🚨 ZORUNLU MOD AKTİF</Text>
            </View>
          )}
        </View>

        {/* Aksiyon Butonları */}
        {item.isCompleted ? (
          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.8}
            onPress={() => handleReset(item)}
          >
            <Text style={styles.resetButtonText}>🔄 Alışkanlığı Tekrar Başlat</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtonsRow}>
            {/* Kanıtla / Tamamla Butonu */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.kanitlaButton,
                isAlertActive && styles.kanitlaAlertButton,
              ]}
              activeOpacity={0.7}
              onPress={() => handleProof(item)}
            >
              <Text style={styles.kanitlaButtonText}>
                {isAlertActive ? '🔕 Sustur & Kanıtla' : '📸 Kanıtla'}
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
              "{activeAlertHabit.title}" için 3 erteleme bitti. Susturmak için kanıtlayın.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.alertBannerButton}
            onPress={() => handleProof(activeAlertHabit)}
          >
            <Text style={styles.alertBannerButtonText}>Sustur</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Test ve Hızlı Eylem Çubuğu */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={handleTestNotification}
        >
          <Text style={styles.quickButtonText}>🔔 Test Bildirimi Gönder</Text>
        </TouchableOpacity>

        {habits.length > 0 && !activeAlertHabit && (
          <TouchableOpacity
            style={[styles.quickButton, styles.quickButtonDanger]}
            onPress={() => triggerZorunluMod(habits[0])}
          >
            <Text style={[styles.quickButtonText, styles.quickButtonDangerText]}>
              🚨 Alarmı Test Et
            </Text>
          </TouchableOpacity>
        )}
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
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyTitle}>Henüz alışkanlık eklemediniz</Text>
            <Text style={styles.emptySubtitle}>
              Su içme, ilaç alma veya egzersiz gibi rutinlerinizi eklemek için aşağıdaki "+" butonuna dokunun.
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
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickButtonText: {
    fontSize: 12,
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  intervalText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  completedBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  alertBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  alertBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 14,
    fontWeight: '700',
  },
  erteleButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  erteleButtonText: {
    color: '#334155',
    fontSize: 14,
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
  resetButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#475569',
    fontSize: 13,
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
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 34,
  },
});
