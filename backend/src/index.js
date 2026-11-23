require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const friendRoutes = require('./routes/friends');
const challengeRoutes = require('./routes/challenges');
const prisma = require('./db');
const { helmetMiddleware, apiLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';

// 1. Güvenlik Başlıkları (Helmet)
app.use(helmetMiddleware);

// 2. CORS (Cross-Origin Resource Sharing)
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    credentials: true,
  })
);

// 3. Rate Limiting (DDoS & Abuse Koruması)
app.use('/api/', apiLimiter);

// 4. Payload Boyut Sınırlandırması (10MB - dosya ve fotoğraf transferleri için güvenli üst sınır)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. İstek Günlüğü (Request Logger)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 6. Kök ve Durum Kontrolü (Healthcheck)
app.get('/', (req, res) => {
  res.json({
    name: 'Habitime Backend API',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL?.startsWith('file:') ? 'sqlite' : 'postgresql',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    databaseType: process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite (Zero-config local)' : 'PostgreSQL',
    time: new Date(),
  });
});

// 7. API Uç Noktaları
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/challenges', challengeRoutes);

// 8. 404 Bulunamadı Yakalayıcı
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Uç nokta bulunamadı: ${req.method} ${req.originalUrl}`,
  });
});

// 9. Merkezi Güvenli Hata Yöneticisi (Hata Detayları Üretimde Gizlenir)
app.use((err, req, res, next) => {
  console.error('Beklenmeyen Sunucu Hatası:', err);
  res.status(err.status || 500).json({
    success: false,
    error: IS_PROD
      ? 'Sunucu tarafında bir işlem hatası oluştu.'
      : 'Sunucu hatası: ' + (err.message || err),
  });
});

// 10. Sunucuyu Başlat
const server = app.listen(PORT, () => {
  console.log(`🚀 Habitime API Sunucusu http://localhost:${PORT} adresinde aktif`);
  console.log(`🛡️ Güvenlik Katmanı: Helmet + Rate Limiter + CORS aktif`);
  console.log(`📊 Veritabanı Modu: ${process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite (dev.db - Sıfır Kurulum)' : 'PostgreSQL'}`);
});

module.exports = { app, server };
