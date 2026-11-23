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
          dosesToday: 0,
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
 * Yeni bir alışkanlık kaydeder (Su veya İlaç).
 *
 * @param {Object} habitData
 * @param {string} habitData.title - Alışkanlık başlığı
 * @param {'water'|'medication'} [habitData.type='water'] - Alışkanlık türü
 * @param {number} [habitData.intervalMinutes] - Hatırlatma aralığı (su için)
 * @param {number} [habitData.dailyTargetLiters] - Günlük su hedefi (litre - su için)
 * @param {number} [habitData.portionLiters] - Her bardak/doğrulama miktarı (litre - su için)
 * @param {Array<string>} [habitData.medicationTimes] - İlaç doz saatleri (ilaç için örn: ['09:00', '21:00'])
 * @param {number} [habitData.targetDoses] - Günlük hedef ilaç dozu sayısı (ilaç için)
 * @param {Object} [habitData.daysConfig] - Günlük saat/aktiflik aralıkları
 * @returns {Promise<Object>} Oluşturulan yeni alışkanlık
 */
export const saveHabit = async ({
  title,
  type = 'water',
  intervalMinutes = 60,
  dailyTargetLiters = 2.5,
  portionLiters = 0.25,
  medicationTimes = ['09:00'],
  targetDoses = null,
  daysConfig = DEFAULT_DAYS_CONFIG,
}) => {
  try {
    const existingHabits = await getHabits();
    const isMedication = type === 'medication';

    const cleanMedTimes = Array.isArray(medicationTimes) && medicationTimes.length > 0
      ? medicationTimes
      : ['09:00'];

    const newHabit = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      type: isMedication ? 'medication' : 'water',
      // Su alanları (İlaç seçilmişse null)
      intervalMinutes: isMedication ? null : Number(intervalMinutes) || 60,
      dailyTargetLiters: isMedication ? null : Number(dailyTargetLiters) || 2.5,
      portionLiters: isMedication ? null : Number(portionLiters) || 0.25,
      todayIntakeLiters: 0,
      // İlaç alanları (Su seçilmişse null)
      medicationTimes: isMedication ? cleanMedTimes : null,
      targetDoses: isMedication ? Number(targetDoses || cleanMedTimes.length) : null,
      dosesToday: 0,
      // Erteleme kuralı: İlaç için 15 dakika, Su için 30 dakika
      snoozeMinutes: isMedication ? 15 : 30,
      lastActiveDate: getTodayKey(),
      intakeHistory: [],
      daysConfig: daysConfig || DEFAULT_DAYS_CONFIG,
      snoozeCount: 0,
      maxSnooze: 3,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      lastProofAt: null,
      lastProofUri: null,
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
 * Kamera ile kanıt doğrulandıktan sonra alışkanlık ilerlemesini kaydeder (Su veya İlaç).
 * Geçici fotoğraf verisini kalıcı depolamaz; sadece zaman damgasını ve ilerlemeyi işler.
 *
 * Su için: Eklenen miktar (litre) bugünkü tüketime eklenir, todayIntakeLiters >= dailyTargetLiters ise tamamlanır.
 * İlaç için: Bugünkü alınan doz sayısı artırılır (dosesToday + 1), dosesToday >= targetDoses ise tamamlanır.
 *
 * @param {string} habitId
 * @param {number} [intakeAmount] - Bu doğrulamada eklenen su miktarı (litre)
 * @returns {Promise<{ habit: Object, goalReached: boolean, updatedList: Array }>}
 */
export const recordHabitProof = async (habitId, intakeAmount = null) => {
  try {
    const habits = await getHabits();
    const now = new Date().toISOString();
    let updatedHabit = null;
    let goalReached = false;

    const updatedList = habits.map((habit) => {
      if (habit.id === habitId) {
        const isMedication = habit.type === 'medication';
        let isGoalReached = false;
        let newTotalIntake = Number(habit.todayIntakeLiters || 0);
        let newDosesToday = Number(habit.dosesToday || 0);
        const record = {
          id: Date.now().toString(),
          timestamp: now,
          type: isMedication ? 'medication' : 'water',
        };

        if (isMedication) {
          newDosesToday += 1;
          const targetDoses = Number(habit.targetDoses || (habit.medicationTimes?.length || 1));
          isGoalReached = newDosesToday >= targetDoses;
          record.doseNumber = newDosesToday;
          record.targetDoses = targetDoses;
        } else {
          const addAmount = Number(intakeAmount) || Number(habit.portionLiters) || 0.25;
          const target = Number(habit.dailyTargetLiters) || 2.5;
          newTotalIntake = Number((newTotalIntake + addAmount).toFixed(2));
          isGoalReached = newTotalIntake >= target;
          record.amountLiters = addAmount;
          record.targetLiters = target;
        }

        goalReached = isGoalReached;

        const existingHistory = Array.isArray(habit.intakeHistory)
          ? habit.intakeHistory
          : [];

        updatedHabit = {
          ...habit,
          todayIntakeLiters: newTotalIntake,
          dosesToday: newDosesToday,
          isCompleted: isGoalReached,
          snoozeCount: 0,
          lastProofAt: now,
          lastActiveDate: getTodayKey(),
          intakeHistory: [record, ...existingHistory],
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
    console.error('Alışkanlık kanıtı kaydedilirken hata oluştu:', error);
    throw error;
  }
};

// Geriye dönük uyumluluk için alias
export const recordWaterIntakeProof = recordHabitProof;

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
            dosesToday: 0,
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
