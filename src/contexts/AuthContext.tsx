import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthContextType,
  User,
  UserRole,
  LoginCredentials,
  LoginResponse,
  FirstLoginVerificationResponse,
  SignupCredentials,
  VerificationCredentials,
  ResendVerificationCredentials
} from '@/src/types/auth.types';
import * as authService from '@/src/services/auth.service';
import * as dispatchService from '@/src/services/dispatch.service';
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

  const login = async (credentials: LoginCredentials): Promise<LoginResponse | FirstLoginVerificationResponse> => {
    try {
      const response = await authService.login(credentials);

      // First-login verification — don't set auth state (no token yet)
      if ('requires_verification' in response && response.requires_verification) {
        return response;
      }

      // Normal login — set auth state
      const loginResponse = response as LoginResponse;
      setToken(loginResponse.token);
      setUser(loginResponse.user);
      setRole(loginResponse.role);
      return loginResponse;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      await authService.signup(credentials);
      // Don't set auth state here - wait for email verification
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (credentials: VerificationCredentials) => {
    try {
      const response = await authService.verifyEmail(credentials);
      setToken(response.token);
      setUser(response.user);
      setRole(response.role);
    } catch (error) {
      throw error;
    }
  };

  const resendVerificationCode = async (credentials: ResendVerificationCredentials) => {
    try {
      await authService.resendVerificationCode(credentials);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Defense in depth: if the user is a responder, explicitly go off-duty
      // before clearing auth. The token is still valid at this point, so the
      // API call can authenticate. The server-side logout also handles this
      // as a fallback, but calling it here ensures cleanup even if logout
      // is interrupted.
      if (role === 'responder') {
        try {
          await dispatchService.updateDutyStatus({
            is_on_duty: false,
            responder_status: 'offline',
          });
          console.log('[AuthContext] Responder set to off-duty before logout');
        } catch (offDutyError) {
          // Don't block logout — server-side logout handles this as fallback
          console.warn('[AuthContext] Failed to go off-duty before logout (proceeding anyway):', offDutyError);
        }
      }

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
    signup,
    verifyEmail,
    resendVerificationCode,
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
