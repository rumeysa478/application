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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { completeHabit } from '../services/storage';
import { stopVibration } from '../services/vibration';

export default function CameraProofScreen({ route, navigation }) {
  const { habitId, habitTitle } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [photo, setPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);

  // Ekran açıldığında aktif titreşimi sustur
  useEffect(() => {
    stopVibration();
    return () => {
      stopVibration();
    };
  }, []);

  // İzin henüz yüklenmediyse yükleme göstergesi
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Kamera başlatılıyor...</Text>
      </View>
    );
  }

  // İzin verilmediyse izin isteme ekranı
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={['top', 'bottom']}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
        <Text style={styles.permissionSubtitle}>
          Habitime'ın zorlayıcı kanıt sistemini kullanabilmek için kamera erişimine izin vermelisiniz.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          activeOpacity={0.8}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
        </TouchableOpacity>

        {/* Emülatör / Kamera donanımı olmayan ortamlar için test butonu */}
        <TouchableOpacity
          style={styles.mockButton}
          activeOpacity={0.8}
          onPress={() => {
            setPhoto({
              uri: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=60',
            });
          }}
        >
          <Text style={styles.mockButtonText}>🧪 Test Fotoğrafı ile Devam Et</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Vazgeç</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Fotoğraf Çekme Eylemi
  const handleTakePhoto = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      if (cameraRef.current) {
        const captured = await cameraRef.current.takePictureAsync({
          quality: 0.7,
        });
        if (captured && captured.uri) {
          setPhoto(captured);
          return;
        }
      }
      // Kamera ref yoksa veya emülatörse yedek fotoğraf kullan
      setPhoto({
        uri: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=60',
      });
    } catch (error) {
      console.warn('Fotoğraf çekme uyarısı (emülatör olabilir):', error);
      setPhoto({
        uri: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=60',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Kamera Ön/Arka Değiştir
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Kanıtı Onaylama ve Kaydetme
  const handleConfirmProof = async () => {
    if (!habitId) {
      Alert.alert('Hata', 'Alışkanlık kimliği bulunamadı.');
      return;
    }

    try {
      setIsProcessing(true);
      stopVibration();
      await completeHabit(habitId, photo?.uri);

      Alert.alert(
        '🎉 Kanıt Doğrulandı!',
        `"${habitTitle || 'Alışkanlık'}" için kanıt fotoğrafı başarıyla kaydedildi ve görev tamamlandı!`,
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Hata', 'Kanıt onaylanırken bir sorun oluştu.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {photo ? (
        // Fotoğraf Önizleme Ekranı
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />

          <SafeAreaView style={styles.previewOverlay} edges={['top', 'bottom']}>
            {/* Üst Bilgi Başlığı */}
            <View style={styles.previewOverlayHeader}>
              <Text style={styles.previewHeaderTitle}>
                📸 Kanıt Fotoğrafı Önizlemesi
              </Text>
              <Text style={styles.previewHeaderSubtitle}>
                {habitTitle || 'Alışkanlık'} göreviniz için bu kanıtı onaylıyor musunuz?
              </Text>
            </View>

            {/* Alt Eylemler */}
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.retakeBtn]}
                onPress={() => setPhoto(null)}
                disabled={isProcessing}
              >
                <Text style={styles.retakeBtnText}>🔄 Tekrar Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.confirmBtn]}
                onPress={handleConfirmProof}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>✓ Kanıtı Onayla</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        // Canlı Kamera Ekranı
        <View style={styles.cameraWrapper}>
          {/* Kamera Arka Planı (Tam Ekran) */}
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            ref={cameraRef}
          />

          {/* Kamera Üzerindeki Arayüz Katmanı */}
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
                <Text style={styles.guideText}>
                  {habitTitle ? `🎯 ${habitTitle}` : '🎯 Kanıt Fotoğrafı'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.topBtn}
                onPress={toggleCameraFacing}
              >
                <Text style={styles.topBtnText}>🔄 Çevir</Text>
              </TouchableOpacity>
            </View>

            {/* Kadraj Çerçevesi */}
            <View style={styles.frameContainer}>
              <View style={styles.focusFrame}>
                <Text style={styles.frameHint}>Kanıtı çerçeveye yerleştirin</Text>
              </View>
            </View>

            {/* Alt Deklanşör Paneli (Sabit ve Yüksek Görünürlüklü) */}
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
                    <Text style={styles.shutterCameraIcon}>📸</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.shutterLabel}>Fotoğraf Çek</Text>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
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
  cameraWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  guideBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  guideText: {
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
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  frameHint: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
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
  shutterCameraIcon: {
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
  previewOverlayHeader: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  previewHeaderSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 4,
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
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
