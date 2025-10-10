'use client';

import React, { useEffect, useState } from 'react';
import { Button, Col, Input, Row, Space, Table, Tooltip, Typography, Tag, Descriptions, Select, Spin } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useTranslation } from "react-i18next";
import Modal from 'antd/es/modal/Modal';
import { useQuery } from "@tanstack/react-query";
import { fetchMasterRowWords, updateMasterRowWordApi, fetchPOS, fetchNER, fetchSemantic } from '@/services/master/master-api';
import { fullTextAnalysis, vietnameseFullAnalysis, namedEntityRecognition } from '@/services/nlp/nlp-api';
import { normalizeVietnameseSyllable } from '@/services/vietnamese/vietnamese-normalization-api';
import { MasterRowWord } from '@/types/master-row-word.type';
import Card from 'antd/es/card/Card';
import Dropdown from 'antd/es/dropdown/dropdown';
import { EditOutlined, DownOutlined, RobotOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import useApp from 'antd/es/app/useApp';
import { axiosInstance } from '@/services/axios';


const { Text } = Typography;

export default function MasterRowWordTable() {
  const { t } = useTranslation();
  const { message } = useApp();
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalEditVisible, setIsModalEditVisible] = useState(false);
  const [isModalAIEditVisible, setIsModalAIEditVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<MasterRowWord | null>(null);
  const [aiEditedWord, setAiEditedWord] = useState<MasterRowWord | null>(null);
  const [aiEditedWords, setAiEditedWords] = useState<MasterRowWord[] | null>(null);
  const [originalSentenceRows, setOriginalSentenceRows] = useState<MasterRowWord[] | null>(null);
  const [aiCellDecisions, setAiCellDecisions] = useState<Record<number, { pos?: boolean; lemma?: boolean; morph?: boolean; ner?: boolean; grm?: boolean }>>({});
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [langCode, setLangCode] = useState<string | undefined>('');
  const [search, setSearch] = useState<string | undefined>();
  // Dropdown data states
  const [posOptions, setPosOptions] = useState<{ value: string; label: string }[]>([]);
  const [nerOptions, setNerOptions] = useState<{ value: string; label: string }[]>([]);
  const [semanticOptions, setSemanticOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  // Keeping these commented until needed to avoid unused variable lint errors
  // const [totalAll, setTotalAll] = useState<number | null>(null);
  // const [totalAllSen, setTotalAllSen] = useState<number | null>(null);
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

  const columns: ColumnsType<MasterRowWord> = columnKeys.map((key) => {
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
        const langColorMap: Record<string, string> = {
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
        <Space>
          {user?.role === 'admin' && (
            <>
              <Button icon={<EditOutlined />} onClick={() => showModalEdit(record)}>{t('edit')}</Button>
              <Button 
                icon={<RobotOutlined />} 
                onClick={() => showModalAIEdit(record)}
                type="primary"
                ghost
              >
                {t('edit_by_ai')}
              </Button>
            </>
          )}
        </Space>
      );
      return {
        ...column,
        render,
      };
    }

    return column;

  });

  // Query for WordRowMaster
  const { data: wordRowMasterData, isLoading: isLoadingMaster } = useQuery({
    queryKey: ['master-row-word', pagination.current, pagination.pageSize, langCode, search],
    queryFn: async () => {
      const res = await fetchMasterRowWords(pagination.current, pagination.pageSize, langCode, search);
      if (res.status !== 200) {
        message.error(res.statusText);
        return { data: [], total: null };
      }
      // setTotalAll(res.data.total_all);
      // setTotalAllSen(res.data.total_all_sen);
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

  const handleTableChange = (pager: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: pager.current || 1,
      pageSize: pager.pageSize || prev.pageSize,
    }));
  };
  const showModal = (record: MasterRowWord) => {
    setSelectedWord(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedWord(null);
  };

  const fetchDropdownData = async (langCode?: string) => {
    setIsLoadingDropdowns(true);
    try {
      const [posRes, nerRes, semanticRes] = await Promise.all([
        fetchPOS(langCode),
        fetchNER(langCode),
        fetchSemantic(langCode)
      ]);

      if (posRes.status === 200 && posRes.data?.data) {
        setPosOptions(posRes.data.data.map((item: any) => ({
          value: item.value || item,
          label: item.label || item
        })));
      }

      if (nerRes.status === 200 && nerRes.data?.data) {
        setNerOptions(nerRes.data.data.map((item: any) => ({
          value: item.value || item,
          label: item.label || item
        })));
      }

      if (semanticRes.status === 200 && semanticRes.data?.data) {
        setSemanticOptions(semanticRes.data.data.map((item: any) => ({
          value: item.value || item,
          label: item.label || item
        })));
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      message.error('Failed to load dropdown options');
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const showModalEdit = (record: MasterRowWord) => {
    setSelectedWord(record);
    setIsModalEditVisible(true);
    // Fetch dropdown data when opening edit modal
    fetchDropdownData(record.lang_code);
  };

  const handleCancelEdit = () => {
    setIsModalEditVisible(false);
    setSelectedWord(null);
  };

  const showModalAIEdit = (record: MasterRowWord) => {
    setSelectedWord(record);
    setIsModalAIEditVisible(true);
  };

  const handleCancelAIEdit = () => {
    setIsModalAIEditVisible(false);
    setSelectedWord(null);
    setAiEditedWord(null);
    setAiEditedWords(null);
    setOriginalSentenceRows(null);
    setIsAIProcessing(false);
  };

  const handleAIEditConfirm = async () => {
    if (!selectedWord) return;
    setIsAIProcessing(true);
    try {
      // Fetch all rows in the sentence (by id_sen) for current language
      const searchId = selectedWord.id_sen || '';
      const lang = selectedWord.lang_code || '';
      const resAll = await fetchMasterRowWords(1, 1000, lang, searchId);
      const allRows: MasterRowWord[] = (resAll?.data?.data || []).filter((r: MasterRowWord) => r.id_sen === searchId && r.lang_code === lang);
      setOriginalSentenceRows(allRows);

      // Build sentence text from words
      const joinWithSpace = (tokens: string[]) => tokens.join(' ')
        .replace(/_/g, ' ')
        .replace(/\s+([\.,\?/:;\\!%\)\}\]])/g, '$1')
        .replace(/([\(\[\{])\s+/g, '$1')
        .trim();
      const sentenceText = joinWithSpace(allRows.map(r => r.word || ''));

      // Analyze full sentence
      const analysisResult = selectedWord.lang_code === 'vi'
        ? await vietnameseFullAnalysis(sentenceText)
        : await fullTextAnalysis(sentenceText);

      // Get NER separately
      let nerEntities: any[] = [];
      try {
        if (selectedWord.lang_code === 'vi') {
          const nerResult = await axiosInstance.post('/nlp/vietnamese/ner', { text: sentenceText });
          nerEntities = nerResult.data || [];
        } else {
          const nerResult = await namedEntityRecognition(sentenceText);
          nerEntities = nerResult || [];
        }
      } catch (error) {
        console.warn('NER analysis failed:', error);
      }

      // Map token results back to rows by order
      const firstSentence = analysisResult.sentences && analysisResult.sentences.length > 0 ? analysisResult.sentences[0] : null;
      const tokens = (firstSentence?.tokens || []) as any[];
      const updatedRows: MasterRowWord[] = await Promise.all(allRows.map(async (row, index) => {
        const token = tokens[index];
        const updated: MasterRowWord = { ...row };
        if (token) {
          if (token.pos) updated.pos = token.pos as any;
          if (token.lemma) updated.lemma = token.lemma as any;
          if (token.dep) updated.grm = token.dep as any;
          
          // For Vietnamese text, normalize lemma and morph using Vietnamese normalization
          if (selectedWord.lang_code === 'vi') {
            try {
              if (token.lemma) {
                const normalizedLemma = await normalizeVietnameseSyllable(token.lemma);
                updated.lemma = normalizedLemma.normalized_syllable as any;
              }
              // Also normalize the word itself for morph field
              if (row.word) {
                const normalizedMorph = await normalizeVietnameseSyllable(row.word);
                updated.morph = normalizedMorph.normalized_syllable as any;
              }
            } catch (error) {
              console.warn('Vietnamese normalization failed for word:', row.word, error);
              // Keep original values if normalization fails
            }
          }
        }
        return updated;
      }));

      // Assign NER labels best-effort
      if (nerEntities && nerEntities.length > 0) {
        nerEntities.forEach((ent: any) => {
          const label = ent.label;
          const entText = (ent.text || '').trim();
          if (!entText) return;
          updatedRows.forEach((row, idx) => {
            const token = tokens[idx];
            if (token && (token.text || '').trim() && entText.includes(token.text)) {
              (row as any).ner = label;
            }
          });
        });
      }

      // Initialize decisions as undecided; icons will be shown only for changed fields
      const decisions: Record<number, { pos?: boolean; lemma?: boolean; ner?: boolean; grm?: boolean }> = {};
      updatedRows.forEach((row) => {
        decisions[row.id] = {};
      });
      setAiCellDecisions(decisions);

      setAiEditedWords(updatedRows);
      setAiEditedWord(null);
      message.success(t('ai_edit_success'));
    } catch (error) {
      console.error('AI edit error:', error);
      message.error(t('ai_edit_failed'));
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAISave = async () => {
    try {
      if (aiEditedWords && aiEditedWords.length > 0) {
        const finalRows = aiEditedWords.map((row, idx) => {
          const orig = (originalSentenceRows || [])[idx] || row;
          const decide = aiCellDecisions[row.id] || {};
          const merged: MasterRowWord = { ...orig };
          // Only apply AI when the field changed AND user accepted. Otherwise keep original.
          const hasPosChanged = (orig.pos || '') !== (row.pos || '');
          const hasLemmaChanged = (orig.lemma || '') !== (row.lemma || '');
          const hasMorphChanged = (orig.morph || '') !== (row.morph || '');
          const hasNerChanged = (orig.ner || '') !== (row.ner || '');
          const hasGrmChanged = (orig.grm || '') !== (row.grm || '');

          merged.pos = hasPosChanged && decide.pos === true ? row.pos : orig.pos;
          merged.lemma = hasLemmaChanged && decide.lemma === true ? row.lemma : orig.lemma;
          merged.morph = hasMorphChanged && decide.morph === true ? row.morph : orig.morph;
          merged.ner = hasNerChanged && decide.ner === true ? row.ner : orig.ner;
          merged.grm = hasGrmChanged && decide.grm === true ? row.grm : orig.grm;
          return merged;
        });
        for (const w of finalRows) {
          await updateMasterRowWordApi(w);
        }
        message.success(t('edit_success'));
        handleCancelAIEdit();
      } else if (aiEditedWord) {
        const res = await updateMasterRowWordApi(aiEditedWord);
        if (res.status !== 200) {
          message.error(t('edit_failed'));
          return;
        } else {
          if (res.data?.data) {
            wordRowMasterData?.data?.forEach((word: MasterRowWord, index: number) => {
              if (word.id === aiEditedWord.id) {
                wordRowMasterData.data[index] = res.data?.data;
              }
            });
          }
          message.success(t('edit_success'));
          handleCancelAIEdit();
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      message.error(t('edit_failed'));
    }
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
    } catch {
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
    const langColorMap: Record<string, string> = {
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
        {fieldOrder.map((key: string) => {
          const rw = selectedWord as unknown as Record<string, unknown>;
          const rawVal = rw[key];
          let value: React.ReactNode = rawVal as React.ReactNode;
          if (key === 'lang_pair') {
            const lp = rawVal ?? 'null';
            const lc = rw.lang_code ?? 'null';
            value = (
              <Space size={4} wrap>
                <Tag color={langColorMap[String(lp)] || 'geekblue'}>{t(String(lp))}</Tag>
                <Tag color={langColorMap[String(lc)] || 'default'}>{t(String(lc))}</Tag>
              </Space>
            );
          }
          const display = (value === undefined || value === null || value === '' ? '-' : value);
          return (
            <Descriptions.Item key={key} label={t(key)}>
              {display}
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
        onChange={(pager) => {
          handleTableChange(pager as TablePaginationConfig);
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
          <div>
            {isLoadingDropdowns && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Spin size="small" /> <span style={{ marginLeft: 8 }}>Loading dropdown options...</span>
              </div>
            )}
            <table style={{ width: '100%', fontSize: '14px' }} key={selectedWord?.id + "modal"}>
              <tbody key={selectedWord?.id + "modal-tbody"}>
                {columns.map(col => {
                  const k = col.key as string | undefined;
                  if (!k) return null;
                  const rw = selectedWord as unknown as Record<string, unknown>;
                  const val = rw[k];
                  const inputValue = typeof val === 'string' || typeof val === 'number' ? val : '';
                  const titleNode = col.title && typeof col.title === 'string' ? col.title : t(k);

                  // Check if this field should be a dropdown
                  const isDropdownField = ['pos', 'ner', 'semantic'].includes(k);

                  return (
                    <tr
                      key={k + 'modalEdit'}
                      hidden={k === 'action'}
                      style={{ verticalAlign: 'top' }}
                    >
                      <td style={{ padding: '6px 12px 4px 0', width: 160 }}>
                        <strong>{titleNode}:</strong>
                      </td>
                      <td style={{ padding: '4px 0 14px' }}>
                        {isDropdownField ? (
                          <Select
                            size="small"
                            style={{ width: '100%' }}
                            placeholder={t(k)}
                            value={inputValue as string | undefined}
                            disabled={['id', 'id_sen', 'id_string', 'action', 'lang_code', 'lang_pair'].includes(k)}
                            onChange={(value) => onChangeWord(k, value)}
                            options={k === 'pos' ? posOptions : k === 'ner' ? nerOptions : semanticOptions}
                            loading={isLoadingDropdowns}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        ) : (
                          <Input
                            size="small"
                            placeholder={t(k)}
                            value={inputValue as string | number | undefined}
                            disabled={['id', 'id_sen', 'id_string', 'action', 'lang_code', 'lang_pair'].includes(k)}
                            onChange={(e) => onChangeWord(k, e.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* AI Edit Modal */}
      <Modal
        title={t('edit_by_ai')}
        open={isModalAIEditVisible}
        onCancel={handleCancelAIEdit}
        footer={null}
        width={800}
      >
        {selectedWord && (
          <div>
            {!aiEditedWord && !aiEditedWords ? (
              <div>
                <p style={{ marginBottom: 16, fontSize: 16 }}>
                  {(() => {
                    const joinWithSpace = (tokens: string[]) => tokens.join(' ')
                      .replace(/_/g, ' ')
                      .replace(/\s+([\.,\?/:;\\!%\)\}\]])/g, '$1')
                      .replace(/([\(\[\{])\s+/g, '$1')
                      .trim();
                    const sentenceText = originalSentenceRows && originalSentenceRows.length > 0
                      ? joinWithSpace(originalSentenceRows.map(r => r.word || ''))
                      : (selectedWord.word || '');
                    return t('ai_edit_confirm', { sentence: sentenceText });
                  })()}
                </p>
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Button 
                    type="primary" 
                    onClick={handleAIEditConfirm}
                    loading={isAIProcessing}
                    size="large"
                    icon={<RobotOutlined />}
                  >
                    {isAIProcessing ? t('ai_edit_processing') : t('edit_by_ai')}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: 16 }}>{t('ai_edit_preview')}</h3>
                {(() => {
                  const joinWithSpace = (tokens: string[]) => tokens.join(' ')
                    .replace(/_/g, ' ')
                    .replace(/\s+([\.,\?/:;\\!%\)\}\]])/g, '$1')
                    .replace(/([\(\[\{])\s+/g, '$1')
                    .trim();
                  const beforeRows = originalSentenceRows || [];
                  const afterRows = aiEditedWords || [];
                  const beforeSentence = beforeRows.length > 0 ? joinWithSpace(beforeRows.map(r => r.word || '')) : (selectedWord.word || '');
                  const afterSentence = afterRows.length > 0 ? joinWithSpace(afterRows.map(r => r.word || '')) : beforeSentence;
                  return (
                    <>
                      <div style={{ marginBottom: 24 }}>
                        <h4>{t('ai_edit_original')}</h4>
                        <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                          {beforeSentence}
                        </div>
                      </div>
                      <div style={{ marginBottom: 24 }}>
                        <h4>{t('ai_edit_processed')}</h4>
                        <div style={{ padding: 12, backgroundColor: '#e6f7ff', borderRadius: 6 }}>
                          {afterSentence}
                        </div>
                      </div>
                      {afterRows.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('word')}</th>
                                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>POS</th>
                                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Lemma</th>
                                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Morph</th>
                                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>NER</th>
                                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('grm')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {afterRows.map((row, idx) => {
                                const orig = beforeRows[idx] || {} as MasterRowWord;
                                const highlight = (beforeVal: any, afterVal: any) => ({
                                  style: { backgroundColor: beforeVal !== afterVal ? '#fff2e8' : 'transparent' as const, fontWeight: beforeVal !== afterVal ? 'bold' as const : 'normal' as const },
                                  text: `${beforeVal || '-'} → ${afterVal || '-'}`
                                });
                                const beforePos = (orig as any).pos, afterPos = row.pos;
                                const beforeLemma = (orig as any).lemma, afterLemma = row.lemma;
                                const beforeMorph = (orig as any).morph, afterMorph = row.morph;
                                const beforeNer = (orig as any).ner, afterNer = row.ner;
                                const beforeGrm = (orig as any).grm, afterGrm = row.grm;
                                const posCell = highlight(beforePos, afterPos);
                                const lemmaCell = highlight(beforeLemma, afterLemma);
                                const morphCell = highlight(beforeMorph, afterMorph);
                                const nerCell = highlight(beforeNer, afterNer);
                                const grmCell = highlight(beforeGrm, afterGrm);
                                const decide = aiCellDecisions[row.id] || {};
                                const setDecision = (field: 'pos'|'lemma'|'morph'|'ner'|'grm', value: boolean) => {
                                  setAiCellDecisions(prev => ({
                                    ...(prev || {}),
                                    [row.id]: {
                                      ...(prev?.[row.id] || {}),
                                      [field]: value
                                    }
                                  }));
                                };
                                const showIcons = (beforeVal: any, afterVal: any, field: 'pos'|'lemma'|'morph'|'ner'|'grm') => {
                                  const changed = (beforeVal || '') !== (afterVal || '');
                                  const decided = decide[field] !== undefined;
                                  if (!changed) return null;
                                  if (decided) return null;
                                  return (
                                    <span>
                                      <Button size="small" type="default" icon={<CheckOutlined />} onClick={() => setDecision(field, true)} />
                                      <Button size="small" style={{ marginLeft: 6 }} icon={<CloseOutlined />} onClick={() => setDecision(field, false)} />
                                    </span>
                                  );
                                };
                                return (
                                  <tr key={row.id}>
                                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{idx + 1}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa' }}>{row.word}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa', ...posCell.style }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{posCell.text}</span>
                                        {showIcons(beforePos, afterPos, 'pos')}
                                      </div>
                                    </td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa', ...lemmaCell.style }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{lemmaCell.text}</span>
                                        {showIcons(beforeLemma, afterLemma, 'lemma')}
                                      </div>
                                    </td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa', ...morphCell.style }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{morphCell.text}</span>
                                        {showIcons(beforeMorph, afterMorph, 'morph')}
                                      </div>
                                    </td>
                                    <td style={{ padding: 8, borderBottom: '1px solid ' + '#fafafa', ...nerCell.style }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{nerCell.text}</span>
                                        {showIcons(beforeNer, afterNer, 'ner')}
                                      </div>
                                    </td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #fafafa', ...grmCell.style }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{grmCell.text}</span>
                                        {showIcons(beforeGrm, afterGrm, 'grm')}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div style={{ textAlign: 'center' }}>
                  <Space>
                    <Button onClick={handleCancelAIEdit}>
                      {t('cancel')}
                    </Button>
                    <Button type="primary" onClick={handleAISave}>
                      {t('save')}
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
