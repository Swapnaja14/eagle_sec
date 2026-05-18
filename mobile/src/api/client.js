import { API_CONFIG } from '../utils/constants';
import tokenManager from '../utils/tokenManager';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
    console.log('[ApiClient] Initialized with baseURL:', this.baseURL);
  }

  async request(url, options = {}) {
    console.log('[ApiClient] Request:', url, options.method || 'GET');
    
    try {
      const accessToken = await tokenManager.getAccessToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (accessToken && !options._skipAuth) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const config = {
        ...options,
        headers,
        timeout: API_CONFIG.TIMEOUT,
      };

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${this.baseURL}${url}`, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('[ApiClient] Response:', url, response.status);
      
      // Handle 401 - Token expired
      if (response.status === 401 && !options._retry) {
        console.log('[ApiClient] Token expired, attempting refresh');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(url, { ...options, _retry: true });
        } else {
          // Refresh failed, clear tokens and throw
          await tokenManager.clearAll();
          throw {
            message: 'Session expired. Please login again.',
            status: 401,
            shouldLogout: true,
          };
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[ApiClient] Error response:', error);
        throw {
          message: error.detail || error.message || `HTTP ${response.status}`,
          status: response.status,
          data: error,
        };
      }

      return response.json();
    } catch (error) {
      console.error('[ApiClient] Request failed:', url, error);
      
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout. Please try again.',
          type: 'timeout',
        };
      }
      
      if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
        throw {
          message: 'Network error. Please check your connection.',
          type: 'network',
        };
      }
      throw error;
    }
  }

  async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${this.baseURL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      await tokenManager.saveTokens(data.access, data.refresh);

      this.failedQueue.forEach(({ resolve }) => resolve(true));
      this.failedQueue = [];

      return true;
    } catch (error) {
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  async get(url, config = {}) {
    return this.request(url, { ...config, method: 'GET' });
  }

  async post(url, data = {}, config = {}) {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch(url, data = {}, config = {}) {
    return this.request(url, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(url, config = {}) {
    return this.request(url, { ...config, method: 'DELETE' });
  }
}

export default new ApiClient();
