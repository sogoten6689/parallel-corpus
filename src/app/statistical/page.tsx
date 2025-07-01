'use client';

import StatisticsTable from "@/components/ui/statistics-table";
import { getNERSet, getPOSSet, getSEMSet } from "@/dao/data-utils";
import { RootState } from "@/redux";
import { RowStat } from "@/types/row-stat.type";
import { Button, Cascader, CascaderProps, Col, Flex, Row, Select, Switch, Typography } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

interface Option {
  value: string;
  label: string;
  children?: Option[];
}

const Statistical: React.FC = () => {
  const { t } = useTranslation();
  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2),
    lang_1 = useSelector((state: RootState) => state.dataSlice.lang_1),
    lang_2 = useSelector((state: RootState) => state.dataSlice.lang_2);

  const [showFirst, setShowFirst] = useState(true),
    [topResults, setTopResults] = useState('all'),
    [tagSelect, setTagSelect] = useState(['all']),
    [numTypes, setNumTypes] = useState(1),
    [data, setData] = useState<RowStat[]>([]);

  const handleTopResults = (value: string) => {
    setTopResults(value);
  };

  const handleSwitch = (checked: boolean) => {
    setShowFirst(checked);
  };

  const handleTagSelect: CascaderProps<Option>['onChange'] = (value) => {
    setTagSelect(value);
  };

  const posSet = showFirst ? getPOSSet(rows_1) : getPOSSet(rows_2),
    nerSet = showFirst ? getNERSet(rows_1) : getNERSet(rows_2),
    semSet = showFirst ? getSEMSet(rows_1) : getSEMSet(rows_2),
    numTokens = showFirst ? rows_1.length : rows_2.length;

  const options: Option[] = [
    {
      value: 'all',
      label: t('all'),
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

  const getData = () => {
    const corpus = showFirst ? rows_1 : rows_2;
    const data: Record<string, number> = {};

    corpus.map(row => {
      if ((tagSelect.length === 1 && tagSelect[0] === 'all') ||
        (tagSelect.length === 2 && tagSelect[0] === 'pos' && row.POS.toLowerCase() === tagSelect[1].toLowerCase()) ||
        (tagSelect.length === 2 && tagSelect[0] === 'ner' && row.NER.toLowerCase() === tagSelect[1].toLowerCase()) ||
        (tagSelect.length === 2 && tagSelect[0] === 'semantic' && row.Semantic.toLowerCase() === tagSelect[1].toLowerCase())) {
        if (Object.keys(data).includes(row.Word.toLowerCase())) {
          data[row.Word.toLowerCase()] += 1;
        } else {
          data[row.Word.toLowerCase()] = 1;
        }
      }
    });
    return data;
  }

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

  const handleViewButton = () => {
    const data = getData();
    setNumTypes(Object.keys(data).length);
    showData(data);
  };

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3">
          <Row gutter={24}> {/* Add gutter for column spacing */}
            <Col span={16}>
              <StatisticsTable data={data}></StatisticsTable>
            </Col>
            <Col span={8}>
              <Flex vertical gap={24}>
                <Flex gap='middle'>
                  <Typography.Title level={5} className="font-semibold">{t("select_language")}</Typography.Title>
                  <Switch
                    checked={showFirst}
                    onChange={handleSwitch}
                    checkedChildren={lang_1 ? t(lang_1) : t("lang1")}
                    unCheckedChildren={lang_2 ? t(lang_2) : t("lang2")}
                  />
                </Flex>
                <Typography.Title level={5}>{t('total_types')}: {numTypes}, {t('total_tokens')}: {numTokens}</Typography.Title>
                <Flex gap='middle'>
                  <Typography.Title level={5}>{t('select_top')}</Typography.Title>
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
                <Flex gap='middle'>
                  <Typography.Title level={5}>{t('filter_tag')}</Typography.Title>
                  <Cascader options={options} onChange={handleTagSelect} placeholder={t('please_select')} defaultValue={tagSelect} />
                </Flex>
                <Button type='primary' onClick={handleViewButton}>{t('view')}</Button>
              </Flex>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}

export default Statistical;
