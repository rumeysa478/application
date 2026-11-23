/**
 * Ortak Haftalık Yarışmalar (Weekly Challenges)
 * Tüm kullanıcılar için Pazartesi-Pazar döngüsünde çalışan ortak haftalık yarışma.
 */
export const WEEKLY_CHALLENGES = [
  {
    id: 'wc-1',
    weekIndex: 0,
    title: '💧 Haftanın Su Şampiyonu',
    badge: '🌊',
    description: 'Hafta boyunca en az 14.0 Litre su iç ve yapay zekâ ile doğrula.',
    targetType: 'water_liters',
    targetValue: 14.0,
    rewardPoints: 500,
  },
  {
    id: 'wc-2',
    weekIndex: 1,
    title: '⚡ Demir İrade Maratonu',
    badge: '⚡',
    description: 'Hafta boyunca en az 25 başarılı AI kanıt doğrulaması tamamla.',
    targetType: 'proof_count',
    targetValue: 25,
    rewardPoints: 600,
  },
  {
    id: 'wc-3',
    weekIndex: 2,
    title: '🛡️ Sıfır Taviz Haftası',
    badge: '🛡️',
    description: 'Hafta içinde hiç erteleme kullanmadan 15 zorunlu görevi tamamla.',
    targetType: 'zero_snooze',
    targetValue: 15,
    rewardPoints: 750,
  },
  {
    id: 'wc-4',
    weekIndex: 3,
    title: '🌸 Büyülü Bahçe Zirvesi',
    badge: '🌸',
    description: 'Hafta boyunca maskotunu en üst büyüme/sağlık evresine ulaştır.',
    targetType: 'widget_health',
    targetValue: 100,
    rewardPoints: 650,
  },
];

/**
 * Haftanın ortak yarışmasını döndürür.
 */
export const getWeeklyChallenge = () => {
  // Yılın kaçıncı haftası olduğunu hesapla
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  const idx = weekNum % WEEKLY_CHALLENGES.length;
  return WEEKLY_CHALLENGES[idx] || WEEKLY_CHALLENGES[0];
};

export const getTodayChallenge = getWeeklyChallenge;

/**
 * Alışkanlıklar ve profil verisine göre haftanın yarışma ilerlemesini hesaplar.
 */
export const calculateChallengeProgress = (habits, profile) => {
  const challenge = getWeeklyChallenge();
  let current = 0;

  if (challenge.targetType === 'water_liters') {
    // Toplam su tüketimi
    current = habits.reduce((sum, h) => sum + (Number(h.todayIntakeLiters) || 0), 0);
  } else if (challenge.targetType === 'proof_count') {
    current = habits.reduce((sum, h) => sum + ((h.intakeHistory || []).length), 0);
  } else if (challenge.targetType === 'zero_snooze') {
    current = habits.filter((h) => (h.snoozeCount || 0) === 0 && (h.todayIntakeLiters || 0) > 0).length;
  } else if (challenge.targetType === 'widget_health') {
    current = profile?.widgetHealth || 0;
  }

  const target = challenge.targetValue;
  const isCompleted = current >= target;
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return {
    challenge,
    current: Number(current.toFixed(2)),
    target,
    isCompleted,
    percentage,
  };
};
