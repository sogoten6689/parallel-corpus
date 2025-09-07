'use client';

import StatisticsTable from "@/components/ui/statistics-table";
import { RootState } from "@/redux";
import { RowStat } from "@/types/row-stat.type";
import { Option } from '@/types/option.type';
import { Button, Cascader, CascaderProps, Col, Flex, Row, Select, Typography, Form } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { fetchPOS, fetchNER, fetchSemantic } from '@/services/master/master-api';
import { useAppLanguage } from '@/contexts/AppLanguageContext';

const Statistical: React.FC = () => {
  const { t } = useTranslation();
  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1);
  const rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2);
  const lang_1 = useSelector((state: RootState) => state.dataSlice.lang_1);
  const lang_2 = useSelector((state: RootState) => state.dataSlice.lang_2);

  const { appLanguage } = useAppLanguage();
  const currentLang = appLanguage?.currentLanguage || lang_1 || 'vi';

  const baseRows = currentLang === lang_2 ? rows_2 : rows_1; // decide which corpus aligns with header language

  const [topResults, setTopResults] = useState('all');
  const [tagSelect, setTagSelect] = useState(['all']);
  const [numTypes, setNumTypes] = useState(1);
  const [data, setData] = useState<RowStat[]>([]);
  const [posSetRemote, setPosSetRemote] = useState<string[]>([]);
  const [nerSetRemote, setNerSetRemote] = useState<string[]>([]);
  const [semSetRemote, setSemSetRemote] = useState<string[]>([]);

  const handleTopResults = (value: string) => {
    setTopResults(value);
  };

  const handleTagSelect: CascaderProps<Option>['onChange'] = (value) => {
    setTagSelect(value);
  };
  // Token count still derived from corpus for frequency calculations
  const numTokens = baseRows.length;

  // Fetch remote tag options when current language (or language pair) changes; remote only (no local fallback)
  useEffect(() => {
    let cancelled = false;
    const code = currentLang;
    setPosSetRemote([]);
    setNerSetRemote([]);
    setSemSetRemote([]);
    Promise.all([
      fetchPOS(code).then(r => r.data?.data || []).catch(() => []),
      fetchNER(code).then(r => r.data?.data || []).catch(() => []),
      fetchSemantic(code).then(r => r.data?.data || []).catch(() => [])
    ]).then(([posArr, nerArr, semArr]) => {
      if (cancelled) return;
      setPosSetRemote(posArr);
      setNerSetRemote(nerArr);
      setSemSetRemote(semArr);
      // If previously selected specific tag no longer exists, reset to 'all'
      if (tagSelect.length === 2) {
        const [cat, val] = tagSelect;
        const exists = (
          (cat === 'pos' && posArr.includes(val)) ||
          (cat === 'ner' && nerArr.includes(val)) ||
          (cat === 'semantic' && semArr.includes(val))
        );
        if (!exists) setTagSelect(['all']);
      }
    });
    return () => { cancelled = true; };
  }, [currentLang, appLanguage?.languagePair, tagSelect]);

  const options: Option[] = [
    {
      value: 'all',
      label: t('all'),
    },
    {
      value: 'pos',
      label: t('pos'),
      children: posSetRemote.map((pos: string) => ({ value: pos, label: pos })),
    },
    {
      value: 'ner',
      label: t('ner'),
      children: nerSetRemote.map((ner: string) => ({ value: ner, label: ner })),
    },
    {
      value: 'semantic',
      label: t('semantic'),
      children: semSetRemote.map((sem: string) => ({ value: sem, label: sem })),
    }
  ];

  const getData = () => {
    const data: Record<string, number> = {};
    for (const row of baseRows) {
      const wordKey = row.Word.toLowerCase();
      const matches = (tagSelect.length === 1 && tagSelect[0] === 'all') ||
        (tagSelect.length === 2 && tagSelect[0] === 'pos' && row.POS.toLowerCase() === tagSelect[1].toLowerCase()) ||
        (tagSelect.length === 2 && tagSelect[0] === 'ner' && row.NER.toLowerCase() === tagSelect[1].toLowerCase()) ||
        (tagSelect.length === 2 && tagSelect[0] === 'semantic' && row.Semantic.toLowerCase() === tagSelect[1].toLowerCase());
      if (!matches) continue;
      data[wordKey] = (data[wordKey] || 0) + 1;
    }
    return data;
  };

  const showData = (data: Record<string, number>) => {
    const punc = [",", ".", "\"", "\\", "/", ":", ";", "'", "?", "<", ">", "|", "!", "#", "-", "_", "`", "~", "&", "*", "(", ")"];
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    let count = 0;
    const newData: RowStat[] = [];

    sorted.forEach(([k, v]) => {
      if (!punc.includes(k)) {
        count++;
        if (topResults !== 'all' && count > Number(topResults)) {
          return;
        }
        const percent = v * 100 / numTokens, f = -Math.log10(v / numTokens),
          row = new RowStat(k, v, percent, f);
        newData.push(row);
      }
    });

    setData(newData);
  }

  const handleViewButton = async () => {
    try {
      const res = await fetchSemantic(currentLang);
      const items: Array<{ Word: string; Count: number; Percent: number; F: number; }> = res.data?.data || [];

      const sorted = items.sort((a, b) => (b.Count - a.Count) || a.Word.localeCompare(b.Word));
      const limitedItems = topResults !== 'all' ? sorted.slice(0, Number(topResults)) : sorted;

      const rows: RowStat[] = limitedItems.map(it => new RowStat(it.Word, it.Count, it.Percent, it.F));
      setData(rows);
      setNumTypes(items.length);
    } catch (e) {
      // Fallback to local computation if API fails
      const data = getData();
      setNumTypes(Object.keys(data).length);
      showData(data);
    }
  };

  // Auto load default data on mount and when language changes
  useEffect(() => {
    handleViewButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLang]);

  const [form] = Form.useForm();

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3">
          <Row gutter={16}>
            <Col span={16}>
              <StatisticsTable data={data}></StatisticsTable>
            </Col>
            <Col span={8}>
              <Flex vertical gap={16}>
                <Flex gap='small' align='center'>
                  <Typography.Title level={5} className="font-semibold !mb-0">{t('current_language')}:</Typography.Title>
                  <Typography.Text strong>{t(currentLang)}</Typography.Text>
                </Flex>
                <Typography.Title level={5} className='!mb-0'>{t('total_types')}: {numTypes}, {t('total_tokens')}: {numTokens}</Typography.Title>
                <Flex gap='small' align='center'>
                  <Typography.Title level={5} className='!mb-0'>{t('select_top')}</Typography.Title>
                  <Select
                    defaultValue={topResults}
                    style={{ width: 120 }}
                    onChange={handleTopResults}
                    options={[
                      { value: 'all', label: t('all') },
                      { value: '10', label: '10' },
                      { value: '20', label: '20' },
                      { value: '30', label: '30' },
                      { value: '40', label: '40' },
                      { value: '50', label: '50' },
                      { value: '60', label: '60' },
                      { value: '70', label: '70' },
                      { value: '80', label: '80' },
                      { value: '90', label: '90' },
                      { value: '100', label: '100' },
                    ]}
                  />
                </Flex>
                <Flex gap='small' align="center">
                  <Typography.Title level={5} className="!mb-0">{t('filter_tag')}</Typography.Title>
                  <Form form={form} layout="inline" className="flex items-center" style={{ marginBottom: 0 }}>
                    <Form.Item name="tagSelect" initialValue={tagSelect} className="flex items-center !mb-0">
                      <Cascader
                        options={options}
                        onChange={(value, opts) => { handleTagSelect(value, opts); form.setFieldsValue({ tagSelect: value }); }}
                        placeholder={t('please_select')}
                        value={tagSelect}
                        className="flex items-center"
                      />
                    </Form.Item>
                  </Form>
                </Flex>
                <Flex gap='small' justify="center">
                  <Button type='primary' onClick={handleViewButton}>
                    {t('view')}
                  </Button>
                </Flex>
              </Flex>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}

export default Statistical;
