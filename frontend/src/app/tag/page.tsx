'use client';

import DicIdTable from "@/components/ui/dicid-table";
import { useTranslation } from "react-i18next";
import { Divider, Button, Select, App, Cascader, Typography, Form } from 'antd';
import { useEffect, useState } from "react";
// Removed local corpus-derived tag set utilities; now using only remote API tag lists
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
  const [page1, setPage1] = useState(1);
  const [tagSelect, setTagSelect] = useState(['none']);
  const [posSetRemote, setPosSetRemote] = useState<string[]>([]);
  const [nerSetRemote, setNerSetRemote] = useState<string[]>([]);
  const [semSetRemote, setSemSetRemote] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  // Removed rows from redux since tag options now sourced exclusively from remote APIs

  const { appLanguage } = useAppLanguage();
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [otherLangCode, setOtherLangCode] = useState('en');

  // Use current language from header for fetching tag options
  const currentLangForTags = appLanguage?.currentLanguage || 'vi';
  const options: Option[] = getTagOptions(
    t,
    posSetRemote,
    nerSetRemote,
    semSetRemote
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

  // Auto-search when page changes (will invoke after handleFormFinish definition)

  useEffect(() => {
    // Refetch when either current language OR language pair changes (dropdown)
    const code = currentLangForTags;
    let cancelled = false;
    setPosSetRemote([]);
    setNerSetRemote([]);
    setSemSetRemote([]);

    Promise.all([
      fetchPOS(code).then(res => res.data?.data || []).catch(() => []),
      fetchNER(code).then(res => res.data?.data || []).catch(() => []),
      fetchSemantic(code).then(res => res.data?.data || []).catch(() => [])
    ]).then(([posArr, nerArr, semArr]) => {
      if (cancelled) return;
      setPosSetRemote(posArr);
      setNerSetRemote(nerArr);
      setSemSetRemote(semArr);
    });
    return () => { cancelled = true; };
  }, [currentLangForTags, appLanguage?.languagePair]);

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
      if (err && typeof err === 'object') {
        const anyErr = err as { message?: string; stack?: string };
        if (anyErr.message) console.log('Error message:', anyErr.message);
        if (anyErr.stack) console.log('Error stack:', anyErr.stack);
      }
      message.error(t('something_wrong'));
    }
  };

  useEffect(() => {
    if (!tagSelect || tagSelect.length !== 2) return;
    handleFormFinish();
  // Only re-run when pagination or tag changes intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page1, limit, tagSelect]);

  // Removed row selection handlers as they were unused in UI

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
              selectedRowKey={null}
              onRowSelect={() => {}}
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
              selectedRowKey={null}
              onRowSelect={() => {}}
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
