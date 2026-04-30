import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// ===============================
// 🌐 BASE URL RESOLUTION
// ===============================
// Priority:
//   1. EXPO_PUBLIC_API_URL env override (recommended for production / LAN)
//   2. Web → localhost
//   3. Android emulator → 10.0.2.2
//   4. Physical device (Expo Go) → derive LAN IP from Metro bundle URL
//   5. Fallback localhost
const BACKEND_PORT = 8000;

function deriveLanHost() {
  try {
    // Metro / RN dev server URL, e.g. "http://192.168.1.5:8081/index.bundle?..."
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const m = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?/);
      if (m && m[1]) return m[1];
    }
    // Fallback: global DEV server host (set by RN/Expo)
    if (typeof global !== 'undefined') {
      const debuggerHost = global.__expo?.modules?.ExponentConstants?.expoConfig?.hostUri
        || global.__DEV_SERVER_URL__
        || global.HermesInternal?.getRuntimeProperties?.()?.serverHost;
      if (typeof debuggerHost === 'string') {
        const m = debuggerHost.match(/^(?:https?:\/\/)?([^/:]+)/);
        if (m && m[1]) return m[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

function resolveBaseURL() {
  // Web: always use the browser's current hostname so it works for
  // both localhost and LAN-served Expo Web. Browsers loopback
  // localhost without going through the OS firewall.
  if (Platform.OS === 'web') {
    const host =
      (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
    return `http://${host}:${BACKEND_PORT}/api`;
  }

  // Native: explicit env override wins (set in mobile/.env for physical devices).
  const override =
    (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL) || null;
  if (override) return override.replace(/\/$/, '');

  const lan = deriveLanHost();
  if (lan && lan !== 'localhost' && lan !== '127.0.0.1') {
    return `http://${lan}:${BACKEND_PORT}/api`;
  }

  if (Platform.OS === 'android') return `http://10.0.2.2:${BACKEND_PORT}/api`;
  return `http://localhost:${BACKEND_PORT}/api`;
}

export const baseURL = resolveBaseURL();
console.log('🌐 API baseURL =', baseURL);

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// ===============================
// 🔐 TOKEN HELPERS
// ===============================

const getAccessToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('access_token');
  }
  return await AsyncStorage.getItem('access_token');
};

const getRefreshToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('refresh_token');
  }
  return await AsyncStorage.getItem('refresh_token');
};

const setAccessToken = async (token) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('access_token', token);
  } else {
    await AsyncStorage.setItem('access_token', token);
  }
};

const setRefreshToken = async (token) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('refresh_token', token);
  } else {
    await AsyncStorage.setItem('refresh_token', token);
  }
};

const clearTokens = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } else {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
  }
};

// ===============================
// 📤 REQUEST INTERCEPTOR
// ===============================

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===============================
// 📥 RESPONSE INTERCEPTOR
// ===============================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Skip refresh logic for login endpoint
    if (original.url.includes('/token/') && !original.url.includes('/refresh/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refresh = await getRefreshToken();

        if (!refresh) throw new Error('No refresh token');

        console.log("🔄 Refreshing token...");

        const { data } = await api.post('/token/refresh/', {
          refresh,
        });

        await setAccessToken(data.access);

        original.headers.Authorization = `Bearer ${data.access}`;

        return api(original);
      } catch (err) {
        console.log("❌ Refresh failed → logging out");

        await clearTokens();

        // Optional: redirect to login
        // window.location.href = "/login";

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// ===============================
// 📦 EXPORTS
// ===============================

export default api;

export const dashboardAPI = {
  getTraineeOverview: () => api.get('/trainee/dashboard/'),
};

export const coursesAPI = {
  list: (params) => api.get('/courses/', { params }),
  get: (id) => api.get(`/courses/${id}/`),
  getAllocatedForTrainee: () => api.get('/trainee/courses/'),
};

export const assessmentsAPI = {
  list: (params) => api.get('/assessments/quizzes/', { params }),
};

// ===============================
// 🔑 LOGIN HELPER (IMPORTANT)
// ===============================

export const authAPI = {
  login: async (credentials) => {
    const { data } = await api.post('/token/', credentials);

    await setAccessToken(data.access);
    await setRefreshToken(data.refresh);

    console.log("✅ Tokens stored");

    return data;
  },
  me: () => api.get('/auth/me/'),
  logout: async () => {
    const refresh = await getRefreshToken();
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (e) {
      // Still clear locally even if blacklist call fails
      console.log('Logout call failed (clearing local anyway):', e?.message);
    }
    await clearTokens();
  },
};

export const certificatesAPI = {
  forEmployee: (userId) => api.get(`/certificates/employee/${userId}/`),
  generate: (submissionId) => api.post('/certificates/generate/', { submission_id: submissionId }),
  download: (certId) => api.get(`/certificates/${certId}/download/`),
};

export const quizzesAPI = {
  list: (params) => api.get('/assessments/quizzes/', { params }),
  get: (id) => api.get(`/assessments/quizzes/${id}/`),
  start: (id) => api.post(`/assessments/quizzes/${id}/start_quiz/`),
  questions: (id) => api.get(`/assessments/quizzes/${id}/questions/`),
};

export const submissionsAPI = {
  list: (params) => api.get('/assessments/submissions/', { params }),
  get: (id) => api.get(`/assessments/submissions/${id}/`),
  submitAnswer: (id, data) => api.post(`/assessments/submissions/${id}/submit_answer/`, data),
  complete: (id) => api.post(`/assessments/submissions/${id}/complete_submission/`),
  mine: () => api.get('/assessments/submissions/my_submissions/'),
};
export const sessionsAPI = {
  upcoming: (params) => api.get('/sessions/upcoming/', { params }),
  calendar: (params) => api.get('/sessions/calendar/', { params }),
};
