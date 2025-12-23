import api from './api';
import { User } from '@/src/types/auth.types';
import { saveUser } from './storage.service';

export interface UserProfile extends User {
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email_verified_at?: string;
  created_at?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
}

/**
 * Get the current user's profile
 * GET /api/user
 */
export const getProfile = async (): Promise<UserProfile> => {
  try {
    const response = await api.get<UserProfile>('/user');
    return response.data;
  } catch (error: any) {
    console.error('[User Service] Get profile error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update the current user's profile
 * PUT /api/user/profile
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
  try {
    const response = await api.put<UpdateProfileResponse>('/user/profile', data);
    
    // Update local storage with new user data
    if (response.data.user) {
      await saveUser(response.data.user);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[User Service] Update profile error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Change password
 * PUT /api/user/password
 */
export const changePassword = async (data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> => {
  try {
    const response = await api.put<{ message: string }>('/user/password', data);
    return response.data;
  } catch (error: any) {
    console.error('[User Service] Change password error:', error.response?.data || error.message);
    throw error;
  }
};




