import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await AsyncStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');

        const { data } = await api.post('/auth/refresh/', { refresh });
        await AsyncStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        // Handle logout
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const dashboardAPI = {
  getTraineeOverview: () => api.get('/trainee/dashboard/'),
};

export const coursesAPI = {
  list: (params) => api.get('/courses/', { params }),
  get: (id) => api.get(`/courses/${id}/`),
};

export const assessmentsAPI = {
  list: (params) => api.get('/assessments/quizzes/', { params }),
  startQuiz: (id) => api.post(`/assessments/quizzes/${id}/start_quiz/`),
  getQuestions: (id) => api.get(`/assessments/quizzes/${id}/questions/`),
  submitAnswer: (submissionId, data) => api.post(`/assessments/submissions/${submissionId}/submit_answer/`, data),
  completeSubmission: (submissionId) => api.post(`/assessments/submissions/${submissionId}/complete_submission/`),
  mySubmissions: (params) => api.get('/assessments/submissions/my_submissions/', { params }),
};
