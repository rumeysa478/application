# Habitime Backend (PostgreSQL + Prisma ORM + Express)

Habitime mobil uygulaması için merkezi veritabanı, kimlik doğrulama, arkadaşlık sistemi, puan transferi ve haftalık lig liderlik tablosu servisi.

---

## 🚀 Hızlı Başlangıç

### 1. PostgreSQL Veritabanını Başlatın (Docker ile 1 Adımda)
```bash
cd backend
docker compose up -d
```
*(Port: `5432`, Veritabanı: `habitime_db`, Kullanıcı: `habitime`, Parola: `habitime_pass`)*

---

### 2. Bağımlılıkları Yükleyin ve Prisma Şemasını Senkronize Edin
```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
```

---

### 3. Demo Verileri Yükleyin (Opsiyonel ama Tavsiye Edilir)
```bash
npm run seed
```
*(10 adet kullanıcı, arkadaşlık bağları ve haftalık yarışma puanlarını otomatik yükler)*

---

### 4. API Sunucusunu Çalıştırın
```bash
npm run dev
# veya
npm start
```
Sunucu: `http://localhost:4000` adresinde dinlemeye başlar.

---

## 📡 API Uç Noktaları

| Yöntem | Uç Nokta | Açıklama |
|---|---|---|
| `POST` | `/api/auth/register` | Kayıt (yaş, boy, kilo ile bilimsel su litresi hesabı) |
| `POST` | `/api/auth/login` | Giriş ve JWT üretimi |
| `GET`  | `/api/auth/me` | Giriş yapmış kullanıcı bilgileri |
| `GET`  | `/api/habits` | Kullanıcının alışkanlık listesi |
| `POST` | `/api/habits` | Alışkanlık oluşturma (İlaç: 15 dk, Su: 30 dk erteleme) |
| `PUT`  | `/api/habits/:id` | Alışkanlık güncelleme |
| `DELETE` | `/api/habits/:id` | Alışkanlık silme |
| `POST` | `/api/habits/:id/verify` | Kanıt doğrulama, log ve puanlama (Zorunlu vs Ek Kanıt, 2x çarpanı) |
| `GET`  | `/api/friends` | Arkadaş listesi |
| `POST` | `/api/friends/connect` | Arkadaş bağlantısı kurma |
| `POST` | `/api/friends/transfer-points` | Arkadaşa puan transferi |
| `GET`  | `/api/challenges/weekly/leaderboard` | Haftalık liderlik tablosu (üst %10 dilim ve eşit puanlılar) |
| `POST` | `/api/challenges/weekly/distribute-double-points` | Üst %10 dilime yarın için 2x çarpan tanımlama |
