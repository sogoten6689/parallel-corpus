'use client';

import React, { useState } from 'react';
import { Image, Layout, Menu, theme, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  HomeOutlined,
  BulbOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/app/ThemeProvider';

const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { mode, toggleTheme } = useTheme();
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div
          className=' flex items-center justify-center  p-4 align-center space-x-4'
          // style={{ display: 'flex' }}
        >
          <Image 
            width={32}
            height={32}
            src="/hcmus-icon.png"
            alt="logo"
          />
          {!collapsed && <Typography.Text style={{ color: 'white' }} color='white' className='font-bold color-white text-2xl text-white py-2 my-2'>Parallel Corpus</Typography.Text>}
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={
          [
            {
              key: '1',
              icon: <HomeOutlined />,
              label: <Link href="/">Home</Link>,
            },
            {
              key: '2',
              icon: <UserOutlined />,
              label: <Link href="/about">About</Link>,
            },
          ]
        }>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div className='flex-end'>
              
              <div style={{ float: 'right', padding: '0 16px' }}>
                Theme: {mode === 'light' ? <SunOutlined onClick={toggleTheme} /> : <MoonOutlined onClick={toggleTheme} />}
              </div>
              <div style={{ float: 'right', padding: '0 16px' }}>
                Language: EN
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
