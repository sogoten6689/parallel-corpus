'use client';

import React, { useState } from 'react';
import { Image, Layout, Menu, theme, Typography, Flex, Divider } from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  FontColorsOutlined,
  InfoOutlined,
  TagOutlined,
  TagsOutlined,
  StockOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/app/theme-provider';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './language-switcher';
import FileUploader from './file-uploader';
import { usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { mode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();

  // Map routes to menu keys
  const menuKeyMap: Record<string, string> = {
    '/': '1',
    '/word': '12',
    '/tag': '3',
    '/word-tag': '4',
    '/statistical': '5',
    '/introduction': '6',
  };

  // Find the key that matches the current pathname
  const selectedKey = menuKeyMap[pathname] || '1';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="flex items-center justify-center p-2 align-center space-x-2">
          <Image width={32} height={32} src="/CLC_logo.png" alt="logo" />
          {!collapsed && (
            <Typography.Text
              style={{ color: 'white' }}
              className="font-bold text-2xl py-2 my-2"
            >
              {t("app_name")}
            </Typography.Text>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            { key: '1', icon: <FontColorsOutlined />, label: <Link href="/">{t('home')}</Link> },
            { key: '12', icon: <SearchOutlined />, label: <Link href="/word">{t('word')}</Link> },
            { key: '3', icon: <TagOutlined />, label: <Link href="/tag">{t('tag')}</Link> },
            { key: '4', icon: <TagsOutlined />, label: <Link href="/word-tag">{t('word_tag')}</Link> },
            { key: '5', icon: <StockOutlined />, label: <Link href="/statistical">{t('statistical')}</Link> },
            { key: '6', icon: <InfoOutlined />, label: <Link href="/introduction">{t('introduction')}</Link> },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer }}>
          <Flex gap="middle" align="center" style={{ width: '100%' }}>
            <Flex gap="middle" align="center" style={{ flex: 1, justifyContent: 'center' }}>
              <FileUploader />
            </Flex>
            <Flex gap="middle" align="center" style={{ justifyContent: 'flex-end', marginRight: 20 }}>
              {mode === 'light' ? (
                <SunOutlined onClick={toggleTheme} style={{ fontSize: 20, verticalAlign: 'middle' }} />
              ) : (
                <MoonOutlined onClick={toggleTheme} style={{ fontSize: 20, verticalAlign: 'middle' }} />
              )}
              <Divider type="vertical" />
              <LanguageSwitcher />
            </Flex>
          </Flex>
        </Header>
        <Content style={{ margin: '16px' }}>
          {children}
        </Content>
        {/* Thêm footer */}
        <div
          id="footer"
          className="footer fixed-bottom"
          style={{
            backgroundColor: mode === 'dark' ? '#333' : 'aliceblue', // Thay đổi màu theo chế độ
            color: mode === 'dark' ? '#fff' : '#222', // Thay đổi màu chữ theo chế độ
            padding: '20px 5%',
            textAlign: 'center',
          }}
        >
          <p>
            Công trình này được thực hiện bởi một số học viên cao học và giảng viên
            <a target="_blank" href="https://www.fit.hcmus.edu.vn"> Khoa Công nghệ Thông tin</a> và
            <a target="_blank" href="https://www.clc.hcmus.edu.vn/"> Trung tâm Ngôn ngữ học Tính toán</a> thuộc
            <a target="_blank" href="https://www.hcmus.edu.vn/"> Trường ĐH Khoa học Tự nhiên - ĐHQG - HCM</a> trong khuôn khổ đề tài nghiên cứu khoa học của
            <a target="_blank" href="https://dost.hochiminhcity.gov.vn"> Sở Khoa học & Công nghệ TpHCM</a>.
          </p>
        </div>
      </Layout>
    </Layout>
  );
}
