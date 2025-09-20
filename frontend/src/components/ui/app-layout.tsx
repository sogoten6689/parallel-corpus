'use client';

import React, { useState, useEffect } from 'react';
import { Image, Layout, Menu, theme, Typography, Flex, Divider, FloatButton, Drawer, Radio, RadioChangeEvent, Button, Dropdown, Avatar, Space, Switch } from 'antd';
import type { MenuProps } from 'antd';
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
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  AccountBookOutlined,
  DownOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useTheme } from '@/app/theme-provider';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './language-switcher';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { appRoute } from '@/config/appRoute';
import { getKeyName } from '../helper/helper-ui';
import { useAppLanguage } from '@/contexts/AppLanguageContext';
import FileUploaderMaster from './file-uploader-master';

const { Header, Sider, Content } = Layout;


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [radioValue, setRadioValue] = useState('1');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const { t } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { appLanguage, setLanguageGroup, setCurrentLanguage } = useAppLanguage();

  // Handle window resize for responsive drawer width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const showHelpDrawer = () => {
    setOpen(true);
  };

  const onHelpDrawerClose = () => {
    setOpen(false);
  };

  const showMenuDrawer = () => {
    setMenuDrawerOpen(true);
  };

  const onMenuDrawerClose = () => {
    setMenuDrawerOpen(false);
  };

  const handleRadioChange = (e: RadioChangeEvent) => {
    setRadioValue(e.target.value);
  };

  const handleLogout = () => {
    logout();
    router.push(appRoute.home);
  };

  const handleMyProfile = () => {
    router.push(appRoute.myProfile);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: handleMyProfile,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout') || 'Logout',
      onClick: handleLogout,
    },
  ];

  const handleSetLanguageGroup = (languageGroup: string) => {
    // Implementation for setting language group
    setLanguageGroup(languageGroup);
  };

  const languageGroupItems = [
    {
      key: 'vi_en',
      label: t('vi_en'),
      onClick: () => {
        handleSetLanguageGroup('vi_en');
      },
    },
    {
      key: 'vi_zh',
      label: t('vi_zh'),
      onClick: () => {
        handleSetLanguageGroup('vi_zh');
      },
    },
    {
      key: 'vi_ja',
      label: t('vi_ja'),
      onClick: () => {
        handleSetLanguageGroup('vi_ja');
      },
    },
    {
      key: 'vi_ru',
      label: t('vi_ru'),
      onClick: () => {
        handleSetLanguageGroup('vi_ru');
      },
    },

    {
      key: 'vi_ko',
      label: t('vi_ko'),
      onClick: () => {
        handleSetLanguageGroup('vi_ko');
      },
    },
  ];

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuKeyMap: Record<string, string> = {
    '/': '1',
    // Fix: incorrect key '12' prevented highlighting the Word menu item
    '/word': '2',
    '/tag': '3',
    '/word-tag': '4',
    '/statistical': '5',
    '/introduction': '7',
    '/users': '6',
    '/my-profile': '8',
    '/my-word': '9',
  };

  const selectedKey = menuKeyMap[pathname] || '1';

  const TAG_MAP: Record<string, { group: string; label: string }> = {
    "1": { group: "tags.EN_POS", label: "tags.en_pos_tag" },
    "2": { group: "tags.VN_POS", label: "tags.vn_pos_tag" },
    "3": { group: "tags.EN_NER", label: "tags.en_ner_tag" },
    "4": { group: "tags.VN_NER", label: "tags.vn_ner_tag" },
  };

  const handleSwitch = () => {
    const currentLanguage = appLanguage?.lang_1 === appLanguage?.currentLanguage ? appLanguage?.lang_2 : appLanguage?.lang_1;
    setCurrentLanguage(currentLanguage ?? 'en', appLanguage ?? { languagePair: 'en_vi', currentLanguage: 'en', lang_1: 'en', lang_2: 'vi' });
  };
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
          defaultOpenKeys={['mgmt']}
          items={(function (): MenuProps['items'] {
            const base: Exclude<MenuProps['items'], undefined> = [
              { key: '1', icon: <FontColorsOutlined />, label: <Link href="/">{t('home')}</Link> },
              { key: '2', icon: <SearchOutlined />, label: <Link href="/word">{t('menu_word')}</Link> },
              { key: '3', icon: <TagOutlined />, label: <Link href="/tag">{t('menu_tag')}</Link> },
              { key: '4', icon: <TagsOutlined />, label: <Link href="/word-tag">{t('menu_word_tag')}</Link> },
              { key: '5', icon: <StockOutlined />, label: <Link href="/statistical">{t('statistical')}</Link> },
              { key: '7', icon: <InfoOutlined />, label: <Link href="/introduction">{t('introduction')}</Link> },
              // user?.id ? { key: '9', icon: <UserOutlined />, label: <Link href="/my-word">{t('my_word')}</Link> } : null,
            ];
            const mgmtChildren: Exclude<MenuProps['items'], undefined> = [
              user?.role === 'admin' ? { key: '6', icon: <SettingOutlined />, label: <Link href="/users">{t('user')}</Link> } : null,
              user?.id ? { key: '8', icon: <AccountBookOutlined />, label: <Link href="/my-profile">{t('profile')}</Link> } : null,
            ].filter((i): i is NonNullable<typeof i> => i !== null);
            if (mgmtChildren.length > 0) {
              base.splice(5, 0, { key: 'mgmt', icon: <SettingOutlined />, label: <span>{t('management')}</span>, children: mgmtChildren });
            }
            return base;
          })()}
        />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer, padding: '0 16px' }}>
          <Flex align="center" justify="flex-end" style={{ width: '100%', height: '100%' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={showMenuDrawer}
              style={{ fontSize: '18px', padding: '8px' }}
              aria-label="Open menu"
            />
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

        {/* Menu Drawer */}
        <Drawer
          title={t('menu')}
          placement="right"
          closable={{ 'aria-label': 'Close Menu' }}
          onClose={onMenuDrawerClose}
          open={menuDrawerOpen}
          width={windowWidth > 768 ? 400 : windowWidth > 480 ? '90vw' : '95vw'}
          styles={{
            body: { padding: '16px' },
            header: { paddingBottom: '12px' }
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: windowWidth > 480 ? '24px' : '16px' }}>
            {/* Language Settings Section */}
            <div>
              <Typography.Title level={5} style={{ marginBottom: '12px', fontSize: windowWidth > 480 ? '16px' : '14px' }}>
                {t("language_settings")}
              </Typography.Title>

              {/* 2 cột 1 dòng cho Language Pair và Current Language */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexDirection: windowWidth > 600 ? 'row' : 'column' }}>
                {/* Language Pair Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography.Text className="font-semibold" style={{ display: 'block', marginBottom: '8px', fontSize: windowWidth > 480 ? '14px' : '12px' }}>
                    {t("language_pair")}:
                  </Typography.Text>
                  <Dropdown menu={{ items: languageGroupItems }} trigger={['click']} placement="bottomLeft">
                    <Button style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: windowWidth > 480 ? '14px' : '12px' }}>
                      {appLanguage?.languagePair ? t(appLanguage?.languagePair) : t('en_vi')}
                      <DownOutlined />
                    </Button>
                  </Dropdown>
                </div>

                {/* Current Language Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography.Text className="font-semibold" style={{ display: 'block', marginBottom: '8px', fontSize: windowWidth > 480 ? '14px' : '12px' }}>
                    {t("current_language")}:
                  </Typography.Text>
                  <Switch
                    checked={appLanguage?.lang_1 === appLanguage?.currentLanguage}
                    onChange={handleSwitch}
                    checkedChildren={appLanguage?.lang_1 === appLanguage?.currentLanguage ? t(appLanguage?.lang_1 ?? "null") : t("null")}
                    unCheckedChildren={appLanguage?.lang_2 === appLanguage?.currentLanguage ? t(appLanguage?.lang_2 ?? "null") : t("null")}
                    size={windowWidth > 480 ? 'default' : 'small'}
                  />
                </div>
              </div>

              {/* Interface Language - riêng biệt */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography.Text className="font-semibold" style={{ display: 'block', marginBottom: '8px', fontSize: windowWidth > 480 ? '14px' : '12px' }}>
                  {t("interface_language")}:
                </Typography.Text>
                <LanguageSwitcher />
              </div>
            </div>

            <Divider style={{ margin: '0' }} />

            {/* Theme & Tools Section */}
            <div>
              <Typography.Title level={5} style={{ marginBottom: '12px', fontSize: windowWidth > 480 ? '16px' : '14px' }}>
                {t("settings")}
              </Typography.Title>

              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                <Typography.Text style={{ fontSize: windowWidth > 480 ? '14px' : '12px' }}>{t("theme")}:</Typography.Text>
                <Button
                  type="text"
                  onClick={toggleTheme}
                  icon={mode === 'light' ? <SunOutlined /> : <MoonOutlined />}
                  size={windowWidth > 480 ? 'middle' : 'small'}
                  style={{ fontSize: windowWidth > 480 ? '14px' : '12px' }}
                >
                  {mode === 'light' ? t('light_mode') : t('dark_mode')}
                </Button>
              </div>

              {user?.role === 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                  <Typography.Text style={{ display: 'block', marginBottom: '8px', fontSize: windowWidth > 480 ? '14px' : '12px', textAlign: 'center' }}>
                    {t("admin_tools")}:
                  </Typography.Text>
                  <FileUploaderMaster />
                </div>
              )}
            </div>

            <Divider style={{ margin: '0' }} />

            {/* User Section */}
            <div>
              <Typography.Title level={5} style={{ marginBottom: '12px', fontSize: windowWidth > 480 ? '16px' : '14px' }}>
                {t("account")}
              </Typography.Title>

              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <Flex align="center" gap="middle">
                    <Avatar icon={<UserOutlined />} size={windowWidth > 480 ? 'default' : 'small'} />
                    <Typography.Text strong style={{ fontSize: windowWidth > 480 ? '14px' : '12px' }}>
                      {getKeyName(user?.fullName ?? "Unknown")}
                    </Typography.Text>
                  </Flex>

                  <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                      type="text"
                      icon={<UserOutlined />}
                      onClick={handleMyProfile}
                      style={{ fontSize: windowWidth > 480 ? '14px' : '12px' }}
                      size={windowWidth > 480 ? 'middle' : 'small'}
                    >
                      {t('profile')}
                    </Button>
                    <Button
                      type="text"
                      icon={<SettingOutlined />}
                      style={{ fontSize: windowWidth > 480 ? '14px' : '12px' }}
                      size={windowWidth > 480 ? 'middle' : 'small'}
                    >
                      {t('settings')}
                    </Button>
                    <Button
                      type="text"
                      icon={<LogoutOutlined />}
                      onClick={handleLogout}
                      style={{ color: '#ff4d4f', fontSize: windowWidth > 480 ? '14px' : '12px' }}
                      size={windowWidth > 480 ? 'middle' : 'small'}
                    >
                      {t('auth.logout')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href={appRoute.login}>
                    <Button
                      type="text"
                      icon={<LoginOutlined />}
                      style={{ fontSize: windowWidth > 480 ? '14px' : '12px' }}
                      size={windowWidth > 480 ? 'middle' : 'small'}
                    >
                      {t('auth.login')}
                    </Button>
                  </Link>
                  <Link href={appRoute.signup}>
                    <Button
                      type="primary"
                      icon={<UserOutlined />}
                      style={{ fontSize: windowWidth > 480 ? '14px' : '12px' }}
                      size={windowWidth > 480 ? 'middle' : 'small'}
                    >
                      {t('auth.signup')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Drawer>

        <FloatButton icon={<QuestionCircleOutlined />} type="primary" style={{ insetInlineEnd: 24 }} onClick={showHelpDrawer} />
        <Drawer
          title={t('help')}
          closable={{ 'aria-label': 'Close Button' }}
          onClose={onHelpDrawerClose}
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
