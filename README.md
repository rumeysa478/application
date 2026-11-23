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

- 🤖 **Vision AI ile Su Kabı Doğrulaması:** Fotoğraf çekildiğinde rastgele bir görüntü kabul edilmez; yapay zekâ (Google Gemini 1.5 Flash Vision API) karede su bardağı, şişe veya matara olup olmadığını analiz eder. Yalnızca geçerli kanıtlar onaylanır.
- 🔒 **Gizlilik Odaklı Geçici Veri Temizliği:** Kanıt fotoğrafları cihazda veya sunucuda kalıcı olarak depolanmaz; doğrulama sonrası fotoğraf verisi bellekten temizlenir, yalnızca zaman damgası ve tüketim miktarı kaydedilir.
- 💧 **Günlük Su Hedefi & İlerleme Takibi:** Kullanıcı günlük su hedefini (örn. 2.5 Litre) ve bardak porsiyonunu (örn. 250 ml) belirler. Her doğrulamada su miktarı eklenir ve hedef dolmadan gün tamamlandı sayılmaz.
- 📅 **Gün Bazlı Çalışma Saatleri & Uyku Modu Koruması:** Haftanın her günü (Pazartesi–Pazar) için ayrı başlangıç ve bitiş saatleri (örn. 09:00 – 23:00) ayarlanabilir. Uyku saatlerinde alarmlar ve zorlayıcı mod devreye girmez.
- ✏️ **Alışkanlık Düzenleme Ekranı (`EditHabitScreen`):** Alışkanlık adı, tekrar sıklığı, günlük hedef ve haftalık saatler istendiği an güncellenebilir.
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
| **AsyncStorage** | Alışkanlık verileri, günlük su tüketimi ve API anahtarı depolama |
| **React Navigation (Native Stack)** | Ekranlar arası akıcı geçişler ve modal yönetimi |

---

## 📂 Proje Dizin Yapısı

```text
Habitime/
├── src/
│   ├── data/
│   │   └── didYouKnow.js            # "Biliyor muydunuz?" bilgi havuzu (16+ bilimsel not)
│   ├── screens/
│   │   ├── HomeScreen.js            # Ana ekran, su ilerleme çubuğu ve kart listesi
│   │   ├── AddHabitScreen.js        # Yeni alışkanlık, hedef ve haftalık saat tanımlama
│   │   ├── EditHabitScreen.js       # Alışkanlık düzenleme ekranı
│   │   └── CameraProofScreen.js     # Kamera önizleme ve Vision AI doğrulama ekranı
│   └── services/
│       ├── visionAi.js              # Gemini Vision API ile su kabı analiz servisi
│       ├── storage.js               # AsyncStorage CRUD, su tüketimi ve saat aralığı kontrolü
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
