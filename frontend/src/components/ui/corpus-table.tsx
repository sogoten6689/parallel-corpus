'use client';

import React, { useEffect, useState } from 'react';
import { message, Table, Tooltip, Typography } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { MasterRowWord } from '@/types/master-row-word.type';
import { Point } from '@/types/point.type';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';

import { useQuery } from "@tanstack/react-query";
import { fetchWordRowMasters, getWordRowMasterCount } from '@/services/word-row-master/word-row-master-api';
import { fetchMasterRowWords } from '@/services/master/master-api';


const { Text } = Typography;

type CorpusTableProps = {
  sentences?: Record<string, Point>;
  langCode?: string;
  useWordRowMaster?: boolean;
}

export default function CorpusTable({ sentences, langCode, useWordRowMaster = false }: CorpusTableProps) {
  const { t } = useTranslation();

  const getColumnWithTooltip = (key: string) => ({
    title: <Tooltip title={t(`${key}_tooltip`)}>{t(key)}</Tooltip>,
    dataIndex: key,
    key: key,
  });

  const columnKeys = ['id', 'id_string', 'id_sen','word', 'lemma', 'links', 'morph', 'pos', 'phrase', 'grm', 'ner', 'semantic', 'lang_code'];

  const columns = columnKeys.map((key) => {
    const column = getColumnWithTooltip(key);

    if (key === 'idString') {
      const render = (text: string, record: any) => (
        <a onClick={() => showModal(record)}>{text}</a>
      );
      return {
        ...column,
        render,
      };
    }

    return column;

  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
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
      return { data: res.data.data, total: res.data.total };
    },
    enabled: useWordRowMaster,
  });

  useEffect(() => {
    if (useWordRowMaster && wordRowMasterData) {
      setPagination(prev => ({
        ...prev,
        total: wordRowMasterData.total,
      }));
    }
  }, [wordRowMasterData, useWordRowMaster]);
  
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };
  const showModal = (record: RowWord) => {
    setSelectedWord(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedWord(null);
  };

  // Determine data source and loading state
  const isLoading = useWordRowMaster ? isLoadingMaster : false;
  const tableData = useWordRowMaster ? 
    (wordRowMasterData?.data || []) :
    (sentences ? Object.values(sentences).map(point => point as unknown as MasterRowWord) : []);

  return (
    <div>
      <div className="mb-4">
        <Text strong>{t('total_rows')}: {useWordRowMaster ? (wordRowMasterData?.total || '--') : (tableData.length || '--')}</Text>
      </div>
      {isLoading && <p>{t('loading')}</p>}
      {(useWordRowMaster ? errorMaster : false) && <p>{t('error')}: {errorMaster?.message}</p>}
      <Table
        dataSource={tableData}
        columns={columns}
        rowKey="ID"
        scroll={{ x: 'max-content' }}
        className='w-full'
        bordered
        loading={isLoading}
        pagination={useWordRowMaster ? {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        } : false}
        onChange={useWordRowMaster ? (pagination, filters, sorter) => {
          handleTableChange(pagination, filters, sorter);
        } : undefined}
      />
      <Modal
        title={`${t('word_detail')}: '${selectedWord?.Word}'`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {selectedWord && (
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td><strong>{t('word')}:</strong></td>
                <td>{selectedWord.Word}</td>
              </tr>
              <tr>
                <td><strong>{t('lemma')}:</strong></td>
                <td>{selectedWord.Lemma}</td>
              </tr>
              <tr>
                <td><strong>{t('pos')}:</strong></td>
                <td>{selectedWord.POS}</td>
              </tr>
              <tr>
                <td><strong>{t('morph')}:</strong></td>
                <td>{selectedWord.Morph}</td>
              </tr>
              <tr>
                <td><strong>{t('ner')}:</strong></td>
                <td>{selectedWord.NER}</td>
              </tr>
              <tr>
                <td><strong>{t('semantic')}:</strong></td>
                <td>{selectedWord.Semantic}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
