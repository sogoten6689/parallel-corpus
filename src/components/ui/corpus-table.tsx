'use client';

import React from 'react';
import { Table, Tooltip } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { useTranslation } from 'react-i18next';

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
const columns = columnKeys.map(getColumnWithTooltip);

  return (
    <div style={{ padding: 16 }}>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="ID"
        scroll={{ x: 'max-content' }}
        className='w-full'
      />
    </div>
  );
}
