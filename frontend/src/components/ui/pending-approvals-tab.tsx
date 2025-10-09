'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Tag, message, Modal, Space } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getPendingSentencePairs, approveSentencePair, rejectSentencePair } from '@/services/sentence-pair/sentence-pair-api';
import type { SentencePair } from '@/types/sentence-pair.type';

const { Title, Text } = Typography;

const PendingApprovalsTab: React.FC = () => {
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

  const fetchPendingPairs = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    try {
      const response = await getPendingSentencePairs(page, pageSize);
      setSentencePairs(response.data);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.total,
      });
    } catch (error) {
      message.error('Failed to fetch pending sentence pairs');
      console.error('Error fetching pending pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPairs();
  }, []);

  const handleApprove = async (id: string) => {
    Modal.confirm({
      title: 'Approve Sentence Pair',
      content: 'Are you sure you want to approve this sentence pair?',
      onOk: async () => {
        try {
          await approveSentencePair(id);
          message.success(t('sentence_approved_successfully'));
          fetchPendingPairs(pagination.current, pagination.pageSize);
        } catch (error) {
          message.error('Failed to approve sentence pair');
          console.error('Error approving sentence pair:', error);
        }
      },
    });
  };

  const handleReject = async (id: string) => {
    Modal.confirm({
      title: 'Reject Sentence Pair',
      content: 'Are you sure you want to reject this sentence pair?',
      onOk: async () => {
        try {
          await rejectSentencePair(id);
          message.success(t('sentence_rejected_successfully'));
          fetchPendingPairs(pagination.current, pagination.pageSize);
        } catch (error) {
          message.error('Failed to reject sentence pair');
          console.error('Error rejecting sentence pair:', error);
        }
      },
    });
  };

  const handleView = (record: SentencePair) => {
    setSelectedPair(record);
    setViewModalVisible(true);
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
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: t('action'),
      key: 'action',
      width: 200,
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
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id!)}
            title={t('approve')}
            style={{ color: '#52c41a' }}
          />
          <Button
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id!)}
            title={t('reject')}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Title level={4}>{t('pending_approval')}</Title>
        
        {sentencePairs.length === 0 ? (
          <div className="text-center py-8">
            <Text type="secondary">{t('no_sentence_pairs')}</Text>
          </div>
        ) : (
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
                fetchPendingPairs(page, pageSize || 10);
              },
            }}
            scroll={{ x: 800 }}
          />
        )}
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
              <Text strong>Status:</Text> <Tag color="orange">{t('pending_approval')}</Tag>
            </div>
            <div>
              <Text strong>Created By:</Text> {selectedPair.createdBy}
            </div>
            <div>
              <Text strong>Created At:</Text> {selectedPair.createdAt ? new Date(selectedPair.createdAt).toLocaleString() : '-'}
            </div>
            
            <div className="mt-6">
              <Text strong>Analysis Results:</Text>
              <div className="mt-2 p-4 bg-blue-50 rounded">
                <Text type="secondary">
                  The sentence pair has been analyzed and is ready for approval. 
                  Click "Approve" to move it to the master database, or "Reject" to decline it.
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingApprovalsTab;
