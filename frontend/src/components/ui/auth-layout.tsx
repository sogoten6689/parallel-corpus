'use client';

import React from 'react';
import { Layout, Typography, Flex, Divider, theme } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '@/app/theme-provider';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './language-switcher';
import Image from 'next/image';

const { Header, Content } = Layout;

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const { mode, toggleTheme } = useTheme();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: colorBgContainer, padding: '0 24px' }}>
        <Flex gap="middle" align="center" style={{ width: '100%' }}>
          {/* Left side - Logo */}
          <Flex gap="middle" align="center" style={{ flex: 1 }}>
            <Image width={32} height={32} src="/CLC_logo.png" alt="logo" />
            <Typography.Text className="font-bold text-xl">
              {t("app_name")}
            </Typography.Text>
          </Flex>
          
          {/* Right side - Controls */}
          <Flex gap="middle" align="center">
            {mode === 'light' ? (
              <SunOutlined onClick={toggleTheme} style={{ fontSize: 20, cursor: 'pointer' }} />
            ) : (
              <MoonOutlined onClick={toggleTheme} style={{ fontSize: 20, cursor: 'pointer' }} />
            )}
            <Divider type="vertical" />
            <LanguageSwitcher />
          </Flex>
        </Flex>
      </Header>
      
      <Content 
        style={{ 
          padding: 0,
          background: mode === 'dark' ? '#1f1f1f' : '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        {children}
      </Content>
    </Layout>
  );
}
