'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tooltip, Typography } from 'antd';
import { RowWord } from '@/types/row-word.type';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';
import { useQuery } from "@tanstack/react-query";
import { getUser } from '@/services/user/user-api';

const fetchRowWords = async (
  page: number,
  limit: number,
  search?: string,
  lang?: string
): Promise<{ data: RowWord[]; total: number }> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) params.append("search", search);

  const res = await getUser(page, limit, search);
  
  return res.data; 

};


type UserTableProps = {
}

const getColumnKey = (key: string) => {
  switch (key) {
    // case 'id':
    //   return 'ID';
    // case 'full_name':
    //   return 'Full name';
    // case 'email':
    //   return 'Email';
    // case 'organization':
    //   return 'Organization';
    // case 'role':
    //   return 'Role';
    // case 'date_of_birth':
    //   return 'Date of birth';
    default:
    return key;
  }
}

export default function UserTable({ }: UserTableProps) {
  const { t } = useTranslation();

  const getColumnWithTooltip = (key: string) => ({
    title: <Tooltip title={t(`${key}`)}>{t(key)}</Tooltip>,
    dataIndex: getColumnKey(key),
    key: getColumnKey(key),
  });

  const columnKeys = ['id', 'full_name', 'email', 'organization', 'role', 'date_of_birth'];

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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });


  const { data, isLoading, error } = useQuery({
    queryKey: ['users', pagination],
    queryFn: () => fetchRowWords(pagination.current, pagination.pageSize),
  });

  useEffect(() => {
    if (data) {
      setPagination({
        ...pagination,
        total: data.total,
      });
    }
  }, [data]);
  
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };
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
      </div>
      {isLoading && <p>{t('loading')}</p>}
      {error && <p>{t('error')}: {error.message}</p>}
      {data && (
        <>
          <Table
            dataSource={data.data}
            columns={columns}
            rowKey="ID"
            scroll={{ x: 'max-content' }}
            className='w-full'
            bordered
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
            }}
            onChange={(pagination, filters, sorter) => {
              handleTableChange(pagination, filters, sorter);
            }}
          />
        </>
      )}
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
                <td><strong>{t('id')}:</strong></td>
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
