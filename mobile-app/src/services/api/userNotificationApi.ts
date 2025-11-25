import { API_BASE_URL } from '@/src/constants/api';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Helper function to get auth token
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

// Get all notifications for a user
export const getUserNotifications = async (userId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch notifications. Please try again.');
    throw error;
  }
};

// Get unread notifications for a user
export const getUnreadNotifications = async (userId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch unread notifications. Please try again.');
    throw error;
  }
};

// Get notification count (total and unread)
export const getNotificationCount = async (userId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/count/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch notification count. Please try again.');
    throw error;
  }
};

// Mark a single notification as read
export const markAsRead = async (notificationId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/mark-read/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to mark notification as read. Please try again.');
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to mark all notifications as read. Please try again.');
    throw error;
  }
};

// Get active stories for a user
export const getActiveStories = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/stories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch stories. Please try again.');
    throw error;
  }
};

// Delete a single notification
export const deleteNotification = async (notificationId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/delete/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to delete notification. Please try again.');
    throw error;
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (userId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/notifications/delete-all/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to delete all notifications. Please try again.');
    throw error;
  }
};
