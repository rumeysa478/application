# ⏰ Habitime - Zorlayıcı Alışkanlık Takip Uygulaması

<p align="center">
  <b>Ertelemeye son veren, fotoğraf doğrulamalı akıllı alışkanlık takip asistanı.</b>
</p>

---

## 📖 Proje Hakkında

**Habitime**, özellikle su içme, düzenli ilaç alma, egzersiz yapma gibi kritik günlük rutinleri aksatmadan yerine getirmeyi sağlayan **zorlayıcı bir alışkanlık takip mobil uygulamasıdır**. 

Geleneksel takip uygulamalarının aksine, sadece bildirim göndermekle kalmaz; kullanıcının görevi gerçekten tamamladığını **kamera ile kanıt fotoğrafı alarak** doğrular. Erteleme mekanizması sınırlandırılmış olup, süre dolduğunda kullanıcı görevi yerine getirene kadar uyarı vermeye devam eder.

---

## ✨ Temel Özellikler

- 🔔 **Zamanlanmış Bildirimler:** Belirlenen saatlerde ve periyotlarda kullanıcıya hedefe özel hatırlatıcı bildirimler gönderilir.
- ⏳ **Sınırlı Erteleme (Snooze) Mekanizması:** 
  - Görev başına en fazla **3 kez** erteleme hakkı.
  - Her erteleme süresi **30 dakika** ile sınırlandırılmıştır.
- 🚨 **Zorlayıcı Uyarı & Alarm:** Erteleme hakları tükendiğinde veya süre bittiğinde, kanıt fotoğrafı çekilene kadar devam eden sürekli titreşim ve bildirim uyarıları devreye girer.
- 📸 **Kamera ile Kanıt Doğrulaması:** Kullanıcı görevi tamamladığını belgelemek için uygulama içi kamera ile anlık kanıt fotoğrafı çekmek zorundadır (örneğin: su bardağı, ilaç kutusu).
- 💡 **"Biliyor Muydunuz?" Bilgi Kartları:** Bildirim içeriklerinde ve görev ekranlarında kullanıcıyı motive eden, alışkanlıkla ilgili kısa gündem özetleri ve faydalı bilimsel ipuçları ("Biliyor muydunuz?").

---

## 🛠️ Teknoloji Stoku

Habitime, modern mobil geliştirme ekosisteminin güçlü araçlarıyla inşa edilmiştir:

| Teknoloji / Kütüphane | Kullanım Amacı |
| :--- | :--- |
| **React Native (Expo)** | Çapraz platform (iOS & Android) mobil uygulama çatısı |
| **Expo Camera** | Görev tamamlama kanıt fotoğraflarının çekimi ve kamera yönetimi |
| **Expo Notifications** | Yerel zamanlanmış bildirimler ve uyarı yönetimi |
| **AsyncStorage** | Alışkanlık verileri, erteleme sayaçları ve yerel durum saklama |
| **React Navigation** | Ekranlar arası akıcı geçişler ve stack navigasyon yönetimi |

---

## 📂 Proje Dizin Yapısı

```text
Habitime/
├── assets/                  # İkonlar, görseller ve statik dosyalar
├── src/
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri (Butonlar, Kartlar vb.)
│   ├── data/                # Statik veriler ("Biliyor muydunuz?" içerikleri vb.)
│   ├── screens/             # Uygulama ekranları (Ana Sayfa, Kamera, Detay vb.)
│   └── services/            # Bildirim, depolama ve kamera servis mantığı
├── App.js                   # Uygulama giriş noktası ve navigasyon kapsayıcısı
├── app.json                 # Expo yapılandırma dosyası
├── package.json             # Bağımlılıklar ve npm betikleri
└── README.md                # Proje dokümantasyonu
```

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel geliştirme ortamınızda ayağa kaldırmak için aşağıdaki adımları izleyin:

### 1. Ön Gereksinimler
- Sisteminizde **Node.js** (v18 veya üzeri) kurulu olmalıdır.
- Test için fiziksel cihazınızda **Expo Go** uygulaması (Android / iOS) veya yüklü bir emülatör bulunmalıdır.

### 2. Projeyi Klonlayın ve Bağımlılıkları Yükleyin
```bash
# Repoyu klonlayın
git clone https://github.com/rumeysa478/application.git
cd application

# Bağımlılıkları yükleyin (mevcut değilse)
npm install
```

### 3. Uygulamayı Başlatın
```bash
npx expo start
```

Uygulama başladığında terminalde bir QR kod görüntülenecektir:
- **Fiziksel Cihaz:** Expo Go uygulaması ile QR kodu taratarak projeyi anında test edebilirsiniz.
- **Android Emülatör:** Terminalde `a` tuşuna basın.
- **iOS Simülatör (macOS):** Terminalde `i` tuşuna basın.
- **Web:** Terminalde `w` tuşuna basın.

---

## 📋 Geliştirme Yol Haritası

- [x] Expo altyapısının ve temel paketlerin kurulumu
- [x] Temiz mimari klasör yapısının (`src/`) oluşturulması
- [x] Proje konsepti ve dokümantasyonun hazırlanması
- [ ] Navigasyon ve temel ekran tasarımlarının (Screens) kodlanması
- [ ] Bildirim ve erteleme (Snooze) servislerinin entegrasyonu
- [ ] Kamera doğrulama modülünün uygulanması
- [ ] "Biliyor muydunuz?" veri setinin ve dinamik gösteriminin eklenmesi
- [ ] Testler ve kullanıcı deneyimi optimizasyonları

---

## 📄 Lisans
Bu proje eğitim ve kişisel gelişim amaçlı geliştirilmektedir.
