// API Configuration
// ✅ Updated with your computer's actual WiFi IP address: 192.168.0.108
// Both your phone and computer MUST be on the same WiFi network
export const API_BASE_URL = 'http://192.168.1.6:3000/api';

export const API_ENDPOINTS = {
  AUTH: {
    USER_LOGIN: '/Auth/User-login',
    USER_SIGNUP: '/Auth/User-signup',
    ADMIN_LOGIN: '/Auth/Admin-login',
    ADMIN_SIGNUP: '/adminActions/admin-signup',
    GET_ADMINS: '/Auth/admins',
  },
  USER: {
    GET_PROFILE: (phoneNumber: string) => `/user/phone/${phoneNumber}`,
    UPDATE_PROFILE: (userId: string) => `/user/update/${userId}`,
    UPLOAD_IMAGE: (userId: string) => `/user/upload-profile-image/${userId}`,
  },
  HATCHERY: {
    GET_USER_HATCHERIES: (userId: string) => `/hatcheries/user/${userId}`,
    CREATE: '/hatcheries/create',
    DELETE: (hatcheryId: string) => `/hatcheries/delete/${hatcheryId}`,
  },
};
