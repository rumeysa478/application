import { getUserProfile, awardTop10Bonus } from './userService';

// Simüle edilmiş global yarışmacılar
const GLOBAL_PARTICIPANTS = [
  { id: 'gp-1', username: 'Merve_Hydra', avatar: '💧', score: 480, isUser: false },
  { id: 'gp-2', username: 'Kaan_Fit', avatar: '⚡', score: 440, isUser: false },
  { id: 'gp-3', username: 'Ayse_Rutin', avatar: '🌸', score: 390, isUser: false },
  { id: 'gp-4', username: 'Emre_Disiplin', avatar: '🎯', score: 350, isUser: false },
  { id: 'gp-5', username: 'Zeynep_Saglik', avatar: '🌱', score: 310, isUser: false },
  { id: 'gp-6', username: 'Can_Water', avatar: '🌊', score: 260, isUser: false },
  { id: 'gp-7', username: 'Elif_Focus', avatar: '🚀', score: 230, isUser: false },
  { id: 'gp-8', username: 'Burak_Bonsai', avatar: '🪴', score: 190, isUser: false },
  { id: 'gp-9', username: 'Defne_Heal', avatar: '🍵', score: 150, isUser: false },
  { id: 'gp-10', username: 'Tolga_Habit', avatar: '☕', score: 120, isUser: false },
  { id: 'gp-11', username: 'Yagmur_Goal', avatar: '🌧️', score: 90, isUser: false },
  { id: 'gp-12', username: 'Arda_Daily', avatar: '🧘', score: 70, isUser: false },
];

/**
 * Günlük Skor Tablosunu ve kullanıcının yüzdelik dilimini hesaplar.
 * @returns {Promise<{
 *   leaderboard: Array,
 *   userRank: number,
 *   totalCount: number,
 *   percentile: number,
 *   isTop10Percent: boolean,
 *   userEntry: Object
 * }>}
 */
export const getDailyLeaderboard = async () => {
  const profile = await getUserProfile();
  const userScore = profile?.todayChallengeScore || 0;

  const currentUserEntry = {
    id: profile.id,
    username: profile.username || 'Sen',
    avatar: profile.avatar || '🌟',
    score: userScore,
    isUser: true,
    friendCode: profile.friendCode,
    isDoublePointsActive: profile.isDoublePointsActiveToday,
  };

  // Arkadaşları da listeye ekle
  const friendsEntries = (profile.friends || []).map((f) => ({
    id: f.id,
    username: f.username,
    avatar: f.avatar || '👥',
    score: f.score || 0,
    isUser: false,
    isFriend: true,
  }));

  // Hepsini birleştir ve puana göre sırala
  const allEntries = [currentUserEntry, ...friendsEntries, ...GLOBAL_PARTICIPANTS];

  // Benzersiz ID'lere indirge ve puana göre büyükten küçüğe sırala
  const sorted = allEntries.sort((a, b) => b.score - a.score);

  // Sıralamayı ve dereceleri belirle
  const ranked = sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const userIndex = ranked.findIndex((e) => e.isUser);
  const userRank = userIndex !== -1 ? userIndex + 1 : ranked.length;
  const totalCount = ranked.length;
  const percentile = Math.max(1, Math.round((userRank / totalCount) * 100));
  const isTop10Percent = percentile <= 10;

  // Kullanıcı ilk %10'da ise yarın için 2x ödülünü aktifleştir
  if (isTop10Percent && !profile.hasDoublePointsNextDay) {
    await awardTop10Bonus();
  }

  return {
    leaderboard: ranked,
    userRank,
    totalCount,
    percentile,
    isTop10Percent,
    userEntry: ranked[userIndex],
  };
};
