import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ems_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ems_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const refreshUser = async () => {
    try {
      if (!token) return;
      const res = await authApi.me();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('ems_user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          await refreshUser();
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const res = await authApi.login(credentials);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('ems_token', res.token);
        localStorage.setItem('ems_user', JSON.stringify(res.user));
        toast.success(`Welcome back, ${res.user.employee?.firstName || res.user.email}!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (targetRole: Role) => {
    try {
      setIsLoading(true);
      const res = await authApi.demoLogin(targetRole);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('ems_token', res.token);
        localStorage.setItem('ems_user', JSON.stringify(res.user));
        toast.success(`Switched role to ${targetRole} (${res.user.email})`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    toast.info('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        demoLogin,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
