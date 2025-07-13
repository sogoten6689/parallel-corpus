'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en', // Ngôn ngữ mặc định
    fallbackLng: 'en', // Ngôn ngữ dự phòng
    supportedLngs: ['en', 'vi'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React đã xử lý XSS
    },
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
  });

export default i18n;