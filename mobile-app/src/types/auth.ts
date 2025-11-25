// Authentication types
export interface User {
  _id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  assignedAdmin?: string;
  createdAt: string;
  // Profile image
  profileImage?: {
    url: string;
    public_id?: string;
  };
  // Location fields
  country?: string;
  state?: string;
  district?: string;
  pincode?: string;
  address?: string;
  // Seeds information fields
  seedsCount?: number;
  bonus?: number;
  price?: number;
  seedType?: string;
}

export interface Admin {
  _id: string;
  adminId: string;
  name: string;
  username: string;
  phoneNumber: string;
  email?: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  password: string;
  confirmPassword: string;
  assignedAdmin: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  pendingApproval?: boolean;
  notRegistered?: boolean;
  alreadySignedUp?: boolean;
}

export interface AdminsResponse {
  success: boolean;
  admins: Admin[];
}
