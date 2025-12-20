import api from './api';
import { 
  LoginCredentials, 
  LoginResponse, 
  SignupCredentials, 
  SignupResponse, 
  VerificationCredentials,
  VerificationResponse,
  ResendVerificationCredentials,
  User 
} from '@/src/types/auth.types';
import { saveToken, saveUser, saveRole, getUser, clearAll } from './storage.service';

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { token, user, role } = response.data;

    await saveToken(token);
    await saveUser(user);
    await saveRole(role);

    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const signup = async (credentials: SignupCredentials): Promise<SignupResponse> => {
  try {
    const response = await api.post<SignupResponse>('/auth/signup', credentials);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const verifyEmail = async (credentials: VerificationCredentials): Promise<VerificationResponse> => {
  try {
    const response = await api.post<VerificationResponse>('/auth/verify-email', credentials);
    const { token, user, role } = response.data;

    await saveToken(token);
    await saveUser(user);
    await saveRole(role);

    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const resendVerificationCode = async (credentials: ResendVerificationCredentials): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>('/auth/resend-verification', credentials);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  await clearAll();
};

export const getCurrentUser = async (): Promise<User | null> => {
  return await getUser();
};
