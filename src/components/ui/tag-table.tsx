'use client';

import React from 'react';
import { Table } from 'antd';
import { useTranslation } from "react-i18next";
import { Sentence } from '@/types/sentence.type';
import type { ColumnsType } from 'antd/es/table';

type TagTableProps = {
  data: Sentence[],
  selectedRowKey?: React.Key | null,
  onRowSelect?: (row: Sentence | null, index: number | null) => void,
  currentPage?: number,
  onPageChange?: (page: number) => void,
  pageSize?: number,
};

export default function TagTable({
  data,
  selectedRowKey,
  onRowSelect,
  currentPage = 1,
  onPageChange,
  pageSize = 6,
}: TagTableProps) {
  const { t } = useTranslation();

  const columns: ColumnsType<Sentence> = [
    { title: t('left'), dataIndex: 'Left', key: 'Left', width: '45%', align: 'right' as const },
    { title: t('key'), dataIndex: 'Center', key: 'Center', width: '10%', align: 'center' as const },
    { title: t('right'), dataIndex: 'Right', key: 'Right', width: '45%', align: 'left' as const },
  ];

  return (
    <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
      <Table
        dataSource={data}
        columns={columns}
        rowKey={record => record.ID_sen}
        scroll={{ x: 800 }}
        className='w-full'
        bordered
        size='small'
        pagination={{
          pageSize,
          current: currentPage,
          onChange: (page) => onPageChange && onPageChange(page),
        }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
          onChange: (selectedRowKeys, selectedRows) => {
            const key = selectedRowKeys.length > 0 ? selectedRowKeys[0] : null;
            const index = key ? data.findIndex(row => row.ID_sen === key) : null;
            if (onRowSelect) {
              onRowSelect(selectedRows[0] || null, index);
            }
          },
        }}
        components={{
          body: {
            cell: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
              <td {...props} style={{ ...props.style, fontSize: '13px' }} />
            ),
          },
          header: {
            cell: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
              <th {...props} style={{ ...props.style, fontSize: '13px' }} />
            ),
          },
        }}
      />
    </div>
  );
}
