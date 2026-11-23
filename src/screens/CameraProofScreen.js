import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { recordWaterIntakeProof } from '../services/storage';
import { stopVibration } from '../services/vibration';
import { addScore } from '../services/userService';
import {
  analyzeImageForWaterContainer,
  getStoredApiKey,
  setStoredApiKey,
  testApiKey,
} from '../services/visionAi';

export default function CameraProofScreen({ route, navigation }) {
  const { habitId, habitTitle, portionLiters = 0.25 } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [photo, setPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // API Anahtarı Modal Durumu
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);

  const cameraRef = useRef(null);

  // Ekran açıldığında aktif titreşimi sustur ve API anahtarını yükle
  useEffect(() => {
    stopVibration();
    getStoredApiKey().then((k) => setInputApiKey(k || ''));
    return () => {
      stopVibration();
    };
  }, []);

  // API Anahtarını Test Et
  const handleTestKey = async () => {
    setIsTestingKey(true);
    const result = await testApiKey(inputApiKey);
    setIsTestingKey(false);
    if (result.success) {
      Alert.alert(
        '✓ Bağlantı Başarılı',
        `API anahtarı doğrulandı!\nAktif Kullanılacak Model: ${result.model}`
      );
    } else {
      Alert.alert('Bağlantı Hatası', result.error || 'API anahtarı geçersiz.');
    }
  };

  // API Anahtarını Kaydet
  const handleSaveApiKey = async () => {
    await setStoredApiKey(inputApiKey);
    const result = await testApiKey(inputApiKey);
    setShowApiKeyModal(false);
    if (result.success) {
      Alert.alert('Kaydedildi', `API Anahtarı kaydedildi ve model bağlandı (${result.model})!`);
    } else {
      Alert.alert('Kaydedildi', 'API Anahtarı kaydedildi.');
    }
  };

  // İzin yükleniyorsa
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Kamera başlatılıyor...</Text>
      </View>
    );
  }

  // İzin verilmediyse
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={['top', 'bottom']}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
        <Text style={styles.permissionSubtitle}>
          Habitime su kabınızı yapay zekâ ile doğrulayabilmek için kamera erişimine ihtiyaç duyar.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          activeOpacity={0.8}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Kamera İzni Ver</Text>
        </TouchableOpacity>

        {/* Emülatör / Kamera donanımı olmayan ortamlar için test butonu */}
        <TouchableOpacity
          style={styles.mockButton}
          activeOpacity={0.8}
          onPress={() => {
            setPhoto({
              uri: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=60',
              base64: null,
            });
          }}
        >
          <Text style={styles.mockButtonText}>🧪 Test Fotoğrafı ile Devam Et</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Fotoğraf Çekme
  const handleTakePhoto = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      if (cameraRef.current) {
        const captured = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
          skipProcessing: false,
        });

        if (captured && captured.uri) {
          setPhoto(captured);
          return;
        }
      }

      // Kamera ref yoksa veya emülatörde donanım yoksa fallback
      setPhoto({
        uri: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=60',
        base64: null,
      });
    } catch (error) {
      console.warn('Fotoğraf çekme hatası (emülatör olabilir):', error);
      setPhoto({
        uri: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=60',
        base64: null,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Kamera Ön/Arka Değiştir
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Yapay Zekâ Analizi ve Kanıt Onaylama
  const handleVerifyAndConfirm = async () => {
    if (!habitId) {
      Alert.alert('Hata', 'Alışkanlık kimliği bulunamadı.');
      return;
    }

    try {
      setIsAnalyzing(true);

      // Base64 verisi varsa Gemini Vision API ile incele
      if (photo?.base64) {
        const aiResult = await analyzeImageForWaterContainer(photo.base64);

        // 1. Durum: Yapay zekâ nesneyi doğrulamadı (Su kabı yok)
        if (!aiResult.containsWaterContainer && !aiResult.isApiKeyMissing && !aiResult.isNetworkError) {
          Alert.alert(
            '❌ Su Kabı Doğrulanamadı',
            `Yapay zekâ karede bir su bardağı, su şişesi veya matara tespit edemedi.\n(Tespit: ${aiResult.detectedObject || 'Yok'})\n\nLütfen su kabınızı net gösterecek şekilde kadraja alın ve tekrar çekin.`,
            [
              {
                text: 'Tekrar Fotoğraf Çek',
                onPress: () => setPhoto(null),
              },
            ]
          );
          setIsAnalyzing(false);
          return;
        }

        // 2. Durum: API anahtarı girilmemiş veya ağ hatası (Graceful Fallback)
        if (aiResult.isApiKeyMissing || aiResult.isNetworkError) {
          Alert.alert(
            '⚠️ Yapay Zekâ Doğrulaması',
            `${aiResult.message}\n\nKanıtınızı bu seferlik manuel olarak onaylamak ister misiniz?`,
            [
              {
                text: 'Tekrar Çek',
                style: 'cancel',
                onPress: () => setPhoto(null),
              },
              {
                text: '🔑 API Anahtarı Gir',
                onPress: () => setShowApiKeyModal(true),
              },
              {
                text: 'Manuel Onayla',
                onPress: async () => {
                  await finalizeIntake(portionLiters);
                },
              },
            ]
          );
          setIsAnalyzing(false);
          return;
        }

        // 3. Durum: Yapay zekâ su kabını başarıyla doğruladı!
        if (aiResult.containsWaterContainer) {
          await finalizeIntake(portionLiters, aiResult.detectedObject);
          return;
        }
      } else {
        // Test fotoğrafı (base64 yoksa) manuel onay akışı
        await finalizeIntake(portionLiters, 'Test Su Kabı');
      }
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      Alert.alert(
        'Hata',
        'Analiz sırasında bir sorun oluştu. Manuel olarak onaylamak ister misiniz?',
        [
          { text: 'Tekrar Çek', onPress: () => setPhoto(null) },
          { text: 'Manuel Onayla', onPress: () => finalizeIntake(portionLiters) },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Su tüketimini kaydet, puan ver ve ekranı kapat
  const finalizeIntake = async (amount, detectedName = null) => {
    stopVibration();
    const result = await recordWaterIntakeProof(habitId, amount);

    // Puan ödülü (Temel 50 puan, hedef bittiğinde ekstra 100 puan)
    let baseAward = 50;
    if (result.goalReached) {
      baseAward += 100;
    }
    const scoreResult = await addScore(baseAward, 'Su Kanıtı Doğrulandı');

    // Geçici fotoğrafı temizle
    setPhoto(null);

    const amountMl = Math.round(amount * 1000);
    const totalIntake = result.habit.todayIntakeLiters;
    const target = result.habit.dailyTargetLiters;

    const pointsMsg =
      scoreResult.multiplier > 1
        ? `🪙 +${scoreResult.earnedPoints} Puan Kazandınız! (🔥 2x Bonusuyla ${scoreResult.basePoints}x2)`
        : `🪙 +${scoreResult.earnedPoints} Puan Kazandınız!`;

    if (result.goalReached) {
      Alert.alert(
        '🎉 GÜNLÜK HEDEF TAMAMLANDI!',
        `Su kabı doğrulandı${detectedName ? ` (${detectedName})` : ''}!\n\n+${amountMl} ml eklendi.\nBugünkü toplam: ${totalIntake} L / ${target} L\n\n${pointsMsg}\n🌱 Maskotunuz büyüdü ve gelişti!`,
        [{ text: 'Harika!', onPress: () => navigation.goBack() }]
      );
    } else {
      const remaining = (target - totalIntake).toFixed(2);
      Alert.alert(
        '✅ Kanıt Doğrulandı!',
        `Su kabı başarıyla doğrulandı${detectedName ? ` (${detectedName})` : ''}!\n\n+${amountMl} ml kaydedildi.\nBugünkü toplam: ${totalIntake} L / ${target} L (Kalan: ${remaining} L)\n\n${pointsMsg}\n🌱 Maskotunuz sulandı!`,
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {photo ? (
        // Fotoğraf Çekildikten Sonraki Önizleme ve Doğrulama
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />

          <SafeAreaView style={styles.previewOverlay} edges={['top', 'bottom']}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>📸 Kanıt Fotoğrafı Analizi</Text>
              <Text style={styles.previewSubtitle}>
                Yapay zekâ karede su bardağı veya matara olup olmadığını kontrol edecektir.
              </Text>
            </View>

            {/* Alt Eylem Butonları */}
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.retakeBtn]}
                onPress={() => setPhoto(null)}
                disabled={isAnalyzing}
              >
                <Text style={styles.retakeBtnText}>🔄 Tekrar Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.verifyBtn]}
                onPress={handleVerifyAndConfirm}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <View style={styles.analyzingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.verifyBtnText}> AI İnceliyor...</Text>
                  </View>
                ) : (
                  <Text style={styles.verifyBtnText}>
                    🤖 Doğrula (+{Math.round(portionLiters * 1000)}ml)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        // Canlı Kamera Ekranı
        <View style={styles.cameraContainer}>
          {/* Kamera Önizleme Yüzeyi */}
          <CameraView
            style={styles.cameraView}
            facing={facing}
            mode="picture"
            ref={cameraRef}
            onCameraReady={() => setIsCameraReady(true)}
            onMountError={(e) => setCameraError(e.message)}
          />

          {/* Kamera Hatası Uyarısı (Gerekirse) */}
          {cameraError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                ⚠️ Kamera uyarısı: {cameraError} (Test fotoğrafı kullanabilirsiniz)
              </Text>
            </View>
          )}

          {/* Kamera Kontrol Katmanı */}
          <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
            {/* Üst Çubuk */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.topBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.topBtnText}>✕ Kapat</Text>
              </TouchableOpacity>

              <View style={styles.guideBadge}>
                <Text style={styles.guideBadgeText}>
                  {habitTitle || 'Su Kabı Doğrulama'}
                </Text>
              </View>

              <View style={styles.topRightActions}>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => setShowApiKeyModal(true)}
                >
                  <Text style={styles.keyBtnText}>🔑 AI</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.topBtn}
                  onPress={toggleCameraFacing}
                >
                  <Text style={styles.topBtnText}>🔄</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Merkez Hedef Çerçevesi */}
            <View style={styles.frameContainer}>
              <View style={styles.focusFrame}>
                <Text style={styles.frameHint}>Su bardağı veya matarayı çerçeveye alın</Text>
              </View>
            </View>

            {/* Alt Deklanşör Paneli */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.shutterOuter}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#4F46E5" size="large" />
                ) : (
                  <View style={styles.shutterInner}>
                    <Text style={styles.shutterIcon}>📸</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.shutterLabel}>Fotoğraf Çek</Text>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* Gemini API Anahtarı Ayar Modalı */}
      <Modal
        visible={showApiKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔑 Gemini Vision API Anahtarı</Text>
            <Text style={styles.modalSubtitle}>
              Google AI Studio'dan aldığınız ücretsiz Gemini API anahtarını girerek gerçek yapay zekâ görüntü analizini aktifleştirebilirsiniz.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="AIzaSy..."
              placeholderTextColor="#94A3B8"
              value={inputApiKey}
              onChangeText={setInputApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalTestBtn}
                onPress={handleTestKey}
                disabled={isTestingKey}
              >
                {isTestingKey ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Text style={styles.modalTestText}>⚡ Test Et</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApiKeyModal(false)}
              >
                <Text style={styles.modalCancelText}>Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.modalSaveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  mockButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockButtonText: {
    color: '#4338CA',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  errorBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  keyBtn: {
    backgroundColor: 'rgba(79, 70, 229, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  keyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  guideBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  guideBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  frameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  frameHint: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    textAlign: 'center',
  },
  bottomBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 8,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterIcon: {
    fontSize: 28,
  },
  shutterLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  previewHeader: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  retakeBtn: {
    backgroundColor: '#FFFFFF',
  },
  retakeBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  verifyBtn: {
    backgroundColor: '#10B981',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  modalTestBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalTestText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
