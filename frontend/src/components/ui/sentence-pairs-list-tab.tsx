'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Tag, message, Modal, Space, Select } from 'antd';
import { EyeOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getSentencePairs, deleteSentencePair, getSentencePairAnalysis } from '@/services/sentence-pair/sentence-pair-api';
import { fetchPOS, fetchNER, fetchSemantic } from '@/services/master/master-api';
import type { SentencePair } from '@/types/sentence-pair.type';

const { Title, Text } = Typography;

type SentencePairsListTabProps = { active?: boolean };

const SentencePairsListTab: React.FC<SentencePairsListTabProps> = ({ active }) => {
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
    if (active) {
      fetchSentencePairs(1, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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

  const handleView = async (record: SentencePair) => {
    // ensure analyses are loaded from backend (row_words)
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
    // Deep copy minimal fields for safe local edits
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
          {record.status !== 'approved' && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id!)}
              title={t('delete')}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>{t('sentence_pair_list')}</Title>}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchSentencePairs(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            {t('reload') || 'Reload'}
          </Button>
        }
      >
        
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
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{t('sentence_id')}:</Text> {selectedPair.sentenceId}
              <span style={{ marginLeft: 12 }}>{getStatusTag(selectedPair.status)}</span>
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

              {/* Vietnamese Word Analysis Table */}
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

              {/* English Word Analysis Table */}
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

      {/** Edit Modal - mirrors analyze results with editable fields */}
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

export default SentencePairsListTab;
