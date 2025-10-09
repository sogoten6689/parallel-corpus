'use client';

import { useState } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Spin, Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { createSentencePair, analyzeSentences, saveSentencePair } from '@/services/sentence-pair/sentence-pair-api';
import DependencyTree from '@/components/ui/dependency-tree';
import type { CreateSentencePairRequest, WordAnalysis } from '@/types/sentence-pair.type';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface CreateSentencePairTabProps {
  onSuccess?: () => void;
}

const CreateSentencePairTab: React.FC<CreateSentencePairTabProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [sentenceId, setSentenceId] = useState<string>('');

  const [languagePair, setLanguagePair] = useState<string>('vi_en');

  const languageGroupItems = [
    {
      key: 'vi_en',
      label: t('vi_en'),
      onClick: () => {
        setLanguagePair('vi_en');
      },
    },
    {
      key: 'vi_zh',
      label: t('vi_zh'),
      onClick: () => {
        setLanguagePair('vi_zh');
      },
    },
    {
      key: 'vi_ja',
      label: t('vi_ja'),
      onClick: () => {
        setLanguagePair('vi_ja');
      },
    },
    {
      key: 'vi_ru',
      label: t('vi_ru'),
      onClick: () => {
        setLanguagePair('vi_ru');
      },
    },
    {
      key: 'vi_ko',
      label: t('vi_ko'),
      onClick: () => {
        setLanguagePair('vi_ko');
      },
    },
  ];

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Create sentence pair and analyze automatically
      const request = {
        vietnameseText: values.vietnameseText,
        englishText: values.englishText,
        langPair: languagePair,
      };
      const response = await createSentencePair(request);
      setSentenceId(response.sentenceId);

      // Then analyze sentences automatically
      const results = await analyzeSentences(values.vietnameseText, values.englishText, languagePair);
      setAnalysisResults(results);
      
      message.success('Sentence pair created and analyzed successfully');
    } catch (error) {
      message.error('Failed to create and analyze sentence pair');
      console.error('Error creating and analyzing sentence pair:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveAnalysis = async () => {
    if (!analysisResults || !sentenceId) {
      message.error('No analysis results to save');
      return;
    }

    setLoading(true);
    try {
      // Convert analysis results to WordAnalysis format
      const vietnameseAnalysis: WordAnalysis[] = [];
      const englishAnalysis: WordAnalysis[] = [];

      // Process Vietnamese analysis
      if (analysisResults.vietnamese && analysisResults.vietnamese.sentences) {
        for (const sentence of analysisResults.vietnamese.sentences) {
          for (let i = 0; i < sentence.tokens.length; i++) {
            const token = sentence.tokens[i];
            vietnameseAnalysis.push({
              word: token.text,
              lemma: token.lemma || token.text,
              links: i.toString(), // Simple position-based linking
              morph: '',
              pos: token.pos || '',
              phrase: '',
              grm: token.dep || '',
              ner: '',
              semantic: '',
              langCode: 'vi'
            });
          }
        }
      }

      // Process English analysis
      if (analysisResults.english && analysisResults.english.sentences) {
        for (const sentence of analysisResults.english.sentences) {
          for (let i = 0; i < sentence.tokens.length; i++) {
            const token = sentence.tokens[i];
            englishAnalysis.push({
              word: token.text,
              lemma: token.lemma || token.text,
              links: i.toString(),
              morph: '',
              pos: token.pos || '',
              phrase: '',
              grm: token.dep || '',
              ner: '',
              semantic: '',
              langCode: 'en'
            });
          }
        }
      }

      await saveSentencePair({
        sentenceId,
        vietnameseAnalysis,
        englishAnalysis,
        langPair: languagePair || 'vi_en'
      });

      message.success(t('sentence_saved_successfully'));
      setAnalysisResults(null);
      form.resetFields();
      setSentenceId('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error('Failed to save analysis results');
      console.error('Error saving analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <Title level={4}>{t('create_sentence_pair')}</Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={t('lang_pair')}
                rules={[{ required: true, message: t('please_select_language_pair') }]}
              >
                <Dropdown menu={{ items: languageGroupItems }} trigger={['click']}>
                  <Space style={{ cursor: 'pointer', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '6px', backgroundColor: '#fff' }}>
                    {languagePair ? t(languagePair) : t('vi_en')}
                    <DownOutlined />
                  </Space>
                </Dropdown>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('vietnamese_sentence')}
                name="vietnameseText"
                rules={[{ required: true, message: 'Please enter Vietnamese sentence' }]}
              >
                <TextArea
                  rows={4}
                  placeholder={t('enter_vietnamese_sentence')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('english_sentence')}
                name="englishText"
                rules={[{ required: true, message: 'Please enter English sentence' }]}
              >
                <TextArea
                  rows={4}
                  placeholder={t('enter_english_sentence')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full"
                >
                  {t('create_sentence_pair')}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {analysisResults && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>{t('analyze_results')}</Title>
            <Button
              type="primary"
              onClick={handleSaveAnalysis}
              loading={loading}
            >
              {t('save_sentence_pair')}
            </Button>
          </div>

          {/* Vietnamese Analysis */}
          {analysisResults.vietnamese?.sentences?.map((sentence: any, index: number) => (
            <div key={`vi-${index}`} style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                {t('vietnamese_text')} - {t('analyze_results')}
              </Title>
              
              {/* Original Vietnamese Text */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 8 }}>{t('ai_edit_original')}</h4>
                <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                  {sentence.text}
                </div>
              </div>

              {/* Vietnamese Word Analysis Table */}
              {sentence.tokens && sentence.tokens.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('word')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>POS</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('lemma')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('grm')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>NER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentence.tokens.map((token: any, tokenIndex: number) => (
                        <tr key={tokenIndex}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{tokenIndex + 1}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                            {token.text}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <span style={{ backgroundColor: '#e6f7ff', padding: '2px 6px', borderRadius: 4, fontSize: '12px' }}>
                              {token.pos || '-'}
                            </span>
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{token.lemma || '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{token.dep || '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{token.ner || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vietnamese Dependency Tree */}
              {sentence.tokens && sentence.tokens.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    {t('vietnamese_text')} - {t('dependency_tree')}
                  </Title>
                  <DependencyTree tokens={sentence.tokens} />
                </div>
              )}
            </div>
          ))}

          {/* English Analysis */}
          {analysisResults.english?.sentences?.map((sentence: any, index: number) => (
            <div key={`en-${index}`} style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                {t('english_text')} - {t('analyze_results')}
              </Title>
              
              {/* Original English Text */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 8 }}>{t('ai_edit_original')}</h4>
                <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                  {sentence.text}
                </div>
              </div>

              {/* English Word Analysis Table */}
              {sentence.tokens && sentence.tokens.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('word')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>POS</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('lemma')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{t('grm')}</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>NER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentence.tokens.map((token: any, tokenIndex: number) => (
                        <tr key={tokenIndex}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{tokenIndex + 1}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                            {token.text}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <span style={{ backgroundColor: '#f6ffed', padding: '2px 6px', borderRadius: 4, fontSize: '12px' }}>
                              {token.pos || '-'}
                            </span>
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{token.lemma || '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{token.dep || '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{token.ner || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* English Dependency Tree */}
              {sentence.tokens && sentence.tokens.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    {t('english_text')} - {t('dependency_tree')}
                  </Title>
                  <DependencyTree tokens={sentence.tokens} />
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default CreateSentencePairTab;
