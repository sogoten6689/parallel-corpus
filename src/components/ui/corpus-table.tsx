'use client';

import React, { useState } from 'react';
import { Table, Tooltip, Typography } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { Point } from '@/types/point.type';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';

const { Text } = Typography;

type CorpusTableProps = {
  data: RowWord[],
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
    default:
      return key;
  }
}

export default function CorpusTable({ data, sentences }: CorpusTableProps) {
  const { t } = useTranslation();

  const getColumnWithTooltip = (key: string) => ({
    title: <Tooltip title={t(`${key}_tooltip`)}>{t(key)}</Tooltip>,
    dataIndex: getColumnKey(key),
    key: getColumnKey(key),
  });

  const columnKeys = ['id', 'word', 'lemma', 'links', 'morph', 'pos', 'phrase', 'grm', 'ner', 'semantic'];

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
        <Text strong>{t('total_rows')}: {data.length}, {t('total_sentences')}: {Object.entries(sentences).length}</Text>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="ID"
        scroll={{ x: 'max-content' }}
        className='w-full'
        bordered
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
