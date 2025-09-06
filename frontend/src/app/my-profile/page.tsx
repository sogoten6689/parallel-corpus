'use client';
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAppLanguage } from "@/contexts/AppLanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileMeApi, updateProfileMeApi, UserProfile } from "@/services/auth/auth-api";
import useApp from "antd/es/app/useApp";
import { useRouter } from "next/navigation";
import { appRoute } from "@/config/appRoute";
import { Card, Form, Input, DatePicker, Button, Avatar, Space, Typography, Skeleton, Divider, ConfigProvider } from "antd";
import { UserOutlined, SaveOutlined } from "@ant-design/icons";
import type { AxiosError } from 'axios';
import dayjs from "dayjs";
import { getMachineLocale } from "@/dao/utils";
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

export default function Home() {
  const { message } = useApp();
  const { t } = useTranslation();
  const { appLanguage, setCurrentLanguage } = useAppLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Only decide redirect after auth loading is finished
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(appRoute.home); // or appRoute.login if you prefer
    }
  }, [isLoading, user, router]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // profile loading
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch profile only when user is available
  useEffect(() => {
    if (!user) return;
    getProfileMeApi()
      .then((res) => {
        const p = res?.data; // user object
        if (p) setProfile(p);
      })
      .finally(() => setLoading(false));
  }, [user, form]);

  // Populate form values only after loading finished and form is mounted
  useEffect(() => {
    if (!loading && profile) {
      form.setFieldsValue({
        email: profile.email,
        full_name: profile.full_name,
        organization: profile.organization,
        date_of_birth: profile.date_of_birth ? dayjs(profile.date_of_birth) : undefined,
      });
    }
  }, [loading, profile, form]);

  const onFinish = async (values: any) => {
    if (!profile) return;
    setSaving(true);
    try {
      const payload = {
        full_name: (values.full_name ?? profile.full_name)?.trim(),
        // Backend expects a plain date (pydantic date), not ISO datetime
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format('YYYY-MM-DD')
          : (profile.date_of_birth ? dayjs(profile.date_of_birth).format('YYYY-MM-DD') : ''),
        organization: (values.organization ?? profile.organization) || '',
      };
      const res = await updateProfileMeApi(payload);
      if (res.status !== 200) {
        message.error(t('edit_failed'));
      } else {
        message.success(t('edit_success'));
        // Backend returns { message, data: {...user} } while GET /me returns user directly
        const updatedWrapper = res.data;
        const updatedUser = updatedWrapper?.data ? updatedWrapper.data : updatedWrapper;
        try {
          const fresh = await getProfileMeApi();
          const freshUser = fresh.data; // /me returns user fields directly
          setProfile(freshUser);
          form.setFieldsValue({
            email: freshUser.email,
            full_name: freshUser.full_name,
            organization: freshUser.organization,
            date_of_birth: freshUser.date_of_birth ? dayjs(freshUser.date_of_birth) : undefined,
          });
          // sync localStorage user if exists (shape expected by AuthContext)
          localStorage.setItem('user', JSON.stringify({
            id: freshUser.id,
            email: freshUser.email,
            fullName: freshUser.full_name,
            organization: freshUser.organization,
            role: freshUser.role,
            dateOfBirth: freshUser.date_of_birth,
          }));
        } catch (e) {
          // fallback to optimistic updatedUser if refetch fails
          if (updatedUser) {
            setProfile(updatedUser);
            form.setFieldsValue({
              email: updatedUser.email,
              full_name: updatedUser.full_name,
              organization: updatedUser.organization,
              date_of_birth: updatedUser.date_of_birth ? dayjs(updatedUser.date_of_birth) : undefined,
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      const axiosErr = err as AxiosError<any>;
      if (axiosErr?.response?.status === 422) {
        const detail = axiosErr.response?.data?.detail;
        message.error(detail ? `Validation error: ${JSON.stringify(detail)}` : 'Validation error (422)');
      } else {
        message.error(t('edit_failed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const initialDob = profile?.date_of_birth ? dayjs(profile.date_of_birth) : null;

  const machineLocale = getMachineLocale('en');
  const localeCode = appLanguage?.currentLanguage ? (appLanguage.currentLanguage === 'vi' ? 'vi' : 'en') : machineLocale;
  dayjs.locale(localeCode);
  const dateFormat = localeCode === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD';

  if (isLoading || loading) {
    return (
      <ConfigProvider locale={localeCode === 'vi' ? viVN : enUS}>
        <Card style={{ maxWidth: 640, margin: '48px auto' }}>
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={localeCode === 'vi' ? viVN : enUS}>
      <div style={{ maxWidth: 720, margin: '48px auto' }}>
        <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space align="center" size="large" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Avatar size={72} icon={<UserOutlined />} />
              <div>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {profile?.full_name || t('null')}
                </Typography.Title>
                <Typography.Text type="secondary">{profile?.email}</Typography.Text>
              </div>
            </Space>
            <Divider style={{ margin: '12px 0' }} />
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={onFinish}
              initialValues={{ // only used on first mount; subsequent updates via setFieldsValue
                email: profile?.email,
                full_name: profile?.full_name,
                organization: profile?.organization,
                date_of_birth: initialDob,
              }}
            >
              <Form.Item label={t('email')} name="email">
                <Input disabled />
              </Form.Item>
              <Form.Item
                label={<span>{t('full_name')} <span style={{ color: '#ff4d4f' }}>*</span></span>}
                name="full_name"
                rules={[{ required: true, message: t('auth.fullNameRequired') }]}
              >
                <Input placeholder={t('auth.fullName')} />
              </Form.Item>
              <Form.Item label={t('date_of_birth')} name="date_of_birth">
                <DatePicker style={{ width: '100%' }} format={dateFormat} disabledDate={(d) => d && d.isAfter(dayjs())} />
              </Form.Item>
              <Form.Item label={t('organization')} name="organization">
                <Input placeholder={t('organization')} />
              </Form.Item>
              <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  {t('save')}
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </ConfigProvider>
  );
}
