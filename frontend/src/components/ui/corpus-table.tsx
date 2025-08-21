'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tooltip, Typography } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { WordRowMaster } from '@/types/word-row-master.type';
import { Point } from '@/types/point.type';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';

import { useQuery } from "@tanstack/react-query";
import { fetchWordRowMasters, getWordRowMasterCount } from '@/services/word-row-master/word-row-master-api';


const { Text } = Typography;

type CorpusTableProps = {
  sentences?: Record<string, Point>;
  langCode?: string;
  useWordRowMaster?: boolean;
}

const getColumnKey = (key: string) => {
  switch (key) {
    case 'id':
      return 'ID';
    case 'word':
      return 'Word';
    case 'Lemma':
      return 'Lemma';
    case 'links':
      return 'Links';
    case 'morph':
      return 'Morph';
    case 'pos':
      return 'POS';
    case 'phrase':
      return 'Phrase';
    case 'grm':
      return 'Grm';
    case 'ner':
      return 'NER';
    case 'semantic':
      return 'Semantic';
    case 'langCode':
      return 'Lang_code';
    default:
      return key;
  }
}

export default function CorpusTable({ sentences, langCode, useWordRowMaster = false }: CorpusTableProps) {
  const { t } = useTranslation();

  const getColumnWithTooltip = (key: string) => ({
    title: <Tooltip title={t(`${key}_tooltip`)}>{t(key)}</Tooltip>,
    dataIndex: getColumnKey(key),
    key: getColumnKey(key),
  });

  const columnKeys = ['id', 'word', 'lemma', 'links', 'morph', 'pos', 'phrase', 'grm', 'ner', 'semantic', 'langCode'];

  const columns = columnKeys.map((key) => {
    const column = getColumnWithTooltip(key);

    if (key === 'id') {
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
    queryKey: ['word-row-master', pagination.current, pagination.pageSize, langCode],
    queryFn: async () => {
      const data = await fetchWordRowMasters(pagination.current, pagination.pageSize, langCode);
      const count = await getWordRowMasterCount(langCode);
      return { data, total: count.total };
    },
    enabled: useWordRowMaster,
  });

  // Convert WordRowMaster to RowWord format for display
  const transformWordRowMasterToRowWord = (wordMaster: WordRowMaster): RowWord => ({
    ID: wordMaster.row_word_id || '',
    ID_sen: wordMaster.id_sen || '',
    Word: wordMaster.word || '',
    Lemma: wordMaster.lemma || '',
    Links: wordMaster.links || '',
    Morph: wordMaster.morph || '',
    POS: wordMaster.pos || '',
    Phrase: wordMaster.phrase || '',
    Grm: wordMaster.grm || '',
    NER: wordMaster.ner || '',
    Semantic: wordMaster.semantic || '',
    Lang_code: wordMaster.lang_code || '',
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
    (wordRowMasterData?.data?.map(transformWordRowMasterToRowWord) || []) :
    (sentences ? Object.values(sentences).map(point => point as unknown as RowWord) : []);

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
