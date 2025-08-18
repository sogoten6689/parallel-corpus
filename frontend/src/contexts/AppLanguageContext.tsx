'use client';

import { getProfileMeApi, logInApi, signUpApi } from '@/services/auth/auth-api';
import { setToken } from '@/services/axios';
import { App, message } from 'antd';
import { t } from 'i18next';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppLanguage {
  languagePair: string;
  currentLanguage: string;  
}

interface AppLanguageContextType {
  appLanguage: AppLanguage | null;
  isLoading: boolean;
}

const AppLanguageContext = createContext<AppLanguageContextType | undefined>(undefined);

export const useAppLanguage = () => {
  const context = useContext(AppLanguageContext);
  
  if (context === undefined) {
    throw new Error('useAppLanguage must be used within an AppProvider');
  }
  return context;
};

interface AppLanguageProviderProps {
  children: ReactNode;
}

export const AppLanguageProvider: React.FC<AppLanguageProviderProps> = ({ children }) => {
  const [appLanguage, setAppLanguage] = useState<AppLanguage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAppLanagugeState = () => {
      const appLanguage = localStorage.getItem('appLanaguge');
      if (appLanguage) {
        setAppLanguage(JSON.parse(appLanguage));
      }
      setIsLoading(false);
    };

    checkAppLanagugeState();
  }, []);

    const setLanguageGroup = (languagePair: string) => {
      set
    }

  const value: AppLanguageContextType = {
    appLanguage,
    isLoading,
  };

  return (
    <AppLanguageContext.Provider value={value}>
      {children}
    </AppLanguageContext.Provider>
  );
};
