import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authStorage } from '@/src/services/storage/asyncStorage';
import { userLogin, userSignup } from '@/src/services/api/authApi';
import type { User, LoginRequest, SignupRequest } from '@/src/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginData: LoginRequest) => Promise<void>;
  signup: (signupData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check if user is already logged in (on app startup)
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // TEMPORARY: Clear auth data for fresh start
      // Remove these lines after testing to enable auto-login
      // await authStorage.clearAuthData();
      // console.log('🔄 Auth data cleared for fresh start');
      // setIsLoading(false);
      // return;

      const token = await authStorage.getAuthToken();
      const phoneNumber = await authStorage.getUserPhone();

      if (token && phoneNumber) {
        // Validate token by fetching user profile from storage
        const { storage } = await import('@/src/services/storage/asyncStorage');
        const userMongoId = await storage.getItem('userMongoId');
        const userId = await storage.getItem('userId');
        const name = await storage.getItem('userName');
        const email = await storage.getItem('userEmail');

        // Only restore user if we have complete valid data
        if (userMongoId && userId && name) {
          setUser({
            _id: userMongoId,
            userId,
            name: name || '',
            phoneNumber,
            email: email || undefined,
            createdAt: new Date().toISOString(),
          });
          console.log('✅ User restored from storage:', name);
        } else {
          // Invalid or incomplete data, clear everything
          console.log('⚠️ Incomplete user data found, clearing auth');
          await authStorage.clearAuthData();
        }
      } else {
        console.log('ℹ️ No auth token found, user needs to login');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to check authentication status.');
      // On error, clear auth data to be safe
      await authStorage.clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (loginData: LoginRequest) => {
    try {
      const response = await userLogin(loginData);

      if (response.success && response.token && response.user) {
        // Save auth data
        await authStorage.saveAuthData(response.token, response.user);

        // Update state
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      // console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (signupData: SignupRequest) => {
    try {
      const response = await userSignup(signupData);

      if (response.success) {
        // Signup successful, but user might need admin approval
        // We don't set user state here, as they need to wait for approval
        return;
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to sign up. Please try again.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authStorage.clearAuthData();
      setUser(null);
      // Navigate to login screen after successful logout
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to logout. Please try again.');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
