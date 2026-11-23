const express = require('express');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { transferLimiter } = require('../middleware/security');

const router = express.Router();

/**
 * GET /api/friends
 * Kullanıcının arkadaşlarını listeler
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: req.user.userId },
          { addresseeId: req.user.userId },
        ],
        status: 'ACCEPTED',
      },
      include: {
        requester: {
          select: { id: true, username: true, totalScore: true, hasDoublePointsNextDay: true },
        },
        addressee: {
          select: { id: true, username: true, totalScore: true, hasDoublePointsNextDay: true },
        },
      },
    });

    const friends = friendships.map((f) => {
      const isRequester = f.requesterId === req.user.userId;
      const friendData = isRequester ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        ...friendData,
        connectedAt: f.createdAt,
      };
    });

    res.json({ success: true, friends });
  } catch (error) {
    console.error('Arkadaş listeleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/friends/connect
 * Kullanıcı adı veya ID ile arkadaşlık bağlantısı kurar
 */
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const { username, friendId } = req.body;

    if (!username && !friendId) {
      return res.status(400).json({
        success: false,
        error: 'Bağlanmak istediğiniz kişinin kullanıcı adı veya ID bilgisi gereklidir.',
      });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(friendId ? [{ id: friendId }] : []),
          ...(username ? [{ username: username.trim() }] : []),
        ],
      },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
    }

    if (targetUser.id === req.user.userId) {
      return res.status(400).json({ success: false, error: 'Kendinizi arkadaş olarak ekleyemezsiniz.' });
    }

    // Mevcut bağlantı kontrolü
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user.userId, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: req.user.userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(400).json({ success: false, error: 'Bu kullanıcı zaten arkadaş listenizde.' });
      }
      // Beklemede ise doğrudan onayla
      const accepted = await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: 'ACCEPTED' },
      });
      return res.json({ success: true, message: 'Arkadaşlık onaylandı!', friendship: accepted });
    }

    // Yeni arkadaşlık oluştur ve doğrudan kabul et (anında sosyalleşme)
    const newFriendship = await prisma.friendship.create({
      data: {
        requesterId: req.user.userId,
        addresseeId: targetUser.id,
        status: 'ACCEPTED',
      },
      include: {
        addressee: { select: { id: true, username: true, totalScore: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: `${targetUser.username} ile arkadaşlık bağlantısı kuruldu! 🎉`,
      friendship: newFriendship,
    });
  } catch (error) {
    console.error('Arkadaş ekleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/friends/transfer-points
 * Bir arkadaşa puan transferi gerçekleştirir
 */
router.post('/transfer-points', authenticateToken, transferLimiter, async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Veritabanı hazır değil.' });
    }

    const { receiverUsername, receiverId, points } = req.body;
    const transferAmount = parseInt(points, 10);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Geçerli bir puan miktarı girin.' });
    }

    const sender = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (sender.totalScore < transferAmount) {
      return res.status(400).json({
        success: false,
        error: `Yetersiz bakiye! Mevcut puanınız: ${sender.totalScore}, gönderilmek istenen: ${transferAmount}`,
      });
    }

    const receiver = await prisma.user.findFirst({
      where: {
        OR: [
          ...(receiverId ? [{ id: receiverId }] : []),
          ...(receiverUsername ? [{ username: receiverUsername.trim() }] : []),
        ],
      },
    });

    if (!receiver) {
      return res.status(404).json({ success: false, error: 'Puan gönderilecek kullanıcı bulunamadı.' });
    }

    if (receiver.id === sender.id) {
      return res.status(400).json({ success: false, error: 'Kendinize puan gönderemezsiniz.' });
    }

    // İşlemi Transaction ile güvenli tamamla
    const [updatedSender, updatedReceiver, transferRecord] = await prisma.$transaction([
      prisma.user.update({
        where: { id: sender.id },
        data: { totalScore: { decrement: transferAmount } },
      }),
      prisma.user.update({
        where: { id: receiver.id },
        data: { totalScore: { increment: transferAmount } },
      }),
      prisma.pointTransfer.create({
        data: {
          senderId: sender.id,
          receiverId: receiver.id,
          points: transferAmount,
        },
      }),
    ]);

    res.json({
      success: true,
      message: `${receiver.username} adlı arkadaşınıza ${transferAmount} puan hediye edildi! 🎁`,
      remainingPoints: updatedSender.totalScore,
      transfer: transferRecord,
    });
  } catch (error) {
    console.error('Puan transfer hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
