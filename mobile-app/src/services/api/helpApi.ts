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

// Get all user help conversations for admin
export const getUserConversations = async (adminId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user-help/admin/${adminId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch conversations. Please try again.');
    throw error;
  }
};

// Get specific conversation details
export const getConversationById = async (conversationId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user-help/conversation/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch conversation. Please try again.');
    throw error;
  }
};

// Send admin reply to user
export const sendAdminReply = async (data: {
  adminId: string;
  conversationId: string;
  message: string;
}): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user-help/admin/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to send reply. Please try again.');
    throw error;
  }
};

// Close a conversation
export const closeConversation = async (data: {
  adminId: string;
  conversationId: string;
}): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user-help/admin/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to close conversation. Please try again.');
    throw error;
  }
};

// Cleanup old conversations (admin side only)
export const cleanupOldConversations = async (): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user-help/admin/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to cleanup conversations. Please try again.');
    throw error;
  }
};

// Get admin unread count
export const getAdminUnreadCount = async (adminId: string): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/user-help/admin/unread-count/${adminId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch unread count. Please try again.');
    throw error;
  }
};
