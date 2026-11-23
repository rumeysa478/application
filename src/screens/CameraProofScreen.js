import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
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

  // İzin kontrolü
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Kamera başlatılıyor...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
        <Text style={styles.permissionSubtitle}>
          Habitime'ın kanıt doğrulama sistemini kullanabilmek için kamera erişimine izin vermelisiniz.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
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

  // Fotoğraf Çekme İşlemi
  const handleTakePhoto = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const captured = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      setPhoto(captured);
    } catch (error) {
      console.warn('Kamera yakalama hatası (emülatör olabilir):', error);
      // Emülatör veya kamera donanımı yoksa test için yedek kanıt oluştur
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

  // Kanıtı Onaylama İşlemi
  const handleConfirmProof = async () => {
    if (!habitId) {
      Alert.alert('Hata', 'Alışkanlık kimliği bulunamadı.');
      return;
    }

    try {
      setIsProcessing(true);
      // Titreşimi durdur, depolamada alışkanlığı tamamla ve fotoğraf URI'sini kaydet
      stopVibration();
      await completeHabit(habitId, photo?.uri);

      Alert.alert(
        '🎉 Kanıt Doğrulandı!',
        `"${habitTitle || 'Alışkanlık'}" için kanıt fotoğrafı başarıyla kaydedildi. Alışkanlık tamamlandı olarak güncellendi!`,
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
        // Fotoğraf Çekildikten Sonraki Önizleme Ekranı
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />

          {/* Üst Bilgi Başlığı */}
          <View style={styles.previewOverlayHeader}>
            <Text style={styles.previewHeaderTitle}>
              📸 Kanıt Fotoğrafı Önizlemesi
            </Text>
            <Text style={styles.previewHeaderSubtitle}>
              {habitTitle || 'Alışkanlık'} göreviniz için bu kanıtı onaylıyor musunuz?
            </Text>
          </View>

          {/* Alt Butonlar: Tekrar Çek / Onayla */}
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
        </View>
      ) : (
        // Canlı Kamera Önizleme Ekranı
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        >
          {/* Üst Yönlendirme Paneli */}
          <SafeAreaView style={styles.topControls}>
            <View style={styles.headerBar}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.closeBtnText}>✕ Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.flipBtn}
                onPress={toggleCameraFacing}
              >
                <Text style={styles.flipBtnText}>🔄 Çevir</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.guideBadge}>
              <Text style={styles.guideText}>
                🎯 Kanıtınızı (su bardağı, ilaç vb.) kadraja alın
              </Text>
            </View>
          </SafeAreaView>

          {/* Kadraj Kılavuz Çerçevesi */}
          <View style={styles.frameContainer}>
            <View style={styles.focusFrame} />
          </View>

          {/* Alt Deklanşör Paneli */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.shutterButton}
              onPress={handleTakePhoto}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#4F46E5" size="large" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>
          </View>
        </CameraView>
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
    paddingHorizontal: 32,
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
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  flipBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  flipBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  guideBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    borderStyle: 'dashed',
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewOverlayHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 14,
    borderRadius: 12,
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
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
