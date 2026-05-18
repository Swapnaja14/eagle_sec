import apiClient from './client';
import { ENDPOINTS } from '../utils/constants';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Register new trainee
   */
  register: async (userData) => {
    return await apiClient.post(ENDPOINTS.REGISTER, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.confirmPassword,
      first_name: userData.firstName,
      last_name: userData.lastName,
      department: userData.department,
      role: 'trainee', // Always trainee for mobile app
    });
  },

  /**
   * Login with username and password
   */
  login: async (username, password) => {
    return await apiClient.post(ENDPOINTS.LOGIN, {
      username,
      password,
    });
  },

  /**
   * Logout and blacklist refresh token
   */
  logout: async (refreshToken) => {
    return await apiClient.post(ENDPOINTS.LOGOUT, {
      refresh: refreshToken,
    });
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken) => {
    return await apiClient.post(ENDPOINTS.REFRESH_TOKEN, {
      refresh: refreshToken,
    });
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return await apiClient.get(ENDPOINTS.ME);
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    return await apiClient.patch(ENDPOINTS.UPDATE_PROFILE, profileData);
  },
};
