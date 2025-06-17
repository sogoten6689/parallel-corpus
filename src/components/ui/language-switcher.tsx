'use client';

import { Select } from 'antd';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <Select
      defaultValue={i18n.language}
      value={i18n.language}
      onChange={(lang) => i18n.changeLanguage(lang)}
      style={{ width: 120 }}
      options={languages}
    />
  );
}
