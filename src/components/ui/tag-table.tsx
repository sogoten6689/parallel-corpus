'use client';

import React from 'react';
import { Table } from 'antd';
import { RowWord } from '@/types/row-word.type';
// import { useTranslation } from "react-i18next";

const columns = [
  { title: 'Left', dataIndex: 'Left', key: 'Left' },
  { title: 'Key', dataIndex: 'Key', key: 'Key' },
  { title: 'Right', dataIndex: 'Right', key: 'Right' },
];

type TagTableProps = {
  data: RowWord[],
}

export default function TagTable({ data }: TagTableProps) {
  // const { t } = useTranslation();

  return (
    <div style={{ padding: 16 }}>
      <Table
        dataSource={data}
        columns={columns}
        scroll={{ x: 'max-content' }}
        className='w-full'
      />
    </div>
  );
}
