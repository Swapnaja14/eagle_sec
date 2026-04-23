import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ✅ Base URL
const baseURL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api';

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

  console.log("🚀 TOKEN SENT:", token); // DEBUG

  return config;
});

// ===============================
// 📥 RESPONSE INTERCEPTOR
// ===============================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

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
};