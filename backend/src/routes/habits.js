const express = require('express');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/habits
 * Kullanıcının tüm alışkanlıklarını listeler
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, habits });
  } catch (error) {
    console.error('Alışkanlıkları listeleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/habits
 * Yeni Su veya İlaç alışkanlığı oluşturur.
 * Kural: İlaç için 15 dakika, Su için 30 dakika erteleme süresi tanımlanır.
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const {
      type,
      title,
      dailyTargetLiters,
      intervalMinutes,
      scheduleJson,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Alışkanlık başlığı gereklidir.' });
    }

    const habitType = type === 'MEDICATION' ? 'MEDICATION' : 'WATER';
    // İlaç: 15 dk, Su: 30 dk
    const snoozeMinutes = habitType === 'MEDICATION' ? 15 : 30;

    const habit = await prisma.habit.create({
      data: {
        userId: req.user.userId,
        type: habitType,
        title: title.trim(),
        dailyTargetLiters: habitType === 'WATER' ? (parseFloat(dailyTargetLiters) || 2.5) : null,
        consumedTodayLiters: 0,
        intervalMinutes: habitType === 'WATER' ? (parseInt(intervalMinutes, 10) || 60) : null,
        snoozeMinutes,
        maxSnoozes: 3,
        snoozeCount: 0,
        scheduleJson: scheduleJson || {},
        isCompletedToday: false,
      },
    });

    res.status(201).json({ success: true, habit });
  } catch (error) {
    console.error('Alışkanlık ekleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/habits/:id
 * Alışkanlığı günceller
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const { id } = req.params;
    const { title, dailyTargetLiters, intervalMinutes, scheduleJson, isCompletedToday } = req.body;

    const existing = await prisma.habit.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Alışkanlık bulunamadı.' });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(dailyTargetLiters !== undefined && { dailyTargetLiters: parseFloat(dailyTargetLiters) }),
        ...(intervalMinutes !== undefined && { intervalMinutes: parseInt(intervalMinutes, 10) }),
        ...(scheduleJson && { scheduleJson }),
        ...(isCompletedToday !== undefined && { isCompletedToday: Boolean(isCompletedToday) }),
      },
    });

    res.json({ success: true, habit: updated });
  } catch (error) {
    console.error('Alışkanlık güncelleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/habits/:id
 * Alışkanlığı siler
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const { id } = req.params;
    const existing = await prisma.habit.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Alışkanlık bulunamadı.' });
    }

    await prisma.habit.delete({ where: { id } });
    res.json({ success: true, message: 'Alışkanlık silindi.' });
  } catch (error) {
    console.error('Alışkanlık silme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/habits/:id/verify
 * Kanıt doğrulama ve puanlama:
 * - Zorunlu Kanıt vs. Ek Kanıt ayrımı
 * - hasDoublePointsNextDay sadece zorunlu kanıt puanlarına 2x çarpanı uygular
 * - Ek kanıta 2x uygulanmaz (sabit +10 puan)
 * - Fotoğraf saklanmaz; yalnızca VerificationLog zaman damgası tutulur
 */
router.post('/:id/verify', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const { id } = req.params;
    const { isExtra = false, amountLiters = 0.25, onTime = true, zeroSnooze = false } = req.body;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!habit) {
      return res.status(404).json({ success: false, error: 'Alışkanlık bulunamadı.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    // Puan Hesaplama
    let earnedPoints = 0;
    let multiplier = 1;

    if (isExtra) {
      // Ek Kanıt: Sabit +10 puan, 2x çarpanı uygulanmaz
      earnedPoints = 10;
    } else {
      // Zorunlu Kanıt: Zamanında (+20) veya geç (+10)
      let basePoints = onTime ? 20 : 10;
      if (zeroSnooze) basePoints += 15; // Sıfır erteleme bonusu

      // Hedefe ulaşıldı mı kontrolü
      const isWater = habit.type === 'WATER';
      const newTotal = (habit.consumedTodayLiters || 0) + (isWater ? parseFloat(amountLiters) : 0);
      const isGoalReached = isWater
        ? newTotal >= (habit.dailyTargetLiters || 2.5)
        : true;

      if (isGoalReached) {
        basePoints += 35; // Hedef tamamlandı ödülü
      }

      // Üst %10'luk dilim ödülü: hasDoublePointsNextDay ise 2x çarpanı
      if (user.hasDoublePointsNextDay) {
        multiplier = 2;
      }
      earnedPoints = basePoints * multiplier;
    }

    // Alışkanlık İlerlemesini Güncelle
    const isWater = habit.type === 'WATER';
    const updatedConsumed = isWater
      ? Number(((habit.consumedTodayLiters || 0) + parseFloat(amountLiters)).toFixed(2))
      : habit.consumedTodayLiters;
    const isCompleted = isWater
      ? updatedConsumed >= (habit.dailyTargetLiters || 2.5)
      : true;

    const [updatedHabit, updatedUser, verificationLog] = await prisma.$transaction([
      prisma.habit.update({
        where: { id },
        data: {
          consumedTodayLiters: updatedConsumed,
          isCompletedToday: isCompleted,
          snoozeCount: 0,
          lastVerifiedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: req.user.userId },
        data: {
          totalScore: { increment: earnedPoints },
        },
      }),
      // Geçici fotoğraf verisi saklanmaz; sadece zaman damgası loglanır
      prisma.verificationLog.create({
        data: {
          userId: req.user.userId,
          habitId: id,
          habitType: habit.type,
          isExtra: Boolean(isExtra),
          pointsWon: earnedPoints,
          verifiedAt: new Date(),
        },
      }),
    ]);

    // Aktif Haftalık Yarışma Skoruna Ekle
    try {
      const now = new Date();
      let activeChallenge = await prisma.weeklyChallenge.findFirst({
        where: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      });

      if (!activeChallenge) {
        // Otomatik haftalık yarışma oluştur
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Pazartesi
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        activeChallenge = await prisma.weeklyChallenge.create({
          data: {
            title: `Haftalık Su & Sağlık Ligi (${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleString('tr-TR', { month: 'short' })})`,
            startsAt: weekStart,
            endsAt: weekEnd,
            isActive: true,
          },
        });
      }

      if (activeChallenge) {
        await prisma.weeklyScore.upsert({
          where: {
            challengeId_userId: {
              challengeId: activeChallenge.id,
              userId: req.user.userId,
            },
          },
          update: {
            points: { increment: earnedPoints },
          },
          create: {
            challengeId: activeChallenge.id,
            userId: req.user.userId,
            points: earnedPoints,
          },
        });
      }
    } catch (challengeErr) {
      console.warn('Haftalık skor güncellenirken hata (ihmal edilebilir):', challengeErr);
    }

    res.json({
      success: true,
      message: 'Kanıt başarıyla doğrulandı!',
      earnedPoints,
      multiplier,
      totalScore: updatedUser.totalScore,
      habit: updatedHabit,
      verificationLogId: verificationLog.id,
    });
  } catch (error) {
    console.error('Kanıt doğrulama hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
