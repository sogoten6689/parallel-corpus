'use client';

import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.3)',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '32px',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'PC' : 'ParallelCorpus'}
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
                Language: EN
              </div>

              <div style={{ float: 'right', padding: '0 16px' }}>
                Theme: Light
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
