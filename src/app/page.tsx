'use client';
import CorpusTable from "@/components/ui/corpus-table";
import { RootState } from "@/redux";
import { Breadcrumb, Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useState } from "react";

export default function Home() {
  const { t } = useTranslation();
  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2);

  // State to switch between tables
  const [showFirst, setShowFirst] = useState(true);

  // Handler for switch button
  const handleSwitch = (checked: boolean) => {
    setShowFirst(checked);
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-4 flex items-center gap-4">
          <span className="font-semibold">{t("select_language")}</span>
          <Switch
            checked={showFirst}
            onChange={handleSwitch}
            checkedChildren={t("lang1")}
            unCheckedChildren={t("lang2")}
          />
        </div>
        <div className="p-4">
          <CorpusTable data={showFirst ? rows_1 : rows_2} />
        </div>
      </div>
    </>
  );
}
