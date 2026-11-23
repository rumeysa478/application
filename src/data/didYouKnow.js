/**
 * Habitime - "Biliyor muydunuz?" Bilgi Veritabanı
 * Alışkanlıklar, sağlık, odaklanma ve bilim üzerine ilgi çekici hap bilgiler.
 */
export const DID_YOU_KNOW_FACTS = [
  {
    id: 'dyk-1',
    category: 'Sağlık',
    fact: 'Beynimizin yaklaşık %73\'ü sudan oluşur. Yalnızca %2\'lik bir sıvı kaybı bile odaklanma, hafıza ve karar verme hızını belirgin şekilde düşürür.',
  },
  {
    id: 'dyk-2',
    category: 'Alışkanlık',
    fact: 'University College London araştırmasına göre yeni bir alışkanlığın zihinde otomatik hale gelmesi ortalama 66 gün sürer.',
  },
  {
    id: 'dyk-3',
    category: 'Sağlık',
    fact: 'Reçeteli ilaçların her gün aynı saatte alınması, ilacın kandaki etken madde dengesini koruması açısından hayati önem taşır.',
  },
  {
    id: 'dyk-4',
    category: 'Verimlilik',
    fact: 'Masa başında çalışırken her 45 dakikada bir 2 dakika ayağa kalkıp yürümek kan dolaşımını ve bacak damarlarındaki akışı %30 artırır.',
  },
  {
    id: 'dyk-5',
    category: 'Sağlık',
    fact: 'Sabah uyanır uyanmaz içilen 1 bardak ılık su, gece boyu susuz kalan organları uyarır ve metabolizmayı anında %24 hızlandırır.',
  },
  {
    id: 'dyk-6',
    category: 'Psikoloji',
    fact: 'Erteleme (procrastination) tembellik değil, stres ve olumsuz duyguları yönetememe durumudur. Eyleme geçmek stresi hızla düşürür.',
  },
  {
    id: 'dyk-7',
    category: 'Alışkanlık',
    fact: 'James Clear\'ın "2 Dakika Kuralı"na göre yeni bir alışkanlığa başlarken ilk hedef eylemi sadece 2 dakikada başlatabilmektir.',
  },
  {
    id: 'dyk-8',
    category: 'Bilim',
    fact: '20-20-20 Kuralı: Ekran başında her 20 dakikada bir, 20 saniye boyunca 6 metre uzağa bakmak göz kaslarındaki spazmı ve kuruluğu engeller.',
  },
  {
    id: 'dyk-9',
    category: 'Verimlilik',
    fact: 'Stanford Üniversitesi çalışması, hafif tempoda yürüyüş yapmanın yaratıcı problem çözme potansiyelini %60 oranında artırdığını kanıtlamıştır.',
  },
  {
    id: 'dyk-10',
    category: 'Sağlık',
    fact: 'Beyindeki açlık ve susuzluk merkezleri yan yanadır. Birçok ani atıştırma isteği aslında vücudun gizli susuzluk çağrısıdır.',
  },
  {
    id: 'dyk-11',
    category: 'Nörobilim',
    fact: 'Beyin bir alışkanlığı tamamlarken değil, o eylemi yapacağını beklerken en yüksek dopamini salgılar. Beklenti en büyük motivasyondur.',
  },
  {
    id: 'dyk-12',
    category: 'Biyoloji',
    fact: 'Dik duruş ve derin nefes, stres hormonu kortizolü %25 düşürürken vücudun oksijenlenme kapasitesini maksimuma çıkarır.',
  },
  {
    id: 'dyk-13',
    category: 'Uyku',
    fact: 'Yatmadan 1 saat önce mavi ışık yayan ekranları bırakmak, derin uyku evresini tetikleyen melatonin hormonunu %80 oranında dengeler.',
  },
  {
    id: 'dyk-14',
    category: 'Sağlık',
    fact: 'Bir seferde 1 litre su içmek yerine saat başı 1 bardak su içmek böbreklerin suyu hücresel düzeyde emmesini sağlar.',
  },
  {
    id: 'dyk-15',
    category: 'Psikoloji',
    fact: 'Yapılan bir görevi fotoğraflayarak belgelemek zihinde "tamamlandı" hissini ve ertesi gün devam etme kararlılığını %40 güçlendirir.',
  },
  {
    id: 'dyk-16',
    category: 'Alışkanlık',
    fact: 'Alışkanlık İstifleme (Habit Stacking): Yeni bir alışkanlığı yerleşik bir rutinle birleştirmek ("Kahveden hemen sonra ilacımı alacağım") başarıyı 2 katına çıkarır.',
  },
];

/**
 * Rastgele bir "Biliyor muydunuz?" bilgisi döndürür.
 * İleride harici bir bilgi/haber API'sine bağlanabilecek şekilde tasarlanmıştır.
 * @returns {{ id: string, category: string, fact: string }}
 */
export const getRandomFact = () => {
  const randomIndex = Math.floor(Math.random() * DID_YOU_KNOW_FACTS.length);
  return DID_YOU_KNOW_FACTS[randomIndex];
};
