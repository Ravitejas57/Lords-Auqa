import { API_BASE_URL } from '@/src/constants/api';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    if (adminToken) return adminToken;

    const authToken = await AsyncStorage.getItem('authToken');
    if (authToken) return authToken;

    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to retrieve authentication token.');
    return null;
  }
};

// Helper function to handle API responses
const handleResponse = async (response: Response): Promise<any> => {
  try {
    const data = await response.json();

    if (!response.ok) {
      const error: any = new Error(data.message || 'API request failed');
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

// Send broadcast notification
export const sendBroadcastNotification = async (notificationData: {
  target: string;
  region?: string;
  district?: string;
  userIds?: string[];
  type: string;
  priority: string;
  message: string;
  adminId: string;
  files?: Array<{ uri: string; type: string; name: string }>;
}): Promise<any> => {
  try {
    const token = await getAuthToken();

    // If files are provided, use FormData; otherwise use JSON
    const hasFiles = notificationData.files && notificationData.files.length > 0;
    
    let body: FormData | string;
    let headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    if (hasFiles) {
      const formData = new FormData();
      
      // Add text fields
      formData.append('target', notificationData.target);
      formData.append('type', notificationData.type);
      formData.append('priority', notificationData.priority);
      formData.append('message', notificationData.message || ''); // Allow empty message if files are present
      formData.append('adminId', notificationData.adminId);
      
      if (notificationData.region) {
        formData.append('region', notificationData.region);
      }
      if (notificationData.district) {
        formData.append('district', notificationData.district);
      }
      if (notificationData.userIds && notificationData.userIds.length > 0) {
        // Send userIds as JSON string for FormData compatibility
        formData.append('userIds', JSON.stringify(notificationData.userIds));
      }

      // Add files
      notificationData.files!.forEach((file, index) => {
        const filename = file.name || `file_${Date.now()}_${index}.jpg`;
        formData.append('files', {
          uri: file.uri,
          name: filename,
          type: file.type || 'image/jpeg',
        } as any);
      });

      body = formData;
      // Don't set Content-Type header for FormData - let the browser set it with boundary
    } else {
      body = JSON.stringify({
        target: notificationData.target,
        region: notificationData.region,
        district: notificationData.district,
        userIds: notificationData.userIds,
        type: notificationData.type,
        priority: notificationData.priority,
        message: notificationData.message || '', // Allow empty message
        adminId: notificationData.adminId,
      });
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/notifications/admin/broadcast`, {
      method: 'POST',
      headers,
      body,
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to send notification. Please try again.');
    throw error;
  }
};

// Get notification history
export const getNotificationHistory = async (): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/admin/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch notification history. Please try again.');
    throw error;
  }
};

// Cleanup old notifications (admin side only)
export const cleanupOldNotifications = async (): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/admin/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to cleanup notifications. Please try again.');
    throw error;
  }
};

// Get admin's active stories
export const getAdminStories = async (): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/admin/stories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch stories. Please try again.');
    throw error;
  }
};

// Delete admin story
export const deleteAdminStory = async (storyId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/admin/story/${storyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to delete story. Please try again.');
    throw error;
  }
};
