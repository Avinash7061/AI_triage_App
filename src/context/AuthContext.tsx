import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe } from '@/services/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  hospitalId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: string,
    hospitalName?: string,
    hospitalLocation?: string
  ) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mediflow_token');
    if (token) {
      // Set it for the api.ts getHeaders() which reads from 'token'
      localStorage.setItem('token', token);
      apiGetMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('mediflow_token');
          localStorage.removeItem('token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginFn = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem('mediflow_token', data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const registerFn = async (
    email: string,
    password: string,
    name: string,
    role: string,
    hospitalName?: string,
    hospitalLocation?: string
  ) => {
    setError(null);
    try {
      const data = await apiRegister({
        email,
        password,
        name,
        role,
        hospitalName,
        hospitalLocation,
      });
      localStorage.setItem('mediflow_token', data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('mediflow_token');
    localStorage.removeItem('token');
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login: loginFn,
      register: registerFn,
      logout,
      error,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
