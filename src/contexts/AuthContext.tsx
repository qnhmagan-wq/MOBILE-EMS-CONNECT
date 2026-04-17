import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
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

const OFF_DUTY_MAX_ATTEMPTS = 3;
const OFF_DUTY_RETRY_DELAY_MS = 500;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Attempt to set the responder off-duty with retries, verifying the backend
 * actually persisted `is_on_duty: false`. Returns true on confirmed success.
 *
 * - 401/403: the session is already gone; treat as success (no further cleanup possible).
 * - BACKEND_500 / network / unverified response: retry with backoff.
 * - All attempts exhausted: return false so the caller can decide how to proceed.
 */
const attemptOffDutyWithRetry = async (): Promise<boolean> => {
  for (let attempt = 1; attempt <= OFF_DUTY_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await dispatchService.updateDutyStatus({
        is_on_duty: false,
        responder_status: 'offline',
      });

      const serverIsOnDuty =
        (response as any)?.status?.is_on_duty ??
        (response as any)?.is_on_duty ??
        (response as any)?.data?.is_on_duty;

      if (serverIsOnDuty === false) {
        console.log(`[AuthContext] Off-duty confirmed by backend (attempt ${attempt})`);
        return true;
      }

      console.warn(
        `[AuthContext] Off-duty response did not confirm is_on_duty:false (attempt ${attempt}):`,
        response
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        console.warn('[AuthContext] Off-duty call unauthorized — session already invalid');
        return true;
      }
      console.warn(
        `[AuthContext] Off-duty attempt ${attempt} failed:`,
        err?.response?.data || err?.message || err
      );
    }

    if (attempt < OFF_DUTY_MAX_ATTEMPTS) {
      await sleep(OFF_DUTY_RETRY_DELAY_MS * attempt);
    }
  }
  return false;
};

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

  const finalizeLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('[AuthContext] authService.logout failed:', err);
    }
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const logout = async (options?: { force?: boolean }) => {
    // Non-responders skip the duty-status dance entirely.
    if (role !== 'responder') {
      await finalizeLogout();
      return;
    }

    const confirmed = await attemptOffDutyWithRetry();
    if (confirmed || options?.force) {
      await finalizeLogout();
      return;
    }

    // Backend never confirmed off-duty. If we clear the token now, the responder
    // will remain visible on the dispatch dashboard. Let the user decide.
    Alert.alert(
      'Could not confirm off-duty',
      'The server did not confirm you went off-duty. You may still appear available on the dispatch dashboard. Log out anyway?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out anyway',
          style: 'destructive',
          onPress: () => {
            // Fire and forget — user chose to proceed despite server state.
            logout({ force: true });
          },
        },
      ]
    );
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
