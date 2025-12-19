import api from './api';
import { LoginCredentials, LoginResponse, User } from '@/src/types/auth.types';
import { saveToken, saveUser, saveRole, getUser, clearAll } from './storage.service';

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials);
    const { token, user, role } = response.data;

    await saveToken(token);
    await saveUser(user);
    await saveRole(role);

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
