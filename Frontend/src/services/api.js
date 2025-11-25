const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to handle API responses with enhanced error handling
const handleResponse = async (response) => {
  try {
    const data = await response.json();
    if (!response.ok) {
      // Create more specific error messages based on status codes
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
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (error) {
    // Handle JSON parsing errors or network errors
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response format from server');
    }
    throw error;
  }
};

// ==================== USER PROFILE APIs ====================
export const getUserProfile = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    const response = await fetch(`${API_BASE_URL}/user/phone/${phoneNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse(response);
    
    // Ensure user object exists and handle null values properly
    if (result.success && result.user) {
      // The backend should handle null values, but we ensure consistency here
      return result;
    } else {
      throw new Error('Invalid response format: missing user data');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (phoneNumber, profileData) => {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Profile data is required');
    }
    
    // Validate required fields
    if (!profileData.name || !profileData.name.trim()) {
      throw new Error('Name is required and cannot be empty');
    }
    
    const response = await fetch(`${API_BASE_URL}/user/update-phone/${phoneNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    const result = await handleResponse(response);
    
    // Ensure the response contains updated user data
    if (result.success && result.user) {
      return result;
    } else {
      throw new Error('Profile update failed: invalid response format');
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (userId, imageFile) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!imageFile) {
      throw new Error('Image file is required');
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (imageFile.size > maxSize) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }
    
    const formData = new FormData();
    formData.append('userImage', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/user/upload-profile-image/${userId}`, {
      method: 'POST',
      body: formData,
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

// ==================== HATCHERY APIs ====================
export const getUserHatcheries = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const response = await fetch(`${API_BASE_URL}/hatcheries/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching user hatcheries:', error);
    throw error;
  }
};

export const createHatchery = async (hatcheryData) => {
  try {
    if (!hatcheryData || typeof hatcheryData !== 'object') {
      throw new Error('Hatchery data is required');
    }
    
    if (!hatcheryData.userId || !hatcheryData.name || !hatcheryData.startDate || !hatcheryData.endDate) {
      throw new Error('All required fields must be provided: userId, name, startDate, endDate');
    }
    
    const response = await fetch(`${API_BASE_URL}/hatcheries/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hatcheryData),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error creating hatchery:', error);
    throw error;
  }
};

export const deleteHatchery = async (hatcheryId) => {
  try {
    if (!hatcheryId) {
      throw new Error('Hatchery ID is required');
    }
    
    const response = await fetch(`${API_BASE_URL}/hatcheries/delete/${hatcheryId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting hatchery:', error);
    throw error;
  }
};

export const uploadHatcheryImage = async (hatcheryId, imageFile, latitude = null, longitude = null) => {
  try {
    if (!hatcheryId) {
      throw new Error('Hatchery ID is required');
    }

    if (!imageFile) {
      throw new Error('Image file is required');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (imageFile.size > maxSize) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }

    const formData = new FormData();
    formData.append('images', imageFile);

    // Add location data if provided
    if (latitude !== null && longitude !== null) {
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      console.log(`📍 Sending location with upload: ${latitude}, ${longitude}`);
    }

    const response = await fetch(`${API_BASE_URL}/hatcheries/upload-image/${hatcheryId}`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error uploading hatchery image:', error);
    throw error;
  }
};

export const deleteHatcheryImage = async (hatcheryId, imageIndex) => {
  try {
    if (!hatcheryId && hatcheryId !== 0) {
      throw new Error('Hatchery ID is required');
    }

    if (typeof imageIndex === 'undefined' || imageIndex === null) {
      throw new Error('Image index is required');
    }

    const response = await fetch(`${API_BASE_URL}/hatcheries/delete-image/${hatcheryId}/${imageIndex}`, {
      method: 'DELETE',
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting hatchery image:', error);
    throw error;
  }
};

// ==================== HELP MESSAGE APIs ====================

// Send a new help message (User)
export const sendHelpMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/help/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error sending help message:', error);
    throw error;
  }
};

// Get all messages for a specific user
export const getUserHelpMessages = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/help/getMessages/${userId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching user help messages:', error);
    throw error;
  }
};

// Get all help messages (Admin)
export const getAllHelpMessages = async (status = null) => {
  try {
    const url = status
      ? `${API_BASE_URL}/help/getAllMessages?status=${status}`
      : `${API_BASE_URL}/help/getAllMessages`;
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching all help messages:', error);
    throw error;
  }
};

// Reply to a help message (Admin)
export const replyToHelpMessage = async (replyData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/help/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replyData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error replying to help message:', error);
    throw error;
  }
};

// Mark message as resolved (Admin)
export const markHelpMessageAsResolved = async (messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/help/markAsResolved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error marking message as resolved:', error);
    throw error;
  }
};

// Get help message statistics (Admin)
export const getHelpMessageStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/help/stats`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching help message stats:', error);
    throw error;
  }
};
