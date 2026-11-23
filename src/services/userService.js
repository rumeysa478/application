import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConnectFriend, apiTransferPoints } from './api';

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

// EFSA / WHO rehberlerine dayalı kilo başına ~30-35 ml formülü
export const calculateRecommendedWater = (weight, age, height) => {
  const w = parseFloat(weight);
  const a = parseInt(age, 10);
  const h = parseFloat(height);

  if (!w || isNaN(w) || w <= 0) {
    return 2.5; // Veri yoksa EFSA/WHO standart önerisi
  }

  let mlPerKg = 33; // 30-35 ml/kg aralığı
  if (!isNaN(a) && a > 0) {
    if (a < 30) mlPerKg = 35;
    else if (a >= 55) mlPerKg = 30;
    else mlPerKg = 33;
  }

  let heightBonus = 0;
  if (!isNaN(h) && h > 185) heightBonus = 0.2;

  let totalLiters = (w * mlPerKg) / 1000 + heightBonus;
  totalLiters = Math.max(1.5, Math.min(4.5, totalLiters)); // Güvenli aralık
  return parseFloat(totalLiters.toFixed(1));
};

// Başlangıç arkadaş listesi
const DEFAULT_FRIENDS = [
  {
    id: 'f-1',
    username: 'Deniz_Su',
    friendCode: 'HAB-DNZ1',
    score: 540,
    avatar: '🌊',
    widgetStatus: { tierId: 'flower_tier_1', health: 65, label: 'Tomurcuk 🌷' },
  },
  {
    id: 'f-2',
    username: 'Baris_Fit',
    friendCode: 'HAB-BRS2',
    score: 480,
    avatar: '⚡',
    widgetStatus: { tierId: 'flower_tier_2', health: 40, label: 'Genç Fidan 🪴' },
  },
  {
    id: 'f-3',
    username: 'Selin_Rutin',
    friendCode: 'HAB-SLN3',
    score: 390,
    avatar: '🌸',
    widgetStatus: { tierId: 'healer_tier_1', health: 80, label: 'Ayağa Kalktı 🧸' },
  },
];

/**
 * Kullanıcı profilini getirir veya oluşturur.
 */
export const getUserProfile = async () => {
  try {
    const json = await AsyncStorage.getItem(USER_PROFILE_KEY);
    const today = new Date().toISOString().slice(0, 10);

    if (json) {
      const profile = JSON.parse(json);

      // Günlük sıfırlama & Haftalık döngü kontrolü
      if (profile.lastActiveDay !== today) {
        profile.lastActiveDay = today;
        profile.todayExtraProofCount = 0; // Günlük ek kanıt sayacı sıfırlanır
        profile.todayEarnedGrowth = 0; // Günlük maskot büyüme tavanı sıfırlanır

        // Dünün %10 ödülü kontrolü: 2x bonus bugüne aktarılır
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

    // İlk kurulum profili
    const defaultProfile = {
      id: 'user_' + Date.now().toString(36),
      username: 'HabitimeKullanicisi',
      avatar: '🌟',
      friendCode: generateFriendCode(),
      // İsteğe bağlı kişisel veriler
      age: '',
      height: '',
      weight: '',
      recommendedLiters: 2.5,
      // Puanlar
      totalScore: 200,
      weeklyChallengeScore: 120,
      isDoublePointsActiveToday: false, // 2x çarpan aktif mi?
      hasDoublePointsNextDay: false, // Yarın için 2x kazanıldı mı?
      todayExtraProofCount: 0,
      todayEarnedGrowth: 0,
      lastActiveDay: today,
      friends: DEFAULT_FRIENDS,
      unlockedWidgets: ['flower_tier_1', 'healer_tier_1'],
      activeWidgetId: 'flower_tier_1',
      widgetHealth: 35, // Gerçek zamanlı günlere yayılan kademeli büyüme (0-100)
      widgetDaysStreak: 1, // Kaç gündür kesintisiz sulanıyor/bakılıyor
      pointHistory: [],
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
 * KURAL 3: ZORUNLU KANIT VS. EK KANIT PUAN MOTORU
 *
 * Zorunlu Kanıt:
 *  - Zamanında yapıldıysa: +20 puan
 *  - Erteleme sonrası (geç): +10 puan
 *  - Sıfır erteleme bonusu: +15 puan
 *  - Günlük hedef tamamlanınca: +35 puan
 *  - 2x bonusu SADECE zorunlu kanıtlara uygulanır!
 *
 * Ek Kanıt:
 *  - Her kanıt: +10 puan
 *  - Günde en fazla 5 kez puan alınabilir (günlük tavan)
 *  - 2x bonusu Ek Kanıt'a ASLA dahil edilmez (çarpan daima 1x).
 *
 * @param {Object} options
 * @param {'mandatory' | 'extra'} options.type - Kanıt türü
 * @param {boolean} [options.onTime=true] - Zamanında mı yapıldı?
 * @param {boolean} [options.zeroSnooze=false] - Hiç erteleme yapılmadı mı?
 * @param {boolean} [options.goalReached=false] - Günlük su hedefi bu kanıtla bitti mi?
 */
export const addProofScore = async ({
  type = 'mandatory',
  onTime = true,
  zeroSnooze = false,
  goalReached = false,
}) => {
  try {
    const profile = await getUserProfile();
    let basePoints = 0;
    let multiplier = 1;
    let isCapped = false;

    if (type === 'mandatory') {
      // Temel puan (Zamanında: 20, Erteleme sonrası: 10)
      basePoints = onTime ? 20 : 10;

      // Sıfır erteleme bonusu
      if (zeroSnooze) {
        basePoints += 15;
      }

      // Günlük hedef tamamlama bonusu
      if (goalReached) {
        basePoints += 35;
      }

      // 2x çarpanı SADECE zorunlu kanıtlara uygulanır
      if (profile.isDoublePointsActiveToday) {
        multiplier = 2;
      }
    } else {
      // Ek Kanıt: +10 puan, 2x çarpanı ASLA uygulanmaz
      const currentExtraCount = profile.todayExtraProofCount || 0;
      if (currentExtraCount >= 5) {
        // Günlük tavan aşıldı: puan verilmez ama su tüketimi kaydedilir
        isCapped = true;
        basePoints = 0;
      } else {
        basePoints = 10;
        profile.todayExtraProofCount = currentExtraCount + 1;
      }
      multiplier = 1; // 2x dahil edilmez!
    }

    const earnedPoints = basePoints * multiplier;
    const newTotalScore = (profile.totalScore || 0) + earnedPoints;
    const newWeeklyScore = (profile.weeklyChallengeScore || 0) + earnedPoints;

    // KURAL 5: Maskot 1 günde büyümez; günde en fazla +15 büyüme kazanabilir (günlere yayılır)
    const currentDayGrowth = profile.todayEarnedGrowth || 0;
    const growthToAdd = Math.min(10, Math.max(0, 15 - currentDayGrowth)); // Maksimum günlük 15 limit
    const newWidgetHealth = Math.min(100, (profile.widgetHealth || 0) + growthToAdd);
    const newDayGrowth = currentDayGrowth + growthToAdd;

    const updated = await updateUserProfile({
      totalScore: newTotalScore,
      weeklyChallengeScore: newWeeklyScore,
      todayExtraProofCount: profile.todayExtraProofCount,
      todayEarnedGrowth: newDayGrowth,
      widgetHealth: newWidgetHealth,
    });

    return {
      type,
      basePoints,
      multiplier,
      earnedPoints,
      isCapped,
      newTotalScore,
      newWeeklyScore,
      newWidgetHealth,
      profile: updated,
    };
  } catch (error) {
    console.error('Puan ekleme hatası:', error);
    return { earnedPoints: 10, multiplier: 1, newTotalScore: 0 };
  }
};

/**
 * KURAL 5: ARKADAŞA PUAN GÖNDERME
 * Kullanıcı kendi puanından arkadaşına hediye puan aktarır.
 */
export const sendPointsToFriend = async (friendId, amount = 25) => {
  try {
    const profile = await getUserProfile();
    const pts = parseInt(amount, 10);

    if (isNaN(pts) || pts <= 0) {
      throw new Error('Geçerli bir puan miktarı girin.');
    }

    if (profile.totalScore < pts) {
      throw new Error(`Yetersiz puan! Mevcut puanınız: ${profile.totalScore}`);
    }

    const friendIndex = (profile.friends || []).findIndex((f) => f.id === friendId);
    if (friendIndex === -1) {
      throw new Error('Arkadaş bulunamadı.');
    }

    const friend = profile.friends[friendIndex];
    friend.score = (friend.score || 0) + pts;

    const newScore = profile.totalScore - pts;
    const updatedFriends = [...profile.friends];
    updatedFriends[friendIndex] = friend;

    const updated = await updateUserProfile({
      totalScore: newScore,
      friends: updatedFriends,
    });

    // Backend'e de aktarmayı dene (varsa)
    try {
      await apiTransferPoints({
        receiverUsername: friend.username,
        receiverId: friend.id,
        points: pts,
      });
    } catch (apiErr) {
      console.log('Backend puan transferi çevrimdışı fallbackte:', apiErr.message);
    }

    return {
      success: true,
      sentAmount: pts,
      friendName: friend.username,
      newTotalScore: newScore,
      profile: updated,
    };
  } catch (error) {
    console.error('Puan gönderme hatası:', error);
    throw error;
  }
};

/**
 * Arkadaş ekleme
 */
export const addFriend = async (friendCodeOrName) => {
  try {
    const profile = await getUserProfile();
    const query = friendCodeOrName.trim().toUpperCase();

    if (!query) throw new Error('Arkadaş kodu veya kullanıcı adı girin.');
    if (query === profile.friendCode) throw new Error('Kendi kodunuzu ekleyemezsiniz!');

    const alreadyAdded = (profile.friends || []).some(
      (f) => f.friendCode.toUpperCase() === query || f.username.toUpperCase() === query
    );
    if (alreadyAdded) throw new Error('Bu kullanıcı zaten listenizde ekli.');

    // Backend'e bağlanmayı dene (varsa)
    try {
      await apiConnectFriend({ username: query });
    } catch (apiErr) {
      console.log('Backend arkadaş bağlantısı çevrimdışı fallbackte:', apiErr.message);
    }

    const newFriend = {
      id: 'friend_' + Date.now().toString(36),
      username: query.startsWith('HAB-') ? `Dost_${query.slice(-4)}` : query,
      friendCode: query.startsWith('HAB-') ? query : `HAB-${Math.floor(1000 + Math.random() * 9000)}`,
      score: Math.floor(250 + Math.random() * 350),
      avatar: ['🌱', '🚀', '☕', '🌟', '🎯', '🌊'][Math.floor(Math.random() * 6)],
      widgetStatus: {
        tierId: 'flower_tier_1',
        health: Math.floor(40 + Math.random() * 50),
        label: 'Gelişiyor 🌿',
      },
    };

    const updatedFriends = [...(profile.friends || []), newFriend];
    await updateUserProfile({ friends: updatedFriends });
    return newFriend;
  } catch (error) {
    console.error('Arkadaş ekleme hatası:', error);
    throw error;
  }
};

/**
 * Widget kilit açma
 */
export const unlockWidget = async (widgetId, cost) => {
  try {
    const profile = await getUserProfile();
    if (profile.totalScore < cost) {
      throw new Error(`Yetersiz puan! Gereken: ${cost}, Mevcut: ${profile.totalScore}`);
    }

    if (profile.unlockedWidgets.includes(widgetId)) {
      return await updateUserProfile({ activeWidgetId: widgetId });
    }

    return await updateUserProfile({
      totalScore: profile.totalScore - cost,
      unlockedWidgets: [...profile.unlockedWidgets, widgetId],
      activeWidgetId: widgetId,
    });
  } catch (error) {
    throw error;
  }
};

export const setActiveWidget = async (widgetId) => {
  return await updateUserProfile({ activeWidgetId: widgetId });
};

export const awardTop10Bonus = async () => {
  return await updateUserProfile({ hasDoublePointsNextDay: true });
};
