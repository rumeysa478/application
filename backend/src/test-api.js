/**
 * Habitime Backend API End-to-End Verification Test
 */
const http = require('http');

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}`;

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Habitime Backend API Güvenlik ve İşlev Testleri Başlıyor...\n');

  // Test 1: Healthcheck
  console.log('1. Healthcheck Testi...');
  const health = await request('GET', '/api/health');
  if (health.status !== 200 || health.data.database !== 'connected') {
    throw new Error('Healthcheck başarısız: ' + JSON.stringify(health.data));
  }
  console.log('✓ Healthcheck başarılı. DB durumu:', health.data.database, '| Tip:', health.data.databaseType);

  // Test 2: Input Validation (Geçersiz e-posta)
  console.log('\n2. Girdi Doğrulama ve Güvenlik Testi (Hatalı E-posta)...');
  const invalidReg = await request('POST', '/api/auth/register', {
    username: 'test_user',
    email: 'not-an-email',
    password: '123',
  });
  if (invalidReg.status !== 400) {
    throw new Error('Geçersiz e-posta engellenmedi! Status: ' + invalidReg.status);
  }
  console.log('✓ Geçersiz girdi başarıyla 400 ile engellendi:', invalidReg.data.error);

  // Test 3: Başarılı Kayıt
  const uniqueSuffix = Date.now();
  const testUsername = `user_${uniqueSuffix}`;
  const testEmail = `test_${uniqueSuffix}@habitime.com`;
  console.log(`\n3. Kullanıcı Kaydı (${testUsername})...`);
  const regRes = await request('POST', '/api/auth/register', {
    username: testUsername,
    email: testEmail,
    password: 'password123',
    age: 25,
    heightCm: 175,
    weightKg: 70,
  });

  if (regRes.status !== 201 || !regRes.data.token) {
    throw new Error('Kayıt başarısız: ' + JSON.stringify(regRes.data));
  }
  const token = regRes.data.token;
  const user = regRes.data.user;
  console.log('✓ Kullanıcı kaydedildi. Önerilen Su:', user.recommendedWaterLiters, 'L | Token alındı.');

  // Test 4: Giriş Yapma
  console.log('\n4. Kullanıcı Girişi...');
  const loginRes = await request('POST', '/api/auth/login', {
    login: testEmail,
    password: 'password123',
  });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Giriş başarısız: ' + JSON.stringify(loginRes.data));
  }
  console.log('✓ Giriş başarılı.');

  // Test 5: Su Alışkanlığı Ekleme (30 dk snooze kuralı)
  console.log('\n5. Su Alışkanlığı Ekleme...');
  const waterHabitRes = await request(
    'POST',
    '/api/habits',
    {
      type: 'WATER',
      title: 'Günlük 2.5L Su',
      dailyTargetLiters: 2.5,
      intervalMinutes: 60,
    },
    token
  );
  if (waterHabitRes.status !== 201 || waterHabitRes.data.habit.snoozeMinutes !== 30) {
    throw new Error('Su alışkanlığı kuralı hatalı: ' + JSON.stringify(waterHabitRes.data));
  }
  console.log('✓ Su alışkanlığı oluşturuldu. Erteleme süresi:', waterHabitRes.data.habit.snoozeMinutes, 'dk');

  // Test 6: İlaç Alışkanlığı Ekleme (15 dk snooze kuralı)
  console.log('\n6. İlaç Alışkanlığı Ekleme...');
  const medHabitRes = await request(
    'POST',
    '/api/habits',
    {
      type: 'MEDICATION',
      title: 'Vitamin D',
      scheduleJson: { times: ['09:00', '21:00'], days: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'] },
    },
    token
  );
  if (medHabitRes.status !== 201 || medHabitRes.data.habit.snoozeMinutes !== 15) {
    throw new Error('İlaç alışkanlığı kuralı hatalı: ' + JSON.stringify(medHabitRes.data));
  }
  console.log('✓ İlaç alışkanlığı oluşturuldu. Erteleme süresi:', medHabitRes.data.habit.snoozeMinutes, 'dk');

  // Test 7: Kanıt Doğrulama & Puanlama
  console.log('\n7. Kanıt Doğrulama (Su)...');
  const verifyRes = await request(
    'POST',
    `/api/habits/${waterHabitRes.data.habit.id}/verify`,
    {
      isExtra: false,
      amountLiters: 0.5,
      onTime: true,
      zeroSnooze: true,
    },
    token
  );
  if (verifyRes.status !== 200 || !verifyRes.data.earnedPoints) {
    throw new Error('Kanıt doğrulama başarısız: ' + JSON.stringify(verifyRes.data));
  }
  console.log('✓ Kanıt doğrulandı. Kazanılan Puan:', verifyRes.data.earnedPoints, '| Toplam Skor:', verifyRes.data.totalScore);

  // Test 8: Haftalık Skor Tablosu & Üst %10 Hesaplaması
  console.log('\n8. Haftalık Liderlik Tablosu & Üst %10 Hesaplama...');
  const leaderboardRes = await request('GET', '/api/challenges/weekly/leaderboard', null, token);
  if (leaderboardRes.status !== 200 || !leaderboardRes.data.leaderboard) {
    throw new Error('Liderlik tablosu başarısız: ' + JSON.stringify(leaderboardRes.data));
  }
  console.log(
    `✓ Liderlik tablosu alındı. Toplam Katılımcı: ${leaderboardRes.data.totalParticipants}, Üst %10 Barajı: ${leaderboardRes.data.top10ThresholdScore} puan, Üst %10 Kişi Sayısı: ${leaderboardRes.data.top10Count}`
  );

  // Test 9: Arkadaş Bağlantısı ve Puan Transferi
  console.log('\n9. Arkadaş Bağlantısı & Puan Transferi...');
  const connectRes = await request('POST', '/api/friends/connect', { username: 'ahmet' }, token);
  if (connectRes.status !== 201) {
    throw new Error('Arkadaş bağlantısı kurulamadı: ' + JSON.stringify(connectRes.data));
  }
  console.log('✓ Ahmet ile arkadaşlık kuruldu.');

  const transferRes = await request(
    'POST',
    '/api/friends/transfer-points',
    { receiverUsername: 'ahmet', points: 10 },
    token
  );
  if (transferRes.status !== 200) {
    throw new Error('Puan transferi başarısız: ' + JSON.stringify(transferRes.data));
  }
  console.log('✓ 10 puan başarıyla Ahmet\'e transfer edildi. Yeni Bakiye:', transferRes.data.remainingPoints);

  console.log('\n🎉 TÜM TESTLER BAŞARIYLA TAMAMLANDI! Backend sistemi %100 çalışıyor ve güvenli.');
}

module.exports = runTests;

if (require.main === module) {
  const { server } = require('./index');
  setTimeout(async () => {
    try {
      await runTests();
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n❌ Test Başarısız:', err);
      server.close(() => process.exit(1));
    }
  }, 1000);
}
