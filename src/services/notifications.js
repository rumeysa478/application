import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getRandomFact } from '../data/didYouKnow';

// Uygulama ön plandayken bildirim davranışını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Bildirim izinlerini kontrol eder ve kullanıcıdan izin ister.
 * Android için yüksek öncelikli bildirim kanalını yapılandırır.
 * @returns {Promise<boolean>} İzin verilip verilmediği
 */
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habitime-channel', {
        name: 'Habitime Hatırlatıcıları',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#4F46E5',
        sound: 'default',
        enableVibrate: true,
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Bildirim izni alınırken hata oluştu:', error);
    return false;
  }
};

/**
 * Bir alışkanlık için zamanlanmış bildirim oluşturur.
 * İçeriğinde rastgele "Biliyor muydunuz?" bilgisi barındırır.
 * @param {Object} habit
 * @param {string} habit.title
 * @param {number} habit.intervalMinutes
 * @param {number} [customSeconds] - Test için opsiyonel saniye değeri
 * @returns {Promise<string>} Notification ID
 */
export const scheduleHabitNotification = async (habit, customSeconds = null) => {
  const fact = getRandomFact();
  const seconds = customSeconds || Math.max(60, Number(habit.intervalMinutes || 60) * 60);
  const targetText = habit.dailyTargetLiters ? ` (Bugün: ${habit.todayIntakeLiters || 0}/${habit.dailyTargetLiters} L)` : '';

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${habit.title} Vakti! • Biliyor muydunuz?`,
      body: `"${fact.fact}"\n\n💧 Bir bardak su iç ve kamerayla doğrula!${targetText}`,
      data: {
        habitId: habit.id,
        factId: fact.id,
        category: fact.category,
      },
      sound: 'default',
      channelId: 'habitime-channel',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });

  return identifier;
};

/**
 * 30 dakikalık erteleme (Snooze) bildirimi planlar.
 * @param {Object} habit
 * @param {number} [snoozeMinutes=30]
 * @param {number} [customSeconds=null] - Hızlı test için saniye parametresi
 * @returns {Promise<{ identifier: string, fact: Object }>}
 */
export const scheduleSnoozeNotification = async (
  habit,
  snoozeMinutes = 30,
  customSeconds = null
) => {
  const fact = getRandomFact();
  const seconds = customSeconds || Math.max(10, snoozeMinutes * 60);
  const nextSnoozeCount = (habit.snoozeCount || 0) + 1;
  const remainingRights = Math.max(0, 3 - nextSnoozeCount);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏳ Erteleme Vakti: ${habit.title} • Biliyor muydunuz?`,
      body: `"${fact.fact}"\n\n⚠️ Kalan erteleme hakkınız: ${remainingRights}/3`,
      data: {
        habitId: habit.id,
        isSnooze: true,
        snoozeCount: nextSnoozeCount,
      },
      sound: 'default',
      channelId: 'habitime-channel',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });

  return { identifier, fact, seconds };
};

/**
 * Anında test bildirimi gönderir ("Biliyor muydunuz?" içerir).
 * @param {string} habitTitle
 * @returns {Promise<string>}
 */
export const sendInstantNotification = async (habitTitle = 'Alışkanlık') => {
  const fact = getRandomFact();
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${habitTitle} • Biliyor muydunuz?`,
      body: `"${fact.fact}"\n\n💡 Kategori: ${fact.category}`,
      sound: 'default',
      channelId: 'habitime-channel',
    },
    trigger: null, // Hemen göster
  });
  return identifier;
};

/**
 * Zamanlanmış bildirimi iptal eder.
 * @param {string} notificationId
 */
export const cancelNotification = async (notificationId) => {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
};
