const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// Admin login
export const adminLogin = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/Admin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

// Get admin profile by ID
export const getAdminById = async (adminId) => {
  const response = await fetch(`${API_BASE_URL}/user/getAdmin/${adminId}`);
  return handleResponse(response);
};

// Get all user profiles
export const getAllUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/user/all`);
  return handleResponse(response);
};

// Get all pending users (optionally filtered by adminId)
export const getPendingUsers = async (adminId = null) => {
  const url = adminId
    ? `${API_BASE_URL}/adminActions/pending?adminId=${adminId}`
    : `${API_BASE_URL}/adminActions/pending`;
  const response = await fetch(url);
  return handleResponse(response);
};

// Get all approved users (optionally filtered by adminId)
export const getApprovedUsers = async (adminId = null) => {
  const url = adminId
    ? `${API_BASE_URL}/adminActions/approved?adminId=${adminId}`
    : `${API_BASE_URL}/adminActions/approved`;
  const response = await fetch(url);
  return handleResponse(response);
};

// Get all rejected users (optionally filtered by adminId)
export const getRejectedUsers = async (adminId = null) => {
  const url = adminId
    ? `${API_BASE_URL}/adminActions/rejected?adminId=${adminId}`
    : `${API_BASE_URL}/adminActions/rejected`;
  const response = await fetch(url);
  return handleResponse(response);
};

// Approve a pending user
export const approvePendingUser = async (pendingUserId) => {
  const response = await fetch(`${API_BASE_URL}/adminActions/approve/${pendingUserId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

// Reject a pending user
export const rejectPendingUser = async (pendingUserId, reason = '') => {
  const response = await fetch(`${API_BASE_URL}/adminActions/reject/${pendingUserId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  return handleResponse(response);
};

// Update user seeds information
export const updateUserSeeds = async (userId, seedsData) => {
  const response = await fetch(`${API_BASE_URL}/adminActions/update-seeds/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(seedsData),
  });
  return handleResponse(response);
};

// Reset user password
export const resetUserPassword = async (userId, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/adminActions/reset-password/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });
  return handleResponse(response);
};

// Get user hatcheries (for admin view)
export const getUserHatcheries = async (userId, forAdminView = false) => {
  const queryParams = forAdminView ? '?forAdminView=true' : '';
  const response = await fetch(`${API_BASE_URL}/hatcheries/user/${userId}${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

// Approve hatchery
export const approveHatchery = async (data) => {
  const response = await fetch(`${API_BASE_URL}/hatcheries/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// Delete and reset hatchery
export const deleteAndResetHatchery = async (data) => {
  const response = await fetch(`${API_BASE_URL}/hatcheries/delete-and-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// ==================== TRANSACTION HISTORY ====================

// Get user transaction history
export const getUserTransactionHistory = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/hatcheries/transactions/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching user transaction history:', error);
    throw error;
  }
};

// Get all transaction history (for admin - all users)
export const getAllTransactionHistory = async (adminId = null) => {
  try {
    const url = adminId
      ? `${API_BASE_URL}/hatcheries/transactions/all?adminId=${adminId}`
      : `${API_BASE_URL}/hatcheries/transactions/all`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching all transaction history:', error);
    throw error;
  }
};