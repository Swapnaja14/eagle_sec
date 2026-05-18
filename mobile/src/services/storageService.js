import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../utils/constants';

// For web, use localStorage; for native, use SecureStore
const isWeb = Platform.OS === 'web';

/**
 * Secure storage service for sensitive data (tokens)
 * Uses localStorage for web and SecureStore for native
 */
class StorageService {
  // ============ Secure Token Storage ============
  
  async saveTokens(accessToken, refreshToken) {
    try {
      const tokens = JSON.stringify({
        access: accessToken,
        refresh: refreshToken,
        timestamp: Date.now(),
      });
      
      if (isWeb) {
        localStorage.setItem('auth_tokens', tokens);
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync('auth_tokens', tokens);
      }
      return true;
    } catch (error) {
      console.error('Error saving tokens:', error);
      return false;
    }
  }

  async getTokens() {
    try {
      let tokens;
      
      if (isWeb) {
        tokens = localStorage.getItem('auth_tokens');
      } else {
        const SecureStore = require('expo-secure-store');
        tokens = await SecureStore.getItemAsync('auth_tokens');
      }
      
      if (tokens) {
        const parsed = JSON.parse(tokens);
        return {
          access: parsed.access,
          refresh: parsed.refresh,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  }

  async clearTokens() {
    try {
      if (isWeb) {
        localStorage.removeItem('auth_tokens');
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync('auth_tokens');
      }
      return true;
    } catch (error) {
      console.error('Error clearing tokens:', error);
      return false;
    }
  }

  // ============ User Data Storage ============
  
  async saveUserData(userData) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  async getUserData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async clearUserData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }

  // ============ Cache Management ============
  
  async cacheData(key, data, expiryMinutes = 60) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (expiryMinutes * 60 * 1000),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      console.error('Error caching data:', error);
      return false;
    }
  }

  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheItem.expiry) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async clearCache(key) {
    try {
      if (key) {
        await AsyncStorage.removeItem(key);
      } else {
        // Clear all cache except user data and tokens
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(
          k => k !== STORAGE_KEYS.USER_DATA && k.startsWith('cache_')
        );
        await AsyncStorage.multiRemove(cacheKeys);
      }
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // ============ Complete Logout ============
  
  async clearAll() {
    try {
      await this.clearTokens();
      await this.clearUserData();
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
}

export default new StorageService();
