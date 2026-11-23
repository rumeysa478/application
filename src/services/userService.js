import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_PROFILE_KEY = '@habitime_user_profile';

/**
 * Rastgele 6 haneli benzersiz arkadaş davet kodu üretir.
 */
const generateFriendCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HAB-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Başlangıç varsayılan arkadaş listesi (Sosyal deneyimi canlandırmak için)
const DEFAULT_FRIENDS = [
  { id: 'f-1', username: 'Deniz_Su', friendCode: 'HAB-DNZ1', score: 320, avatar: '🌊' },
  { id: 'f-2', username: 'Baris_Fit', friendCode: 'HAB-BRS2', score: 280, avatar: '⚡' },
  { id: 'f-3', username: 'Selin_Rutin', friendCode: 'HAB-SLN3', score: 210, avatar: '🌸' },
];

/**
 * Kullanıcı profilini yerel depolamadan getirir.
 * Yoksa başlangıç profili oluşturur.
 */
export const getUserProfile = async () => {
  try {
    const json = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (json) {
      const profile = JSON.parse(json);
      // Günlük skor sıfırlama kontrolü
      const today = new Date().toISOString().slice(0, 10);
      if (profile.lastActiveDay !== today) {
        profile.lastActiveDay = today;
        profile.todayChallengeScore = 0;
        // Dünün %10 ödülü kontrolü: hasDoublePointsNextDay bugüne aktarılır
        if (profile.hasDoublePointsNextDay) {
          profile.isDoublePointsActiveToday = true;
          profile.hasDoublePointsNextDay = false;
        } else {
          profile.isDoublePointsActiveToday = false;
        }
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      }
      return profile;
    }

    // İlk kez açılıyorsa varsayılan profil
    const defaultProfile = {
      id: 'user_' + Date.now().toString(36),
      username: 'HabitimeKullanicisi',
      avatar: '🌟',
      friendCode: generateFriendCode(),
      totalScore: 150, // Hoş geldin puanı
      todayChallengeScore: 50,
      hasDoublePointsNextDay: false, // Yarın için 2x kazanıldı mı?
      isDoublePointsActiveToday: false, // Bugün 2x aktif mi?
      lastActiveDay: new Date().toISOString().slice(0, 10),
      friends: DEFAULT_FRIENDS,
      unlockedWidgets: ['flower_tier_1', 'healer_tier_1'],
      activeWidgetId: 'flower_tier_1',
      widgetHealth: 45, // 0 - 100 arası büyüme/iyileşme seviyesi
    };

    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultProfile));
    return defaultProfile;
  } catch (error) {
    console.error('Kullanıcı profili yüklenemedi:', error);
    return null;
  }
};

/**
 * Kullanıcı profilini günceller.
 * @param {Object} updates
 */
export const updateUserProfile = async (updates) => {
  try {
    const current = await getUserProfile();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Profil güncellenirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Kullanıcıya puan ekler ve 2x çarpanını otomatik uygular.
 * @param {number} basePoints - Temel kazanılan puan
 * @param {string} [reason='Görev Tamamlandı'] - Puan kazanma sebebi
 * @returns {Promise<{ earnedPoints: number, basePoints: number, multiplier: number, newTotalScore: number }>}
 */
export const addScore = async (basePoints, reason = 'Görev Tamamlandı') => {
  try {
    const profile = await getUserProfile();
    const multiplier = profile.isDoublePointsActiveToday ? 2 : 1;
    const earnedPoints = basePoints * multiplier;

    const newTotalScore = (profile.totalScore || 0) + earnedPoints;
    const newDailyScore = (profile.todayChallengeScore || 0) + earnedPoints;

    // Yaşayan widget sağlığını da artır (her doğrulamada +15 büyüme)
    const newWidgetHealth = Math.min(100, (profile.widgetHealth || 0) + 15);

    const updated = await updateUserProfile({
      totalScore: newTotalScore,
      todayChallengeScore: newDailyScore,
      widgetHealth: newWidgetHealth,
    });

    return {
      earnedPoints,
      basePoints,
      multiplier,
      newTotalScore,
      newDailyScore,
      widgetHealth: newWidgetHealth,
      profile: updated,
    };
  } catch (error) {
    console.error('Puan eklenirken hata oluştu:', error);
    return { earnedPoints: basePoints, multiplier: 1, newTotalScore: basePoints };
  }
};

/**
 * Arkadaş kodu veya kullanıcı adı ile yeni bir arkadaş ekler.
 * @param {string} friendCodeOrName
 */
export const addFriend = async (friendCodeOrName) => {
  try {
    const profile = await getUserProfile();
    const query = friendCodeOrName.trim().toUpperCase();

    if (!query) {
      throw new Error('Lütfen bir arkadaş kodu veya kullanıcı adı girin.');
    }

    if (query === profile.friendCode) {
      throw new Error('Kendi arkadaş kodunuzu ekleyemezsiniz!');
    }

    const alreadyAdded = (profile.friends || []).some(
      (f) => f.friendCode.toUpperCase() === query || f.username.toUpperCase() === query
    );

    if (alreadyAdded) {
      throw new Error('Bu kullanıcı zaten arkadaş listenizde ekli.');
    }

    // Yeni arkadaş nesnesi (Gerçekçi puanla simüle edilir)
    const newFriend = {
      id: 'friend_' + Date.now().toString(36),
      username: query.startsWith('HAB-') ? `Dost_${query.slice(-4)}` : query,
      friendCode: query.startsWith('HAB-') ? query : `HAB-${Math.floor(1000 + Math.random() * 9000)}`,
      score: Math.floor(180 + Math.random() * 220),
      avatar: ['🌱', '🚀', '☕', '🌟', '🎯'][Math.floor(Math.random() * 5)],
    };

    const updatedFriends = [...(profile.friends || []), newFriend];
    await updateUserProfile({ friends: updatedFriends });
    return newFriend;
  } catch (error) {
    console.error('Arkadaş eklenirken hata:', error);
    throw error;
  }
};

/**
 * Widget satın alma / kilit açma işlemi.
 * Puan yeterliyse puanı düşer ve kilidi açar.
 * @param {string} widgetId
 * @param {number} cost
 */
export const unlockWidget = async (widgetId, cost) => {
  try {
    const profile = await getUserProfile();
    if (profile.totalScore < cost) {
      throw new Error(`Yetersiz puan! Bu widget için ${cost} puan gerekiyor. (Mevcut: ${profile.totalScore})`);
    }

    if (profile.unlockedWidgets.includes(widgetId)) {
      // Zaten açık, doğrudan aktif yap
      return await updateUserProfile({ activeWidgetId: widgetId });
    }

    const newScore = profile.totalScore - cost;
    const newUnlocked = [...profile.unlockedWidgets, widgetId];

    return await updateUserProfile({
      totalScore: newScore,
      unlockedWidgets: newUnlocked,
      activeWidgetId: widgetId,
    });
  } catch (error) {
    console.error('Widget kilit açma hatası:', error);
    throw error;
  }
};

/**
 * Aktif widget'ı değiştirir.
 * @param {string} widgetId
 */
export const setActiveWidget = async (widgetId) => {
  return await updateUserProfile({ activeWidgetId: widgetId });
};

/**
 * Yarışmada üst %10'a giren kullanıcı için ertesi gün 2x puan ödülünü tanımlar.
 */
export const awardTop10Bonus = async () => {
  return await updateUserProfile({ hasDoublePointsNextDay: true });
};
