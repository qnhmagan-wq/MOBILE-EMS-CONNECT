import * as SecureStore from 'expo-secure-store';
import { User, UserRole } from '@/src/types/auth.types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'AUTH_TOKEN',
  USER_DATA: 'USER_DATA',
  USER_ROLE: 'USER_ROLE',
} as const;

export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
};

export const saveUser = async (user: User): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
};

export const getUser = async (): Promise<User | null> => {
  const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

export const saveRole = async (role: UserRole): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, role);
};

export const getRole = async (): Promise<UserRole | null> => {
  return (await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE)) as UserRole | null;
};

export const clearAll = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
};
