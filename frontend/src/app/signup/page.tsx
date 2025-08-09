'use client';

import React from 'react';
import { Button, Card, Form, Input, Typography, Divider, DatePicker } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ClockCircleOutlined, BankOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { appRoute } from '@/config/appRoute';
import { useAuth } from '@/contexts/AuthContext';
import dayjs, { Dayjs } from 'dayjs';
import useApp from 'antd/es/app/useApp';

const { Title } = Typography;

interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organization: string;
  dateOfBirth: Date;
}

export default function SignupPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const { message } = useApp(); 

  const onFinish = async (values: SignupFormValues) => {
    setLoading(true);
    try {

      const { confirmPassword, ...signupData } = values;
      const dob = signupData.dateOfBirth ? signupData.dateOfBirth.toISOString().split('T')[0] : null // YYYY-MM-DD

      if (!dob || !dayjs(dob).isValid()) {
        // throw new Error('Date of birth is required');
        message.error('Date of birth is required');
        return;
      }
      const res = await signup({ ...signupData, dateOfBirth: dob ?? '', role: "user" });
      console.log(res);
      
      if (!res.success) {
        message.error(res.message);
      } else {
        message.success(t('auth.signupSuccess'));
        router.push(appRoute.login);
      }
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
            <Form.Item
              name="fullName"
              label={t('auth.fullName')}
              rules={[
                { required: true, message: t('auth.fullNameRequired') }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t('auth.firstName')}
                autoComplete="given-name"
              />
            </Form.Item>

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
              name="organization"
              label={t('auth.organization')}
              rules={[
                { required: true, message: t('auth.organizationRequired') }
              ]}
            >
              <Input
                prefix={<BankOutlined />}
                placeholder={t('auth.organization')}
                autoComplete="organization"
              />
            </Form.Item>

            <Form.Item
              name="dateOfBirth"
              label={t('auth.birthday')}
              rules={[
                { required: true, message: t('auth.birthdayRequired') }
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder={t('auth.birthday')}
                prefix={<ClockCircleOutlined />}
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
