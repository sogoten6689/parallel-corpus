'use client';

import React, { useState } from 'react';
import { Image, Layout, Menu, theme, Typography, Flex, Divider, FloatButton, Drawer, Radio, RadioChangeEvent } from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  FontColorsOutlined,
  InfoOutlined,
  TagOutlined,
  TagsOutlined,
  StockOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
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
  const [open, setOpen] = useState(false);
  const [radioValue, setRadioValue] = useState('1');
  const { t } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  const pathname = usePathname();

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const handleRadioChange = (e: RadioChangeEvent) => {
    setRadioValue(e.target.value);
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuKeyMap: Record<string, string> = {
    '/': '1',
    '/word': '12',
    '/tag': '3',
    '/word-tag': '4',
    '/statistical': '5',
    '/introduction': '6',
  };

  const selectedKey = menuKeyMap[pathname] || '1';

  const TAG_MAP: Record<string, { group: string; label: string }> = {
    "1": { group: "tags.EN_POS", label: "tags.en_pos_tag" },
    "2": { group: "tags.VN_POS", label: "tags.vn_pos_tag" },
    "3": { group: "tags.EN_NER", label: "tags.en_ner_tag" },
    "4": { group: "tags.VN_NER", label: "tags.vn_ner_tag" },
  };

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
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: '1',
              icon: <FontColorsOutlined />,
              label: <Link href="/">{t('home')}</Link>,
            },
            {
              key: '12',
              icon: <SearchOutlined />,
              label: <Link href="/word">{t('word')}</Link>,
            },
            {
              key: '3',
              icon: <TagOutlined />,
              label: <Link href="/tag">{t('tag')}</Link>,
            },
            {
              key: '4',
              icon: <TagsOutlined />,
              label: <Link href="/word-tag">{t('word_tag')}</Link>,
            },
            {
              key: '5',
              icon: <StockOutlined />,
              label: <Link href="/statistical">{t('statistical')}</Link>,
            },
            {
              key: '6',
              icon: <InfoOutlined />,
              label: <Link href="/introduction">{t('introduction')}</Link>,
            },
          ]}
        >
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer }}>
          <Flex gap='middle' align="center" style={{ width: '100%' }}>
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
        <FloatButton icon={<QuestionCircleOutlined />} type="primary" style={{ insetInlineEnd: 24 }} onClick={showDrawer} />
        <Drawer
          title={t('help')}
          closable={{ 'aria-label': 'Close Button' }}
          onClose={onClose}
          open={open}
        >
          <Typography.Title level={5}>{t('select_tag')}</Typography.Title>
          <Radio.Group
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            onChange={handleRadioChange}
            value={radioValue}
          >
            <Radio value="1">{t('tags.en_pos_tag')}</Radio>
            <Radio value="2">{t('tags.vn_pos_tag')}</Radio>
            <Radio value="3">{t('tags.en_ner_tag')}</Radio>
            <Radio value="4">{t('tags.vn_ner_tag')}</Radio>
          </Radio.Group>

          {TAG_MAP[radioValue] && (
            <div style={{ marginTop: 24, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: 8, background: '#f5f5f5' }}>Tag</th>
                    <th style={{ border: '1px solid #ddd', padding: 8, background: '#f5f5f5' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(t(TAG_MAP[radioValue].group, { returnObjects: true }) as Record<string, string>).map(([tag, desc]) => (
                    <tr key={tag}>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{tag}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Drawer>
      </Layout>
    </Layout>
  );
}
