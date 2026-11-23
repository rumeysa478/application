const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { authLimiter, validateRegisterInput, validateLoginInput } = require('../middleware/security');

const router = express.Router();

/**
 * Bilimsel önerilen günlük su hedefi hesaplama (EFSA / WHO / ~35 ml/kg kuralı)
 */
const calculateRecommendedWater = (weightKg) => {
  if (!weightKg || isNaN(weightKg) || weightKg <= 0) return 2.5;
  const calculated = (Number(weightKg) * 35) / 1000;
  return Number(Math.min(5.0, Math.max(1.5, calculated)).toFixed(2));
};

/**
 * POST /api/auth/register
 * Kullanıcı kaydı oluşturur.
 * Güvenlik: authLimiter + validateRegisterInput
 */
router.post('/register', authLimiter, validateRegisterInput, async (req, res) => {
  try {
    const { username, email, password, age, heightCm, weightKg } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Veritabanı bağlantısı henüz hazır değil.',
      });
    }

    // E-posta veya kullanıcı adı zaten kullanımda mı?
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { username: username.trim() },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parsedWeight = weightKg ? parseFloat(weightKg) : null;
    const recommendedWaterLiters = calculateRecommendedWater(parsedWeight);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        age: age ? parseInt(age, 10) : null,
        heightCm: heightCm ? parseInt(heightCm, 10) : null,
        weightKg: parsedWeight,
        recommendedWaterLiters,
        totalScore: 0,
        hasDoublePointsNextDay: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        heightCm: true,
        weightKg: true,
        recommendedWaterLiters: true,
        totalScore: true,
        hasDoublePointsNextDay: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Kayıt başarıyla oluşturuldu.',
      user,
      token,
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Kayıt sırasında bir hata oluştu: ' + error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Kullanıcı girişi ve JWT token üretimi
 * Güvenlik: authLimiter + validateLoginInput
 */
router.post('/login', authLimiter, validateLoginInput, async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Veritabanı bağlantısı henüz hazır değil.',
      });
    }

    const cleanInput = login.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput.toLowerCase() },
          { username: cleanInput },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı/e-posta veya parola hatalı.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı/e-posta veya parola hatalı.',
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { passwordHash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Giriş başarılı.',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Giriş sırasında bir hata oluştu: ' + error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Mevcut kullanıcı bilgilerini döndürür
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        age: true,
        heightCm: true,
        weightKg: true,
        recommendedWaterLiters: true,
        totalScore: true,
        hasDoublePointsNextDay: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
