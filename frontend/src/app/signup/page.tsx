'use client';

import React from 'react';
import { Button, Card, Form, Input, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { appRoute } from '@/config/appRoute';
import { useAuth } from '@/contexts/AuthContext';

const { Title } = Typography;

interface SignupFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      const { confirmPassword, ...signupData } = values;
      await signup(signupData);
      message.success(t('auth.signupSuccess'));
      router.push(appRoute.login);
    } catch (error) {
      message.error(t('auth.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Title level={2}>
            {t('auth.signup')}
          </Title>
          <Typography.Text type="secondary">
            {t('welcome')}
          </Typography.Text>
        </div>
        
        <Card className="shadow-lg">
          <Form
            form={form}
            name="signup"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="firstName"
                label={t('auth.firstName')}
                rules={[
                  { required: true, message: t('auth.firstNameRequired') }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder={t('auth.firstName')}
                  autoComplete="given-name"
                />
              </Form.Item>

              <Form.Item
                name="lastName"
                label={t('auth.lastName')}
                rules={[
                  { required: true, message: t('auth.lastNameRequired') }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder={t('auth.lastName')}
                  autoComplete="family-name"
                />
              </Form.Item>
            </div>

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
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t('auth.confirmPassword')}
              dependencies={['password']}
              rules={[
                { required: true, message: t('auth.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('auth.passwordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder={t('auth.confirmPassword')}
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button 
                type="primary" 
                htmlType="submit" 
                className="w-full"
                loading={loading}
                size="large"
              >
                {t('auth.signupButton')}
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <div className="text-center">
            <Typography.Text type="secondary">
              {t('auth.haveAccount')}{' '}
              <Link href={appRoute.login} className="text-blue-600 hover:text-blue-500 font-medium">
                {t('auth.login')}
              </Link>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
