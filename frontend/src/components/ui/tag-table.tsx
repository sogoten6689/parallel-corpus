'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Table, Button, Modal } from 'antd';
import { useTranslation } from "react-i18next";
import { Sentence } from '@/types/sentence.type';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { alignSentence } from '@/dao/search-utils';
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";
import { SentenceAlignment } from '@/types/alignment.type';

type TagTableProps = {
  data: Sentence[],
  selectedRowKey?: React.Key | null,
  onRowSelect?: (row: Sentence | null, index: number | null) => void,
  currentPage?: number,
  onPageChange?: (page: number) => void,
  pageSize?: number
};

export default function TagTable({
  data,
  selectedRowKey,
  onRowSelect,
  currentPage = 1,
  onPageChange,
  pageSize = 6
}: TagTableProps) {
  const { t } = useTranslation();
  const rows_1 = useSelector((state: RootState) => state.dataSlice.rows_1),
    rows_2 = useSelector((state: RootState) => state.dataSlice.rows_2),
    dicId_1 = useSelector((state: RootState) => state.dataSlice.dicId_1),
    dicId_2 = useSelector((state: RootState) => state.dataSlice.dicId_2);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<Sentence | null>(null);
  const [aligned, setAligned] = useState<SentenceAlignment | null>(null);

  const handleOpenModal = (row: Sentence) => {
    setModalRow(row);
    const alignedResult: SentenceAlignment = alignSentence(row.ID_sen, rows_1, rows_2, dicId_1, dicId_2);
    setAligned(alignedResult);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalRow(null);
    setAligned(null);
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const padding = 40;
  const wordWidth = 40;
  const gap = 40;

  useEffect(() => {
    if (!aligned || !modalOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const topY = padding;
    const bottomY = canvas.height - padding;
    const sentence1 = aligned.sentence_1;
    const sentence2 = aligned.sentence_2;

    sentence1.forEach((word, i) => {
      const x = padding + i * (wordWidth + gap);
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(word.word, x + wordWidth / 2, topY - 10);

      ctx.beginPath();
      ctx.arc(x + wordWidth / 2, topY, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#1976d2';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '11px Arial';
      ctx.fillText(String(word.id), x + wordWidth / 2, topY + 4);
    });

    sentence2.forEach((word, i) => {
      const x = padding + i * (wordWidth + gap);
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(word.word, x + wordWidth / 2, bottomY + 30);

      ctx.beginPath();
      ctx.arc(x + wordWidth / 2, bottomY, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#388e3c';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '11px Arial';
      ctx.fillText(String(word.id), x + wordWidth / 2, bottomY + 4);
    });

    sentence1.forEach((word, i) => {
      const x1 = padding + i * (wordWidth + gap) + wordWidth / 2;
      word.id_target.forEach(targetId => {
        const targetIdx = sentence2.findIndex(w => w.id === targetId);
        if (targetIdx !== -1) {
          const x2 = padding + targetIdx * (wordWidth + gap) + wordWidth / 2;
          ctx.beginPath();
          ctx.moveTo(x1, topY + 18);
          ctx.lineTo(x2, bottomY - 18);
          ctx.strokeStyle = '#f50057';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });

    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [aligned, modalOpen]);

  const columns: ColumnsType<Sentence> = [
    { title: t('left'), dataIndex: 'Left', key: 'Left', width: '40%', align: 'right' as const },
    { title: t('key'), dataIndex: 'Center', key: 'Center', width: '10%', align: 'center' as const },
    { title: t('right'), dataIndex: 'Right', key: 'Right', width: '40%', align: 'left' as const },
    {
      title: t('view'),
      key: 'action',
      width: '10%',
      align: 'center' as const,
      render: (_, row) => (
        <Button
          size="small"
          onClick={() => handleOpenModal(row)}
          icon={<SearchOutlined />} />
      ),
    },
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
      <Modal
        open={modalOpen}
        onCancel={handleCloseModal}
        onOk={handleCloseModal}
        title={t('view_align')}
        footer={null}
        width={900}
        styles={{ body: { overflowX: 'auto' } }}
      >
        {modalRow && (
          <div>
            <div style={{ margin: '20px 0', overflowX: 'auto', width: '100%' }}>
              {aligned && (
                <div style={{ minWidth: 700, width: '100%', overflowX: 'auto' }}>
                  <canvas
                    ref={canvasRef}
                    width={padding * 2 + Math.max(
                      (aligned.sentence_1.length || 1),
                      (aligned.sentence_2.length || 1)
                    ) * (wordWidth + gap)}
                    height={160}
                    style={{
                      border: '1px solid #ccc',
                      width: Math.max(
                        700,
                        padding * 2 + Math.max(
                          (aligned.sentence_1.length || 1),
                          (aligned.sentence_2.length || 1)
                        ) * (wordWidth + gap)
                      ),
                      minWidth: 400,
                      display: 'block'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
