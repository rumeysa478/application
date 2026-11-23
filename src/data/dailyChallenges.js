/**
 * Ortak Günlük Yarışmalar (Daily Challenges)
 * Tüm kullanıcılar için her gün senkronize çalışan topluluk hedefleri.
 */
export const DAILY_CHALLENGES = [
  {
    id: 'dc-1',
    dayIndex: 0,
    title: '💧 Günün Su Ustası',
    badge: '🌊',
    description: 'Bugün en az 2.0 Litre su iç ve yapay zekâ ile doğrula.',
    targetType: 'water_liters',
    targetValue: 2.0,
    rewardPoints: 150,
  },
  {
    id: 'dc-2',
    dayIndex: 1,
    title: '⚡ Seri Doğrulama Günü',
    badge: '⚡',
    description: 'Gün içinde en az 4 başarılı AI kanıt doğrulaması tamamla.',
    targetType: 'proof_count',
    targetValue: 4,
    rewardPoints: 180,
  },
  {
    id: 'dc-3',
    dayIndex: 2,
    title: '🛡️ Tavizsiz İrade (Sıfır Erteleme)',
    badge: '🛡️',
    description: 'Hiçbir erteleme (snooze) hakkını kullanmadan en az 2 görevi tamamla.',
    targetType: 'zero_snooze',
    targetValue: 2,
    rewardPoints: 200,
  },
  {
    id: 'dc-4',
    dayIndex: 3,
    title: '🌿 Canlı Bahçe Sulama Günü',
    badge: '🌸',
    description: 'Yaşayan widget sağlığını %80 seviyesinin üzerine çıkar.',
    targetType: 'widget_health',
    targetValue: 80,
    rewardPoints: 160,
  },
  {
    id: 'dc-5',
    dayIndex: 4,
    title: '🎯 Hedef Vurgunu',
    badge: '🎯',
    description: 'Bugün belirlenen tüm günlük su hedefini %100 tamamla.',
    targetType: 'full_target',
    targetValue: 1,
    rewardPoints: 220,
  },
  {
    id: 'dc-6',
    dayIndex: 5,
    title: '🚀 Hafta Sonu Canavarı',
    badge: '🚀',
    description: 'En az 5 su kabı doğrulaması yaparak yarışma puanı topla.',
    targetType: 'proof_count',
    targetValue: 5,
    rewardPoints: 250,
  },
  {
    id: 'dc-7',
    dayIndex: 6,
    title: '🧘 Pazar Disiplini',
    badge: '✨',
    description: 'Haftayı dinç kapatmak için en az 2.5 Litre su tüketimini belgele.',
    targetType: 'water_liters',
    targetValue: 2.5,
    rewardPoints: 200,
  },
];

/**
 * Günün ortak yarışmasını döndürür (Günün indeksine göre döner).
 */
export const getTodayChallenge = () => {
  const dayIndex = new Date().getDay(); // 0-6
  return DAILY_CHALLENGES.find((c) => c.dayIndex === dayIndex) || DAILY_CHALLENGES[0];
};

/**
 * Alışkanlıklar ve profil verisine göre günün yarışma ilerlemesini hesaplar.
 * @param {Array} habits
 * @param {Object} profile
 * @returns {{ current: number, target: number, isCompleted: boolean, percentage: number }}
 */
export const calculateChallengeProgress = (habits, profile) => {
  const challenge = getTodayChallenge();
  let current = 0;

  if (challenge.targetType === 'water_liters') {
    // Alışkanlıklardaki toplam bugünkü su tüketimini topla
    current = habits.reduce((sum, h) => sum + (Number(h.todayIntakeLiters) || 0), 0);
  } else if (challenge.targetType === 'proof_count') {
    // Bugünkü toplam kanıt sayısını topla
    current = habits.reduce((sum, h) => sum + ((h.intakeHistory || []).length), 0);
  } else if (challenge.targetType === 'zero_snooze') {
    current = habits.filter((h) => (h.snoozeCount || 0) === 0 && (h.todayIntakeLiters || 0) > 0).length;
  } else if (challenge.targetType === 'widget_health') {
    current = profile?.widgetHealth || 0;
  } else if (challenge.targetType === 'full_target') {
    current = habits.some((h) => h.isCompleted) ? 1 : 0;
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
