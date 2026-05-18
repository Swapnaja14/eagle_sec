import { Platform } from 'react-native';

// API Configuration
// IMPORTANT: Update these URLs based on your environment
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
      return 'http://localhost:8000/api';
    } else if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine
      return 'http://10.0.2.2:8000/api';
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:8000/api';
    }
    // For real devices, use your computer's IP address
    // return 'http://192.168.1.XXX:8000/api';
  }
  // Production mode
  return 'https://api.yourcompany.com/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 30000,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  CACHED_COURSES: 'cached_courses',
  CACHED_ASSIGNMENTS: 'cached_assignments',
};

// User Roles
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  TRAINEE: 'trainee',
};

// Assignment Status
export const ASSIGNMENT_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
};

// Course Status
export const COURSE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  RETIRED: 'retired',
};

// Quiz Status
export const QUIZ_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
};

// Colors
export const COLORS = {
  primary: '#2196F3',
  secondary: '#FF9800',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#00BCD4',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
};

// Fonts
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register/',
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  REFRESH_TOKEN: '/token/refresh/',
  ME: '/auth/me/',
  UPDATE_PROFILE: '/auth/me/update/',
  
  // Courses
  COURSES: '/courses/',
  COURSE_DETAIL: (id) => `/courses/${id}/`,
  COURSE_LESSONS: (id) => `/courses/${id}/lessons/`,
  
  // Assignments
  ASSIGNMENTS: '/assignments/',
  MY_ASSIGNMENTS: '/assignments/mine/',
  ASSIGNMENT_DETAIL: (id) => `/assignments/${id}/`,
  COMPLETE_ASSIGNMENT: (id) => `/assignments/${id}/complete/`,
  
  // Assessments
  QUIZZES: '/assessments/quizzes/',
  QUIZ_DETAIL: (id) => `/assessments/quizzes/${id}/`,
  START_QUIZ: (id) => `/assessments/quizzes/${id}/start_quiz/`,
  QUIZ_QUESTIONS: (id) => `/assessments/quizzes/${id}/questions/`,
  SUBMISSIONS: '/assessments/submissions/',
  SUBMIT_ANSWER: (id) => `/assessments/submissions/${id}/submit_answer/`,
  COMPLETE_SUBMISSION: (id) => `/assessments/submissions/${id}/complete_submission/`,
  
  // Certificates
  MY_CERTIFICATES: (userId) => `/certificates/employee/${userId}/`,
  DOWNLOAD_CERTIFICATE: (id) => `/certificates/${id}/download/`,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  ASSIGNMENT_COMPLETED: 'Assignment completed successfully!',
  QUIZ_SUBMITTED: 'Quiz submitted successfully!',
};
