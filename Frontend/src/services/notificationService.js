const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Handle API responses
const handleResponse = async (response) => {
  // Check content type
  const contentType = response.headers.get('content-type');

  // If response is not JSON, throw error
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Server error: Expected JSON but got ${contentType}. Status: ${response.status}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

// ==================== ADMIN NOTIFICATION APIs ====================

/**
 * Send broadcast notification (Admin only)
 * @param {Object} notificationData - { target, region, district, userIds, type, priority, message }
 */
export const sendBroadcastNotification = async (notificationData) => {
  const response = await fetch(`${API_BASE_URL}/notifications/admin/broadcast`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(notificationData),
  });
  return handleResponse(response);
};

/**
 * Get notification history (Admin only)
 */
export const getNotificationHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/admin/history`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Get latest public admin notification (No auth required - for user dashboard)
 */
export const getLatestPublicNotification = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/latest-public`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

// ==================== USER NOTIFICATION APIs ====================

/**
 * Get all notifications for a user
 * @param {string} userId - User ID
 */
export const getUserNotifications = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Get unread notifications for a user
 * @param {string} userId - User ID
 */
export const getUnreadNotifications = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Get notification count (total and unread)
 * @param {string} userId - User ID
 */
export const getNotificationCount = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/count/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification ID
 */
export const markAsRead = async (notificationId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/mark-read/${notificationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 */
export const markAllAsRead = async (userId) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  return handleResponse(response);
};

/**
 * Delete a single notification
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = async (notificationId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/delete/${notificationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Delete all notifications for a user
 * @param {string} userId - User ID
 */
export const deleteAllNotifications = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/delete-all/${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

// ==================== STORY/STATUS APIs ====================

/**
 * Get active stories for a user
 * @param {string} userId - User ID
 */
export const getActiveStories = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/stories`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Get admin's active stories (Admin only)
 */
export const getAdminStories = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/admin/stories`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Delete admin story (Admin only)
 * @param {string} storyId - Story/notification ID
 */
export const deleteAdminStory = async (storyId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/admin/story/${storyId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Send broadcast notification with media files (stories)
 * @param {FormData} formData - Form data with files and notification details
 */
export const sendBroadcastNotificationWithMedia = async (formData) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/notifications/admin/broadcast`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it with boundary
    },
    body: formData,
  });
  return handleResponse(response);
};
