import { API_BASE_URL } from '@/src/constants/api';
import * as SecureStore from 'expo-secure-store';

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const secureToken = await SecureStore.getItemAsync('authToken');
    if (secureToken) return secureToken;

    const adminToken = await SecureStore.getItemAsync('adminToken');
    if (adminToken) return adminToken;

    return null;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
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

// Send a new help message to assigned admin
export const sendHelpMessage = async (data: {
  userId: string;
  subject: string;
  message: string;
  adminId: string;
}): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-help/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error sending help message:', error);
    throw error;
  }
};

// Get all conversations for a user
export const getUserConversations = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-help/conversations/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

// Get a single conversation by ID
export const getConversationById = async (conversationId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-help/conversation/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

// Reply to an existing conversation
export const replyToConversation = async (data: {
  userId: string;
  conversationId: string;
  message: string;
}): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-help/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error replying to conversation:', error);
    throw error;
  }
};
