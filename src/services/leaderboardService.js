import { getUserProfile, awardTop10Bonus } from './userService';
import { apiGetLeaderboard } from './api';

// Simüle edilmiş haftalık global yarışmacılar (Çevrimdışı/Yerel fallback için)
const WEEKLY_GLOBAL_PARTICIPANTS = [
  { id: 'gp-1', username: 'Merve_Hydra', avatar: '💧', score: 1420, isUser: false },
  { id: 'gp-2', username: 'Kaan_Fit', avatar: '⚡', score: 1350, isUser: false },
  { id: 'gp-3', username: 'Ayse_Rutin', avatar: '🌸', score: 1220, isUser: false },
  { id: 'gp-4', username: 'Emre_Disiplin', avatar: '🎯', score: 1100, isUser: false },
  { id: 'gp-5', username: 'Zeynep_Saglik', avatar: '🌱', score: 980, isUser: false },
  { id: 'gp-6', username: 'Can_Water', avatar: '🌊', score: 850, isUser: false },
  { id: 'gp-7', username: 'Elif_Focus', avatar: '🚀', score: 720, isUser: false },
  { id: 'gp-8', username: 'Burak_Bonsai', avatar: '🪴', score: 610, isUser: false },
  { id: 'gp-9', username: 'Defne_Heal', avatar: '🍵', score: 500, isUser: false },
  { id: 'gp-10', username: 'Tolga_Habit', avatar: '☕', score: 420, isUser: false },
  { id: 'gp-11', username: 'Yagmur_Goal', avatar: '🌧️', score: 350, isUser: false },
  { id: 'gp-12', username: 'Arda_Daily', avatar: '🧘', score: 280, isUser: false },
];

/**
 * KURAL 4 & VERİTABANI BAĞLANTISI: HAFTALIK YARIŞMA VE %10 DİLİM (2X ÖDÜLÜ)
 *
 * 1. Öncelikle PostgreSQL backend API'sinden güncel skor tablosunu çeker.
 * 2. Sunucu çevrimdışıysa mevcut yerel AsyncStorage ve simülasyon verisini kesintisiz kullanır.
 * 3. Üst %10 hesaplaması:
 *    topCount = Math.max(1, Math.ceil(N * 0.10))
 *    Eşit puanda olan herkes avantajlı olarak %10 dilime dahil edilir.
 */
export const getWeeklyLeaderboard = async () => {
  const profile = await getUserProfile();
  const userScore = profile?.weeklyChallengeScore || 0;

  // 1. Backend PostgreSQL API'sinden çekmeyi dene
  try {
    const apiResult = await apiGetLeaderboard();
    if (apiResult.success && Array.isArray(apiResult.leaderboard) && apiResult.leaderboard.length > 0) {
      const finalLeaderboard = apiResult.leaderboard.map((item) => ({
        id: item.userId || `user_${item.rank}`,
        username: item.username,
        avatar: item.isCurrentUser ? (profile?.avatar || '🌟') : '👥',
        score: item.points,
        rank: item.rank,
        isUser: item.isCurrentUser,
        isTop10: item.isInTop10Percent,
        hasDoublePointsNextDay: item.hasDoublePointsNextDay,
        widgetStatus: {
          tierId: profile?.activeWidgetId || 'flower_tier_1',
          health: profile?.widgetHealth || 65,
          label: item.isInTop10Percent ? 'Şampiyon 🌟' : 'Büyüyor 🌱',
        },
      }));

      const N = apiResult.totalParticipants || finalLeaderboard.length;
      const userIndex = finalLeaderboard.findIndex((e) => e.isUser);
      const userRank = userIndex !== -1 ? userIndex + 1 : 1;
      const percentile = Math.max(1, Math.round((userRank / Math.max(1, N)) * 100));
      const isTop10Percent = userIndex !== -1 ? finalLeaderboard[userIndex].isTop10 : false;

      return {
        leaderboard: finalLeaderboard,
        totalParticipants: N,
        topCount: apiResult.top10Count,
        cutoffScore: apiResult.top10ThresholdScore,
        isTop10Percent,
        userRank,
        percentile,
        userScore,
        isDbOnline: true,
      };
    }
  } catch (apiErr) {
    console.log('Backend liderlik tablosu çağrısı yerel moda devredildi:', apiErr.message);
  }

  // 2. Çevrimdışı / Yerel Fallback Akışı
  const currentUserEntry = {
    id: profile?.id || 'current_user',
    username: profile?.username || 'Sen',
    avatar: profile?.avatar || '🌟',
    score: userScore,
    isUser: true,
    friendCode: profile?.friendCode,
    isDoublePointsActive: profile?.isDoublePointsActiveToday,
    widgetStatus: {
      tierId: profile?.activeWidgetId || 'flower_tier_1',
      health: profile?.widgetHealth || 35,
      label: 'Büyüyor 🌱',
    },
  };

  const friendsEntries = (profile?.friends || []).map((f) => ({
    id: f.id,
    username: f.username,
    avatar: f.avatar || '👥',
    score: f.score || 0,
    isUser: false,
    isFriend: true,
    friendCode: f.friendCode,
    widgetStatus: f.widgetStatus || { tierId: 'flower_tier_1', health: 50, label: 'Büyüyor 🌱' },
  }));

  const allEntries = [currentUserEntry, ...friendsEntries, ...WEEKLY_GLOBAL_PARTICIPANTS];

  const sorted = allEntries.sort((a, b) => b.score - a.score);
  const ranked = sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const N = ranked.length;
  const topCount = Math.max(1, Math.ceil(N * 0.1));
  const cutoffScore = ranked[topCount - 1]?.score || 0;

  const isTop10Percent = userScore >= cutoffScore && userScore > 0;

  const finalLeaderboard = ranked.map((item) => ({
    ...item,
    isTop10: item.score >= cutoffScore && item.score > 0,
  }));

  const userIndex = finalLeaderboard.findIndex((e) => e.isUser);
  const userRank = userIndex !== -1 ? userIndex + 1 : finalLeaderboard.length;
  const percentile = Math.max(1, Math.round((userRank / N) * 100));

  return {
    leaderboard: finalLeaderboard,
    totalParticipants: N,
    topCount,
    cutoffScore,
    isTop10Percent,
    userRank,
    percentile,
    userScore,
    isDbOnline: false,
  };
};

  // Üst %10'a giren kullanıcıya 2x bonusunu tanımla
  if (isTop10Percent && !profile.hasDoublePointsNextDay) {
    await awardTop10Bonus();
  }

  return {
    leaderboard: finalLeaderboard,
    userRank,
    totalCount: N,
    topCount,
    cutoffScore,
    percentile,
    isTop10Percent,
    userEntry: finalLeaderboard[userIndex],
  };
};

export const getDailyLeaderboard = getWeeklyLeaderboard;
