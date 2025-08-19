'use client';

import { getProfileMeApi, logInApi, signUpApi } from '@/services/auth/auth-api';
import { setToken } from '@/services/axios';
import { App, message } from 'antd';
import { t } from 'i18next';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppLanguage {
  languagePair: string;
  currentLanguage: string;  
  lang_1: string;
  lang_2: string;
}

interface AppLanguageContextType {
  appLanguage: AppLanguage | null;
  isLoading: boolean;
  setLanguageGroup: (languagePair: string) => void
  setCurrentLanguage: (language: string, appLanguage: AppLanguage) => void
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
      } else {
        setAppLanguage({languagePair: 'en_vi', currentLanguage: 'en', lang_1: 'en', lang_2: 'vi'});
      }
      setIsLoading(false);
    };

    checkAppLanagugeState();
  }, []);

    const setLanguageGroup = (languagePair: string) => {
      const appLanguageState: AppLanguage = {
        languagePair: languagePair,
        currentLanguage: languagePair.split('_')[0], 
        lang_1: languagePair.split('_')[0],
        lang_2: languagePair.split('_')[1]}
      setAppLanguage(appLanguageState);
      localStorage.setItem('appLanaguge', JSON.stringify(appLanguageState));
    }
    const setCurrentLanguage = (language: string, appLanguage: AppLanguage) => {
      setAppLanguage({...appLanguage, currentLanguage: language});
      localStorage.setItem('appLanaguge', JSON.stringify({...appLanguage, currentLanguage: language}));
    }
  const value: AppLanguageContextType = {
    appLanguage,
    isLoading,
    setLanguageGroup,
    setCurrentLanguage,
  };

  return (
    <AppLanguageContext.Provider value={value}>
      {children}
    </AppLanguageContext.Provider>
  );
};
