import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = '@habitime_gemini_api_key';

// Varsayılan API Anahtarı (Expo ortam değişkeninden veya AsyncStorage'dan alınabilir)
export const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Kayıtlı Gemini API anahtarını getirir.
 * @returns {Promise<string>}
 */
export const getStoredApiKey = async () => {
  try {
    const key = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return key || DEFAULT_API_KEY;
  } catch (error) {
    return DEFAULT_API_KEY;
  }
};

/**
 * Yeni bir Gemini API anahtarı kaydeder.
 * @param {string} apiKey
 */
export const setStoredApiKey = async (apiKey) => {
  try {
    if (apiKey) {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    } else {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch (error) {
    console.error('API anahtarı kaydedilemedi:', error);
  }
};

/**
 * Çekilen fotoğrafta su bardağı, şişe, matara veya içecek kabı olup olmadığını
 * Gemini Vision API ile analiz eder.
 *
 * @param {string} base64Image - Fotoğrafın Base64 verisi
 * @returns {Promise<{
 *   success: boolean,
 *   containsWaterContainer: boolean,
 *   detectedObject?: string,
 *   message: string,
 *   isApiKeyMissing?: boolean,
 *   isNetworkError?: boolean
 * }>}
 */
export const analyzeImageForWaterContainer = async (base64Image) => {
  const apiKey = await getStoredApiKey();

  // API anahtarı tanımlanmamışsa fallback yanıtı döndür
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      containsWaterContainer: false,
      isApiKeyMissing: true,
      message:
        'Yapay zekâ API anahtarı bulunamadı. Lütfen bir Gemini API anahtarı girin veya manuel doğrulama ile devam edin.',
    };
  }

  // Base64 başlığını temizle (varsa)
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const promptText = `Görseli detaylı analiz et. Bu fotoğrafta bir su bardağı, su şişesi, matara, kupa, sürahi, cam bardak, termos veya herhangi bir su kabı/içecek kabı var mı?
Yanıtını SADECE şu JSON şablonunda ver, hiçbir markdown, açıklama veya ek karakter ekleme:
{"containsWaterContainer": true, "confidence": 0.95, "detectedObject": "su bardağı", "message": "Su bardağı başarıyla tespit edildi."}

Eğer su kabı YOKSA containsWaterContainer değerini false yap ve message alanına neden tespit edilemediğini kısaca yaz.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 250,
    },
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini API Hatası:', response.status, errText);
      return {
        success: false,
        containsWaterContainer: false,
        isNetworkError: true,
        message: `Yapay zekâ servisi hata döndürdü (Kod: ${response.status}). Manuel onay ile devam edebilirsiniz.`,
      };
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Markdown ```json bloklarını temizle
    const cleanJson = candidateText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    return {
      success: true,
      containsWaterContainer: Boolean(parsed.containsWaterContainer),
      detectedObject: parsed.detectedObject || 'Su kabı',
      message:
        parsed.message ||
        (parsed.containsWaterContainer
          ? 'Su kabı başarıyla doğrulandı.'
          : 'Karede su bardağı veya şişe tespit edilemedi.'),
    };
  } catch (error) {
    console.error('Vision AI Analiz Hatası:', error);
    return {
      success: false,
      containsWaterContainer: false,
      isNetworkError: true,
      message:
        'Ağ bağlantısı kurulamadı veya görüntü ayrıştırılamadı. Manuel doğrulama ile devam edebilirsiniz.',
    };
  }
};
