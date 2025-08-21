'use client';
import CorpusTable from "@/components/ui/corpus-table";
import { RootState } from "@/redux";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useAppLanguage } from "@/contexts/AppLanguageContext";

export default function Home() {
  const { t } = useTranslation();
  const { appLanguage, setCurrentLanguage } = useAppLanguage();

  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2),
    sentences_1 = useSelector((state: RootState) => state.dataSlice.dicId_1),
    sentences_2 = useSelector((state: RootState) => state.dataSlice.dicId_2),
    lang_1 = useSelector((state: RootState) => state.dataSlice.lang_1),
    lang_2 = useSelector((state: RootState) => state.dataSlice.lang_2);

  const [showFirst, setShowFirst] = useState(true);

  const handleSwitch = (checked: boolean) => {
    const currentLanguage = appLanguage?.lang_1 === appLanguage?.currentLanguage ? appLanguage?.lang_2 : appLanguage?.lang_1;
    setCurrentLanguage(currentLanguage ?? 'en', appLanguage ?? {languagePair: 'en_vi', currentLanguage: 'en', lang_1: 'en', lang_2: 'vi'});
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        {<CorpusTable 
          sentences={showFirst ? sentences_1 : sentences_2} 
          useWordRowMaster={true}
          langCode={showFirst ? (lang_1 || 'en') : (lang_2 || 'vn')}
        />}
        {/* <div className="p-3">
          <CorpusTable data={showFirst ? rows_1 : rows_2} sentences={showFirst ? sentences_1 : sentences_2} />
        </div> */}
      </div>
    </>
  );
}
