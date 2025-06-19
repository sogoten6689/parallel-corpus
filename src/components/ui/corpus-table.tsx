'use client';

import React from 'react';
import { Table, Typography } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { Point } from '@/types/point.type';

const { Text } = Typography;

const columns = [
  { title: 'ID', dataIndex: 'ID', key: 'ID' },
  { title: 'ID_sen', dataIndex: 'ID_sen', key: 'ID_sen' },
  { title: 'Word', dataIndex: 'Word', key: 'Word' },
  { title: 'Lemma', dataIndex: 'Lemma', key: 'Lemma' },
  { title: 'Links', dataIndex: 'Links', key: 'Links' },
  { title: 'Morph', dataIndex: 'Morph', key: 'Morph' },
  { title: 'POS', dataIndex: 'POS', key: 'POS' },
  { title: 'Phrase', dataIndex: 'Phrase', key: 'Phrase' },
  { title: 'Grm', dataIndex: 'Grm', key: 'Grm' },
  { title: 'NER', dataIndex: 'NER', key: 'NER' },
  { title: 'Semantic', dataIndex: 'Semantic', key: 'Semantic' },
];

type CorpusTableProps = {
  data: RowWord[],
  sentences: Record<string, Point>
}

export default function CorpusTable({ data, sentences }: CorpusTableProps) {
  return (
    <div style={{ padding: 16 }}>
      <div className="mb-4">
        <Text strong>Total items: {data.length}, total sentences: {Object.entries(sentences).length}</Text>
      </div>
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
