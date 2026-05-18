import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER: 'user_data',
};

const isWeb = Platform.OS === 'web';

class TokenManager {
  // Save tokens securely
  async saveTokens(accessToken, refreshToken) {
    try {
      if (isWeb) {
        localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, accessToken);
        await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refreshToken);
      }
      return true;
    } catch (error) {
      console.error('Error saving tokens:', error);
      return false;
    }
  }

  // Get access token
  async getAccessToken() {
    try {
      if (isWeb) {
        return localStorage.getItem(TOKEN_KEYS.ACCESS);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Get refresh token
  async getRefreshToken() {
    try {
      if (isWeb) {
        return localStorage.getItem(TOKEN_KEYS.REFRESH);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
      }
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  // Save user data
  async saveUser(userData) {
    try {
      const userString = JSON.stringify(userData);
      await AsyncStorage.setItem(TOKEN_KEYS.USER, userString);
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  }

  // Get user data
  async getUser() {
    try {
      const userString = await AsyncStorage.getItem(TOKEN_KEYS.USER);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Clear all tokens and user data
  async clearAll() {
    try {
      if (isWeb) {
        localStorage.removeItem(TOKEN_KEYS.ACCESS);
        localStorage.removeItem(TOKEN_KEYS.REFRESH);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
        await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
      }
      await AsyncStorage.removeItem(TOKEN_KEYS.USER);
      return true;
    } catch (error) {
      console.error('Error clearing tokens:', error);
      return false;
    }
  }
}

export default new TokenManager();
