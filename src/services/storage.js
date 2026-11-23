import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_STORAGE_KEY = '@habitime_habits';

/**
 * Tüm kayıtlı alışkanlıkları yerel depolamadan getirir.
 * @returns {Promise<Array>} Alışkanlık listesi
 */
export const getHabits = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Alışkanlıklar getirilirken hata oluştu:', error);
    return [];
  }
};

/**
 * Yeni bir alışkanlık kaydeder.
 * @param {Object} habitData
 * @param {string} habitData.title - Alışkanlık başlığı (örn: "Su İç")
 * @param {number} habitData.intervalMinutes - Hatırlatma aralığı (örn: 60)
 * @returns {Promise<Object>} Oluşturulan yeni alışkanlık
 */
export const saveHabit = async ({ title, intervalMinutes }) => {
  try {
    const existingHabits = await getHabits();
    const newHabit = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      intervalMinutes: Number(intervalMinutes),
      snoozeCount: 0,
      maxSnooze: 3,
      isCompleted: false,
      createdAt: new Date().toISOString(),
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
 * @param {Object} updatedHabit - Güncellenecek alışkanlık nesnesi
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
 * @param {string} habitId - Silinecek alışkanlığın ID'si
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
 * Alışkanlığı tamamlandı olarak işaretler ve erteleme sayacını sıfırlar.
 * @param {string} habitId
 * @returns {Promise<Array>} Güncel liste
 */
export const completeHabit = async (habitId) => {
  try {
    const habits = await getHabits();
    const updatedList = habits.map((habit) =>
      habit.id === habitId
        ? { ...habit, isCompleted: true, snoozeCount: 0 }
        : habit
    );
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (error) {
    console.error('Alışkanlık tamamlanırken hata oluştu:', error);
    throw error;
  }
};

/**
 * Alışkanlığın durumunu ve erteleme sayacını sıfırlar (tekrar başlatır).
 * @param {string} habitId
 * @returns {Promise<Array>} Güncel liste
 */
export const resetHabit = async (habitId) => {
  try {
    const habits = await getHabits();
    const updatedList = habits.map((habit) =>
      habit.id === habitId
        ? { ...habit, isCompleted: false, snoozeCount: 0 }
        : habit
    );
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (error) {
    console.error('Alışkanlık sıfırlanırken hata oluştu:', error);
    throw error;
  }
};

