'use client';
import CorpusTable from "@/components/ui/corpus-table";
import { RootState } from "@/redux";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useState } from "react";

export default function Home() {
  const { t } = useTranslation();
  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2),
    sentences_1 = useSelector((state: RootState) => state.dataSlice.dicId_1),
    sentences_2 = useSelector((state: RootState) => state.dataSlice.dicId_2),
    lang_1 = useSelector((state: RootState) => state.dataSlice.lang_1),
    lang_2 = useSelector((state: RootState) => state.dataSlice.lang_2);

  const [showFirst, setShowFirst] = useState(true);

  const handleSwitch = (checked: boolean) => {
    setShowFirst(checked);
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3 flex items-center gap-4">
          <span className="font-semibold">{t("select_language")}</span>
          <Switch
            checked={showFirst}
            onChange={handleSwitch}
            checkedChildren={lang_1 ? t(lang_1) : t("lang1")}
            unCheckedChildren={lang_2 ? t(lang_2) : t("lang2")}
          />
        </div>
        {<CorpusTable  sentences={showFirst ? sentences_1 : sentences_2} />}
        {/* <div className="p-3">
          <CorpusTable data={showFirst ? rows_1 : rows_2} sentences={showFirst ? sentences_1 : sentences_2} />
        </div> */}
      </div>
    </>
  );
}
