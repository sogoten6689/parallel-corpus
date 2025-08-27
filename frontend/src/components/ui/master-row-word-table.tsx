'use client';

import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Input, message, Row, Select, Space, Table, Tooltip, Typography } from 'antd';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';
import { useQuery } from "@tanstack/react-query";
import { fetchMasterRowWords } from '@/services/master/master-api';
import { MasterRowWord } from '@/types/master-row-word.type';
import Card from 'antd/es/card/Card';
import Dropdown from 'antd/es/dropdown/dropdown';
import { EditOutlined } from '@ant-design/icons';
const { Option } = Select;


const { Text } = Typography;

type MasterRowWordTableProps = {
}

export default function MasterRowWordTable({}: MasterRowWordTableProps) {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<MasterRowWord | null>(null);
  const [langCode, setLangCode] = useState<string | undefined>('');
  const [search, setSearch] = useState<string | undefined>();
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const [totalAllSen, setTotalAllSen] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const getColumnWithTooltip = (key: string) => ({
    title: <Tooltip title={t(`${key}_tooltip`)}>{t(key)}</Tooltip>,
    dataIndex: key,
    key: key,
  });

  const columnKeys = ['id_string', 'id_sen','word', 'lemma', 'links', 'morph', 'pos', 'phrase', 'grm', 'ner', 'semantic', 'lang_pair', 'action'];

  const columns = columnKeys.map((key) => {
    const column = getColumnWithTooltip(key);

    if (key === 'id_string') {
      const render = (text: string, record: MasterRowWord) => (
        <a onClick={() => showModal(record)}>{text}</a>
      );
      return {
        ...column,
        render,
      };
    }

    if (key === 'lang_pair') {
      const render = (text: string, record: MasterRowWord) => (
        <div className="center">
          <div>
            <Button size="small" type='primary'>{t(text ?? 'null')}</Button>
          </div>
          <Button size="small" type='dashed'>{t(record.lang_code ?? 'null')}</Button>
        </div>
      );
      return {
        ...column,
        render,
      };
    }


    if (key === 'action') {
      const render = (text: string, record: MasterRowWord) => (
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>{t('edit')}</Button>
      );
      return {
        ...column,
        render,
      };
    }

    return column;

  });

  // Query for WordRowMaster
  const { data: wordRowMasterData, isLoading: isLoadingMaster, error: errorMaster } = useQuery({
    queryKey: ['master-row-word', pagination.current, pagination.pageSize, langCode, search],
    queryFn: async () => {
      const res = await fetchMasterRowWords(pagination.current, pagination.pageSize, langCode, search);
      console.log(res);
      if (res.status !== 200) {
        message.error(res.statusText);
        return { data: [], total: null };
      }
      setTotalAll(res.data.total_all);
      setTotalAllSen(res.data.total_all_sen);
      return { 
        data: res.data.data,
        total: res.data.total,
        totalSen: res.data.total_sen,
        page: res.data.page,
        limit: res.data.limit, 
        langCode: res.data.lang_code,
        search: res.data.search
      };
    },
  });

  useEffect(() => {
    if (wordRowMasterData) {
      setPagination(prev => ({
        ...prev,
        total: wordRowMasterData.total,
        pageSize: wordRowMasterData.limit,
        current: wordRowMasterData.page,
      }));
    }
  }, [wordRowMasterData]);
  
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };
  const showModal = (record: MasterRowWord) => {
    setSelectedWord(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedWord(null);
  };

  const isLoading = isLoadingMaster;
  const tableData = (wordRowMasterData?.data || [])
  
  const langCodes = [
    {
      key: 'all',
      label: t('all'),
      onClick: () => {
        setLangCode('');
      },
    },
    {
      key: 'vi',
      label: t('vi'),
      onClick: () => {
        setLangCode('vi');
      },
    },
    {
      key: 'en',
      label: t('en'),
      onClick: () => {
        setLangCode('en');
      },
    },
    {
      key: 'ja',
      label: t('ja'),
      onClick: () => {
        setLangCode('ja');
      },
    },
    {
      key: 'ko',
      label: t('ko'),
      onClick: () => {
        setLangCode('ko');
      },
    },
    {
      key: 'zh',
      label: t('zh'),
      onClick: () => {
        setLangCode('zh');
      },
    },
  ];

  const renderTitle = () => {
    return (
      <div>
        {t('all_words').toUpperCase() + ` (${totalAll?.toLocaleString() || '--'})`}
        <br />
        <h5 className='text-sm'>({t('all_sentences').toLowerCase() + `: ${totalAllSen?.toLocaleString() || '--'}`})</h5>
      </div>
    );
  };

  return (
    <div>
      <Card title={renderTitle()} className="mb-10">
        <Row>
          <Col span={6}>
            <Text strong>{t('language')}: </Text>
            <Dropdown menu={{ items: langCodes }} trigger={['click']} className='cursor-pointer primary btn'>
              <Space style={{ cursor: 'pointer' }}>
                <Button size='small'>{langCode ? t(langCode) : t('all')}</Button>
              </Space>
            </Dropdown>
          </Col>
          <Col span={6}>
            <div>
              <Input
                placeholder={t("input_keyword")}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </Col>
          <Col span={6}></Col>
          <Col span={6}></Col>
        </Row>
        <Row>
          <Col span={6}>
            <Text strong>{t('total_words')}: {( wordRowMasterData?.total.toLocaleString() || '--')}</Text>
          </Col>
          <Col span={6}>
            <Text strong>{t('total_sentences')}: {( wordRowMasterData?.totalSen.toLocaleString() || '--')}</Text>
          </Col>
          <Col span={6}></Col>
          <Col span={6}></Col>
        </Row>
      </Card>
      {isLoading && <p>{t('loading')}</p>}
      <Table
        key={"master-row-word"}
        dataSource={tableData}
        columns={columns}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        className='w-full'
        bordered
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={(pagination, filters, sorter) => {
          handleTableChange(pagination, filters, sorter);
        }}
      />
      <Modal
        title={`${t('word_detail')}: '${selectedWord?.word}'`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {selectedWord && (
          <table style={{ width: '100%', fontSize: '14px' }} key={selectedWord?.id + "modal"}>
            <tbody key={selectedWord?.id + "modal-tbody"}>
                {columns.map(({ key, title }) => (
                    <tr key={key + "modal"}>
                      <td><strong>{title}:</strong></td>
                      <td>{(selectedWord as any)[key]}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
