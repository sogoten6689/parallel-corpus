'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Table, Button, Modal } from 'antd';
import { useTranslation } from "react-i18next";
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { alignSentence } from '@/dao/search-utils';
import { useSelector } from 'react-redux';
import { RootState } from "@/redux";
import { SentenceAlignment } from '@/types/alignment.type';
import { DicIdItem } from '@/types/dicid-item.type';
import { getAlignSentence } from '@/services/master/master-api';
import { useAppLanguage } from '@/contexts/AppLanguageContext';
import { DicSentenceAlignment } from '@/types/dic-alignment.type';

type DicIdTableProps = {
  data: DicIdItem[],
  languageCode: string,
  selectedRowKey?: React.Key | null,
  onRowSelect?: (row: DicIdItem | null, index: number | null) => void,
  currentPage?: number,
  onPageChange?: (page: number) => void,
  pageSize?: number,
  total?: number
};

export default function DicIdTable({
  data,
  languageCode,
  selectedRowKey,
  onRowSelect,
  currentPage = 1,
  onPageChange,
  pageSize = 6,
  total = 0
}: DicIdTableProps) {
  const { t } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<DicIdItem | null>(null);
  const [aligned, setAligned] = useState<DicSentenceAlignment | null>(null);
  const { appLanguage } = useAppLanguage();
  const [currentLanguage, setCurrentLanguage] = useState('vi');
  const [otherLangCode, setOtherLangCode] = useState('en');

  useEffect(() => {
    if (appLanguage) {
      setCurrentLanguage(appLanguage.currentLanguage);
      if (appLanguage.currentLanguage === appLanguage.languagePair.split('_')[0]) {
        setOtherLangCode(appLanguage.languagePair.split('_')[1]);
      } else {
        setOtherLangCode(appLanguage.languagePair.split('_')[0]);
      }
    }
  }, [appLanguage]);


  const handleOpenModal = async (row: DicIdItem) => {
    setModalRow(row);

    const res = await getAlignSentence(row.id_string, currentLanguage, appLanguage?.languagePair?? 'vi_en', otherLangCode);
    
    if (res) {
      setAligned(res.data);
    }

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
    



  const timer = setTimeout(() => {
    // console.log("Chạy lại sau 2 giây khi `data` thay đổi");
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
  }, 200);

  return () => clearTimeout(timer);
    
    
  }, [aligned, modalOpen]);

  useEffect(() => {
    if (!modalOpen) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      setModalRow(null);
      setAligned(null);
    }
  }, [modalOpen]);

  const columns: ColumnsType<DicIdItem> = [
    { title: t('left'), dataIndex: 'left', key: 'left', width: '40%', align: 'right' as const },
    { title: t('key'), dataIndex: 'center', key: 'center', width: '10%', align: 'center' as const },
    // { title: t('position'), dataIndex: 'position', key: 'position', width: '10%', align: 'center' as const },
    { title: t('right'), dataIndex: 'right', key: 'right', width: '40%', align: 'left' as const },
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
        rowKey={(record) => record.id_string + languageCode }
        scroll={{ x: 800 }}
        className='w-full'
        bordered
        size='small'
        pagination={{
          pageSize,
          current: currentPage,
          onChange: (page) => onPageChange && onPageChange(page),
          total: total,
        }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
          onChange: (selectedRowKeys, selectedRows) => {
            const key = selectedRowKeys.length > 0 ? selectedRowKeys[0] : null;
            const index = key ? data.findIndex(row => row.id_sen === key) : null;
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
                    // width={700}
                    height={160}
                    style={{
                      // border: '1px solid #ccc',
                      width: Math.max(
                        700,
                        padding * 2 + Math.max(
                          (aligned.sentence_1.length || 1),
                          (aligned.sentence_2.length || 1)
                        ) * (wordWidth + gap)
                      ),
                      // width: 700,

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
