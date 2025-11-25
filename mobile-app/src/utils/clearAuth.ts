import { authStorage } from '@/src/services/storage/asyncStorage';

/**
 * Utility function to clear all authentication data
 * Use this for testing or when you need to force logout
 */
export const clearAuthData = async () => {
  try {
    await authStorage.clearAuthData();
    console.log('✅ Authentication data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing authentication data:', error);
    return false;
  }
};
