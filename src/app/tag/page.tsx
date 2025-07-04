'use client';

import TagTable from "@/components/ui/tag-table";
import { useTranslation } from "react-i18next";
import { Divider, Space, Button, Select, App, Cascader, CascaderProps, Switch, Typography } from 'antd';
import { useState } from "react";
import { RowWord } from "@/types/row-word.type";
import { searchTag } from "@/dao/search-utils";
import { Sentence } from "@/types/sentence.type";
import { getSentence, getSentenceOther } from "@/dao/data-utils";
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";
import { getNERSet, getPOSSet, getSEMSet } from "@/dao/data-utils";
import type { Option } from '@/types/option.type';

const { Option } = Select;

const Tag: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [data_1, setData_1] = useState<Sentence[]>([]);
  const [data_2, setData_2] = useState<Sentence[]>([]);
  const [selectedRow1, setSelectedRow1] = useState<Sentence | null>(null);
  const [selectedRow2, setSelectedRow2] = useState<Sentence | null>(null);
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);

  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2),
    dicId_1 = useSelector((state: RootState) => state.dataSlice.dicId_1),
    dicId_2 = useSelector((state: RootState) => state.dataSlice.dicId_2),
    lang_1 = useSelector((state: RootState) => state.dataSlice.lang_1),
    lang_2 = useSelector((state: RootState) => state.dataSlice.lang_2);

  const [showFirst, setShowFirst] = useState(true),
    [tagSelect, setTagSelect] = useState(['none']);

  let listSentences: Record<string, RowWord> = {};
  const posSet = showFirst ? getPOSSet(rows_1) : getPOSSet(rows_2),
    nerSet = showFirst ? getNERSet(rows_1) : getNERSet(rows_2),
    semSet = showFirst ? getSEMSet(rows_1) : getSEMSet(rows_2);

  const options: Option[] = [
    {
      value: 'none',
      label: t('none'),
    },
    {
      value: 'pos',
      label: t('pos'),
      children: posSet.map((pos: string) => ({
        value: pos,
        label: pos,
      })),
    },
    {
      value: 'ner',
      label: t('ner'),
      children: nerSet.map((ner: string) => ({
        value: ner,
        label: ner
      })),
    },
    {
      value: 'semantic',
      label: t('semantic'),
      children: semSet.map((sem: string) => ({
        value: sem,
        label: sem
      })),
    }
  ];

  const handleTagSelect: CascaderProps<Option>['onChange'] = (value) => {
    setTagSelect(value);
  };

  const handleSwitch = (checked: boolean) => {
    setData_1([]);
    setData_2([]);
    setTagSelect(['none']);
    setShowFirst(checked);
  };

  const handleSearch = () => {
    if (rows_1.length === 0 || rows_2.length === 0) {
      message.warning(t('missing_data'));
      return;
    }

    if (tagSelect.length == 2) {
      listSentences = searchTag(tagSelect[1].toLowerCase(), tagSelect[0], showFirst ? rows_1 : rows_2);
      searchComplete();
    } else {
      message.warning(t('missing_tag'));
    }
  };

  const searchComplete = () => {
    setData_1([]);
    setData_2([]);

    Object.keys(listSentences).forEach((key) => {
      const sentence: Sentence = getSentence(listSentences[key], showFirst ? rows_1 : rows_2, showFirst ? dicId_1 : dicId_2);
      setData_1(prev => [...prev, sentence]);

      const sentence2: Sentence = getSentenceOther(listSentences[key], showFirst ? rows_2 : rows_1, showFirst ? dicId_2 : dicId_1);
      setData_2(prev => [...prev, sentence2]);
    });
  }

  const pageSize = 6;

  const handleRowSelect1 = (row: Sentence | null, index: number | null) => {
    setSelectedRow1(row);
    if (index !== null && data_2[index]) {
      setSelectedRow2(data_2[index]);
      setPage2(Math.floor(index / pageSize) + 1);
    } else {
      setSelectedRow2(null);
    }
  };

  const handleRowSelect2 = (row: Sentence | null, index: number | null) => {
    setSelectedRow2(row);
    if (index !== null && data_1[index]) {
      setSelectedRow1(data_1[index]);
      setPage1(Math.floor(index / pageSize) + 1);
    } else {
      setSelectedRow1(null);
    }
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3">
          <Space direction="vertical" className="w-full" align="center">
            <Space
              direction="horizontal"
              className="w-full flex items-center gap-3"
              style={{ minHeight: 30 }}
            >
              <Typography.Title level={5} className="font-semibold !mb-0 flex items-center">
                {t("filter_tag")}
              </Typography.Title>
              <Cascader
                options={options}
                onChange={handleTagSelect}
                placeholder={t('please_select')}
                value={tagSelect}
                className="flex items-center"
              />
              <Typography.Title level={5} className="font-semibold !mb-0 flex items-center">
                {t("select_language")}
              </Typography.Title>
              <Switch
                checked={showFirst}
                onChange={handleSwitch}
                checkedChildren={lang_1 ? t(lang_1) : t("lang1")}
                unCheckedChildren={lang_2 ? t(lang_2) : t("lang2")}
                className="flex items-center"
              />
              <Button type="primary" onClick={handleSearch} className="flex items-center">
                Search
              </Button>
            </Space>
          </Space>
          {showFirst && (
            <>
              <Divider>
                {lang_1 ? t(lang_1) : t('source_language')}
              </Divider>
              <TagTable
                data={data_1}
                selectedRowKey={selectedRow1 ? selectedRow1.ID_sen : null}
                onRowSelect={handleRowSelect1}
                currentPage={page1}
                onPageChange={setPage1}
                pageSize={pageSize}
              />
              <Divider>
                {lang_2 ? t(lang_2) : t('target_language')}
              </Divider>
              <TagTable
                data={data_2}
                selectedRowKey={selectedRow2 ? selectedRow2.ID_sen : null}
                onRowSelect={handleRowSelect2}
                currentPage={page2}
                onPageChange={setPage2}
                pageSize={pageSize}
              />
            </>
          )}
          {!showFirst && (
            <>
              <Divider>
                {lang_2 ? t(lang_2) : t('source_language')}
              </Divider>
              <TagTable
                data={data_1}
                selectedRowKey={selectedRow1 ? selectedRow1.ID_sen : null}
                onRowSelect={handleRowSelect1}
                currentPage={page1}
                onPageChange={setPage1}
                pageSize={pageSize}
              />
              <Divider>
                {lang_1 ? t(lang_1) : t('target_language')}
              </Divider>
              <TagTable
                data={data_2}
                selectedRowKey={selectedRow2 ? selectedRow2.ID_sen : null}
                onRowSelect={handleRowSelect2}
                currentPage={page2}
                onPageChange={setPage2}
                pageSize={pageSize}
              />
            </>
          )}
        </div>
      </div >
    </>
  );
};


export default Tag;
