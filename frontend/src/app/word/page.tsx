'use client';

import TagTable from "@/components/ui/tag-table";
import { useTranslation } from "react-i18next";
import { Divider, Input, Button, Select, Radio, App, Form, Typography } from 'antd';
import { use, useEffect, useState } from "react";
import { RowWord } from "@/types/row-word.type";
import { searchPhraseAPI, searchWordAPI } from "@/services/rowword/rowword-api";
import { Sentence } from "@/types/sentence.type";
import { getSentencePairAPI } from "@/services/rowword/rowword-api";
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";
import { useAppLanguage } from "@/contexts/AppLanguageContext";
import { fetchDict } from "@/services/master/master-api";
import DicIdTable from "@/components/ui/dicid-table";
import { DicIdItem } from "@/types/dicid-item.type";

const { Option } = Select;

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
  // const [selectedRow1, setSelectedRow1] = useState<Sentence | null>(null);
  // const [selectedRow2, setSelectedRow2] = useState<Sentence | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
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

  const handleSearch = async () => {
  if (!searchText.trim()) {
      message.warning(t('missing_input'))
      return;
    }

    try {
      // if (searchType !== 'phrase') {
      //   listSentences = await searchWordAPI(
      //     searchText.trim(),
      //     searchType === 'morphological',
      //     langCode
      //   );
      // }
      // else {
      //   listSenPhrase = await searchPhraseAPI(
      //     searchText.trim(),
      //     langCode
      //   );
      // }
      const res = await fetchDict(page, limit, currentLanguage, otherLangCode, searchText);
      console.log(res);
      // if (res.status !== 200) {
      //   message.error(res.statusText);
      //   return;
      // }
      if (res.status !== 200) {
        message.error(res.statusText);
        return;
      } else {
        setData_1(res.data.data[currentLanguage]);
        setData_2(res.data.data[otherLangCode]);
      }
      // setData_2(res.data.data);
        
    } catch (err) {
      console.log(err);
      
      message.error(t('something_wrong'));
    }
  };

  const handleFormFinish = () => {
    if (!searchText.trim()) {
      form.validateFields(['searchText']);
      return;
    }
    handleSearch();
  };


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
                  { label: t('phrase'), value: 'phrase' },
                  { label: t('morphological'), value: 'morphological' },
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
            // selectedRowKey={selectedRow1 ? selectedRow1.id_sen : null}
            // onRowSelect={handleRowSelect1}
            currentPage={page}
            // onPageChange={setPage1}
            // pageSize={pageSize}
          />

          <Divider>
            {t(otherLangCode ?? 'en')}
          </Divider>
          <DicIdTable
            data={data_2}
            // selectedRowKey={selectedRow1 ? selectedRow1.id_sen : null}
            // onRowSelect={handleRowSelect1}
            currentPage={page}
            // onPageChange={setPage1}
            // pageSize={pageSize}
          />
        </div>
      </div >
    </>
  );
};


export default Word;
