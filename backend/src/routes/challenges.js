const express = require('express');
const prisma = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/challenges/weekly/leaderboard
 * Haftalık liderlik tablosunu döndürür.
 * KURAL:
 * - topCount = Math.max(1, Math.ceil(N * 0.10))
 * - Eşit puanda olan herkes avantajlı olarak üst %10 dilime dahil edilir.
 */
router.get('/weekly/leaderboard', optionalAuth, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const now = new Date();
    let challenge = await prisma.weeklyChallenge.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        scores: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                totalScore: true,
                hasDoublePointsNextDay: true,
              },
            },
          },
          orderBy: { points: 'desc' },
        },
      },
    });

    if (!challenge) {
      // Aktif yarışma yoksa en sonuncuyu veya tüm kullanıcıların puanlarını göster
      const allUsers = await prisma.user.findMany({
        orderBy: { totalScore: 'desc' },
        take: 50,
        select: {
          id: true,
          username: true,
          totalScore: true,
          hasDoublePointsNextDay: true,
        },
      });

      const N = allUsers.length;
      const topCount = Math.max(1, Math.ceil(N * 0.1));
      const thresholdScore = N > 0 && topCount <= N ? allUsers[topCount - 1].totalScore : 0;

      const leaderboard = allUsers.map((u, index) => ({
        rank: index + 1,
        userId: u.id,
        username: u.username,
        points: u.totalScore,
        isInTop10Percent: u.totalScore > 0 && u.totalScore >= thresholdScore,
        hasDoublePointsNextDay: u.hasDoublePointsNextDay,
        isCurrentUser: req.user ? req.user.userId === u.id : false,
      }));

      return res.json({
        success: true,
        challenge: { title: 'Genel Sıralama Ligi', startsAt: now, endsAt: now },
        totalParticipants: N,
        top10ThresholdScore: thresholdScore,
        top10Count: topCount,
        leaderboard,
      });
    }

    const scores = challenge.scores;
    const N = scores.length;
    const topCount = Math.max(1, Math.ceil(N * 0.1));
    const threshold = N > 0 && topCount <= N ? scores[topCount - 1].points : 0;

    const leaderboard = scores.map((s, index) => ({
      rank: index + 1,
      userId: s.user.id,
      username: s.user.username,
      points: s.points,
      isInTop10Percent: s.points > 0 && s.points >= threshold,
      hasDoublePointsNextDay: s.user.hasDoublePointsNextDay,
      isCurrentUser: req.user ? req.user.userId === s.user.id : false,
    }));

    res.json({
      success: true,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
      },
      totalParticipants: N,
      top10ThresholdScore: threshold,
      top10Count: topCount,
      leaderboard,
    });
  } catch (error) {
    console.error('Liderlik tablosu hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/challenges/weekly/distribute-double-points
 * Gün/hafta sonu üst %10'luk dilime giren tüm kullanıcılara yarın için 2x çarpan ödülü dağıtır
 */
router.post('/weekly/distribute-double-points', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const now = new Date();
    const challenge = await prisma.weeklyChallenge.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        scores: {
          orderBy: { points: 'desc' },
        },
      },
    });

    if (!challenge || challenge.scores.length === 0) {
      return res.json({ success: true, message: 'İşlem yapılacak yarışmacı bulunamadı.' });
    }

    const scores = challenge.scores;
    const N = scores.length;
    const topCount = Math.max(1, Math.ceil(N * 0.1));
    const threshold = scores[Math.min(topCount - 1, N - 1)].points;

    // Eşik puana eşit veya büyük olan herkes (eşitler avantajlı kuralı)
    const qualifyingUserIds = scores
      .filter((s) => s.points > 0 && s.points >= threshold)
      .map((s) => s.userId);

    if (qualifyingUserIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: qualifyingUserIds } },
        data: { hasDoublePointsNextDay: true },
      });
    }

    res.json({
      success: true,
      message: `${qualifyingUserIds.length} kullanıcıya yarın için 2x puan çarpanı hakkı tanımlandı! 🎉`,
      rewardedCount: qualifyingUserIds.length,
    });
  } catch (error) {
    console.error('2x puan dağıtım hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
