'use client';

import TagTable from "@/components/ui/tag-table";
import DicIdTable from "@/components/ui/dicid-table";
import { useTranslation } from "react-i18next";
import { Divider, Button, Select, App, Cascader, Typography, Input, Radio, Form, CascaderProps } from 'antd';
import { useEffect, useState } from "react";
import { RowWord } from "@/types/row-word.type";
import { searchWord, searchWordTag } from "@/dao/search-utils";
import { Sentence } from "@/types/sentence.type";
import { getSentence, getSentenceOther } from "@/dao/data-utils";
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";
import { getNERSet, getPOSSet, getSEMSet } from "@/dao/data-utils";
import type { Option } from '@/types/option.type';
import { getTagOptions } from "@/dao/tag-options";
import { fetchPOS, fetchNER, fetchSemantic, fetchDict, fetchDictWithTagFilter } from "@/services/master/master-api";
import { DicIdItem } from "@/types/dicid-item.type";
import { useAppLanguage } from "@/contexts/AppLanguageContext";

const { Option } = Select;

const WordTag: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [data_1, setData_1] = useState<Sentence[]>([]);
  const [data_2, setData_2] = useState<Sentence[]>([]);
  const [dicData_1, setDicData_1] = useState<DicIdItem[]>([]);
  const [dicData_2, setDicData_2] = useState<DicIdItem[]>([]);
  const [selectedRow1, setSelectedRow1] = useState<Sentence | null>(null);
  const [selectedRow2, setSelectedRow2] = useState<Sentence | null>(null);
  const [selectedDicRow1, setSelectedDicRow1] = useState<DicIdItem | null>(null);
  const [selectedDicRow2, setSelectedDicRow2] = useState<DicIdItem | null>(null);
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState('matches');
  const [language, setLanguage] = useState('1');
  const [tagSelect, setTagSelect] = useState(['none']);
  const [posSetRemote, setPosSetRemote] = useState<string[]>([]);
  const [nerSetRemote, setNerSetRemote] = useState<string[]>([]);
  const [semSetRemote, setSemSetRemote] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(6);

  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2),
    dicId_1 = useSelector((state: RootState) => state.dataSlice.dicId_1),
    dicId_2 = useSelector((state: RootState) => state.dataSlice.dicId_2),
    lang_1 = useSelector((state: RootState) => state.dataSlice.lang_1),
    lang_2 = useSelector((state: RootState) => state.dataSlice.lang_2);

  const { appLanguage } = useAppLanguage();
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [otherLangCode, setOtherLangCode] = useState('en');

  let listSentences: Record<string, RowWord> = {};
  const posSetLocal = language === '1' ? getPOSSet(rows_1) : getPOSSet(rows_2),
    nerSetLocal = language === '1' ? getNERSet(rows_1) : getNERSet(rows_2),
    semSetLocal = language === '1' ? getSEMSet(rows_1) : getSEMSet(rows_2);

  // Check if using tag filter
  const isUsingTagFilter = tagSelect && tagSelect.length === 2;

  const options: Option[] = getTagOptions(
    t, 
    posSetRemote.length ? posSetRemote : posSetLocal, 
    nerSetRemote.length ? nerSetRemote : nerSetLocal, 
    semSetRemote.length ? semSetRemote : semSetLocal
  );

  useEffect(() => {
    if (appLanguage) {
      setCurrentLanguage(appLanguage.currentLanguage);
      if (appLanguage.currentLanguage === appLanguage.languagePair.split('_')[0]) {
        setOtherLangCode(appLanguage.languagePair.split('_')[1]);
      } else {
        setOtherLangCode(appLanguage.languagePair.split('_')[0]);
      }
    }
  }, [appLanguage]);

  // Auto-search when page changes for DicIdTable
  useEffect(() => {
    if (!searchText.trim()) {
      return;
    }
    handleFormFinish();
  }, [page1, limit]);

  useEffect(() => {
    const code = language === '1' ? (lang_1 || '') : (lang_2 || '');
    
    // Fetch POS data
    fetchPOS(code).then(res => {
      const arr: string[] = res.data?.data || [];
      setPosSetRemote(arr);
    }).catch(() => {
      setPosSetRemote([]);
    });

    // Fetch NER data
    fetchNER(code).then(res => {
      const arr: string[] = res.data?.data || [];
      setNerSetRemote(arr);
    }).catch(() => {
      setNerSetRemote([]);
    });

    // Fetch Semantic data
    fetchSemantic(code).then(res => {
      const arr: string[] = res.data?.data || [];
      setSemSetRemote(arr);
    }).catch(() => {
      setSemSetRemote([]);
    });
  }, [language, lang_1, lang_2]);

  const handleTagSelect: CascaderProps<Option>['onChange'] = (value: any) => {
    setTagSelect(value);
  };

  const handleLanguageChange = (value: string) => {
    setData_1([]);
    setData_2([]);
    setDicData_1([]);
    setDicData_2([]);
    setTagSelect(['none']);
    setLanguage(value);
  };

  const handleFormFinish = async () => {
    if (!searchText.trim()) {
      form.validateFields(['searchText']);
      return;
    }

    // Clear previous data
    setData_1([]);
    setData_2([]);
    setDicData_1([]);
    setDicData_2([]);

    // Check if using tag filter or no filter
    if (tagSelect && tagSelect.length === 2) {
      // Using tag filter - use new API with tag filter
      try {
        const currentLang = language === '1' ? (lang_1 || 'vi') : (lang_2 || 'vi');
        const otherLang = language === '1' ? (lang_2 || 'en') : (lang_1 || 'en');
        const langPair = appLanguage?.languagePair || 'vi_en';
        const tagType = tagSelect[0]; // 'pos', 'ner', or 'semantic'
        const tagValue = tagSelect[1]; // the actual tag value
        
        const res = await fetchDictWithTagFilter(
          page1, 
          limit, 
          currentLang, 
          langPair, 
          otherLang, 
          searchText.trim(), 
          searchType === 'morphological', 
          tagType,
          tagValue
        );
        
        if (res.status !== 200) {
          message.error(res.statusText);
          return;
        } else {
          setDicData_1(res.data.data[currentLang] || []);
          setDicData_2(res.data.data[otherLang] || []);
          setTotal(res.data.metadata.total);
          setPage1(res.data.metadata.page);
          setLimit(res.data.metadata.limit);
        }
      } catch (err) {
        console.log(err);
        message.error(t('something_wrong'));
      }
    } else {
      // No tag filter - use DicIdTable like Search Word page
      try {
        const currentLang = language === '1' ? (lang_1 || 'vi') : (lang_2 || 'vi');
        const otherLang = language === '1' ? (lang_2 || 'en') : (lang_1 || 'en');
        const langPair = appLanguage?.languagePair || 'vi_en';
        
        const res = await fetchDict(
          page1, 
          limit, 
          currentLang, 
          langPair, 
          otherLang, 
          searchText.trim(), 
          searchType === 'morphological', 
          false // is_phrase
        );
        
        if (res.status !== 200) {
          message.error(res.statusText);
          return;
        } else {
          setDicData_1(res.data.data[currentLang] || []);
          setDicData_2(res.data.data[otherLang] || []);
          setTotal(res.data.metadata.total);
          setPage1(res.data.metadata.page);
          setLimit(res.data.metadata.limit);
        }
      } catch (err) {
        console.log(err);
        message.error(t('something_wrong'));
      }
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
      setData_1((prev: Sentence[]) => [...prev, sentence]);

      const sentence2: Sentence = getSentenceOther(
        listSentences[key],
        language === '1' ? rows_2 : rows_1,
        language === '1' ? dicId_2 : dicId_1
      );
      setData_2((prev: Sentence[]) => [...prev, sentence2]);
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

  const handleDicRowSelect1 = (row: DicIdItem | null, index: number | null) => {
    setSelectedDicRow1(row);
    if (index !== null && dicData_2[index]) {
      setSelectedDicRow2(dicData_2.find((item: DicIdItem) => item.id_string === row?.id_string) ?? null);
    } else {
      setSelectedDicRow2(null);
    }
  };

  const handleDicRowSelect2 = (row: DicIdItem | null, index: number | null) => {
    setSelectedDicRow2(row);
    if (index !== null && dicData_1[index]) {
      setSelectedDicRow1(dicData_1.find((item: DicIdItem) => item.id_string === row?.id_string) ?? null);
    } else {
      setSelectedDicRow2(null);
    }
  };

  const handleSaveButton = () => {
    if (data_1.length === 0 || data_2.length === 0) {
      return;
    }

    const lines = data_1.map((row1: Sentence, idx: number) => {
      const row2 = data_2[idx];;
      const sentence1 =
        row1.Center === '-' ?
          row1.Left.trim() + ' ' + row1.Right.trim() :
          row1.Left.trim() + ' ' + row1.Center + ' ' + row1.Right.trim(),
        sentence2 =
          row2.Center === '-' ?
            row2.Left.trim() + ' ' + row2.Right.trim() :
            row2.Left.trim() + ' ' + row2.Center + ' ' + row2.Right.trim();
      return `* ${sentence1}\n+ ${sentence2}`;
    });
    const content = lines.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'parallel_corpus.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(t('download_ready'));
  }

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
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  {t('search')}
                </Button>
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
            </div>
          </Form>

          {/* Display data using DicIdTable for both cases */}
          <>
            <Divider>
              {t(currentLanguage ?? 'en')}
            </Divider>
            <DicIdTable
              data={dicData_1}
              languageCode={currentLanguage}
              selectedRowKey={selectedDicRow1 ? selectedDicRow1.id_sen : null}
              onRowSelect={handleDicRowSelect1}
              currentPage={page1}
              total={total}
              onPageChange={setPage1}
              pageSize={limit}
            />

            <Divider>
              {t(otherLangCode ?? 'en')}
            </Divider>
            <DicIdTable
              data={dicData_2}
              languageCode={otherLangCode}
              selectedRowKey={selectedDicRow2 ? selectedDicRow2.id_sen : null}
              onRowSelect={handleDicRowSelect2}
              onPageChange={setPage1}
              currentPage={page1}
              pageSize={limit}
              total={total}
            />
          </>
        </div>
      </div >
    </>
  );
};

export default WordTag;
