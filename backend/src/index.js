require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const friendRoutes = require('./routes/friends');
const challengeRoutes = require('./routes/challenges');
const prisma = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root & Healthcheck
app.get('/', (req, res) => {
  res.json({
    name: 'Habitime Backend API',
    version: '1.0.0',
    status: 'online',
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
    time: new Date(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/challenges', challengeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Beklenmeyen Sunucu Hatası:', err);
  res.status(500).json({
    success: false,
    error: 'Sunucu tarafında beklenmeyen bir hata oluştu: ' + (err.message || err),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Habitime API Sunucusu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`📊 PostgreSQL URL: ${process.env.DATABASE_URL ? 'Tanımlandı' : 'Tanımlanmadı'}`);
});
