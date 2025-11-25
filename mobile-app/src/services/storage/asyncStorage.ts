import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Keys for storage
export const StorageKeys = {
  AUTH_TOKEN: 'authToken',
  USER_PHONE: 'userPhoneNumber',
  USER_ID: 'userId',
  USER_MONGO_ID: 'userMongoId',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
  THEME: 'lords-aqua-theme',
};

// Secure storage for sensitive data (tokens)
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error storing secure item ${key}:`, error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
    }
  },
};

// Regular async storage for non-sensitive data
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error storing item ${key}:`, error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// Helper functions for auth data
export const authStorage = {
  async saveAuthData(token: string, user: any): Promise<void> {
    try {
      // Save token securely
      await secureStorage.setItem(StorageKeys.AUTH_TOKEN, token);

      // Save user data
      await storage.setItem(StorageKeys.USER_PHONE, user.phoneNumber);

      if (user.userId) {
        await storage.setItem(StorageKeys.USER_ID, user.userId);
      }
      if (user._id) {
        await storage.setItem(StorageKeys.USER_MONGO_ID, user._id);
      }
      if (user.name) {
        await storage.setItem(StorageKeys.USER_NAME, user.name);
      }
      if (user.email) {
        await storage.setItem(StorageKeys.USER_EMAIL, user.email);
      }
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  },

  async getAuthToken(): Promise<string | null> {
    return await secureStorage.getItem(StorageKeys.AUTH_TOKEN);
  },

  async getUserPhone(): Promise<string | null> {
    return await storage.getItem(StorageKeys.USER_PHONE);
  },

  async clearAuthData(): Promise<void> {
    try {
      await secureStorage.removeItem(StorageKeys.AUTH_TOKEN);
      await storage.removeItem(StorageKeys.USER_PHONE);
      await storage.removeItem(StorageKeys.USER_ID);
      await storage.removeItem(StorageKeys.USER_MONGO_ID);
      await storage.removeItem(StorageKeys.USER_NAME);
      await storage.removeItem(StorageKeys.USER_EMAIL);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },
};
