import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi, profileApi } from '../services/api';
import { logger } from '../utils/logger';

const log = logger.withModule('Auth');

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  googleLogin: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'ctrllink_token';
const USER_KEY = 'ctrllink_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const profile = await profileApi.getProfile();
      setUser((prev) => {
        if (!prev) return null;
        const updated: User = {
          ...prev,
          name: profile.name,
          email: profile.email,
          emailVerified: profile.emailVerified,
          profilePictureUrl: profile.profilePictureUrl || prev.profilePictureUrl,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      log.warn('Could not refresh profile:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUserStr = localStorage.getItem(USER_KEY);

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr) as User;
        setUser({
          ...parsedUser,
          token: savedToken,
        });

        // Silently refresh profile in background
        profileApi.getProfile()
          .then((profile) => {
            setUser((curr) => {
              if (!curr) return null;
              const fresh: User = {
                ...curr,
                name: profile.name,
                email: profile.email,
                emailVerified: profile.emailVerified,
                profilePictureUrl: profile.profilePictureUrl || curr.profilePictureUrl,
              };
              localStorage.setItem(USER_KEY, JSON.stringify(fresh));
              return fresh;
            });
          })
          .catch(() => {
            // Backend might be offline or token expired
          });
      }
    } catch (e) {
      log.error('Failed to parse stored user data:', e);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = (token: string, email: string, name: string): User => {
    const newUser: User = { token, email, name };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);

    // Fetch initial profile
    profileApi.getProfile()
      .then((profile) => {
        setUser((curr) => {
          if (!curr) return null;
          const fresh: User = {
            ...curr,
            profilePictureUrl: profile.profilePictureUrl || undefined,
            emailVerified: profile.emailVerified,
          };
          localStorage.setItem(USER_KEY, JSON.stringify(fresh));
          return fresh;
        });
      })
      .catch(() => {});

    return newUser;
  };

  const login = async (credentials: LoginRequest): Promise<User> => {
    const res = await authApi.login(credentials);
    return handleAuthSuccess(res.token, res.email, res.name);
  };

  const register = async (data: RegisterRequest): Promise<User> => {
    const res = await authApi.register(data);
    return handleAuthSuccess(res.token, res.email, res.name);
  };

  const googleLogin = async (idToken: string): Promise<User> => {
    const res = await authApi.googleLogin({ idToken });
    return handleAuthSuccess(res.token, res.email, res.name);
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
