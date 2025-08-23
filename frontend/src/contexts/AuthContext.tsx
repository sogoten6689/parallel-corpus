'use client';

import { getProfileMeApi, logInApi, signUpApi } from '@/services/auth/auth-api';
import { setToken } from '@/services/axios';
import { message } from 'antd';
import { t } from 'i18next';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  role: string;
  dateOfBirth: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuthState = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };

    checkAuthState();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      // logIn(email, password);
      const res = await logInApi({email, password});

      if (res.status !== 200 || !res.data.access_token) {
        // throw new Error('Login failed');
        return;
      }


      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);

      const resUser = await getProfileMeApi();
      if (resUser.status !== 200 || !resUser.data) {
        // throw new Error('Get user failed');
        return;
      }


      // Mock user data - replace with actual API response
      const userData: User = {
        id: resUser.data.id,
        email: resUser.data.email,
        fullName: resUser.data.full_name,
        organization: resUser.data.organization,
        role: resUser.data.role,
        dateOfBirth: resUser.data.date_of_birth,
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      // throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 1000));

      const { role, ...rest } = userData;
      const res = await signUpApi(rest);
        console.log(res);
      if (res.status !== 200) {
        
        message.error(t('auth.signupFailed'));
        message.error(res.data.detail);
        // throw new Error('Login failed');
        return { success: false, message: res.data.detail };
      }


      return { success: true, message: t('auth.signupSuccess') };
    } catch (error: any) {
      // throw new Error('Signup failed');
        console.log(error);
      if (error.response.status === 400) {
        return { success: false, message: error.response.data.detail };
      }

      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken('');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
