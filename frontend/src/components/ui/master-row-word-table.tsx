'use client';

import React, { useEffect, useState } from 'react';
import { message, Space, Table, Tooltip, Typography } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';
import { useQuery } from "@tanstack/react-query";
import { fetchMasterRowWords } from '@/services/master/master-api';
import { MasterRowWord } from '@/types/master-row-word.type';
import Card from 'antd/es/card/Card';
import Dropdown from 'antd/es/dropdown/dropdown';


const { Text } = Typography;

type MasterRowWordTableProps = {
}

export default function MasterRowWordTable({}: MasterRowWordTableProps) {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<MasterRowWord | null>(null);
  const [langCode, setLangCode] = useState<string | undefined>();
  const [search, setSearch] = useState<string | undefined>();
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

  const columnKeys = ['id', 'id_string', 'id_sen','word', 'lemma', 'links', 'morph', 'pos', 'phrase', 'grm', 'ner', 'semantic', 'lang_code'];

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

    return column;

  });

  // Query for WordRowMaster
  const { data: wordRowMasterData, isLoading: isLoadingMaster, error: errorMaster } = useQuery({
    queryKey: ['master-row-word', pagination.current, pagination.pageSize, langCode],
    queryFn: async () => {
      const res = await fetchMasterRowWords(pagination.current, pagination.pageSize, langCode);
      console.log(res);
      if (res.status !== 200) {
        message.error(res.statusText);
        return { data: [], total: null };
      }
      return { 
        data: res.data.data,
        total: res.data.total, 
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
  return (
    <div>
      <Card title={t('all_words')} className="mb-10">
        <div className="mb-4">
          <Text strong>{t('total_words')}: {( wordRowMasterData?.total|| '--')}</Text>
        </div>
        <div className="mb-4">
          <Text strong>{t('lang_code')}: {( wordRowMasterData?.langCode || '--')}</Text>
        </div>
        <div className="mb-4">
          <Text strong>{t('search')}: {( wordRowMasterData?.search || '--')}</Text>
        </div>
        <div>
          <Text strong>{t('language')}: </Text>
          <Dropdown menu={{ items: langCodes }} trigger={['click']} className='cursor-pointer'>
            <Space style={{ cursor: 'pointer' }}>
              {langCode ? t(langCode) : t('all')}
            </Space>
          </Dropdown>
        </div>
      </Card>
      {isLoading && <p>{t('loading')}</p>}
      <Table
        dataSource={tableData}
        columns={columns}
        rowKey="ID"
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
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td><strong>{t('word')}:</strong></td>
                <td>{selectedWord.word}</td>
              </tr>
              <tr>
                <td><strong>{t('lemma')}:</strong></td>
                <td>{selectedWord.lemma}</td>
              </tr>
              <tr>
                <td><strong>{t('pos')}:</strong></td>
                <td>{selectedWord.pos}</td>
              </tr>
              <tr>
                <td><strong>{t('morph')}:</strong></td>
                <td>{selectedWord.morph}</td>
              </tr>
              <tr>
                <td><strong>{t('ner')}:</strong></td>
                <td>{selectedWord.ner}</td>
              </tr>
              <tr>
                <td><strong>{t('semantic')}:</strong></td>
                <td>{selectedWord.semantic}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
