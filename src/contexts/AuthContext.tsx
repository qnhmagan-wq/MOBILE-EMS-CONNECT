import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, UserRole, LoginCredentials } from '@/src/types/auth.types';
import * as authService from '@/src/services/auth.service';
import { getToken, getUser, getRole } from '@/src/services/storage.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = await getToken();
      const storedUser = await getUser();
      const storedRole = await getRole();

      if (storedToken && storedUser && storedRole) {
        setToken(storedToken);
        setUser(storedUser);
        setRole(storedRole);
      }
    } catch (error) {
      console.error('Failed to restore auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.user);
      setRole(response.role);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    restoreAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    role,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    restoreAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
