'use client';

import TagTable from "@/components/ui/tag-table";
import { useTranslation } from "react-i18next";
import { Divider, Space, Input, Button, Select, Radio, App } from 'antd';
import { useState } from "react";
import { RowWord } from "@/types/row-word.type";
import { searchPhrase, searchWord } from "@/dao/search-utils";
import { Sentence } from "@/types/sentence.type";
import { getSentence, getSentenceOther } from "@/dao/data-utils";
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";

const { Option } = Select;

const Word: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [language, setLanguage] = useState('1');
  const [searchType, setSearchType] = useState('matches');
  const [searchText, setSearchText] = useState('');
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

  let listSentences: Record<string, RowWord> = {},
    listSenPhrase: Record<string, RowWord[]> = {};

  const handleSearch = () => {
    if (rows_1.length === 0 || rows_2.length === 0) {
      message.warning(t('missing_data'));
      return;
    }
    else if (searchText.trim() === '') {
      message.warning(t('missing_input'))
      return;
    }

    if (searchType !== 'phrase') {
      listSentences = searchWord(searchText.trim(), searchType === 'morphological', language === '1' ? rows_1 : rows_2);
    }
    else {
      listSenPhrase = searchPhrase(searchText.trim(), language === '1' ? rows_1 : rows_2);
    }
    searchComplete();
  };

  const searchComplete = () => {
    setData_1([]);
    setData_2([]);

    if (searchType !== 'phrase') {
      Object.keys(listSentences).forEach((key) => {
        const sentence: Sentence = getSentence(listSentences[key], language === '1' ? rows_1 : rows_2, language === '1' ? dicId_1 : dicId_2);
        setData_1(prev => [...prev, sentence]);

        const sentence2: Sentence = getSentenceOther(listSentences[key], language === '1' ? rows_2 : rows_1, language === '1' ? dicId_2 : dicId_1);
        setData_2(prev => [...prev, sentence2]);
      });
    } else {
      Object.keys(listSenPhrase).forEach((key) => {
        const sentence: Sentence = getSentence(listSenPhrase[key][0], language === '1' ? rows_1 : rows_2, language === '1' ? dicId_1 : dicId_2);
        setData_1(prev => [...prev, sentence]);

        const sentence2: Sentence = getSentenceOther(listSenPhrase[key][0], language === '1' ? rows_2 : rows_1, language === '1' ? dicId_2 : dicId_1);
        setData_2(prev => [...prev, sentence2]);
      });
    }
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
            <Space direction="horizontal" className="w-full">
              <Space wrap className="w-full">
                <Input
                  placeholder={t('input')}
                  style={{ flex: 1 }}
                  width={700}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)} />
              </Space><Space wrap className="w-full">
                <Select style={{ width: 120 }} value={language} onChange={setLanguage}>
                  <Option value="1">{lang_1 ? t(lang_1) : t('lang1')}</Option>
                  <Option value="2">{lang_2 ? t(lang_2) : t('lang2')}</Option>
                </Select>
                <Radio.Group
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  options={[
                    { label: t('matches'), value: 'matches' },
                    { label: t('phrase'), value: 'phrase' },
                    { label: t('morphological'), value: 'morphological' },
                  ]} />
                <Button type="primary" onClick={handleSearch}>Search</Button>
              </Space>
            </Space>
          </Space>
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


export default Word;
