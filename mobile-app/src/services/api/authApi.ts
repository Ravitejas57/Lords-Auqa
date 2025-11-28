import { API_BASE_URL, API_ENDPOINTS } from '@/src/constants/api';
import { Alert } from 'react-native';
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  AdminsResponse,
  User,
} from '@/src/types/auth';

// Helper function to handle API responses
const handleResponse = async (response: Response): Promise<any> => {
  try {
    const data = await response.json();

    if (!response.ok) {
      let errorMessage = data.message || 'API request failed';

      switch (response.status) {
        case 400:
          errorMessage = data.message || 'Invalid request data';
          break;
        case 401:
          errorMessage = 'Authentication required. Please login again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = data.message || 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = data.message || `Request failed with status ${response.status}`;
      }

      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response format from server');
    }
    throw error;
  }
};

// User Login
export const userLogin = async (loginData: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.USER_LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    return await handleResponse(response);
  } catch (error: any) {
    // console.error('Error during user login:', error);

    // Provide helpful error messages for network issues
    if (error.message === 'Network request failed' || error.message?.includes('fetch')) {
      throw new Error(
        'Cannot connect to server. Please check:\n' +
        '1. Backend server is running (npm start in Backend folder)\n' +
        '2. Your phone and computer are on the same WiFi\n' +
        '3. API_BASE_URL in api.ts has your computer\'s correct IP address'
      );
    }

    throw error;
  }
};

// User Signup
export const userSignup = async (signupData: SignupRequest): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.USER_SIGNUP}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to sign up. Please try again.');
    throw error;
  }
};

// Get Admins List
export const getAdmins = async (): Promise<AdminsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GET_ADMINS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch admins. Please try again.');
    throw error;
  }
};

// Get User Profile by Phone Number
export const getUserProfile = async (phoneNumber: string): Promise<{ success: boolean; user: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.GET_PROFILE(phoneNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch user profile. Please try again.');
    throw error;
  }
};

// Update User Profile
export const updateUserProfile = async (userId: string, formData: FormData): Promise<{ success: boolean; user: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.UPDATE_PROFILE(userId)}`, {
      method: 'PUT',
      body: formData,
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to update profile. Please try again.');
    throw error;
  }
};

// Admin Login
export const adminLogin = async (loginData: { username: string; password: string }): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ADMIN_LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    return await handleResponse(response);
  } catch (error: any) {
    // Provide helpful error messages for network issues
    if (error.message === 'Network request failed' || error.message?.includes('fetch')) {
      const networkError = 'Cannot connect to server. Please check:\n' +
        '1. Backend server is running (npm start in Backend folder)\n' +
        '2. Your phone and computer are on the same WiFi network\n' +
        '3. API_BASE_URL in api.ts has your computer\'s correct IP address\n' +
        `Current API URL: ${API_BASE_URL}`;
      Alert.alert('Connection Error', networkError);
      throw new Error(networkError);
    }

    Alert.alert('Error', error?.message || 'Failed to login. Please try again.');
    throw error;
  }
};

