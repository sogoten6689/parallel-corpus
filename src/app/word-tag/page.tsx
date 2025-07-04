'use client';

import TagTable from "@/components/ui/tag-table";
import { useTranslation } from "react-i18next";
import { Divider, Button, Select, App, Cascader, Typography, Input, Radio, Form } from 'antd';
import { useState } from "react";
import { RowWord } from "@/types/row-word.type";
import { searchWord, searchWordTag } from "@/dao/search-utils";
import { Sentence } from "@/types/sentence.type";
import { getSentence, getSentenceOther } from "@/dao/data-utils";
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";
import { getNERSet, getPOSSet, getSEMSet } from "@/dao/data-utils";
import type { Option } from '@/types/option.type';
import { getTagOptions } from "@/dao/tag-options";

const { Option } = Select;

const WordTag: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [data_1, setData_1] = useState<Sentence[]>([]);
  const [data_2, setData_2] = useState<Sentence[]>([]);
  const [selectedRow1, setSelectedRow1] = useState<Sentence | null>(null);
  const [selectedRow2, setSelectedRow2] = useState<Sentence | null>(null);
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState('matches');
  const [language, setLanguage] = useState('1');
  const [tagSelect, setTagSelect] = useState(['none']);

  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2),
    dicId_1 = useSelector((state: RootState) => state.dataSlice.dicId_1),
    dicId_2 = useSelector((state: RootState) => state.dataSlice.dicId_2),
    lang_1 = useSelector((state: RootState) => state.dataSlice.lang_1),
    lang_2 = useSelector((state: RootState) => state.dataSlice.lang_2);

  let listSentences: Record<string, RowWord> = {};
  const posSet = language === '1' ? getPOSSet(rows_1) : getPOSSet(rows_2),
    nerSet = language === '1' ? getNERSet(rows_1) : getNERSet(rows_2),
    semSet = language === '1' ? getSEMSet(rows_1) : getSEMSet(rows_2);

  const options: Option[] = getTagOptions(t, posSet, nerSet, semSet);

  const handleTagSelect: CascaderProps<Option>['onChange'] = (value) => {
    setTagSelect(value);
  };

  const handleLanguageChange = (value: string) => {
    setData_1([]);
    setData_2([]);
    setTagSelect(['none']);
    setLanguage(value);
  };

  const handleFormFinish = () => {
    if (rows_1.length === 0 || rows_2.length === 0) {
      message.warning(t('missing_data'));
      return;
    }
    if (!searchText.trim()) {
      form.validateFields(['searchText']);
      return;
    }
    // Tag selection is optional, but if present, must be valid
    if (!tagSelect || (tagSelect.length !== 2 && !(tagSelect.length === 1 && tagSelect[0] === 'none'))) {
      message.warning(t('missing_tag'));
      return;
    }

    if (tagSelect.length === 2) {
      listSentences = searchWordTag(
        searchText.trim().toLowerCase(),
        searchType === 'morphological',
        tagSelect[1].toLowerCase(),
        tagSelect[0],
        language === '1' ? rows_1 : rows_2
      );
      searchComplete();
    } else {
      listSentences = searchWord(
        searchText.trim(),
        searchType === 'morphological',
        language === '1' ? rows_1 : rows_2
      );
      searchComplete();
    }
  };

  const searchComplete = () => {
    setData_1([]);
    setData_2([]);

    Object.keys(listSentences).forEach((key) => {
      const sentence: Sentence = getSentence(
        listSentences[key],
        language === '1' ? rows_1 : rows_2,
        language === '1' ? dicId_1 : dicId_2
      );
      setData_1(prev => [...prev, sentence]);

      const sentence2: Sentence = getSentenceOther(
        listSentences[key],
        language === '1' ? rows_2 : rows_1,
        language === '1' ? dicId_2 : dicId_1
      );
      setData_2(prev => [...prev, sentence2]);
    });
  };

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
          <Form
            form={form}
            layout="inline"
            onFinish={handleFormFinish}
            className="w-full flex flex-col gap-3 items-center justify-center"
          >
            <div className="w-full flex flex-row flex-wrap gap-3 items-center justify-center">
              <Typography.Title level={5} className="font-semibold !mb-0 flex items-center">
                {t("input_keyword")}
              </Typography.Title>
              <Form.Item
                name="searchText"
                className="flex-1 min-w-[200px]"
                initialValue={searchText}
                rules={[{ required: true, message: t('missing_input') }]}
              >
                <Input
                  placeholder={t('input')}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </Form.Item>
              <Form.Item name="searchType" initialValue={searchType}>
                <Radio.Group
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  options={[
                    { label: t('matches'), value: 'matches' },
                    { label: t('morphological'), value: 'morphological' },
                  ]}
                />
              </Form.Item>
            </div>
            <div className="w-full flex flex-row flex-wrap gap-3 items-center justify-center">
              <Typography.Title level={5} className="font-semibold !mb-0 flex items-center">
                {t("filter_tag")}
              </Typography.Title>
              <Form.Item
                name="tagSelect"
                className="flex items-center"
                initialValue={tagSelect}
              >
                <Cascader
                  options={options}
                  onChange={handleTagSelect}
                  placeholder={t('please_select')}
                  value={tagSelect}
                  className="flex items-center"
                />
              </Form.Item>
              <Typography.Title level={5} className="font-semibold !mb-0 flex items-center">
                {t("select_language")}
              </Typography.Title>
              <Form.Item name="language" initialValue={language}>
                <Select
                  style={{ width: 120 }}
                  value={language}
                  onChange={handleLanguageChange}
                >
                  <Option value="1">{lang_1 ? t(lang_1) : t('lang1')}</Option>
                  <Option value="2">{lang_2 ? t(lang_2) : t('lang2')}</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="flex items-center">
                  {t('search') || 'Search'}
                </Button>
              </Form.Item>
            </div>
          </Form>
          {language === '1' && (
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
          {language !== '1' && (
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


export default WordTag;
