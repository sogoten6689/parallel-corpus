'use client';

import DicIdTable from "@/components/ui/dicid-table";
import { useTranslation } from "react-i18next";
import { Divider, Button, Select, App, Cascader, Typography, Form } from 'antd';
import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";
import { getNERSet, getPOSSet, getSEMSet } from "@/dao/data-utils";
import type { Option } from '@/types/option.type';
import { getTagOptions } from "@/dao/tag-options";
import { fetchPOS, fetchNER, fetchSemantic, fetchDictWithTagFilter } from "@/services/master/master-api";
import { DicIdItem } from "@/types/dicid-item.type";
import { useAppLanguage } from "@/contexts/AppLanguageContext";

const { Option } = Select;

const Tag: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [dicData_1, setDicData_1] = useState<DicIdItem[]>([]);
  const [dicData_2, setDicData_2] = useState<DicIdItem[]>([]);
  const [selectedDicRow1, setSelectedDicRow1] = useState<DicIdItem | null>(null);
  const [selectedDicRow2, setSelectedDicRow2] = useState<DicIdItem | null>(null);
  const [page1, setPage1] = useState(1);
  const [tagSelect, setTagSelect] = useState(['none']);
  const [posSetRemote, setPosSetRemote] = useState<string[]>([]);
  const [nerSetRemote, setNerSetRemote] = useState<string[]>([]);
  const [semSetRemote, setSemSetRemote] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2);

  const { appLanguage } = useAppLanguage();
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [otherLangCode, setOtherLangCode] = useState('en');

  // Use current language from header for fetching tag options
  const currentLangForTags = appLanguage?.currentLanguage || 'vi';
  const posSetLocal = getPOSSet(rows_1),
    nerSetLocal = getNERSet(rows_1),
    semSetLocal = getSEMSet(rows_1);

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

  // Auto-search when page changes
  useEffect(() => {
    if (!tagSelect || tagSelect.length !== 2) {
      return;
    }
    handleFormFinish();
  }, [page1, limit]);

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

  const handleFormFinish = async () => {
    if (!tagSelect || tagSelect.length !== 2) {
      message.warning(t('missing_tag'));
      return;
    }

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
      
      // Debug logging
      console.log('=== DEBUG TAG SEARCH ===');
      console.log('Tag selection:', { tagSelect, tagType, tagValue });
      console.log('Language settings:', { currentLang, otherLang, langPair });
      console.log('App language from header:', appLanguage);
      console.log('Current language from header:', appLanguage?.currentLanguage);
      console.log('Language pair from header:', appLanguage?.languagePair);
      
      // Call API with search="" to get all words with the selected tag
      const res = await fetchDictWithTagFilter(
        page1, 
        limit, 
        currentLang, 
        langPair, 
        otherLang, 
        "", // search="" to get all words with the tag
        false, // is_morph = false
        tagType,
        tagValue
      );
      
      console.log('=== API RESPONSE ===');
      console.log('Full response:', res);
      console.log('Response status:', res.status);
      console.log('Response data:', res.data);
      console.log('Response metadata:', res.data?.metadata);
      
      if (res.status !== 200) {
        message.error(res.statusText);
        return;
      } else {
        console.log('=== PROCESSING RESPONSE ===');
        console.log('Available languages in response:', Object.keys(res.data.data || {}));
        console.log('Current lang data:', res.data.data[currentLang]);
        console.log('Other lang data:', res.data.data[otherLang]);
        console.log('Data types:', {
          currentLang: typeof res.data.data[currentLang],
          otherLang: typeof res.data.data[otherLang],
          currentLangIsArray: Array.isArray(res.data.data[currentLang]),
          otherLangIsArray: Array.isArray(res.data.data[otherLang])
        });
        
        const currentLangData = res.data.data[currentLang] || [];
        const otherLangData = res.data.data[otherLang] || [];
        
        console.log('Setting data:', {
          dicData_1: currentLangData,
          dicData_2: otherLangData,
          total: res.data.metadata.total
        });
        
        setDicData_1(currentLangData);
        setDicData_2(otherLangData);
        setTotal(res.data.metadata.total);
        setPage1(res.data.metadata.page);
        setLimit(res.data.metadata.limit);
        
        // Debug: log the data being set
        console.log('=== FINAL STATE ===');
        console.log('Total records found:', res.data.metadata.total);
        console.log('Current language records:', currentLangData.length);
        console.log('Other language records:', otherLangData.length);
      }
    } catch (err) {
      console.log('=== ERROR IN HANDLEFORMFINISH ===');
      console.log('Error details:', err);
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);
      message.error(t('something_wrong'));
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
      setSelectedDicRow1(null);
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
            className="w-full flex flex-row flex-wrap gap-3 items-center justify-center"
          >
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
                onChange={value => setTagSelect(value)}
                placeholder={t('please_select')}
                value={tagSelect}
                className="flex items-center"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {t('search')}
              </Button>
            </Form.Item>
          </Form>

          {/* Display data using DicIdTable */}
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

export default Tag;
