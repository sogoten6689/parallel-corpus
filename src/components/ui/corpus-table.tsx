'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tooltip, Typography } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { Point } from '@/types/point.type';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';

import { useQuery } from "@tanstack/react-query";
const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API;
//   const fetchRowWords = async (): Promise<{ data: RowWord[]}> => {
//     const res = await fetch(`${apiUrl}/words`);
//     if (!res.ok) throw new Error("Failed to fetch words");
//   return res.json();
// };
const fetchRowWords = async (
  page: number,
  limit: number,
  search?: string,
  lang?: string
): Promise<{ data: RowWord[]; total: number }> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) params.append("search", search);
  if (lang) params.append("lang", lang);

  const res = await fetch(`${apiUrl}/words?${params.toString()}`);
  
  if (!res.ok) throw new Error("Failed to fetch words");

  return res.json(); // expected format: { data: [...], total: number }
};


const { Text } = Typography;

type CorpusTableProps = {
  sentences: Record<string, Point>
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

export default function CorpusTable({ sentences }: CorpusTableProps) {
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
      const render = (text: string, record: RowWord) => (
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
  const [selectedWord, setSelectedWord] = useState<RowWord | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });


  const { data, isLoading, error } = useQuery({
    queryKey: ['words', pagination],
    queryFn: () => fetchRowWords(pagination.current, pagination.pageSize),
  });

  useEffect(() => {
    if (data) {
      setPagination({
        ...pagination,
        total: data.total,
      });
    }
  }, [data]);
  
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

  return (
    <div>
      <div className="mb-4">
        <Text strong>{t('total_rows')}: {data?.total || '--'}</Text>
        {/* <Text strong>{t('total_sentences')}: {Object.keys(sentences).length}</Text> */}
      </div>
      {isLoading && <p>{t('loading')}</p>}
      {error && <p>{t('error')}: {error.message}</p>}
      {data && (
        <>
          <Table
            dataSource={data.data}
            columns={columns}
            rowKey="ID"
            scroll={{ x: 'max-content' }}
            className='w-full'
            bordered
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
            }}
            onChange={(pagination, filters, sorter) => {
              handleTableChange(pagination, filters, sorter);
            }}
          />
        </>
      )}
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
