'use client';
import CorpusTable from "@/components/ui/corpus-table";
import { RootState } from "@/redux";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useAppLanguage } from "@/contexts/AppLanguageContext";
import MasterRowWordTable from "@/components/ui/master-row-word-table";

export default function Home() {
  const { appLanguage, setCurrentLanguage } = useAppLanguage();
  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <MasterRowWordTable />
      </div>
    </>
  );
}
