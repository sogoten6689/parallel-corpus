'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Tag, message, Modal, Space, Select } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getPendingSentencePairs, approveSentencePair, rejectSentencePair, getSentencePairAnalysis } from '@/services/sentence-pair/sentence-pair-api';
import { fetchPOS, fetchNER, fetchSemantic } from '@/services/master/master-api';
import type { SentencePair } from '@/types/sentence-pair.type';

const { Title, Text } = Typography;

type PendingApprovalsTabProps = { active?: boolean };

const PendingApprovalsTab: React.FC<PendingApprovalsTabProps> = ({ active }) => {
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPair, setEditingPair] = useState<SentencePair | null>(null);
  const [viEditingIdx, setViEditingIdx] = useState<number | null>(null);
  const [enEditingIdx, setEnEditingIdx] = useState<number | null>(null);

  // Dropdown options for POS/NER/Semantic
  const [viPosOptions, setViPosOptions] = useState<string[]>([]);
  const [viNerOptions, setViNerOptions] = useState<string[]>([]);
  const [viSemOptions, setViSemOptions] = useState<string[]>([]);
  const [enPosOptions, setEnPosOptions] = useState<string[]>([]);
  const [enNerOptions, setEnNerOptions] = useState<string[]>([]);
  const [enSemOptions, setEnSemOptions] = useState<string[]>([]);

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
    if (active) {
      fetchPendingPairs(1, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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

  const handleView = async (record: SentencePair) => {
    try {
      const loaded = await getSentencePairAnalysis(record.sentenceId);
      const merged: SentencePair = {
        ...record,
        vietnamese_analysis: undefined,
        english_analysis: undefined,
        vietnameseAnalysis: loaded.vietnameseAnalysis,
        englishAnalysis: loaded.englishAnalysis,
      } as any;
      setSelectedPair(merged);
    } catch {
      setSelectedPair(record);
    }
    setViewModalVisible(true);
  };

  const handleOpenEdit = (record: SentencePair) => {
    const clone: SentencePair = JSON.parse(JSON.stringify(record));
    setEditingPair(clone);
    setEditModalVisible(true);
    // Fetch dropdowns for vi and en
    Promise.all([
      fetchPOS('vi').then(r => r.data?.data || []).catch(() => []),
      fetchNER('vi').then(r => r.data?.data || []).catch(() => []),
      fetchSemantic('vi').then(r => r.data?.data || []).catch(() => []),
      fetchPOS('en').then(r => r.data?.data || []).catch(() => []),
      fetchNER('en').then(r => r.data?.data || []).catch(() => []),
      fetchSemantic('en').then(r => r.data?.data || []).catch(() => []),
    ]).then(([vPos, vNer, vSem, ePos, eNer, eSem]) => {
      setViPosOptions(vPos);
      setViNerOptions(vNer);
      setViSemOptions(vSem);
      setEnPosOptions(ePos);
      setEnNerOptions(eNer);
      setEnSemOptions(eSem);
    });
  };

  const handleApplyEdit = () => {
    if (!editingPair) return;
    setSentencePairs(prev => prev.map(p => (p.id === editingPair.id ? editingPair : p)));
    setEditModalVisible(false);
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
          {record.status === 'pending' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.sentenceId)}
                title={t('approve')}
                style={{ color: '#52c41a' }}
              />
              <Button
                type="text"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.sentenceId)}
                title={t('reject')}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>{t('pending_approval')}</Title>}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchPendingPairs(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            {t('reload') || 'Reload'}
          </Button>
        }
      >
        
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
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{t('sentence_id')}:</Text> {selectedPair.sentenceId}
              <span style={{ marginLeft: 12 }}><Tag color="orange">{t('pending_approval')}</Tag></span>
            </div>

            {/* Vietnamese Analysis */}
            <div style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                {t('vietnamese_text')} - {t('analyze_results')}
              </Title>

              {/* Original Vietnamese Text */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                  {selectedPair.vietnameseText}
                </div>
              </div>

              {/* Vietnamese Word Analysis Table with per-word actions */}
              {selectedPair.vietnameseAnalysis && selectedPair.vietnameseAnalysis.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('word')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>POS</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('lemma')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('grm')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>NER</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPair.vietnameseAnalysis.map((w, idx) => (
                        <tr key={`vi-${idx}`}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{idx + 1}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 600 }}>{w.word}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {viEditingIdx === idx ? (
                              <input value={w.pos} onChange={(e) => {
                                const updated = [...(selectedPair.vietnameseAnalysis || [])];
                                updated[idx] = { ...w, pos: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, vietnameseAnalysis: updated });
                              }} style={{ width: 90 }} />
                            ) : (
                              <span style={{ backgroundColor: '#e6f7ff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                                {w.pos || '-'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {viEditingIdx === idx ? (
                              <input value={w.lemma} onChange={(e) => {
                                const updated = [...(selectedPair.vietnameseAnalysis || [])];
                                updated[idx] = { ...w, lemma: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, vietnameseAnalysis: updated });
                              }} style={{ width: 120 }} />
                            ) : (w.lemma || '-')}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {viEditingIdx === idx ? (
                              <input value={w.grm} onChange={(e) => {
                                const updated = [...(selectedPair.vietnameseAnalysis || [])];
                                updated[idx] = { ...w, grm: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, vietnameseAnalysis: updated });
                              }} style={{ width: 120 }} />
                            ) : (w.grm || '-')}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {viEditingIdx === idx ? (
                              <input value={w.ner} onChange={(e) => {
                                const updated = [...(selectedPair.vietnameseAnalysis || [])];
                                updated[idx] = { ...w, ner: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, vietnameseAnalysis: updated });
                              }} style={{ width: 120 }} />
                            ) : (w.ner || '-')}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Button type="link" onClick={() => setViEditingIdx(viEditingIdx === idx ? null : idx)}>
                              {viEditingIdx === idx ? t('done') || 'Xong' : t('edit')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* English Analysis */}
            <div>
              <Title level={4} style={{ marginBottom: 16 }}>
                {t('english_text')} - {t('analyze_results')}
              </Title>

              {/* Original English Text */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                  {selectedPair.englishText}
                </div>
              </div>

              {/* English Word Analysis Table with per-word actions */}
              {selectedPair.englishAnalysis && selectedPair.englishAnalysis.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('word')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>POS</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('lemma')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('grm')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>NER</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPair.englishAnalysis.map((w, idx) => (
                        <tr key={`en-${idx}`}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{idx + 1}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 600 }}>{w.word}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {enEditingIdx === idx ? (
                              <input value={w.pos} onChange={(e) => {
                                const updated = [...(selectedPair.englishAnalysis || [])];
                                updated[idx] = { ...w, pos: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, englishAnalysis: updated });
                              }} style={{ width: 90 }} />
                            ) : (
                              <span style={{ backgroundColor: '#f6ffed', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                                {w.pos || '-'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {enEditingIdx === idx ? (
                              <input value={w.lemma} onChange={(e) => {
                                const updated = [...(selectedPair.englishAnalysis || [])];
                                updated[idx] = { ...w, lemma: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, englishAnalysis: updated });
                              }} style={{ width: 120 }} />
                            ) : (w.lemma || '-')}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {enEditingIdx === idx ? (
                              <input value={w.grm} onChange={(e) => {
                                const updated = [...(selectedPair.englishAnalysis || [])];
                                updated[idx] = { ...w, grm: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, englishAnalysis: updated });
                              }} style={{ width: 120 }} />
                            ) : (w.grm || '-')}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {enEditingIdx === idx ? (
                              <input value={w.ner} onChange={(e) => {
                                const updated = [...(selectedPair.englishAnalysis || [])];
                                updated[idx] = { ...w, ner: e.target.value } as any;
                                setSelectedPair({ ...selectedPair, englishAnalysis: updated });
                              }} style={{ width: 120 }} />
                            ) : (w.ner || '-')}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Button type="link" onClick={() => setEnEditingIdx(enEditingIdx === idx ? null : idx)}>
                              {enEditingIdx === idx ? t('done') || 'Xong' : t('edit')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={t('edit')}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleApplyEdit}
        okText={t('edit')}
        width={900}
      >
        {editingPair && (
          <div>
            {/* Vietnamese editable section */}
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 12 }}>
                {t('vietnamese_text')} - {t('analyze_results')}
              </Title>
              <textarea
                value={editingPair.vietnameseText}
                onChange={(e) => setEditingPair({ ...editingPair, vietnameseText: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 12 }}
              />
              {editingPair.vietnameseAnalysis && editingPair.vietnameseAnalysis.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('word')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>POS</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('lemma')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('grm')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>NER</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Semantic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingPair.vietnameseAnalysis.map((w, idx) => (
                        <tr key={`evi-${idx}`}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{idx + 1}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 600 }}>{w.word}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Select
                              value={w.pos}
                              onChange={(val) => {
                                const updated = [...(editingPair.vietnameseAnalysis || [])];
                                updated[idx] = { ...w, pos: val } as any;
                                setEditingPair({ ...editingPair, vietnameseAnalysis: updated });
                              }}
                              style={{ width: 120 }}
                              options={viPosOptions.map(o => ({ value: o, label: o }))}
                              showSearch
                            />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <input value={w.lemma} onChange={(e) => {
                              const updated = [...(editingPair.vietnameseAnalysis || [])];
                              updated[idx] = { ...w, lemma: e.target.value };
                              setEditingPair({ ...editingPair, vietnameseAnalysis: updated });
                            }} style={{ width: 120 }} />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <input value={w.grm} onChange={(e) => {
                              const updated = [...(editingPair.vietnameseAnalysis || [])];
                              updated[idx] = { ...w, grm: e.target.value };
                              setEditingPair({ ...editingPair, vietnameseAnalysis: updated });
                            }} style={{ width: 120 }} />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Select
                              value={w.ner}
                              onChange={(val) => {
                                const updated = [...(editingPair.vietnameseAnalysis || [])];
                                updated[idx] = { ...w, ner: val } as any;
                                setEditingPair({ ...editingPair, vietnameseAnalysis: updated });
                              }}
                              style={{ width: 140 }}
                              options={viNerOptions.map(o => ({ value: o, label: o }))}
                              showSearch
                            />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Select
                              value={(w as any).semantic}
                              onChange={(val) => {
                                const updated = [...(editingPair.vietnameseAnalysis || [])];
                                updated[idx] = { ...(w as any), semantic: val } as any;
                                setEditingPair({ ...editingPair, vietnameseAnalysis: updated });
                              }}
                              style={{ width: 140 }}
                              options={viSemOptions.map(o => ({ value: o, label: o }))}
                              showSearch
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* English editable section */}
            <div>
              <Title level={4} style={{ marginBottom: 12 }}>
                {t('english_text')} - {t('analyze_results')}
              </Title>
              <textarea
                value={editingPair.englishText}
                onChange={(e) => setEditingPair({ ...editingPair, englishText: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 12 }}
              />
              {editingPair.englishAnalysis && editingPair.englishAnalysis.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('word')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>POS</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('lemma')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('grm')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>NER</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Semantic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingPair.englishAnalysis.map((w, idx) => (
                        <tr key={`een-${idx}`}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{idx + 1}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 600 }}>{w.word}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Select
                              value={w.pos}
                              onChange={(val) => {
                                const updated = [...(editingPair.englishAnalysis || [])];
                                updated[idx] = { ...w, pos: val } as any;
                                setEditingPair({ ...editingPair, englishAnalysis: updated });
                              }}
                              style={{ width: 120 }}
                              options={enPosOptions.map(o => ({ value: o, label: o }))}
                              showSearch
                            />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <input value={w.lemma} onChange={(e) => {
                              const updated = [...(editingPair.englishAnalysis || [])];
                              updated[idx] = { ...w, lemma: e.target.value };
                              setEditingPair({ ...editingPair, englishAnalysis: updated });
                            }} style={{ width: 120 }} />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <input value={w.grm} onChange={(e) => {
                              const updated = [...(editingPair.englishAnalysis || [])];
                              updated[idx] = { ...w, grm: e.target.value };
                              setEditingPair({ ...editingPair, englishAnalysis: updated });
                            }} style={{ width: 120 }} />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Select
                              value={w.ner}
                              onChange={(val) => {
                                const updated = [...(editingPair.englishAnalysis || [])];
                                updated[idx] = { ...w, ner: val } as any;
                                setEditingPair({ ...editingPair, englishAnalysis: updated });
                              }}
                              style={{ width: 140 }}
                              options={enNerOptions.map(o => ({ value: o, label: o }))}
                              showSearch
                            />
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <Select
                              value={(w as any).semantic}
                              onChange={(val) => {
                                const updated = [...(editingPair.englishAnalysis || [])];
                                updated[idx] = { ...(w as any), semantic: val } as any;
                                setEditingPair({ ...editingPair, englishAnalysis: updated });
                              }}
                              style={{ width: 140 }}
                              options={enSemOptions.map(o => ({ value: o, label: o }))}
                              showSearch
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingApprovalsTab;
