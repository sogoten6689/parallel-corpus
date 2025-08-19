'use client';
import CorpusTable from "@/components/ui/corpus-table";
import { RootState } from "@/redux";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useState } from "react";
import UserTable from "@/components/ui/user-table";

export default function UserList() {
  const { t } = useTranslation();

  const [showFirst, setShowFirst] = useState(true);

  const handleSwitch = (checked: boolean) => {
    setShowFirst(checked);
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3 flex items-center gap-4">
        </div>
        {<UserTable />}
      </div>
    </>
  );
}
