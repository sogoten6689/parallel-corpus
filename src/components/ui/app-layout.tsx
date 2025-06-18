'use client';

import React, { useState } from 'react';
import { Image, Layout, Menu, theme, Typography } from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  FontColorsOutlined,
  InfoOutlined,
  TagOutlined,
  TagsOutlined,
  StockOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/app/theme-provider';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './language-switcher';
import FileUploader from './file-uploader';

const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { mode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div
          className=' flex items-center justify-center p-2 align-center space-x-2'
        >
          <Image
            width={32}
            height={32}
            src="/hcmus-icon.png"
            alt="logo"
          />
          {!collapsed && <Typography.Text style={{ color: 'white' }} color='white' className='font-bold color-white text-2xl text-white py-2 my-2'>{t("app_name")}</Typography.Text>}
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={
          [
            {
              key: '1',
              icon: <FontColorsOutlined />,
              label: <Link href="/">{t('word')}</Link>,
            },
            {
              key: '2',
              icon: <TagOutlined />,
              label: <Link href="/tag">{t('tag')}</Link>,
            },
            {
              key: '3',
              icon: <TagsOutlined />,
              label: <Link href="/word-tag">{t('word_tag')}</Link>,
            },
            {
              key: '4',
              icon: <StockOutlined />,
              label: <Link href="/statistical">{t('statistical')}</Link>,
            },
            {
              key: '5',
              icon: <InfoOutlined />,
              label: <Link href="/introduction">{t('introduction')}</Link>,
            },
          ]
        }>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div className='flex-end'>

            <div style={{ float: 'right', padding: '0 16px' }}>
              <span
                className="cursor-pointer select-none"
                onClick={toggleTheme}
              >
                {t('toggleTheme')}
              </span>{' '}
              {mode === 'light' ? (
                <SunOutlined onClick={toggleTheme} />
              ) : (
                <MoonOutlined onClick={toggleTheme} />
              )}
            </div>
            <div style={{ float: 'right', padding: '0 16px' }}>
              <LanguageSwitcher />
            </div>
            <div style={{ float: 'right', padding: '0 16px' }}>
              <FileUploader />
            </div>

          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
