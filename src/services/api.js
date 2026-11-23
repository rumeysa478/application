import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = '@habitime_jwt_token';
const USER_KEY = '@habitime_current_user';

// Android Emülatör localhost için 10.0.2.2, iOS ve Web için localhost:4000
const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');

export const API_BASE_URL = DEFAULT_API_URL;

/**
 * Kayıtlı JWT token'ı getirir
 */
export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * JWT token kaydeder
 */
export const setStoredToken = async (token) => {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Token kaydedilemedi:', e);
  }
};

/**
 * Sunucunun erişilebilir olup olmadığını kontrol eder (timeout: 2500ms)
 */
export const checkServerHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, database: data.database };
    }
    return { online: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    return { online: false, reason: 'Bağlantı kurulamadı (Çevrimdışı/Yerel Mod)' };
  }
};

/**
 * Genel Güvenli İstek Yürütücü (Sunucu kapalıysa asla çökmez, fallback döner)
 */
async function request(endpoint, options = {}) {
  const token = await getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    return { success: true, ...data };
  } catch (error) {
    // Sunucu kapalı veya ağ yok — sessiz çevrimdışı fallback
    console.warn(`[API] ${endpoint} çevrimdışı fallback devrede:`, error.message);
    return {
      success: false,
      isOffline: true,
      error: 'Backend sunucusuna ulaşılamadı. Yerel önbellek kullanılıyor.',
    };
  }
}

// ================= AUTH API =================

export const apiRegister = async ({ username, email, password, age, heightCm, weightKg }) => {
  const result = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, age, heightCm, weightKg }),
  });

  if (result.success && result.token) {
    await setStoredToken(result.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }
  return result;
};

export const apiLogin = async ({ emailOrUsername, password }) => {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (result.success && result.token) {
    await setStoredToken(result.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }
  return result;
};

export const apiGetMe = async () => {
  return request('/api/auth/me');
};

// ================= HABITS API =================

export const apiGetHabits = async () => {
  return request('/api/habits');
};

export const apiCreateHabit = async (habitData) => {
  return request('/api/habits', {
    method: 'POST',
    body: JSON.stringify(habitData),
  });
};

export const apiUpdateHabit = async (id, habitData) => {
  return request(`/api/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(habitData),
  });
};

export const apiDeleteHabit = async (id) => {
  return request(`/api/habits/${id}`, {
    method: 'DELETE',
  });
};

export const apiVerifyHabit = async (id, verifyData) => {
  return request(`/api/habits/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify(verifyData),
  });
};

// ================= FRIENDS API =================

export const apiGetFriends = async () => {
  return request('/api/friends');
};

export const apiConnectFriend = async ({ username, friendId }) => {
  return request('/api/friends/connect', {
    method: 'POST',
    body: JSON.stringify({ username, friendId }),
  });
};

export const apiTransferPoints = async ({ receiverUsername, receiverId, points }) => {
  return request('/api/friends/transfer-points', {
    method: 'POST',
    body: JSON.stringify({ receiverUsername, receiverId, points }),
  });
};

// ================= CHALLENGES & LEADERBOARD API =================

export const apiGetLeaderboard = async () => {
  return request('/api/challenges/weekly/leaderboard');
};
