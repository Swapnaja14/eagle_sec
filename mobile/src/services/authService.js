import apiClient from '../api/client';
import tokenManager from '../utils/tokenManager';

class AuthService {
  async login(username, password) {
    try {
      const response = await apiClient.post('/auth/login/', {
        username,
        password,
      });

      const { access, refresh, user } = response;

      // Save tokens and user data
      await tokenManager.saveTokens(access, refresh);
      await tokenManager.saveUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register/', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        department: userData.department,
        role: 'trainee',
      });

      const { access, refresh, user } = response;

      // Save tokens and user data
      await tokenManager.saveTokens(access, refresh);
      await tokenManager.saveUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  async logout() {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      
      if (refreshToken) {
        await apiClient.post('/auth/logout/', {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await tokenManager.clearAll();
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me/');
      await tokenManager.saveUser(response);
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async checkAuth() {
    const accessToken = await tokenManager.getAccessToken();
    const user = await tokenManager.getUser();
    return { isAuthenticated: !!accessToken, user };
  }
}

export default new AuthService();
