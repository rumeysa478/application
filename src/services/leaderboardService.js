import { getUserProfile, awardTop10Bonus } from './userService';

// Simüle edilmiş haftalık global yarışmacılar
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
 * KURAL 4: HAFTALIK YARIŞMA, EŞİT PUANDA %10 DİLİM VE 2X ÖDÜLÜ
 *
 * Sıralamada üst %10'luk dilim:
 *   topCount = Math.max(1, Math.ceil(N * 0.10))
 * Sınır puanı:
 *   cutoffScore = ranked[topCount - 1].score
 * Eşit puan kuralı:
 *   Sınır puanına eşit veya büyük olan HERKES avantajı alır!
 */
export const getWeeklyLeaderboard = async () => {
  const profile = await getUserProfile();
  const userScore = profile?.weeklyChallengeScore || 0;

  const currentUserEntry = {
    id: profile.id,
    username: profile.username || 'Sen',
    avatar: profile.avatar || '🌟',
    score: userScore,
    isUser: true,
    friendCode: profile.friendCode,
    isDoublePointsActive: profile.isDoublePointsActiveToday,
    widgetStatus: {
      tierId: profile.activeWidgetId || 'flower_tier_1',
      health: profile.widgetHealth || 35,
      label: 'Büyüyor 🌱',
    },
  };

  // Arkadaşları da listeye ekle
  const friendsEntries = (profile.friends || []).map((f) => ({
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

  // Puana göre büyükten küçüğe sırala
  const sorted = allEntries.sort((a, b) => b.score - a.score);

  // Sıralamayı belirle
  const ranked = sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const N = ranked.length;
  // Üst %10 kişi sayısı
  const topCount = Math.max(1, Math.ceil(N * 0.1));

  // Sınır çizgisindeki eşik puanı (Cutoff Score)
  const cutoffScore = ranked[topCount - 1]?.score || 0;

  // Eşit puan kuralı: cutoffScore ile eşit olan HERKES üst %10'dadır!
  const isTop10Percent = userScore >= cutoffScore && userScore > 0;

  // Her yarışmacıya üst %10 etiketini işle
  const finalLeaderboard = ranked.map((item) => ({
    ...item,
    isTop10: item.score >= cutoffScore && item.score > 0,
  }));

  const userIndex = finalLeaderboard.findIndex((e) => e.isUser);
  const userRank = userIndex !== -1 ? userIndex + 1 : finalLeaderboard.length;
  const percentile = Math.max(1, Math.round((userRank / N) * 100));

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
