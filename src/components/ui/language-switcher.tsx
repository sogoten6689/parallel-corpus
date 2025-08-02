'use client';

import { Dropdown, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { GlobalOutlined } from '@ant-design/icons';

const languages = [
  { key: 'en', label: 'English' },
  { key: 'vi', label: 'Tiếng Việt' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const items = languages.map((lang) => ({
    key: lang.key,
    label: lang.label,
    onClick: () => i18n.changeLanguage(lang.key)
  }));

  const getCurrentLanguageLabel = () => {
    return languages.find(lang => lang.key === i18n.language)?.label || 'English';
  };

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
    >
      <a onClick={(e) => e.preventDefault()}>
        <Space className="cursor-pointer">
          <GlobalOutlined />
          {getCurrentLanguageLabel()}
        </Space>
      </a>
    </Dropdown>
  );
}
