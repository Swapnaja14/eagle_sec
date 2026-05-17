import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// ===============================
// 🌐 BASE URL RESOLUTION
// ===============================

const BACKEND_PORT = 8000;

function deriveLanHost() {
  try {
    // Metro bundle URL
    const scriptURL = NativeModules?.SourceCode?.scriptURL;

    if (scriptURL) {
      const match = scriptURL.match(
        /^https?:\/\/([^/:]+)(?::\d+)?/
      );

      if (match && match[1]) {
        return match[1];
      }
    }

    // Expo fallback
    if (typeof global !== 'undefined') {
      const debuggerHost =
        global.__expo?.modules?.ExponentConstants
          ?.expoConfig?.hostUri ||
        global.__DEV_SERVER_URL__ ||
        global.HermesInternal
          ?.getRuntimeProperties?.()?.serverHost;

      if (typeof debuggerHost === 'string') {
        const match =
          debuggerHost.match(
            /^(?:https?:\/\/)?([^/:]+)/
          );

        if (match && match[1]) {
          return match[1];
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

function resolveBaseURL() {
  // Web
  if (Platform.OS === 'web') {
    const host =
      (typeof window !== 'undefined' &&
        window.location?.hostname) ||
      'localhost';

    return `http://${host}:${BACKEND_PORT}/api`;
  }

  // Environment override
  const override =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.EXPO_PUBLIC_API_URL) ||
    null;

  if (override) {
    return override.replace(/\/$/, '');
  }

  // Physical device LAN IP
  const lan = deriveLanHost();

  if (
    lan &&
    lan !== 'localhost' &&
    lan !== '127.0.0.1'
  ) {
    return `http://${lan}:${BACKEND_PORT}/api`;
  }

  // Android emulator
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }

  // iOS simulator
  return `http://localhost:${BACKEND_PORT}/api`;
}

export const baseURL = resolveBaseURL();

console.log('🌐 API baseURL =', baseURL);

// ===============================
// 📡 AXIOS INSTANCE
// ===============================

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===============================
// 🔐 TOKEN HELPERS
// ===============================

const getAccessToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(
      'access_token'
    );
  }

  return await AsyncStorage.getItem(
    'access_token'
  );
};

const getRefreshToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(
      'refresh_token'
    );
  }

  return await AsyncStorage.getItem(
    'refresh_token'
  );
};

const setAccessToken = async (token) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(
      'access_token',
      token
    );
  } else {
    await AsyncStorage.setItem(
      'access_token',
      token
    );
  }
};

const setRefreshToken = async (token) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(
      'refresh_token',
      token
    );
  } else {
    await AsyncStorage.setItem(
      'refresh_token',
      token
    );
  }
};

const clearTokens = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(
      'access_token'
    );

    localStorage.removeItem(
      'refresh_token'
    );
  } else {
    await AsyncStorage.removeItem(
      'access_token'
    );

    await AsyncStorage.removeItem(
      'refresh_token'
    );
  }
};

// ===============================
// 📤 REQUEST INTERCEPTOR
// ===============================

api.interceptors.request.use(
  async (config) => {
    const token =
      await getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// 📥 RESPONSE INTERCEPTOR
// ===============================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config;

    // Skip refresh for login route
    if (
      originalRequest?.url?.includes(
        '/token/'
      ) &&
      !originalRequest?.url?.includes(
        '/refresh/'
      )
    ) {
      return Promise.reject(error);
    }

    // Handle expired token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refresh =
          await getRefreshToken();

        if (!refresh) {
          throw new Error(
            'No refresh token'
          );
        }

        console.log(
          '🔄 Refreshing token...'
        );

        const { data } =
          await api.post(
            '/token/refresh/',
            {
              refresh,
            }
          );

        await setAccessToken(
          data.access
        );

        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.log(
          '❌ Refresh failed → logging out'
        );

        await clearTokens();

        return Promise.reject(
          refreshError
        );
      }
    }

    return Promise.reject(error);
  }
);

// ===============================
// 🔑 AUTH API
// ===============================

export const authAPI = {
  login: async (credentials) => {
    const { data } =
      await api.post(
        '/token/',
        credentials
      );

    await setAccessToken(
      data.access
    );

    await setRefreshToken(
      data.refresh
    );

    console.log(
      '✅ Tokens stored'
    );

    return data;
  },

  me: () => api.get('/auth/me/'),

  logout: async () => {
    const refresh =
      await getRefreshToken();

    try {
      if (refresh) {
        await api.post(
          '/auth/logout/',
          {
            refresh,
          }
        );
      }
    } catch (e) {
      console.log(
        'Logout call failed:',
        e?.message
      );
    }

    await clearTokens();
  },
};

// ===============================
// 📊 DASHBOARD API
// ===============================

export const dashboardAPI = {
  getTraineeOverview: () =>
    api.get('/trainee/dashboard/'),
};

// ===============================
// 📚 COURSES API
// ===============================

export const coursesAPI = {
  list: (params) =>
    api.get('/courses/', {
      params,
    }),

  get: (id) =>
    api.get(`/courses/${id}/`),

  getAllocatedForTrainee: () =>
    api.get('/trainee/courses/'),
};

// ===============================
// 📝 ASSESSMENTS API
// ===============================

export const assessmentsAPI = {
  list: (params) =>
    api.get(
      '/assessments/quizzes/',
      {
        params,
      }
    ),

  getById: (id) =>
    api.get(
      `/assessments/quizzes/${id}/`
    ),

  startQuiz: (id) =>
    api.post(
      `/assessments/quizzes/${id}/start_quiz/`
    ),

  getQuestions: (id) =>
    api.get(
      `/assessments/quizzes/${id}/questions/`
    ),

  submitAnswer: (
    submissionId,
    data
  ) =>
    api.post(
      `/assessments/submissions/${submissionId}/submit_answer/`,
      data
    ),

  completeSubmission: (
    submissionId
  ) =>
    api.post(
      `/assessments/submissions/${submissionId}/complete_submission/`
    ),

  submitAssessment: (data) =>
    api.post(
      '/assessments/submit/',
      data
    ),

  mySubmissions: (params) =>
    api.get(
      '/assessments/submissions/my_submissions/',
      {
        params,
      }
    ),
};

// ===============================
// 🏆 CERTIFICATES API
// ===============================

export const certificatesAPI = {
  forEmployee: (userId) =>
    api.get(
      `/certificates/employee/${userId}/`
    ),

  generate: (submissionId) =>
    api.post(
      '/certificates/generate/',
      {
        submission_id:
          submissionId,
      }
    ),

  download: (certId) =>
    api.get(
      `/certificates/${certId}/download/`
    ),
};

// ===============================
// ❓ QUIZZES API
// ===============================

export const quizzesAPI = {
  list: (params) =>
    api.get(
      '/assessments/quizzes/',
      {
        params,
      }
    ),

  get: (id) =>
    api.get(
      `/assessments/quizzes/${id}/`
    ),

  start: (id) =>
    api.post(
      `/assessments/quizzes/${id}/start_quiz/`
    ),

  questions: (id) =>
    api.get(
      `/assessments/quizzes/${id}/questions/`
    ),
};

// ===============================
// 📨 SUBMISSIONS API
// ===============================

export const submissionsAPI = {
  list: (params) =>
    api.get(
      '/assessments/submissions/',
      {
        params,
      }
    ),

  get: (id) =>
    api.get(
      `/assessments/submissions/${id}/`
    ),

  submitAnswer: (
    id,
    data
  ) =>
    api.post(
      `/assessments/submissions/${id}/submit_answer/`,
      data
    ),

  complete: (id) =>
    api.post(
      `/assessments/submissions/${id}/complete_submission/`
    ),

  mine: () =>
    api.get(
      '/assessments/submissions/my_submissions/'
    ),
};

// ===============================
// 📅 SESSIONS API
// ===============================

export const sessionsAPI = {
  upcoming: (params) =>
    api.get(
      '/sessions/upcoming/',
      {
        params,
      }
    ),

  calendar: (params) =>
    api.get(
      '/sessions/calendar/',
      {
        params,
      }
    ),
};

// ===============================
// 🚀 DEFAULT EXPORT
// ===============================

export default api;