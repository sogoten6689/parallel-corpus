'use client';
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAppLanguage } from "@/contexts/AppLanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileMeApi, updateProfileMeApi, UserProfile } from "@/services/auth/auth-api";
import useApp from "antd/es/app/useApp";

export default function Home() {
  const { message } = useApp();
  const { t } = useTranslation();
  const { appLanguage, setCurrentLanguage } = useAppLanguage();
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      window.location.href = '/';
    }
  }, [user]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // getProfile().then((data) => {
    //   setProfile(data);
    //   setLoading(false);
    // });
    getProfileMeApi().then((data) => {
      setProfile(data.data);
      setLoading(false);
    })
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await updateProfileMeApi({
        full_name: profile.full_name,
        date_of_birth: profile.date_of_birth,
        organization: profile.organization,
      });
      if (res.status !== 200) {
        // throw new Error('Failed to update profile.');
        message.error('Failed to update profile.');
      }
      else {
        message.success('Profile updated successfully!');
        setProfile(res.data.data);
      }
      // const updated = await getProfile();
      // setProfile(updated);
      // alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
         <div className="max-w-md mx-auto p-6 border rounded-lg">
      <h1 className="text-xl font-bold mb-4">My Profile</h1>
      <label className="block mb-2">
        Email (read-only)
        <input
          type="text"
          value={profile?.email || ''}
          className="w-full border px-3 py-2 rounded"
          disabled
        />
      </label>
      <label className="block mb-2">
        Full Name
        <input
          type="text"
          name="full_name"
          value={profile?.full_name || ''}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      <label className="block mb-2">
        Date of Birth
        <input
          type="date"
          name="date_of_birth"
          value={profile?.date_of_birth?.split('T')[0] || ''}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      <label className="block mb-2">
        Organization
        <input
          type="text"
          name="organization"
          value={profile?.organization || ''}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
      </label>
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
      </div>
    </>
  );
}
