'use client'

import { RowStat } from "@/types/row-stat.type"
import { Table } from "antd"
import { ColumnType } from "antd/es/table"
import { useTranslation } from "react-i18next"
import { useState } from "react";

type StatisticsTableProps = {
  data: RowStat[]
}

export default function StatisticsTable({
  data
}: StatisticsTableProps) {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(100);

  const columns: ColumnType<RowStat>[] = [
    {
      title: t('word'),
      dataIndex: 'Word',
      key: 'Word',
      sorter: (a, b) => a.Word.localeCompare(b.Word),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: t('count'),
      dataIndex: 'Count',
      key: 'Count',
      sorter: (a, b) => a.Count - b.Count,
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: t('percent'),
      dataIndex: 'Percent',
      key: 'Percent',
      sorter: (a, b) => a.Percent - b.Percent,
      sortDirections: ['descend', 'ascend'],
      render: (value: number) => value.toFixed(2) + '%'
    },
    {
      title: t('F'),
      dataIndex: 'F',
      key: 'F',
      sorter: (a, b) => a.F - b.F,
      sortDirections: ['descend', 'ascend'],
      render: (value: number) => value.toFixed(2)
    }
  ];

  return (
    <div>
      <Table
        dataSource={data}
        columns={columns}
        bordered
        size='small'
        rowKey={row => `${row.Word}`}
        showSorterTooltip={{ target: 'sorter-icon' }}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
      />
    </div>
  );
}