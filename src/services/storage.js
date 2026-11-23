import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_STORAGE_KEY = '@habitime_habits';

// Haftalık varsayılan çalışma saatleri ve aktiflik yapılandırması
export const DEFAULT_DAYS_CONFIG = {
  monday: { name: 'Pazartesi', active: true, startHour: '09:00', endHour: '23:00' },
  tuesday: { name: 'Salı', active: true, startHour: '09:00', endHour: '23:00' },
  wednesday: { name: 'Çarşamba', active: true, startHour: '09:00', endHour: '23:00' },
  thursday: { name: 'Perşembe', active: true, startHour: '09:00', endHour: '23:00' },
  friday: { name: 'Cuma', active: true, startHour: '09:00', endHour: '23:00' },
  saturday: { name: 'Cumartesi', active: true, startHour: '09:00', endHour: '23:00' },
  sunday: { name: 'Pazar', active: true, startHour: '09:00', endHour: '23:00' },
};

export const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Belirli bir tarih ve saat için alışkanlığın çalışma aralığında olup olmadığını denetler.
 * (Uyku saatlerinde veya pasif günlerde alarm/uyarı çalmasını engellemek için)
 *
 * @param {Object} habit
 * @param {Date} [date=new Date()]
 * @returns {boolean}
 */
export const isWithinActiveHours = (habit, date = new Date()) => {
  if (!habit || !habit.daysConfig) return true;

  const dayIndex = date.getDay(); // 0: Pazar, 1: Pazartesi ...
  const dayKey = DAY_KEYS[dayIndex];
  const daySetting = habit.daysConfig[dayKey];

  // Gün pasif yapılmışsa çalışma aralığında değil
  if (!daySetting || !daySetting.active) {
    return false;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const [startH, startM] = (daySetting.startHour || '09:00').split(':').map(Number);
  const [endH, endM] = (daySetting.endHour || '23:00').split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Gece yarısını aşan aralık (örn: 22:00 - 02:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
};

/**
 * Bugünün tarih anahtarı (YYYY-MM-DD)
 */
const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Tüm kayıtlı alışkanlıkları yerel depolamadan getirir.
 * Gün değişmişse bugünkü su ilerlemesini ve tamamlanma durumunu otomatik olarak yeniler.
 *
 * @returns {Promise<Array>} Alışkanlık listesi
 */
export const getHabits = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
    if (!jsonValue) return [];

    const habits = JSON.parse(jsonValue);
    const today = getTodayKey();
    let hasChanges = false;

    // Günlük sıfırlama kontrolü
    const normalizedHabits = habits.map((habit) => {
      if (habit.lastActiveDate !== today) {
        hasChanges = true;
        return {
          ...habit,
          lastActiveDate: today,
          todayIntakeLiters: 0,
          isCompleted: false,
          snoozeCount: 0,
        };
      }
      return habit;
    });

    if (hasChanges) {
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(normalizedHabits)
      );
    }

    return normalizedHabits;
  } catch (error) {
    console.error('Alışkanlıklar getirilirken hata oluştu:', error);
    return [];
  }
};

/**
 * Yeni bir alışkanlık kaydeder.
 *
 * @param {Object} habitData
 * @param {string} habitData.title - Alışkanlık başlığı
 * @param {number} habitData.intervalMinutes - Hatırlatma aralığı
 * @param {number} [habitData.dailyTargetLiters=2.5] - Günlük su hedefi (litre)
 * @param {number} [habitData.portionLiters=0.25] - Her bardak/doğrulama miktarı (litre)
 * @param {Object} [habitData.daysConfig] - Günlük saat aralıkları
 * @returns {Promise<Object>} Oluşturulan yeni alışkanlık
 */
export const saveHabit = async ({
  title,
  intervalMinutes,
  dailyTargetLiters = 2.5,
  portionLiters = 0.25,
  daysConfig = DEFAULT_DAYS_CONFIG,
}) => {
  try {
    const existingHabits = await getHabits();
    const newHabit = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      intervalMinutes: Number(intervalMinutes),
      dailyTargetLiters: Number(dailyTargetLiters) || 2.5,
      portionLiters: Number(portionLiters) || 0.25,
      todayIntakeLiters: 0,
      lastActiveDate: getTodayKey(),
      intakeHistory: [],
      daysConfig: daysConfig || DEFAULT_DAYS_CONFIG,
      snoozeCount: 0,
      maxSnooze: 3,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      lastProofAt: null,
    };

    const updatedHabits = [newHabit, ...existingHabits];
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedHabits));
    return newHabit;
  } catch (error) {
    console.error('Alışkanlık kaydedilirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Mevcut bir alışkanlığı günceller.
 * @param {Object} updatedHabit
 * @returns {Promise<Array>} Güncel liste
 */
export const updateHabit = async (updatedHabit) => {
  try {
    const habits = await getHabits();
    const updatedList = habits.map((habit) =>
      habit.id === updatedHabit.id ? { ...habit, ...updatedHabit } : habit
    );
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (error) {
    console.error('Alışkanlık güncellenirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Belirtilen ID'ye sahip alışkanlığı siler.
 * @param {string} habitId
 * @returns {Promise<Array>} Kalan liste
 */
export const deleteHabit = async (habitId) => {
  try {
    const habits = await getHabits();
    const filteredList = habits.filter((habit) => habit.id !== habitId);
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(filteredList));
    return filteredList;
  } catch (error) {
    console.error('Alışkanlık silinirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Alışkanlığı erteler (snoozeCount artırılır, maks 3).
 * @param {string} habitId
 * @returns {Promise<Object|null>}
 */
export const snoozeHabit = async (habitId) => {
  try {
    const habits = await getHabits();
    let updatedTarget = null;
    const updatedList = habits.map((habit) => {
      if (habit.id === habitId && (habit.snoozeCount || 0) < 3) {
        updatedTarget = {
          ...habit,
          snoozeCount: (habit.snoozeCount || 0) + 1,
        };
        return updatedTarget;
      }
      return habit;
    });

    if (updatedTarget) {
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedList));
    }
    return updatedTarget;
  } catch (error) {
    console.error('Alışkanlık ertelenirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Kamera ile kanıt doğrulandıktan sonra su tüketimini kaydeder.
 * Geçici fotoğraf verisini kalıcı depolamaz; sadece zaman damgasını ve tüketim miktarını işler.
 * Günlük hedef tamamlanmışsa (todayIntakeLiters >= dailyTargetLiters) isCompleted = true yapar.
 *
 * @param {string} habitId
 * @param {number} [intakeAmount] - Bu doğrulamada eklenen miktar (litre)
 * @returns {Promise<{ habit: Object, goalReached: boolean, updatedList: Array }>}
 */
export const recordWaterIntakeProof = async (habitId, intakeAmount = null) => {
  try {
    const habits = await getHabits();
    const now = new Date().toISOString();
    let updatedHabit = null;
    let goalReached = false;

    const updatedList = habits.map((habit) => {
      if (habit.id === habitId) {
        const addAmount = Number(intakeAmount) || Number(habit.portionLiters) || 0.25;
        const target = Number(habit.dailyTargetLiters) || 2.5;
        const currentIntake = Number(habit.todayIntakeLiters || 0);
        const newTotalIntake = Number((currentIntake + addAmount).toFixed(2));

        const isGoalReached = newTotalIntake >= target;
        goalReached = isGoalReached;

        const intakeRecord = {
          id: Date.now().toString(),
          timestamp: now,
          amountLiters: addAmount,
        };

        const existingHistory = Array.isArray(habit.intakeHistory)
          ? habit.intakeHistory
          : [];

        updatedHabit = {
          ...habit,
          todayIntakeLiters: newTotalIntake,
          isCompleted: isGoalReached,
          snoozeCount: 0,
          lastProofAt: now,
          lastActiveDate: getTodayKey(),
          intakeHistory: [intakeRecord, ...existingHistory],
          // Geçici fotoğraf URI/Base64 saklanmaz (bellek/gizlilik temizliği)
          lastProofUri: null,
        };
        return updatedHabit;
      }
      return habit;
    });

    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedList));
    return { habit: updatedHabit, goalReached, updatedList };
  } catch (error) {
    console.error('Su tüketimi kaydedilirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Alışkanlığı sıfırlar (tekrar başlatır).
 * @param {string} habitId
 * @returns {Promise<Array>} Güncel liste
 */
export const resetHabit = async (habitId) => {
  try {
    const habits = await getHabits();
    const updatedList = habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            isCompleted: false,
            snoozeCount: 0,
            todayIntakeLiters: 0,
          }
        : habit
    );
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (error) {
    console.error('Alışkanlık sıfırlanırken hata oluştu:', error);
    throw error;
  }
};
