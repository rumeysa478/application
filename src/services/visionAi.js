import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = '@habitime_gemini_api_key';
const CACHED_MODEL_KEY = '@habitime_gemini_model';

// Ortam değişkeninden veya varsayılan anahtar
export const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Aday model listesi (Öncelik sırasına göre)
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
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
 * API anahtarı URL path'inde DEĞİL, 'x-goog-api-key' header'ı ile gönderilir.
 * @param {string} apiKey
 * @returns {Promise<{ success: boolean, model?: string, error?: string }>}
 */
export const testApiKey = async (apiKey) => {
  const key = (apiKey || '').trim();
  if (!key) {
    return { success: false, error: 'API anahtarı boş olamaz.' };
  }

  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-goog-api-key': key,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('API Anahtarı test hatası (HTTP ' + res.status + '):', errText);
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
        supported.find((m) => m.name.includes('2.5-flash')) ||
        supported.find((m) => m.name.includes('2.0-flash')) ||
        supported.find((m) => m.name.includes('1.5-flash')) ||
        supported[0];

      const chosen = preferred ? preferred.name.replace(/^models\//, '') : 'gemini-2.5-flash';
      await AsyncStorage.setItem(CACHED_MODEL_KEY, chosen);
      return { success: true, model: chosen };
    }

    return { success: true, model: 'gemini-2.5-flash' };
  } catch (e) {
    console.error('testApiKey istisnası:', e);
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
 * 1. API anahtarı URL path veya query'sine konulmaz; 'x-goog-api-key' header'ı kullanılır.
 * 2. 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
 *    uç noktasına POST isteği atılır.
 * 3. İstek gövdesinde 'inline_data: { mime_type: "image/jpeg", data: base64String }' gönderilir.
 * 4. Model yanıtı '{"isValidContainer": boolean, "reason": string}' JSON formatında döner.
 * 5. response.ok değilse hata gövdesi konsola loglanır ve anlaşılır mesaj gösterilir.
 *
 * @param {string} base64Image - Fotoğrafın Base64 verisi
 * @returns {Promise<{
 *   success: boolean,
 *   containsWaterContainer: boolean,
 *   detectedObject?: string,
 *   reason?: string,
 *   message: string,
 *   isApiKeyMissing?: boolean,
 *   isNetworkError?: boolean
 * }>}
 */
export const analyzeImageForWaterContainer = async (base64Image) => {
  const apiKey = (await getStoredApiKey() || '').trim();

  // API anahtarı tanımlanmamışsa
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
  const cleanBase64 = (base64Image || '')
    .replace(/^data:image\/\w+;base64,/, '')
    .trim();

  if (!cleanBase64) {
    return {
      success: false,
      containsWaterContainer: false,
      isNetworkError: true,
      message: 'Fotoğraf verisi (base64) okunamadı. Lütfen tekrar deneyin.',
    };
  }

  // Kullanıcı kuralına uygun prompt: {"isValidContainer": boolean, "reason": string}
  const promptText = `Görseli incele. Bu fotoğrafta bir su şişesi, su bardağı, matara, termos, kupa, sürahi veya herhangi bir su/içecek kabı var mı?
SADECE aşağıdaki JSON formatında yanıt ver, markdown backtick (\\\`\\\`\\\`json) veya ek açıklama koyma:
{"isValidContainer": true, "reason": "Fotoğrafta su bardağı tespit edildi"}
veya içecek kabı yoksa:
{"isValidContainer": false, "reason": "Karede su kabı veya içecek kabı tespit edilemedi"}`;

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
      maxOutputTokens: 200,
    },
  };

  // Birincil olarak gemini-2.5-flash, 404 durumunda yedek modeller
  const activeModel = await resolveActiveModel(apiKey);
  const modelsToTry = [
    activeModel,
    ...FALLBACK_MODELS.filter((m) => m !== activeModel),
  ];

  let lastErrorDetail = '';

  for (const model of modelsToTry) {
    // API anahtarı URL path veya query'sine konulmaz; saf endpoint kullanılır
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini Vision API Hatası [Model: ${model}, HTTP ${response.status}]:`, errorBody);

        let parsedMsg = `HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(errorBody);
          parsedMsg = errJson?.error?.message || parsedMsg;
        } catch {}

        lastErrorDetail = `${model}: ${parsedMsg}`;

        // 404 ise bir sonraki aday modeli dene
        if (response.status === 404) {
          console.warn(`Model ${model} 404 döndürdü, bir sonraki aday model deneniyor...`);
          continue;
        }

        // 400, 401, 403 vb. ise kullanıcıya hata bildir
        return {
          success: false,
          containsWaterContainer: false,
          isNetworkError: true,
          message: `Gemini API Hatası (${parsedMsg}). Lütfen API anahtarınızı veya izinlerinizi kontrol edin.`,
        };
      }

      // Başarılı yanıt! Bu modeli hafızaya al
      await AsyncStorage.setItem(CACHED_MODEL_KEY, model);

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Markdown etiketlerini temizle
      const cleanJson = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let parsed = null;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (jsonErr) {
        console.warn('JSON doğrudan ayrıştırılamadı, metin kontrol ediliyor:', rawText);
        const lower = rawText.toLowerCase();
        const isValid =
          lower.includes('"isvalidcontainer": true') ||
          lower.includes('"isvalidcontainer":true') ||
          lower.includes('isvalidcontainer: true');
        parsed = {
          isValidContainer: isValid,
          reason: rawText.slice(0, 120),
        };
      }

      const isValid = Boolean(parsed?.isValidContainer ?? parsed?.containsWaterContainer);
      const reason =
        parsed?.reason ||
        parsed?.message ||
        (isValid ? 'Su kabı tespit edildi' : 'Su kabı tespit edilemedi');

      return {
        success: true,
        containsWaterContainer: isValid,
        detectedObject: reason,
        reason: reason,
        message: reason,
      };
    } catch (netErr) {
      console.error(`Model ${model} ağ çağrısı istisnası:`, netErr);
      lastErrorDetail = netErr.message || 'Ağ bağlantı hatası';
    }
  }

  // Modellerin tümü başarısız olduysa
  return {
    success: false,
    containsWaterContainer: false,
    isNetworkError: true,
    message: `Gemini Vision API bağlantısı sağlanamadı (${lastErrorDetail}). Lütfen API anahtarınızı ve internet bağlantınızı kontrol edin.`,
  };
};
