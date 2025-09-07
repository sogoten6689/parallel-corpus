'use client';

import DicIdTable from "@/components/ui/dicid-table";
import { useTranslation } from "react-i18next";
import { Divider, Button, Select, App, Cascader, Typography, Input, Radio, Form, CascaderProps } from 'antd';
import { useEffect, useState } from "react";
// Removed unused search utilities and sentence helpers
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
  // Removed sentence-level parallel view state (unused in UI)
  const [dicData_1, setDicData_1] = useState<DicIdItem[]>([]);
  const [dicData_2, setDicData_2] = useState<DicIdItem[]>([]);
  // Removed unused selected sentence tracking
  const [selectedDicRow1, setSelectedDicRow1] = useState<DicIdItem | null>(null);
  const [selectedDicRow2, setSelectedDicRow2] = useState<DicIdItem | null>(null);
  const [page1, setPage1] = useState(1);
  // Removed secondary page state for unused sentence list
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState('matches');
  // Removed legacy language state (now derived from context)
  const [tagSelect, setTagSelect] = useState(['none']);
  const [posSetRemote, setPosSetRemote] = useState<string[]>([]);
  const [nerSetRemote, setNerSetRemote] = useState<string[]>([]);
  const [semSetRemote, setSemSetRemote] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(6);

  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1);
  const rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2);
  // Removed unused dicId_1 and dicId_2 selectors

  const { appLanguage } = useAppLanguage();
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [otherLangCode, setOtherLangCode] = useState('en');

  // Removed unused sentence construction map
  
  // Use language from header to determine which data to use for local tag sets
  const isFirstLang = appLanguage?.currentLanguage === (appLanguage?.languagePair?.split('_')[0] || 'vi');
  const posSetLocal = isFirstLang ? getPOSSet(rows_1) : getPOSSet(rows_2),
    nerSetLocal = isFirstLang ? getNERSet(rows_1) : getNERSet(rows_2),
    semSetLocal = isFirstLang ? getSEMSet(rows_1) : getSEMSet(rows_2);

  // Check if using tag filter
  // Determine if tag filter is in use (inline when needed)

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

  // Auto-search when page changes for DicIdTable (effect defined after handleFormFinish)

  // Use current language from header for fetching tag options
  const currentLangForTags = appLanguage?.currentLanguage || 'vi';
  
  useEffect(() => {
    const code = currentLangForTags;
    
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
  }, [currentLangForTags]);

  const handleTagSelect: CascaderProps<Option>['onChange'] = (value) => {
    setTagSelect(value);
  };

  // Removed handleLanguageChange (context driven)

  const handleFormFinish = async () => {
    if (!searchText.trim()) {
      form.validateFields(['searchText']);
      return;
    }

  // Clear previous dictionary data
    setDicData_1([]);
    setDicData_2([]);

    // Check if using tag filter or no filter
    if (tagSelect && tagSelect.length === 2) {
      // Using tag filter - use new API with tag filter
      try {
        // Use language from header instead of local state
        const currentLang = appLanguage?.currentLanguage || 'vi';
        const langPair = appLanguage?.languagePair || 'vi_en';
        
        // Determine other language from language pair
        let otherLang = 'en';
        if (langPair && langPair.includes('_')) {
          const [lang1, lang2] = langPair.split('_');
          otherLang = currentLang === lang1 ? lang2 : lang1;
        }
        
        const tagType = tagSelect[0]; // 'pos', 'ner', or 'semantic'
        const tagValue = tagSelect[1]; // the actual tag value
        
        console.log('=== DEBUG TAG SEARCH ===');
        console.log('Tag selection:', { tagSelect, tagType, tagValue });
        console.log('Language settings:', { currentLang, otherLang, langPair });
        console.log('App language from header:', appLanguage);
        
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
        // Use language from header instead of local state
        const currentLang = appLanguage?.currentLanguage || 'vi';
        const langPair = appLanguage?.languagePair || 'vi_en';
        
        // Determine other language from language pair
        let otherLang = 'en';
        if (langPair && langPair.includes('_')) {
          const [lang1, lang2] = langPair.split('_');
          otherLang = currentLang === lang1 ? lang2 : lang1;
        }
        
        console.log('=== DEBUG WORD SEARCH ===');
        console.log('Search text:', searchText.trim());
        console.log('Language settings:', { currentLang, otherLang, langPair });
        console.log('App language from header:', appLanguage);
        
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

  useEffect(() => {
    if (!searchText.trim()) return;
    handleFormFinish();
    // Intentionally exclude handleFormFinish to avoid recreating (stable enough for current needs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page1, limit, searchText]);

  // Removed searchComplete (unused sentence logic)

  // Removed sentence pagination constants

  // Removed sentence row selection handlers

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

  // Removed save to corpus function (irrelevant to dictionary tag view)

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
