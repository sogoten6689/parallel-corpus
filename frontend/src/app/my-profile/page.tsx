'use client';
import CorpusTable from "@/components/ui/corpus-table";
import { RootState } from "@/redux";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useAppLanguage } from "@/contexts/AppLanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { t } = useTranslation();
  const { appLanguage, setCurrentLanguage } = useAppLanguage();
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      window.location.href = '/';
    }
  }, [user]);
  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        hello
      </div>
    </>
  );
}
