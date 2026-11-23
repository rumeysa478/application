import { Vibration, Platform } from 'react-native';

let vibrationInterval = null;
let isVibrating = false;

// Android için titreşim deseni: [bekleme, titreşim, bekleme, titreşim...]
const VIBRATION_PATTERN = [0, 800, 400, 800, 400, 1000];

/**
 * Sürekli ve zorlayıcı titreşim uyarısını başlatır.
 * Kullanıcı "Sustur / Kanıtla" eylemini yapana kadar devam eder.
 */
export const startPersistentVibration = () => {
  if (isVibrating) return;

  isVibrating = true;

  if (Platform.OS === 'android') {
    // Android'de repeat=true ile desen sürekli döner (index 0'dan başlar)
    Vibration.vibrate(VIBRATION_PATTERN, true);
  } else {
    // iOS için periyodik tetikleme
    Vibration.vibrate();
    vibrationInterval = setInterval(() => {
      Vibration.vibrate();
    }, 1500);
  }
};

/**
 * Aktif titreşimi durdurur.
 */
export const stopVibration = () => {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  Vibration.cancel();
  isVibrating = false;
};

/**
 * Titreşimin şu an aktif olup olmadığını döndürür.
 * @returns {boolean}
 */
export const isVibrationActive = () => {
  return isVibrating;
};
