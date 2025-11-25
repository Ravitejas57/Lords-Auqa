import { API_BASE_URL } from '@/src/constants/api';
import { Alert } from 'react-native';

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

// Get all pending users (filtered by adminId)
export const getPendingUsers = async (adminId: string | null = null): Promise<any> => {
  try {
    const url = adminId
      ? `${API_BASE_URL}/adminActions/pending?adminId=${adminId}`
      : `${API_BASE_URL}/adminActions/pending`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch pending users. Please try again.');
    throw error;
  }
};

// Get all approved users (filtered by adminId)
export const getApprovedUsers = async (adminId: string | null = null): Promise<any> => {
  try {
    const url = adminId
      ? `${API_BASE_URL}/adminActions/approved?adminId=${adminId}`
      : `${API_BASE_URL}/adminActions/approved`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch approved users. Please try again.');
    throw error;
  }
};

// Get all rejected users (filtered by adminId)
export const getRejectedUsers = async (adminId: string | null = null): Promise<any> => {
  try {
    const url = adminId
      ? `${API_BASE_URL}/adminActions/rejected?adminId=${adminId}`
      : `${API_BASE_URL}/adminActions/rejected`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch rejected users. Please try again.');
    throw error;
  }
};

// Approve a pending user
export const approvePendingUser = async (pendingUserId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/adminActions/approve/${pendingUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to approve user. Please try again.');
    throw error;
  }
};

// Reject a pending user
export const rejectPendingUser = async (pendingUserId: string, reason: string = ''): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/adminActions/reject/${pendingUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to reject user. Please try again.');
    throw error;
  }
};

// Add a new user
export const addUser = async (data: {
  name: string;
  phoneNumber: string;
  email?: string;
  password: string;
  country: string;
  state: string;
  district: string;
  fullAddress: string;
  pincode: string;
  seedsCount: number;
  bonus: number;
  price: number;
  seedType: string;
  assignedAdmin: string;
}): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/adminActions/add-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to add user. Please try again.');
    throw error;
  }
};

// Update user seeds information
export const updateUserSeeds = async (
  userId: string,
  seedsData: {
    seedsCount: number;
    bonus: number;
    price: number;
    seedType: string;
  }
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/adminActions/update-seeds/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seedsData),
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to update user seeds. Please try again.');
    throw error;
  }
};


// Get admin profile
export const getAdminProfile = async (adminId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/adminActions/getAdmin/${adminId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch admin profile. Please try again.');
    throw error;
  }
};

// Update admin profile
export const updateAdminProfile = async (
  adminId: string,
  formData: FormData
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/adminActions/update/${adminId}`, {
      method: 'PUT',
      body: formData,
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to update admin profile. Please try again.');
    throw error;
  }
};

// Get admin statistics
export const getAdminStatistics = async (adminId?: string): Promise<any> => {
  try {
    const url = adminId
      ? `${API_BASE_URL}/adminActions/statistics?adminId=${adminId}`
      : `${API_BASE_URL}/adminActions/statistics`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to fetch admin statistics. Please try again.');
    throw error;
  }
};

// Reset user password
export const resetUserPassword = async (
  userId: string,
  newPassword: string,
  adminId?: string
): Promise<any> => {
  try {
    console.log('🔍 Mobile - Resetting password for userId:', userId);
    console.log('🔍 Mobile - User ID type:', typeof userId);
    console.log('🔍 Mobile - Is valid ObjectId?', /^[0-9a-fA-F]{24}$/.test(userId));
    
    const response = await fetch(`${API_BASE_URL}/user/password-reset/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        newPassword: newPassword,
        adminId: adminId || 'admin123',
      }),
    });

    const data = await response.json();
    
    console.log('🔍 Mobile - API Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to reset password');
    }
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to reset password. Please try again.');
    throw error;
  }
};
