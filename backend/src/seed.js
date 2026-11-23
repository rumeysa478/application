const bcrypt = require('bcryptjs');
const prisma = require('./db');

async function seed() {
  console.log('🌱 Habitime Veritabanı Demo Verileri Ekleniyor...');

  if (!prisma) {
    console.error('❌ Prisma başlatılamadı. DATABASE_URL ve PostgreSQL bağlantısını kontrol edin.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Demo Kullanıcılar
  const usersData = [
    { username: 'ahmet', email: 'ahmet@habitime.com', age: 26, weightKg: 78, recommendedWaterLiters: 2.73, totalScore: 320, hasDoublePointsNextDay: true },
    { username: 'zeynep', email: 'zeynep@habitime.com', age: 24, weightKg: 58, recommendedWaterLiters: 2.03, totalScore: 290, hasDoublePointsNextDay: true },
    { username: 'mehmet', email: 'mehmet@habitime.com', age: 30, weightKg: 85, recommendedWaterLiters: 2.98, totalScore: 210, hasDoublePointsNextDay: false },
    { username: 'ayse', email: 'ayse@habitime.com', age: 28, weightKg: 62, recommendedWaterLiters: 2.17, totalScore: 180, hasDoublePointsNextDay: false },
    { username: 'can', email: 'can@habitime.com', age: 22, weightKg: 72, recommendedWaterLiters: 2.52, totalScore: 140, hasDoublePointsNextDay: false },
    { username: 'elif', email: 'elif@habitime.com', age: 25, weightKg: 54, recommendedWaterLiters: 1.89, totalScore: 120, hasDoublePointsNextDay: false },
    { username: 'burak', email: 'burak@habitime.com', age: 32, weightKg: 88, recommendedWaterLiters: 3.08, totalScore: 90, hasDoublePointsNextDay: false },
    { username: 'deniz', email: 'deniz@habitime.com', age: 27, weightKg: 66, recommendedWaterLiters: 2.31, totalScore: 70, hasDoublePointsNextDay: false },
    { username: 'selin', email: 'selin@habitime.com', age: 23, weightKg: 52, recommendedWaterLiters: 1.82, totalScore: 50, hasDoublePointsNextDay: false },
    { username: 'rumeysa', email: 'rumeysa@habitime.com', age: 25, weightKg: 60, recommendedWaterLiters: 2.1, totalScore: 450, hasDoublePointsNextDay: true },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { totalScore: u.totalScore, hasDoublePointsNextDay: u.hasDoublePointsNextDay },
      create: {
        ...u,
        passwordHash,
      },
    });
    createdUsers.push(user);
  }

  console.log(`✓ ${createdUsers.length} kullanıcı hazır.`);

  // 2. Demo Arkadaşlıklar
  if (createdUsers.length >= 2) {
    const u1 = createdUsers[0];
    const u2 = createdUsers[1];
    await prisma.friendship.upsert({
      where: {
        requesterId_addresseeId: {
          requesterId: u1.id,
          addresseeId: u2.id,
        },
      },
      update: { status: 'ACCEPTED' },
      create: {
        requesterId: u1.id,
        addresseeId: u2.id,
        status: 'ACCEPTED',
      },
    });
    console.log(`✓ ${u1.username} ve ${u2.username} arkadaş yapıldı.`);
  }

  // 3. Haftalık Yarışma ve Skorlar
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const challenge = await prisma.weeklyChallenge.upsert({
    where: { id: 'weekly-current' },
    update: { isActive: true },
    create: {
      id: 'weekly-current',
      title: 'Haftalık Su & Sağlık Şampiyonası',
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    },
  });

  for (const u of createdUsers) {
    await prisma.weeklyScore.upsert({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId: u.id,
        },
      },
      update: { points: u.totalScore },
      create: {
        challengeId: challenge.id,
        userId: u.id,
        points: u.totalScore,
      },
    });
  }

  console.log('✓ Haftalık yarışma ve skorlar eklendi.');
  console.log('🎉 Seed tamamlandı!');
}

seed()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
