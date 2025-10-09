'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Tag, message, Modal, Space } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getSentencePairs, deleteSentencePair } from '@/services/sentence-pair/sentence-pair-api';
import type { SentencePair } from '@/types/sentence-pair.type';

const { Title, Text } = Typography;

const SentencePairsListTab: React.FC = () => {
  const { t } = useTranslation();
  const [sentencePairs, setSentencePairs] = useState<SentencePair[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPair, setSelectedPair] = useState<SentencePair | null>(null);

  const fetchSentencePairs = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    try {
      const response = await getSentencePairs(page, pageSize);
      setSentencePairs(response.data);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.total,
      });
    } catch (error) {
      message.error('Failed to fetch sentence pairs');
      console.error('Error fetching sentence pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentencePairs();
  }, []);

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete Sentence Pair',
      content: 'Are you sure you want to delete this sentence pair?',
      onOk: async () => {
        try {
          await deleteSentencePair(id);
          message.success(t('sentence_deleted_successfully'));
          fetchSentencePairs(pagination.current, pagination.pageSize);
        } catch (error) {
          message.error('Failed to delete sentence pair');
          console.error('Error deleting sentence pair:', error);
        }
      },
    });
  };

  const handleView = (record: SentencePair) => {
    setSelectedPair(record);
    setViewModalVisible(true);
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      draft: { color: 'default', text: 'Draft' },
      pending: { color: 'orange', text: t('pending_approval') },
      approved: { color: 'green', text: t('approved') },
      rejected: { color: 'red', text: t('rejected') },
    };
    
    const statusConfig = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
  };

  const columns = [
    {
      title: t('sentence_id'),
      dataIndex: 'sentenceId',
      key: 'sentenceId',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('vietnamese_text'),
      dataIndex: 'vietnameseText',
      key: 'vietnameseText',
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
          {text}
        </Text>
      ),
    },
    {
      title: t('english_text'),
      dataIndex: 'englishText',
      key: 'englishText',
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
          {text}
        </Text>
      ),
    },
    {
      title: t('lang_pair'),
      dataIndex: 'langPair',
      key: 'langPair',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t('action'),
      key: 'action',
      width: 150,
      render: (_, record: SentencePair) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title={t('view')}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id!)}
            title={t('delete')}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Title level={4}>{t('sentence_pair_list')}</Title>
        
        <Table
          columns={columns}
          dataSource={sentencePairs}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
            onChange: (page, pageSize) => {
              fetchSentencePairs(page, pageSize || 10);
            },
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={t('analyze_results')}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedPair && (
          <div className="space-y-4">
            <div>
              <Text strong>{t('sentence_id')}:</Text> {selectedPair.sentenceId}
            </div>
            <div>
              <Text strong>{t('vietnamese_text')}:</Text>
              <div className="mt-1 p-3 bg-gray-50 rounded">
                {selectedPair.vietnameseText}
              </div>
            </div>
            <div>
              <Text strong>{t('english_text')}:</Text>
              <div className="mt-1 p-3 bg-gray-50 rounded">
                {selectedPair.englishText}
              </div>
            </div>
            <div>
              <Text strong>Status:</Text> {getStatusTag(selectedPair.status)}
            </div>
            {selectedPair.vietnameseAnalysis && (
              <div>
                <Text strong>{t('vietnamese_text')} - {t('word_analysis')}:</Text>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Word</th>
                        <th className="p-2 text-left">Lemma</th>
                        <th className="p-2 text-left">POS</th>
                        <th className="p-2 text-left">NER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPair.vietnameseAnalysis.map((word, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{word.word}</td>
                          <td className="p-2">{word.lemma}</td>
                          <td className="p-2">{word.pos}</td>
                          <td className="p-2">{word.ner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {selectedPair.englishAnalysis && (
              <div>
                <Text strong>{t('english_text')} - {t('word_analysis')}:</Text>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Word</th>
                        <th className="p-2 text-left">Lemma</th>
                        <th className="p-2 text-left">POS</th>
                        <th className="p-2 text-left">NER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPair.englishAnalysis.map((word, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{word.word}</td>
                          <td className="p-2">{word.lemma}</td>
                          <td className="p-2">{word.pos}</td>
                          <td className="p-2">{word.ner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SentencePairsListTab;
