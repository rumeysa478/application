import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = '@habitime_gemini_api_key';
const CACHED_MODEL_KEY = '@habitime_gemini_model';

// Ortam değişkeninden veya varsayılan anahtar
export const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Aday model listesi (Öncelik sırasına göre)
const FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
];

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
      // Anahtar değiştiğinde model önbelleğini temizle
      await AsyncStorage.removeItem(CACHED_MODEL_KEY);
    } else {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
      await AsyncStorage.removeItem(CACHED_MODEL_KEY);
    }
  } catch (error) {
    console.error('API anahtarı kaydedilemedi:', error);
  }
};

/**
 * Girilen API anahtarının geçerliliğini ve kullanılabilecek modelleri test eder.
 * @param {string} apiKey
 * @returns {Promise<{ success: boolean, model?: string, error?: string }>}
 */
export const testApiKey = async (apiKey) => {
  const key = (apiKey || '').trim();
  if (!key) {
    return { success: false, error: 'API anahtarı boş olamaz.' };
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-goog-api-key': key,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed?.error?.message || msg;
      } catch {}
      return { success: false, error: msg };
    }

    const data = await res.json();
    if (Array.isArray(data.models)) {
      const supported = data.models.filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent')
      );

      const preferred =
        supported.find((m) => m.name.includes('2.0-flash')) ||
        supported.find((m) => m.name.includes('2.5-flash')) ||
        supported.find((m) => m.name.includes('1.5-flash')) ||
        supported.find((m) => m.name.includes('flash')) ||
        supported[0];

      const chosen = preferred ? preferred.name.replace(/^models\//, '') : 'gemini-2.0-flash';
      await AsyncStorage.setItem(CACHED_MODEL_KEY, chosen);
      return { success: true, model: chosen };
    }

    return { success: true, model: 'gemini-2.0-flash' };
  } catch (e) {
    return { success: false, error: e.message || 'Ağ bağlantı hatası.' };
  }
};

/**
 * Bu API anahtarı için çalışan en uygun modeli tespit eder.
 */
const resolveActiveModel = async (apiKey) => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_MODEL_KEY);
    if (cached) return cached;

    const testRes = await testApiKey(apiKey);
    if (testRes.success && testRes.model) {
      return testRes.model;
    }
  } catch {}

  return FALLBACK_MODELS[0];
};

/**
 * Çekilen fotoğrafta su bardağı, şişe, matara veya içecek kabı olup olmadığını
 * Gemini Vision API ile analiz eder.
 *
 * 404 hatasını önlemek için dinamik model çözümlemesi ve aday modeller arası
 * otomatik geçiş mekanizması kullanır.
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
  const apiKey = (await getStoredApiKey() || '').trim();

  // API anahtarı tanımlanmamışsa fallback yanıtı döndür
  if (!apiKey) {
    return {
      success: false,
      containsWaterContainer: false,
      isApiKeyMissing: true,
      message:
        'Yapay zekâ API anahtarı girilmedi. Lütfen bir Gemini API anahtarı girin veya manuel doğrulama ile devam edin.',
    };
  }

  // Base64 başlığını temizle
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const promptText = `Görseli incele. Bu fotoğrafta bir su bardağı, su şişesi, matara, kupa, sürahi, cam bardak, termos veya herhangi bir su/içecek kabı var mı?
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

  // Dinamik model çözümleme
  const activeModel = await resolveActiveModel(apiKey);

  // Denenecek modeller listesi (Aktif model en başta)
  const modelsToTry = [
    activeModel,
    ...FALLBACK_MODELS.filter((m) => m !== activeModel),
  ];

  let lastErrorMsg = '';

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 404) {
        // Bu model bulunamadıysa bir sonraki modeli dene
        console.warn(`Model ${model} 404 döndürdü, bir sonraki aday deneniyor...`);
        lastErrorMsg = `Model ${model} bulunamadı (404).`;
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini API Hatası (${model}):`, response.status, errText);
        let detail = `Kod: ${response.status}`;
        try {
          const errObj = JSON.parse(errText);
          detail = errObj?.error?.message || detail;
        } catch {}
        lastErrorMsg = detail;
        continue;
      }

      // Başarılı yanıt! Bu modeli önbelleğe kaydet
      await AsyncStorage.setItem(CACHED_MODEL_KEY, model);

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
    } catch (e) {
      console.warn(`Model ${model} çağrısı istisnası:`, e);
      lastErrorMsg = e.message || 'Ağ hatası';
    }
  }

  // Tüm aday modeller başarısız olduysa
  return {
    success: false,
    containsWaterContainer: false,
    isNetworkError: true,
    message: `Gemini API bağlantısı sağlanamadı (${lastErrorMsg}). Manuel onay ile devam edebilirsiniz.`,
  };
};
