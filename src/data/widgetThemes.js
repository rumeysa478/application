/**
 * Yaşayan Widget Temaları ve Kademeleri (Living Widget Tiers)
 * Alışkanlık türüne göre bağlanan ve su/görev doğrulamalarıyla yaşayan evcil maskotlar.
 */
export const WIDGET_THEMES = [
  // TEMA 1: Çiçek Sulama / Bitki Büyütme (Su alışkanlıkları için)
  {
    id: 'flower_tier_1',
    themeType: 'water',
    name: 'Papatya Bahçesi',
    cost: 0,
    unlockedByDefault: true,
    description: 'Her su içtiğinizde sulanan, yaprak açan ve çiçek veren canlı papatya.',
    stages: [
      { min: 0, max: 25, icon: '🌱', label: 'Tohum', status: 'Tohum yeni ekildi, su bekliyor!' },
      { min: 26, max: 50, icon: '🌿', label: 'Filiz', status: 'İlk yeşil yapraklar güneşe uzandı.' },
      { min: 51, max: 75, icon: '🌷', label: 'Tomurcuk', status: 'Çiçek açmaya çok yakın, harika gidiyorsun!' },
      { min: 76, max: 99, icon: '🌼', label: 'Açan Papatya', status: 'Mis kokulu papatya sağlıkla açtı!' },
      { min: 100, max: 100, icon: '🌸✨', label: 'Görkemli Bahçe', status: 'Bugünkü tüm su hedefini aldı ve parıldıyor!' },
    ],
  },
  {
    id: 'flower_tier_2',
    themeType: 'water',
    name: 'Huzurlu Bonsai',
    cost: 500,
    unlockedByDefault: false,
    description: 'Sabır ve düzenli su ile gelişen bilge bir minyatür ağaç.',
    stages: [
      { min: 0, max: 25, icon: '🪵', label: 'Bonsai Kökü', status: 'Toprağı nemsiz, bir bardak su ver!' },
      { min: 26, max: 50, icon: '🪴', label: 'Genç Fidan', status: 'Dalları yavaşça şekilleniyor.' },
      { min: 51, max: 75, icon: '🌳', label: 'Budanmış Bonsai', status: 'Uyum ve disiplinin sembolü oldu.' },
      { min: 76, max: 99, icon: '🎋', label: 'Yeşil Zirve', status: 'Kusursuz bonsai formu yakalandı.' },
      { min: 100, max: 100, icon: '👑🪴', label: 'Efsanevi Zen Bonsai', status: 'Günün zirvesinde dinginlik saçıyor!' },
    ],
  },
  {
    id: 'flower_tier_3',
    themeType: 'water',
    name: 'Kozmik Gece Orkidesi',
    cost: 1200,
    unlockedByDefault: false,
    description: 'Yalnızca disiplinli su içenlerin yetiştirebildiği parıltılı uzay çiçeği.',
    stages: [
      { min: 0, max: 25, icon: '🌟', label: 'Yıldız Tohumu', status: 'Kozmik tohum nem bekliyor.' },
      { min: 26, max: 50, icon: '🪻', label: 'Mor Kristal Dal', status: 'Işıltılı yapraklar belirdi.' },
      { min: 51, max: 75, icon: '💎', label: 'Kristal Tomurcuk', status: 'Parıltısı tüm odayı aydınlatıyor.' },
      { min: 76, max: 99, icon: '🌺', label: 'Açan Orkide', status: 'Eşsiz bir mor ışıma saçıyor!' },
      { min: 100, max: 100, icon: '🌌🌺', label: 'Kozmik Çiçeklenme', status: 'Yıldızlararası bir zarafetle tamamlandı!' },
    ],
  },

  // TEMA 2: Hasta İyileştirme / Şifa Maskotu (İlaç, vitamin ve sağlık alışkanlıkları için)
  {
    id: 'healer_tier_1',
    themeType: 'health',
    name: 'Sevimli Şifa Ayıcığı',
    cost: 0,
    unlockedByDefault: true,
    description: 'Zamanında alınan ilaçlar ve rutinlerle yavaş yavaş sağlığına kavuşan ayıcık.',
    stages: [
      { min: 0, max: 25, icon: '🤒', label: 'Hasta & Yorgun', status: 'Ateşi var ve yatakta yatıyor.' },
      { min: 26, max: 50, icon: '💊', label: 'İlacını Aldı', status: 'İlaç etki etmeye başladı, dinleniyor.' },
      { min: 51, max: 75, icon: '🍵', label: 'Çorba İçti', status: 'Güç topladı, tebessüm etmeye başladı.' },
      { min: 76, max: 99, icon: '🧸', label: 'Ayağa Kalktı', status: 'Yataktan kalktı ve sana el sallıyor!' },
      { min: 100, max: 100, icon: '🌟🧸', label: 'Tamamen Sağlıklı!', status: 'Süper enerjik ve sana çok teşekkür ediyor!' },
    ],
  },
  {
    id: 'healer_tier_2',
    themeType: 'health',
    name: 'Süper Kurtarma Robotu',
    cost: 600,
    unlockedByDefault: false,
    description: 'Sağlık görevlerinle pilleri dolan ve kalkanları açılan biyonik robot.',
    stages: [
      { min: 0, max: 25, icon: '🪫', label: 'Kritik Pil', status: 'Sistem enerjisi %10, destek gerekiyor.' },
      { min: 26, max: 50, icon: '🔌', label: 'Şarj Oluyor', status: 'Çekirdek güç seviyesi yükseliyor.' },
      { min: 51, max: 75, icon: '⚙️', label: 'Sistemler Aktif', status: 'Sensörler ve motorlar devreye girdi.' },
      { min: 76, max: 99, icon: '🚀', label: 'Uçuşa Hazır', status: 'Görev moduna geçti!' },
      { min: 100, max: 100, icon: '🤖⚡', label: 'Aşırı Yüklü Kahraman', status: 'Maksimum güçte görev başında!' },
    ],
  },
  {
    id: 'healer_tier_3',
    themeType: 'health',
    name: 'Efsanevi Şifa Ejderhası',
    cost: 1500,
    unlockedByDefault: false,
    description: 'Rutin disiplininle yumurtadan çıkıp büyüyen koruyucu ejderha.',
    stages: [
      { min: 0, max: 25, icon: '🥚', label: 'Sıcak Yumurta', status: 'Yumurta ilgi ve disiplin bekliyor.' },
      { min: 26, max: 50, icon: '🐣', label: 'Yavru Ejder', status: 'Kabuk kırıldı, minik bir ejder belirdi.' },
      { min: 51, max: 75, icon: '🫧', label: 'Ateş Nefesi', status: 'İlk tatlı duman halkalarını üflüyor.' },
      { min: 76, max: 99, icon: '🔥', label: 'Alev Kanatları', status: 'Gökyüzüne kanat çırpmaya başladı!' },
      { min: 100, max: 100, icon: '🐲✨', label: 'Kadim Muhafız', status: 'Senin en güçlü sağlık kalkanın oldu!' },
    ],
  },
];

/**
 * Belirli bir kademe ve sağlık yüzdesine (0-100) göre widget durumunu döndürür.
 * @param {string} tierId
 * @param {number} healthPercent
 */
export const getWidgetStage = (tierId, healthPercent = 50) => {
  const tier = WIDGET_THEMES.find((w) => w.id === tierId) || WIDGET_THEMES[0];
  const percent = Math.max(0, Math.min(100, Math.round(healthPercent)));

  const stage =
    tier.stages.find((s) => percent >= s.min && percent <= s.max) ||
    tier.stages[tier.stages.length - 1];

  return {
    tier,
    stage,
    healthPercent: percent,
  };
};
