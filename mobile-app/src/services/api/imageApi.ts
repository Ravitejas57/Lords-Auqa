import { API_BASE_URL } from '@/src/constants/api';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try SecureStore first (where tokens are actually stored)
    const secureToken = await SecureStore.getItemAsync('authToken');
    if (secureToken) return secureToken;

    // Fallback to check adminToken for admin users
    const adminToken = await SecureStore.getItemAsync('adminToken');
    if (adminToken) return adminToken;

    return null;
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to retrieve authentication token.');
    return null;
  }
};

export interface HatcheryImage {
  url: string;
  public_id: string;
  uploadedAt: string;
  status?: 'uploaded' | 'pending' | 'approved' | 'rejected';
  location?: {
    latitude: number;
    longitude: number;
  };
  adminFeedback?: {
    action: 'approve' | 'decline';
    message?: string;
    timestamp?: string;
  };
}

export interface Hatchery {
  _id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  images: HatcheryImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadImageResponse {
  success: boolean;
  message: string;
  images: HatcheryImage[];
  hatchery: Hatchery;
}

export interface DeleteImageResponse {
  success: boolean;
  message: string;
  hatchery: Hatchery;
}

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

const handleResponse = async (response: Response): Promise<any> => {
  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Get all hatcheries for a user
 */
export const getUserHatcheries = async (userId: string, forAdminView: boolean = false): Promise<{ success: boolean; hatcheries: Hatchery[]; count: number }> => {
  try {
    const queryParams = forAdminView ? '?forAdminView=true' : '';
    const response = await fetch(`${API_BASE_URL}/hatcheries/user/${userId}${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch hatcheries. Please try again.');
    throw error;
  }
};

/**
 * Get a single hatchery by ID
 */
export const getHatcheryById = async (hatcheryId: string): Promise<{ success: boolean; hatchery: Hatchery }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/${hatcheryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch hatchery. Please try again.');
    throw error;
  }
};

/**
 * Upload image to hatchery with location data
 */
export const uploadHatcheryImage = async (
  hatcheryId: string,
  imageUri: string,
  location?: { latitude: number; longitude: number }
): Promise<UploadImageResponse> => {
  try {
    const formData = new FormData();

    // Handle URI format for Android content:// URIs
    let finalUri = imageUri;
    if (Platform.OS === 'android' && imageUri.startsWith('content://')) {
      try {
        // Copy content:// URI to a temporary file:// URI for FormData compatibility
        const tempUri = `${FileSystem.cacheDirectory}hatchery_${Date.now()}.jpg`;
        await FileSystem.copyAsync({
          from: imageUri,
          to: tempUri,
        });
        finalUri = tempUri;
      } catch (copyError) {
        // If copy fails, try using the original URI (some versions of React Native handle content://)
        console.log('Could not copy file, using original URI');
      }
    }

    // Create file object from URI
    // Extract filename from URI (handle both file:// and content:// URIs)
    const uriParts = finalUri.split('/');
    let filename = uriParts[uriParts.length - 1] || 'image.jpg';
    
    // Remove query parameters if present
    filename = filename.split('?')[0];
    
    // Ensure filename has extension
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
    }
    
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('images', {
      uri: finalUri,
      name: filename,
      type,
    } as any);

    // Add location data if provided
    if (location) {
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
    }

    const token = await getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't set Content-Type manually - React Native will set it automatically with boundary for FormData
    const url = `${API_BASE_URL}/hatcheries/upload-image/${hatcheryId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });

    return await handleResponse(response);
  } catch (error: any) {
    // Check if it's a network error
    if (error?.message === 'Network request failed' || error?.message?.includes('Network')) {
      Alert.alert(
        'Network Error',
        'Cannot connect to server. Please check:\n' +
        '1. Backend server is running\n' +
        '2. Your phone and computer are on the same WiFi\n' +
        '3. API_BASE_URL is correct\n' +
        `Current URL: ${API_BASE_URL}`
      );
    } else {
      Alert.alert('Error', error?.message || 'Failed to upload image. Please try again.');
    }
    throw error;
  }
};

/**
 * Delete image from hatchery
 * Note: Images can only be deleted within 60 seconds of upload (unless rejected by admin)
 */
export const deleteHatcheryImage = async (
  hatcheryId: string,
  imageIndex: number
): Promise<DeleteImageResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/delete-image/${hatcheryId}/${imageIndex}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to delete image. Please try again.');
    throw error;
  }
};

/**
 * Create a new hatchery for a user
 */
export const createHatchery = async (data: {
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; message: string; hatchery: Hatchery }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to create hatchery. Please try again.');
    throw error;
  }
};


/**
 * Approve hatchery and reset images (complete transaction)
 */
export const approveHatchery = async (data: {
  hatcheryId: string;
  userId: string;
  adminId?: string;
  adminName?: string;
}): Promise<{ success: boolean; message: string; hatchery: Hatchery }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to approve hatchery. Please try again.');
    throw error;
  }
};

export interface TransactionHistory {
  _id: string;
  userId: string;
  userMongoId?: string;
  userName: string;
  userPhoneNumber?: string;
  hatcheryId: string;
  hatcheryName: string;
  startDate: string;
  endDate: string;
  approvedImages: Array<{
    url: string;
    public_id: string;
    uploadedAt: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
  }>;
  seedsCount: number;
  bonus: number;
  price: number;
  seedType: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt: string;
  status: 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

/**
 * Get admin transaction history
 */
export const getAdminTransactionHistory = async (adminId: string): Promise<{
  success: boolean;
  count: number;
  transactions: TransactionHistory[];
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/transactions/admin?adminId=${adminId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch transaction history. Please try again.');
    throw error;
  }
};

/**
 * Get user transaction history
 */
export const getUserTransactionHistory = async (userId: string): Promise<{
  success: boolean;
  count: number;
  transactions: TransactionHistory[];
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/transactions/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch transaction history. Please try again.');
    throw error;
  }
};

/**
 * Delete hatchery and reset slots (without creating purchase history)
 */
export const deleteAndResetHatchery = async (data: {
  hatcheryId: string;
  userId: string;
  adminId?: string;
  adminName?: string;
}): Promise<{ success: boolean; message: string; hatchery: Hatchery }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/delete-and-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to delete hatchery. Please try again.');
    throw error;
  }
};
