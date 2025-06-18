'use client';

import React, { useState } from 'react';
import { Table, Tooltip } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { useTranslation } from 'react-i18next';
import Modal from 'antd/es/modal/Modal';

type CorpusTableProps = {
  data: RowWord[]
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

export default function CorpusTable({ data }: CorpusTableProps) {
const { t } = useTranslation();


// Giả sử bạn dùng i18n
const getColumnWithTooltip = (key: string) => ({
  title: <Tooltip title={t(`${key}_tooltip`)}>{t(key)}</Tooltip>,
  dataIndex: getColumnKey(key),
  key: getColumnKey(key),
});

// Danh sách các cột
const columnKeys = ['id', 'word', 'lemma', 'links', 'morph', 'pos', 'phrase', 'grm', 'ner', 'semantic'];

// Tạo columns
const columns = columnKeys.map((key) => {
  const column = getColumnWithTooltip(key);

  // Thêm render nếu là 'Word' (hoặc 'ID')
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
    <div style={{ padding: 16 }}>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="ID"
        scroll={{ x: 'max-content' }}
        className='w-full'
      />
       <Modal
        title={`Chi tiết từ: ${selectedWord?.Word}`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {selectedWord && (
          <div>
            <p><strong>Word:</strong> {selectedWord.Word}</p>
            <p><strong>Lemma:</strong> {selectedWord.Lemma}</p>
            <p><strong>POS:</strong> {selectedWord.POS}</p>
            <p><strong>Morph:</strong> {selectedWord.Morph}</p>
            <p><strong>NER:</strong> {selectedWord.NER}</p>
            <p><strong>Semantic:</strong> {selectedWord.Semantic}</p>
            {/* Add more fields as needed */}
          </div>
        )}
      </Modal>
    </div>
  );
}
