'use client';

import React from 'react';
import { Table } from 'antd';
import { RowWord } from '@/types/row-word.type';

const columns = [
  { title: 'ID', dataIndex: 'ID', key: 'ID' },
  { title: 'ID Sentence', dataIndex: 'ID_sen', key: 'ID_sen' },
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
  data: RowWord[]
}

export default function CorpusTable({ data }: CorpusTableProps) {
  return (
    <div style={{ padding: 16 }}>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="ID"
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
