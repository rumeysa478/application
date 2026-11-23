import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = '@habitime_gemini_api_key';
const CACHED_MODEL_KEY = '@habitime_gemini_model';

// Hedef model: gemini-3.5-flash-lite (en güncel ve kararlı model)
export const TARGET_MODEL = 'gemini-3.5-flash-lite';
export const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

// Ortam değişkeninden veya varsayılan anahtar
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
 * Eski model önbelleğini temizler ve hedef modeli gemini-2.5-flash olarak ayarlar.
 * @param {string} apiKey
 */
export const setStoredApiKey = async (apiKey) => {
  try {
    if (apiKey) {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      await AsyncStorage.setItem(CACHED_MODEL_KEY, TARGET_MODEL);
    } else {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
      await AsyncStorage.removeItem(CACHED_MODEL_KEY);
    }
  } catch (error) {
    console.error('API anahtarı kaydedilemedi:', error);
  }
};

/**
 * Girilen API anahtarının geçerliliğini test eder.
 * API anahtarı URL path/query'sine DEĞİL, 'x-goog-api-key' header'ı ile gönderilir.
 * Başarılı olursa modeli TARGET_MODEL (gemini-2.5-flash) olarak onaylar.
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
      console.error(`API Anahtarı test hatası [Model: ${TARGET_MODEL}] (HTTP ${res.status}):`, errText);
      let msg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed?.error?.message || msg;
      } catch {}
      return { success: false, error: `[Model: ${TARGET_MODEL}] ${msg}` };
    }

    // Başarılı olduğunda daima gemini-2.5-flash kaydet
    await AsyncStorage.setItem(CACHED_MODEL_KEY, TARGET_MODEL);
    return { success: true, model: TARGET_MODEL };
  } catch (e) {
    console.error(`testApiKey istisnası [Model: ${TARGET_MODEL}]:`, e);
    return { success: false, error: `[Model: ${TARGET_MODEL}] ${e.message || 'Ağ bağlantı hatası.'}` };
  }
};

/**
 * Aktif modeli döndürür. Eski model (özellikle gemini-1.5-flash) kayıtlıysa
 * otomatik olarak temizleyip gemini-2.5-flash olarak günceller.
 */
export const resolveActiveModel = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_MODEL_KEY);
    if (cached !== TARGET_MODEL) {
      console.log(`Eski model önbelleği (${cached}) tespit edildi, ${TARGET_MODEL} olarak güncelleniyor.`);
      await AsyncStorage.setItem(CACHED_MODEL_KEY, TARGET_MODEL);
    }
  } catch (err) {
    console.warn('Model önbellek kontrol hatası:', err);
  }
  return TARGET_MODEL;
};

/**
 * Çekilen fotoğrafta belirtilen alışkanlık türüne uygun nesne olup olmadığını
 * Gemini Vision API (gemini-3.5-flash-lite / fallback modeller) ile analiz eder.
 *
 * KURAL 3:
 * - Su ('water'): Su bardağı, şişe, matara, kupa, termos veya içecek kabı tespiti.
 * - İlaç ('medication'): İlaç kutusu, blister tablet şeridi, hap/kapsül, şurup şişesi veya hap+kaşık tespiti.
 *
 * 1. API anahtarı URL path/query'sine konulmaz; 'x-goog-api-key' başlığı kullanılır.
 * 2. İstek gövdesinde 'inline_data: { mime_type: "image/jpeg", data: base64String }' gönderilir.
 * 3. Model yanıtı JSON olarak alınır; alınamazsa güvenli metin analizi ile ayrıştırılır.
 *
 * @param {string} base64Image - Fotoğrafın Base64 verisi
 * @param {'water'|'medication'} [habitType='water'] - Alışkanlık türü
 * @returns {Promise<{
 *   success: boolean,
 *   containsWaterContainer: boolean,
 *   isValidProof: boolean,
 *   detectedObject?: string,
 *   reason?: string,
 *   message: string,
 *   isApiKeyMissing?: boolean,
 *   isNetworkError?: boolean
 * }>}
 */
export const analyzeProofImage = async (base64Image, habitType = 'water') => {
  const isMedication = habitType === 'medication';
  const apiKey = ((await getStoredApiKey()) || '').trim();

  // API anahtarı tanımlanmamışsa
  if (!apiKey) {
    return {
      success: false,
      containsWaterContainer: false,
      isValidProof: false,
      isApiKeyMissing: true,
      message: `Yapay zekâ API anahtarı girilmedi [Model: ${TARGET_MODEL}]. Lütfen bir Gemini API anahtarı girin veya manuel doğrulama ile devam edin.`,
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
      isValidProof: false,
      isNetworkError: true,
      message: `Fotoğraf verisi (base64) okunamadı [Model: ${TARGET_MODEL}]. Lütfen tekrar deneyin.`,
    };
  }

  // AsyncStorage içindeki eski model kalıntılarını temizle ve hedef modeli garantile
  await resolveActiveModel();

  // KURAL 3: Alışkanlık türüne göre dinamik Vision Prompt oluşturma
  const promptText = isMedication
    ? `Görseli incele. Bu fotoğrafta bir ilaç kutusu, reçeteli ilaç ambalajı, blister ambalaj (tablet/kapsül şeridi), hap, kapsül, tablet, şurup şişesi, damla veya bir ilaçla birlikte kullanılan bardak/kaşık var mı?
SADECE aşağıdaki JSON formatında yanıt ver, markdown backtick (\`\`\`json) veya ek açıklama yazma:
{"isValidContainer": true, "reason": "Fotoğrafta ilaç kutusu/tableti tespit edildi"}
veya ilaç/kutu yoksa:
{"isValidContainer": false, "reason": "Karede ilaç kutusu, blister veya hap tespit edilemedi"}`
    : `Görseli incele. Bu fotoğrafta bir su şişesi, su bardağı, matara, termos, kupa, sürahi veya herhangi bir su/içecek kabı var mı?
SADECE aşağıdaki JSON formatında yanıt ver, markdown backtick (\`\`\`json) veya ek açıklama yazma:
{"isValidContainer": true, "reason": "Fotoğrafta su bardağı/şişesi tespit edildi"}
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

  let lastErrorDetail = '';

  for (const model of FALLBACK_MODELS) {
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

        // 404 veya 503 ise sonraki adayı dene
        if (response.status === 404 || response.status === 503) {
          console.warn(`Model ${model} ${response.status} döndürdü, bir sonraki model deneniyor...`);
          continue;
        }

        return {
          success: false,
          containsWaterContainer: false,
          isValidProof: false,
          isNetworkError: true,
          message: `Gemini API Hatası [Model: ${model}] (${parsedMsg}). Lütfen API anahtarınızı veya izinlerinizi kontrol edin.`,
        };
      }

      // Başarılı!
      await AsyncStorage.setItem(CACHED_MODEL_KEY, model);

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Markdown ```json bloklarını temizle
      const cleanJson = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // 1. JSON olarak ayrıştırmayı dene
      let parsed = null;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (jsonErr) {
        // Regex ile JSON blok bulma
        const jsonMatch = rawText.match(/\{[\s\S]*"(?:isValidContainer|isValidProof)"[\s\S]*\}/i);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {}
        }
      }

      // 2. Güvenli Olumlu/Olumsuz Ayrıştırma (JSON dönmezse metin analizi fallback)
      let isValid = false;
      let reason = '';

      const jsonVal = parsed?.isValidContainer ?? parsed?.isValidProof;
      if (parsed && typeof jsonVal === 'boolean') {
        isValid = jsonVal;
        reason = parsed.reason || (isValid
          ? (isMedication ? 'İlaç/kutu başarıyla tespit edildi' : 'Su kabı tespit edildi')
          : (isMedication ? 'İlaç/kutu tespit edilemedi' : 'Su kabı tespit edilemedi'));
      } else {
        console.warn(`[Model: ${model}] JSON ayrıştırılamadı, metin analizi fallback çalıştırılıyor:`, rawText);
        const lower = rawText.toLowerCase();

        if (lower.includes('"isvalidcontainer": true') || lower.includes('"isvalidcontainer":true') || lower.includes('"isvalidproof": true') || lower.includes('"isvalidproof":true')) {
          isValid = true;
          reason = isMedication ? 'Fotoğrafta ilaç/kutu tespit edildi.' : 'Fotoğrafta su kabı tespit edildi.';
        } else if (lower.includes('"isvalidcontainer": false') || lower.includes('"isvalidcontainer":false') || lower.includes('"isvalidproof": false') || lower.includes('"isvalidproof":false')) {
          isValid = false;
          reason = isMedication ? 'Karede ilaç veya kutu tespit edilemedi.' : 'Karede su kabı tespit edilemedi.';
        } else {
          const positiveWords = isMedication
            ? ['ilaç', 'hap', 'tablet', 'kapsül', 'blister', 'şurup', 'reçete', 'kutu', 'ambalaj', 'prospektüs', 'tespit edildi', 'evet', 'true']
            : ['su bardağı', 'su şişesi', 'matara', 'termos', 'kupa', 'bardak', 'şişe', 'tespit edildi', 'evet', 'true'];
          const negativeWords = ['tespit edilemedi', 'bulunamadı', 'yok', 'hayır', 'false'];

          const hasPositive = positiveWords.some((w) => lower.includes(w));
          const hasNegative = negativeWords.some((w) => lower.includes(w));

          if (hasNegative && !lower.includes('tespit edildi')) {
            isValid = false;
            reason = isMedication ? 'Karede ilaç veya kutu tespit edilemedi.' : 'Karede su kabı tespit edilemedi.';
          } else if (hasPositive) {
            isValid = true;
            reason = isMedication ? 'Fotoğrafta ilaç/tablet başarıyla tespit edildi.' : 'Fotoğrafta su kabı başarıyla tespit edildi.';
          } else {
            isValid = false;
            reason = isMedication ? 'Görüntüde net bir ilaç veya ambalaj doğrulanamadı.' : 'Görüntüde net bir su kabı doğrulanamadı.';
          }
        }
      }

      return {
        success: true,
        containsWaterContainer: isValid,
        isValidProof: isValid,
        detectedObject: reason,
        reason: reason,
        message: reason,
      };
    } catch (netErr) {
      console.error(`Gemini Vision API [Model: ${model}] ağ çağrısı istisnası:`, netErr);
      lastErrorDetail = `${model}: ${netErr.message || 'Ağ bağlantı hatası'}`;
    }
  }

  return {
    success: false,
    containsWaterContainer: false,
    isValidProof: false,
    isNetworkError: true,
    message: `Gemini Vision API bağlantısı sağlanamadı [Model: ${TARGET_MODEL}] (${lastErrorDetail}). Lütfen internetinizi ve API anahtarınızı kontrol edin.`,
  };
};

/**
 * Geriye dönük uyumluluk alias'ı: Su kabı analizi
 */
export const analyzeImageForWaterContainer = async (base64Image) => {
  return analyzeProofImage(base64Image, 'water');
};
