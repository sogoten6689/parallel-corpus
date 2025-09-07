'use client';

import { useTranslation } from "react-i18next";
import { Divider, Input, Button, Radio, App, Form, Typography } from 'antd';
import { useEffect, useState, useCallback } from "react";
import { useAppLanguage } from "@/contexts/AppLanguageContext";
import { fetchDict } from "@/services/master/master-api";
import DicIdTable from "@/components/ui/dicid-table";
import { DicIdItem } from "@/types/dicid-item.type";

// Removed unused Select.Option destructuring

const Word: React.FC = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [otherLangCode, setOtherLangCode] = useState('en');
  const { appLanguage } = useAppLanguage();

  const [searchType, setSearchType] = useState('matches');
  const [searchText, setSearchText] = useState('');
  const [data_1, setData_1] = useState<DicIdItem[]>([]);
  const [data_2, setData_2] = useState<DicIdItem[]>([]);
  const [selectedRow1, setSelectedRow1] = useState<DicIdItem | null>(null);
  const [selectedRow2, setSelectedRow2] = useState<DicIdItem | null>(null); // used for second table selection
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();

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


  const handleRowSelect1 = (row: DicIdItem | null, index: number | null) => {
    setSelectedRow1(row);
    if (index !== null && data_2[index]) {
      setSelectedRow2(data_2.find((item) => item.id_string === row?.id_string) ?? null);
      // setSelectedRow2(data_2[index]);
    } else {
      setSelectedRow2(null);
    }
  };

  const handleRowSelect2 = (row: DicIdItem | null, index: number | null) => {
    setSelectedRow2(row);
    if (index !== null && data_1[index]) {
      setSelectedRow1(data_1.find((item) => item.id_string === row?.id_string) ?? null);
    } else {
      setSelectedRow1(null);
    }
  };
  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) {
      message.warning(t('missing_input'))
      return;
    }

    try {
      setData_1([]);
      setData_2([]);
      const res = await fetchDict(page, limit, currentLanguage,  appLanguage?.languagePair?? 'vi_en', otherLangCode, searchText, searchType === 'morphological', searchType === 'phrase');
      if (res.status !== 200) {
        message.error(res.statusText);
        return;
      } else {
        setData_1(res.data.data[currentLanguage]);
        setData_2(res.data.data[otherLangCode]);
        setTotal(res.data.metadata.total);
        setPage(res.data.metadata.page);
        setLimit(res.data.metadata.limit);
      }
    } catch (err) {
      console.log(err);

      message.error(t('something_wrong'));
    }
  }, [searchText, message, t, page, limit, currentLanguage, appLanguage?.languagePair, otherLangCode, searchType]);

  const handleFormFinish = () => {
    if (!searchText.trim()) {
      form.validateFields(['searchText']);
      return;
    }
    handleSearch();
  };

  useEffect(() => {
    if (!searchText.trim()) return;
    handleSearch();
  }, [handleSearch, searchText]);


  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFormFinish}
            className="w-full flex flex-row flex-wrap gap-2 items-center justify-center"
          >
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
                  { label: t('phrase'), value: 'phrase' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {t('search')}
              </Button>
            </Form.Item>
          </Form>

          <Divider>
            {t(currentLanguage ?? 'en')}
          </Divider>
          <DicIdTable
            data={data_1}
            languageCode={currentLanguage}
            selectedRowKey={selectedRow1 ? selectedRow1.id_sen : null}
            onRowSelect={handleRowSelect1}
            currentPage={page}
            total={total}
            onPageChange={setPage}
            pageSize={limit}
          />

          <Divider>
            {t(otherLangCode ?? 'en')}
          </Divider>
          <DicIdTable
            data={data_2}
            languageCode={otherLangCode}
            selectedRowKey={selectedRow2 ? selectedRow2.id_sen : null}
            onRowSelect={handleRowSelect2}
            onPageChange={setPage}
            currentPage={page}
            pageSize={limit}
            total={total}
          />
        </div>
      </div >
    </>
  );
};


export default Word;
