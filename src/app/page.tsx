'use client';
import CorpusTable from "@/components/ui/corpus-table";
import TextAnalyzer from "@/components/ui/text-analyzer";
import { RootState } from "@/redux";
import { Switch, Tabs } from "antd";
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

  const tabItems = [
    {
      key: 'corpus',
      label: t('parallel_corpus'),
      children: (
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
          <div className="p-3">
            <CorpusTable data={showFirst ? rows_1 : rows_2} sentences={showFirst ? sentences_1 : sentences_2} />
          </div>
        </div>
      ),
    },
    {
      key: 'analysis',
      label: t('language_analysis'),
      children: <TextAnalyzer />,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {t('parallel_corpus_analysis')}
        </h1>
        <p className="text-gray-600">
          {t('analysis_description')}
        </p>
      </div>
      
      <Tabs
        defaultActiveKey="corpus"
        items={tabItems}
        size="large"
        className="bg-white rounded-lg shadow-sm"
      />
    </div>
  );
}
