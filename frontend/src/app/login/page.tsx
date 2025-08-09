'use client';

import React from 'react';
import { Button, Card, Form, Input, Checkbox, Typography, Divider } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { appRoute } from '@/config/appRoute';
import { useAuth } from '@/contexts/AuthContext';
import useApp from 'antd/es/app/useApp';

const { Title } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const { message } = useApp();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success(t('auth.loginSuccess'));
      router.push(appRoute.home);
    } catch (error) {
      message.error(t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Title level={2}>
            {t('auth.login')}
          </Title>
          <Typography.Text type="secondary">
            {t('welcome')}
          </Typography.Text>
        </div>
        
        <Card className="shadow-lg">
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label={t('auth.email')}
              rules={[
                { required: true, message: t('auth.emailRequired') },
                { type: 'email', message: t('auth.emailInvalid') }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder={t('auth.email')}
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('auth.password')}
              rules={[
                { required: true, message: t('auth.passwordRequired') },
                { min: 6, message: t('auth.passwordMin') }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder={t('auth.password')}
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div className="flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>{t('auth.rememberMe')}</Checkbox>
                </Form.Item>
                <Link href="#" className="text-blue-600 hover:text-blue-500">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </Form.Item>

            <Form.Item className="mb-0">
              <Button 
                type="primary" 
                htmlType="submit" 
                className="w-full"
                loading={loading}
                size="large"
              >
                {t('auth.loginButton')}
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <div className="text-center">
            <Typography.Text type="secondary">
              {t('auth.noAccount')}{' '}
              <Link href={appRoute.signup} className="text-blue-600 hover:text-blue-500 font-medium">
                {t('auth.signup')}
              </Link>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
