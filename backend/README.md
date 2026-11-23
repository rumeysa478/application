# Habitime Backend API (Prisma ORM + Express)

Habitime mobil uygulaması için merkezi veritabanı, kimlik doğrulama, arkadaşlık sistemi, puan transferi, haftalık liderlik tablosu ve yapay zekâ kanıt doğrulama servisi.

---

## ⚡ Hızlı Başlangıç (Docker GEREKMEZ - Sıfır Kurulum)

Geliştirme ortamında **hiçbir harici yazılım (Docker veya yerel PostgreSQL) kurmanıza gerek yoktur**. Yerleşik SQLite veritabanı doğrudan çalışır.

### 1. Backend Dizinine Geçin
```bash
cd backend
```

### 2. Veritabanını Senkronize Edin ve Tohumlayın (Seed)
```bash
# Şemayı senkronize edin (otomatik dev.db oluşturur)
npm run db:push

# Demo kullanıcıları ve haftalık lig skorlarını yükleyin
npm run seed
```

### 3. API Sunucusunu Başlatın (Port 4000)
```bash
npm run dev
# veya
npm start
```

API Sunucusu `http://localhost:4000` adresinde çalışmaya başlar.  
Durum kontrolü: `http://localhost:4000/api/health`

### 4. Otomatik Testleri Çalıştırın
```bash
npm test
```
*(Kayıt, giriş, girdi denetimi, su/ilaç erteleme kuralları, kanıt doğrulama, liderlik tablosu ve atomik puan transferi testlerini tek komutla koşar).*

---

## 🛡️ Güvenlik Mimarisi

1. **Helmet HTTP Koruma Katmanı**:
   - Güvenli başlıklar (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, vb.)
   - `X-Powered-By: Express` bilgisi istemcilerden gizlenir.

2. **Gelişmiş Rate Limiting (Kötüye Kullanım & DDoS Koruması)**:
   - **Auth Limiter**: `/api/auth/register` ve `/api/auth/login` uç noktalarında 15 dakikada en fazla 15 deneme (Brute-Force ve Credential Stuffing koruması).
   - **Transfer Limiter**: `/api/friends/transfer-points` için 10 dakikada en fazla 30 istek (Bot puan boşaltma koruması).
   - **Genel API Limiter**: Tüm `/api/*` yolları için 15 dakikada en fazla 300 istek.

3. **Girdi Doğrulama & Sanitizasyon**:
   - E-posta formatı RFC 5322 regex ile denetlenir.
   - Kullanıcı adları 3-30 karakter, yalnızca alfasayısal ve alt çizgi (`[a-zA-Z0-9_]`) kabul eder.
   - Parola minimum 6 karakter şartı.
   - Yaş (5-120), boy (50-250 cm), kilo (20-300 kg) sınır kontrolleri.

4. **Atomik Veri Bütünlüğü**:
   - Puan transferleri Prisma `$transaction` ile işletilir; bakiye yetersizse veya alıcı bulunamazsa işlem rollback edilir, puan kaybı imkânsızdır.

5. **Güvenli Hata Yönetimi**:
   - Üretim ortamında (`NODE_ENV=production`) dahili veritabanı ve sunucu hata ayrıntıları istemcilere sızdırılmaz.

---

## 🐘 Üretim (Production) İçin PostgreSQL Modu

Uygulamanızı Docker, Supabase, Neon veya Railway üzerinde PostgreSQL ile çalıştırmak isterseniz:

1. `backend/prisma/schema.postgresql.prisma` dosyası hazırdır.
2. `.env` dosyasında `DATABASE_URL` satırını PostgreSQL adresinizle güncelleyin:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/habitime_db?schema=public"
   ```
3. Docker ile yerel PostgreSQL başlatmak için:
   ```bash
   docker compose up -d
   npx prisma db push --schema=prisma/schema.postgresql.prisma
   ```

---

## 📡 API Uç Noktaları

| Yöntem | Uç Nokta | Açıklama |
|---|---|---|
| `GET`  | `/api/health` | Sağlık durumu ve DB bağlantı kontrolü |
| `POST` | `/api/auth/register` | Kullanıcı kaydı (yaş, boy, kilo ile bilimsel su hesabı) |
| `POST` | `/api/auth/login` | Güvenli giriş ve JWT üretimi |
| `GET`  | `/api/auth/me` | Giriş yapmış kullanıcı bilgileri |
| `GET`  | `/api/habits` | Kullanıcının alışkanlık listesi |
| `POST` | `/api/habits` | Alışkanlık oluşturma (İlaç: 15 dk, Su: 30 dk erteleme) |
| `PUT`  | `/api/habits/:id` | Alışkanlık güncelleme |
| `DELETE` | `/api/habits/:id` | Alışkanlık silme |
| `POST` | `/api/habits/:id/snooze` | Hatırlatıcı erteleme (maksimum 3 hak) |
| `POST` | `/api/habits/:id/verify` | AI kanıt doğrulama, log ve puanlama (Zorunlu vs Ek Kanıt, 2x çarpanı) |
| `GET`  | `/api/friends` | Arkadaş listesi |
| `POST` | `/api/friends/connect` | Arkadaş bağlantısı kurma |
| `POST` | `/api/friends/transfer-points` | Arkadaşa puan transferi (Atomik transaction) |
| `GET`  | `/api/challenges/weekly/leaderboard` | Haftalık lig tablosu (üst %10 dilim ve eşit puanlılar) |
