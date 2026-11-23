const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Helmet HTTP Güvenlik Başlıkları
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Mobil / SPA API için CSP esnek tutulur
  crossOriginEmbedderPolicy: false,
});

/**
 * Genel API İstek Limiti (DDoS ve Flood Koruması)
 * 15 dakikada IP başına maksimum 300 istek
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Çok fazla istek yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
  },
});

/**
 * Kimlik Doğrulama Limiti (Brute-Force & Credential Stuffing Koruması)
 * 15 dakikada IP başına maksimum 15 kayıt veya giriş denemesi
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Çok fazla başarısız veya peş peşe giriş/kayıt denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
  },
});

/**
 * Puan Transfer Limiti (Bot ve Kötüye Kullanım Koruması)
 * 10 dakikada maksimum 30 transfer isteği
 */
const transferLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Kısa sürede çok fazla puan transferi yapıldı. Lütfen biraz bekleyin.',
  },
});

/**
 * E-posta format doğrulaması (RFC 5322 genel kontrolü)
 */
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

/**
 * Kullanıcı adı doğrulaması (3-30 karakter, harf, rakam ve alt çizgi)
 */
const isValidUsername = (username) => {
  if (typeof username !== 'string') return false;
  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  return regex.test(username.trim());
};

/**
 * Kayıt girdilerini doğrulama middleware
 */
const validateRegisterInput = (req, res, next) => {
  let { username, email, password, age, heightCm, weightKg } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Kullanıcı adı, e-posta ve parola alanları zorunludur.',
    });
  }

  username = String(username).trim();
  email = String(email).trim().toLowerCase();

  if (!isValidUsername(username)) {
    return res.status(400).json({
      success: false,
      error: 'Kullanıcı adı 3-30 karakter uzunluğunda olmalı ve yalnızca harf, rakam ve alt çizgi içermelidir.',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Lütfen geçerli bir e-posta adresi girin.',
    });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Parola en az 6 karakter uzunluğunda olmalıdır.',
    });
  }

  if (age !== undefined && age !== null && age !== '') {
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 120) {
      return res.status(400).json({
        success: false,
        error: 'Yaş 5 ile 120 arasında geçerli bir tam sayı olmalıdır.',
      });
    }
    req.body.age = parsedAge;
  }

  if (heightCm !== undefined && heightCm !== null && heightCm !== '') {
    const parsedHeight = parseInt(heightCm, 10);
    if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 250) {
      return res.status(400).json({
        success: false,
        error: 'Boy 50 ile 250 cm arasında geçerli bir değer olmalıdır.',
      });
    }
    req.body.heightCm = parsedHeight;
  }

  if (weightKg !== undefined && weightKg !== null && weightKg !== '') {
    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
      return res.status(400).json({
        success: false,
        error: 'Kilo 20 ile 300 kg arasında geçerli bir değer olmalıdır.',
      });
    }
    req.body.weightKg = parsedWeight;
  }

  req.body.username = username;
  req.body.email = email;
  next();
};

/**
 * Giriş girdilerini doğrulama middleware
 */
const validateLoginInput = (req, res, next) => {
  let { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({
      success: false,
      error: 'Kullanıcı adı/e-posta ve parola gereklidir.',
    });
  }

  req.body.login = String(login).trim();
  next();
};

module.exports = {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  transferLimiter,
  validateRegisterInput,
  validateLoginInput,
  isValidEmail,
  isValidUsername,
};
