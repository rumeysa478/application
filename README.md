# ⏰ Habitime - Yapay Zekâ Destekli Zorlayıcı Alışkanlık Takip Uygulaması

<p align="center">
  <b>Ertelemeye son veren, Vision AI (Yapay Zekâ) ile su kabı doğrulamalı akıllı alışkanlık takip asistanı.</b>
</p>

---

## 📖 Proje Hakkında

**Habitime**, özellikle günlük su tüketimi ve düzenli rutinleri aksatmadan yerine getirmeyi sağlayan **yapay zekâ destekli ve zorlayıcı bir mobil takip uygulamasıdır**.

Geleneksel takip uygulamalarının aksine sadece bildirim göndermekle kalmaz; kullanıcının su içtiğini **kamera ve Vision AI (Google Gemini API)** aracılığıyla kadrajdaki su bardağını, şişesini veya matarasını analiz ederek doğrular. 

Erteleme mekanizması sınırlandırılmış olup, süre dolduğunda kullanıcı görevi yerine getirene kadar uyarı vermeye devam eder. Ayrıca uyku saatlerini koruyan gün bazlı akıllı saat aralıkları ve litre bazlı günlük hedef takibi sunar.

---

## ✨ Temel Özellikler

- 🤖 **Vision AI ile Su Kabı Doğrulaması:** Fotoğraf çekildiğinde rastgele bir görüntü kabul edilmez; yapay zekâ (Google Gemini Vision API: 2.0-flash, 2.5-flash, 1.5-flash modelleri dinamik keşifli) karede su bardağı, şişe veya matara olup olmadığını analiz eder. Yalnızca geçerli kanıtlar onaylanır.
- 🔒 **Gizlilik Odaklı Geçici Veri Temizliği:** Kanıt fotoğrafları cihazda veya sunucuda kalıcı olarak depolanmaz; doğrulama sonrası fotoğraf verisi bellekten temizlenir, yalnızca zaman damgası ve tüketim miktarı kaydedilir.
- 👤 **Profil & Bilimsel Su Hedefi Hesaplama:** İsteğe bağlı Yaş, Boy ve Kilo verileri girildiğinde EFSA / WHO / NASEM rehberlerine (~33 ml/kg) dayalı günlük önerilen su litresi otomatik hesaplanır; kullanıcı dilerse manuel düzenleyebilir.
- ⏰ **Standart Alarm Saat/Dakika Seçici (`TimePickerModal`):** Haftanın 7 günü için çalışma ve uyku saatleri alarm kurar gibi interaktif saat/dakika seçici tekerleğiyle ayarlanabilir.
- 🪙 **Zorunlu vs. Ek Kanıt Puan Motoru:**
  - *Zorunlu Kanıt:* Zamanında: +20 puan, Geç: +10 puan, Sıfır erteleme: +15 puan, Hedef tamamlama: +35 puan (🔥 2x bonusu geçerlidir).
  - *Ek Kanıt:* Her an yüklenebilir (+10 puan, günde en fazla 5 kez puan alınabilir, 2x çarpanı ASLA uygulanmaz).
- 🏆 **Haftalık Yarışma & Eşitlik Korumalı İlk %10 (Top 10%):** Haftalık rotasyonlu yarışmalar. Skor tablosunda ilk %10'a girenler (aynı baraj puanına sahip eşitlikler dahil) bir sonraki dönemde 2x puan kazanır.
- 🪴 **Yaşayan Maskot Widget'ı & Kademeli Büyüme (Multi-Day):** Maskot 1 günde maksimuma ulaşamaz; günde en fazla +15 sağlık/büyüme kazanabilir ve günlere yayılan istikrarlı su tüketimiyle evrimleşir. Pazar yerinden yeni maskotlar açılabilir.
- 👥 **Sosyal Ağ & Arkadaşlık:** Arkadaş koduyla ekleşme, arkadaşların yaşayan maskotunu görüntüleme ve arkadaşa hediye puan aktarma.
- ⏳ **Sınırlı Erteleme (Snooze) Mekanizması:** En fazla **3 kez 30'ar dakika** erteleme hakkı.
- 🚨 **Zorlayıcı Alarm & Titreşim:** Erteleme hakları tükendiğinde, su kabı kanıtı onaylanana kadar devam eden sürekli titreşimli zorunlu mod devreye girer.
- 💡 **"Biliyor Muydunuz?" Bilgi Kartları:** Bildirimlerde ve görev ekranlarında kullanıcıyı motive eden 16+ bilimsel ve psikolojik hap bilgi.

---

## 🛠️ Teknoloji Stoku

| Teknoloji / Kütüphane | Kullanım Amacı |
| :--- | :--- |
| **React Native (Expo SDK 58)** | Çapraz platform (iOS & Android) mobil uygulama çatısı |
| **Expo Camera (`CameraView`)** | Kamera önizlemesi ve anlık kanıt fotoğrafı çekimi |
| **Google Gemini Vision API** | Çekilen fotoğrafta su bardağı/kabı varlığını tespit eden yapay zekâ |
| **Expo Notifications** | Yerel zamanlanmış bildirimler ve uyarı yönetimi |
| **AsyncStorage** | Alışkanlıklar, profil, haftalık skorlar ve yaşayan maskot verileri |
| **React Navigation (Native Stack)** | Ekranlar arası akıcı geçişler ve modal yönetimi |

---

## 📂 Proje Dizin Yapısı

```text
Habitime/
├── src/
│   ├── components/
│   │   ├── LivingWidget.js          # Yaşayan maskot bileşeni ve sağlık durumu
│   │   └── TimePickerModal.js       # Standart alarm saat ve dakika seçici modalı
│   ├── data/
│   │   ├── dailyChallenges.js       # Haftalık yarışma görevleri ve havuz
│   │   └── didYouKnow.js            # "Biliyor muydunuz?" bilgi havuzu (16+ bilimsel not)
│   ├── screens/
│   │   ├── HomeScreen.js            # Ana ekran, yaşayan widget, su barı ve kart listesi
│   │   ├── AddHabitScreen.js        # Yeni alışkanlık ve alarm saat seçimi
│   │   ├── EditHabitScreen.js       # Alışkanlık düzenleme ve alarm saat seçimi
│   │   ├── ProfileScreen.js         # Yaş/boy/kilo ve önerilen su hedefi düzenleme
│   │   ├── LeaderboardScreen.js     # Haftalık skor tablosu, ilk %10 ve arkadaş etkileşimi
│   │   ├── WidgetShopScreen.js      # Maskot dükkanı ve puan harcama
│   │   └── CameraProofScreen.js     # Kamera önizleme, Vision AI ve zorunlu/ek kanıt onaylama
│   └── services/
│       ├── visionAi.js              # Gemini Vision API analiz ve dinamik model keşif servisi
│       ├── storage.js               # AsyncStorage CRUD, su tüketimi ve saat aralığı kontrolü
│       ├── userService.js           # Profil, EFSA su formülü, puan motoru ve maskot gelişimi
│       ├── leaderboardService.js    # Haftalık skor tablosu ve eşitlik korumalı ilk %10 hesabı
│       ├── notifications.js         # Bildirim ve erteleme planlama servisi
│       └── vibration.js             # Kesintisiz titreşim ve alarm servisi
├── App.js                           # NavigationContainer ve Stack Navigator
├── app.json                         # Expo yapılandırması ve kamera izin eklentileri
├── package.json                     # Bağımlılıklar
└── README.md                        # Proje dokümantasyonu
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Ön Gereksinimler
- Sisteminizde **Node.js** (v18 veya üzeri) kurulu olmalıdır.
- Test için fiziksel cihazınızda **Expo Go** uygulaması veya yüklü bir emülatör bulunmalıdır.

### 2. Projeyi Klonlayın ve Başlatın
```bash
# Repoyu klonlayın
git clone https://github.com/rumeysa478/application.git
cd application

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npx expo start
```

### 3. Yapay Zekâ (Gemini API) Anahtarını Tanımlama
- Google AI Studio'dan (`aistudio.google.com`) ücretsiz Gemini API anahtarı alabilirsiniz.
- Uygulama içinde **"🔑 AI Anahtarı"** butonuna dokunarak anahtarınızı yapıştırabilirsiniz.
- API anahtarı girilmediğinde veya internet olmadığında uygulama çökmez; otomatik olarak güvenli **manuel doğrulama** moduna geçer.

---

## 📄 Lisans
Bu proje eğitim ve kişisel gelişim amaçlı geliştirilmektedir.
