'use client';
import CorpusTable from "@/components/ui/corpus-table";
import { RootState } from "@/redux";
import { Breadcrumb } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
export default function Home() {
  const { t } = useTranslation();
  const rows = useSelector((state: RootState) => state.dataSlice.rows);

  return (
    <>
    <div className="grid grid-rows-[auto_1fr]">
       <Breadcrumb items={[{ title: t("word") }]} />
    </div>
    <br />

    <div className="grid grid-rows-[auto_1fr]">
        <div className="p-4">
        <CorpusTable data={rows} />
      </div>
    </div>
    </>
  );
}
