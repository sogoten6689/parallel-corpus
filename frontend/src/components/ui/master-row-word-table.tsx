'use client';

import React, { useEffect, useState } from 'react';
import { Button, Col, Input, Row, Space, Table, Tooltip, Typography, Tag, Descriptions } from 'antd';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';
import { useQuery } from "@tanstack/react-query";
import { fetchMasterRowWords, updateMasterRowWordApi } from '@/services/master/master-api';
import { MasterRowWord } from '@/types/master-row-word.type';
import Card from 'antd/es/card/Card';
import Dropdown from 'antd/es/dropdown/dropdown';
import { EditOutlined, DownOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import useApp from 'antd/es/app/useApp';


const { Text } = Typography;

type MasterRowWordTableProps = {
}

export default function MasterRowWordTable({ }: MasterRowWordTableProps) {
  const { t } = useTranslation();
  const { message } = useApp();
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalEditVisible, setIsModalEditVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<MasterRowWord | null>(null);
  const [langCode, setLangCode] = useState<string | undefined>('');
  const [search, setSearch] = useState<string | undefined>();
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const [totalAllSen, setTotalAllSen] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const getColumnWithTooltip = (key: string) => ({
    title: <Tooltip title={t(`${key}_tooltip`)}>{t(key)}</Tooltip>,
    dataIndex: key,
    key: key,
  });

  const columnKeys = ['id_string', 'id_sen', 'word', 'lemma', 'links', 'morph', 'pos', 'phrase', 'grm', 'ner', 'semantic', 'lang_pair', 'action'];

  const columns = columnKeys.map((key) => {
    const column = getColumnWithTooltip(key);

    if (key === 'id_string') {
      const render = (text: string, record: MasterRowWord) => (
        <a onClick={() => showModal(record)}>{text}</a>
      );
      return {
        ...column,
        render,
      };
    }

    if (key === 'lang_pair') {
      const render = (text: string, record: MasterRowWord) => {
        const lp = text ?? 'null';
        const lc = record.lang_code ?? 'null';
        const langColorMap: Record<string,string> = {
          vi: 'green',
          en: 'blue',
          ja: 'red',
          ko: 'magenta',
          zh: 'volcano'
        };
        return (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Space size={4} wrap style={{ justifyContent: 'center', display: 'flex', maxWidth: 160 }}>
              <Tag color={langColorMap[lp] || 'geekblue'}>{t(lp)}</Tag>
              <Tag color={langColorMap[lc] || 'default'}>{t(lc)}</Tag>
            </Space>
          </div>
        );
      };
      return {
        ...column,
        render,
        align: 'center' as const,
      };
    }


    if (key === 'action') {
      const render = (text: string, record: MasterRowWord) => (
        <>
          {user?.role === 'admin' &&
            <Button icon={<EditOutlined />} onClick={() => showModalEdit(record)}>{t('edit')}</Button>
          }
        </>
      );
      return {
        ...column,
        render,
      };
    }

    return column;

  });

  // Query for WordRowMaster
  const { data: wordRowMasterData, isLoading: isLoadingMaster, error: errorMaster } = useQuery({
    queryKey: ['master-row-word', pagination.current, pagination.pageSize, langCode, search],
    queryFn: async () => {
      const res = await fetchMasterRowWords(pagination.current, pagination.pageSize, langCode, search);
      if (res.status !== 200) {
        message.error(res.statusText);
        return { data: [], total: null };
      }
      setTotalAll(res.data.total_all);
      setTotalAllSen(res.data.total_all_sen);
      return {
        data: res.data.data,
        total: res.data.total,
        totalSen: res.data.total_sen,
        page: res.data.page,
        limit: res.data.limit,
        langCode: res.data.lang_code,
        search: res.data.search
      };
    },
  });

  useEffect(() => {
    if (wordRowMasterData) {
      setPagination(prev => ({
        ...prev,
        total: wordRowMasterData.total,
        pageSize: wordRowMasterData.limit,
        current: wordRowMasterData.page,
      }));
    }
  }, [wordRowMasterData]);

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };
  const showModal = (record: MasterRowWord) => {
    setSelectedWord(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedWord(null);
  };

  const showModalEdit = (record: MasterRowWord) => {
    setSelectedWord(record);
    setIsModalEditVisible(true);
  };

  const handleCancelEdit = () => {
    setIsModalEditVisible(false);
    setSelectedWord(null);
  };

  const isLoading = isLoadingMaster;
  const tableData = (wordRowMasterData?.data || [])

  const langCodes = [
    {
      key: 'all',
      label: t('all'),
      onClick: () => {
        setLangCode('');
      },
    },
    {
      key: 'vi',
      label: t('vi'),
      onClick: () => {
        setLangCode('vi');
      },
    },
    {
      key: 'en',
      label: t('en'),
      onClick: () => {
        setLangCode('en');
      },
    },
    {
      key: 'ja',
      label: t('ja'),
      onClick: () => {
        setLangCode('ja');
      },
    },
    {
      key: 'ko',
      label: t('ko'),
      onClick: () => {
        setLangCode('ko');
      },
    },
    {
      key: 'zh',
      label: t('zh'),
      onClick: () => {
        setLangCode('zh');
      },
    },
  ];

  const formatNumber = (n: number | null) => n != null ? n.toLocaleString() : '--';

  async function handleOkEdit(): Promise<void> {
    console.log(selectedWord);
    try {
      if (selectedWord) {
        const res = await updateMasterRowWordApi(selectedWord);

        if (res.status !== 200) {
          message.error(t('edit_failed'));
          return;
        } else {
          if (res.data?.data) {
            wordRowMasterData?.data?.forEach((word: MasterRowWord, index: number) => {
              if (word.id === selectedWord.id) {
                wordRowMasterData.data[index] = res.data?.data;
              }
            })
          }
          message.success(t('edit_success'));
          handleCancelEdit();
        }
      }
    } catch (error) {
      message.error(t('edit_failed'));
    }

  }

  const onChangeWord = (key: string, value: string) => {
    if (selectedWord) {
      setSelectedWord({
        ...selectedWord,
        [key]: value,
      });
    }
  }

  const renderViewDetails = () => {
    if (!selectedWord) return null;
    const fieldOrder = columnKeys.filter(k => k !== 'action');
    const langColorMap: Record<string,string> = {
      vi: 'green', en: 'blue', ja: 'red', ko: 'magenta', zh: 'volcano'
    };
    return (
      <Descriptions
        size="small"
        bordered
        column={1}
        labelStyle={{ width: 180, fontWeight: 600 }}
        contentStyle={{ background: '#fff' }}
      >
        {fieldOrder.map(key => {
          const rawVal = (selectedWord as any)[key];
          let value: any = rawVal;
          if (key === 'lang_pair') {
            const lp = rawVal ?? 'null';
            const lc = (selectedWord as any).lang_code ?? 'null';
            value = (
              <Space size={4} wrap>
                <Tag color={langColorMap[lp] || 'geekblue'}>{t(lp)}</Tag>
                <Tag color={langColorMap[lc] || 'default'}>{t(lc)}</Tag>
              </Space>
            );
          }
          return (
            <Descriptions.Item key={key} label={t(key)}>
              {value === undefined || value === null || value === '' ? '-' : value}
            </Descriptions.Item>
          );
        })}
      </Descriptions>
    );
  }

  return (
    <div>
      <Card className="mb-10">
        <Row gutter={[16, 12]} align="middle" wrap>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>{t('language')}</Text>
              <Dropdown menu={{ items: langCodes }} trigger={['click']} className='cursor-pointer' arrow>
                <Button size='middle' block>
                  {langCode ? t(langCode) : t('all')} <DownOutlined style={{ fontSize: 12, marginLeft: 6 }} />
                </Button>
              </Dropdown>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>{t('search')}</Text>
              <Input
                allowClear
                placeholder={t('input_keyword')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={2}>
              <Text strong>{t('total_words')}</Text>
              <Text>{formatNumber(wordRowMasterData?.total ?? null)}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size={2}>
              <Text strong>{t('total_sentences')}</Text>
              <Text>{formatNumber(wordRowMasterData?.totalSen ?? null)}</Text>
            </Space>
          </Col>
        </Row>
      </Card>
      {isLoading && <p>{t('loading')}</p>}
      <Table
        key={"master-row-word"}
        dataSource={tableData}
        columns={columns}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        className='w-full'
        bordered
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={(pagination, filters, sorter) => {
          handleTableChange(pagination, filters, sorter);
        }}
      />
      <Modal
        title={`${t('word_detail')}: '${selectedWord?.word}'`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        {renderViewDetails()}
      </Modal>

      <Modal
        title={`${t('word_edit')}: '${selectedWord?.word}'`}
        open={isModalEditVisible}
        onCancel={handleCancelEdit}
        onOk={handleOkEdit}
        okText={t('save')}
        cancelText={t('cancel')}
      >
        {selectedWord && (
          <table style={{ width: '100%', fontSize: '14px' }} key={selectedWord?.id + "modal"}>
            <tbody key={selectedWord?.id + "modal-tbody"}>
              {columns.map(({ key, title }, idx) => (
                  <tr
                    key={key + "modalEidt"}
                    hidden={key === 'action'}
                    style={{ verticalAlign: 'top' }}
                  >
                    <td style={{ padding: '6px 12px 4px 0', width: 160 }}>
                      <strong>{title}:</strong>
                    </td>
                    <td style={{ padding: '4px 0 14px' }}>
                      <Input
                        size="small"
                        placeholder={t(key)}
                        value={(selectedWord as any)[key]}
                        disabled={['id', 'id_sen', 'id_string', 'action', 'lang_code', 'lang_pair'].includes(key)}
                        onChange={(e) => onChangeWord(key, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
