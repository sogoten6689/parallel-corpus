'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, Select, Card, Tabs, Spin, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import AnalysisTable from './analysis-table';
import TranslationComparison from './translation-comparison';
import AlignmentTable from './alignment-table';

const { TextArea } = Input;
const { Option } = Select;

interface AnalysisResult {
  analysis: Array<{
    Word: string;
    Lemma: string;
    Links: string;
    Morph: string;
    POS: string;
    Phrase: string;
    Grm: string;
    NER: string;
    Semantic: string;
  }>;
  statistics: {
    posCounts: Array<{ POS: string; Count: number }>;
    nerCounts: Array<{ NER: string; Count: number }>;
  };
  language?: string;
  translation?: string;
  translated_analysis?: Array<{
    Word: string;
    Lemma: string;
    Links: string;
    Morph: string;
    POS: string;
    Phrase: string;
    Grm: string;
    NER: string;
    Semantic: string;
  }>;
  english_translation?: string;
  english_analysis?: Array<{
    Word: string;
    Lemma: string;
    Links: string;
    Morph: string;
    POS: string;
    Phrase: string;
    Grm: string;
    NER: string;
    Semantic: string;
  }>;
  vietnamese_translation?: string;
  vietnamese_analysis?: Array<{
    Word: string;
    Lemma: string;
    Links: string;
    Morph: string;
    POS: string;
    Phrase: string;
    Grm: string;
    NER: string;
    Semantic: string;
  }>;
  dependency_tree_html?: string;
  alignment_result?: Array<[number, number]>;
}

const TextAnalyzer: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [text, setText] = useState('Chúng tôi đã học bài ở trường cả ngày');
  const [language, setLanguage] = useState('vi');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [activeTabKey, setActiveTabKey] = useState('analysis');
  const [analyzedText, setAnalyzedText] = useState<string>(''); // Store the text that was analyzed
  const isInitialMount = useRef(true);
  const resultsRef = useRef(results);
  const textRef = useRef(text);
  const loadedTabs = useRef(new Set(['analysis'])); // Track which tabs have been loaded
  
  // Update refs when state changes
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);
  
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Handle language change and update sample text only if current text is empty or is a sample
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Define sample texts
    const viSample = 'Chúng tôi đã học bài ở trường cả ngày';
    const enSample = 'We studied at school all day';
    
    // Only update text if it's empty or currently showing a sample text
    if (!text.trim() || text === viSample || text === enSample) {
      if (newLanguage === 'vi') {
        setText(viSample);
      } else {
        setText(enSample);
      }
    }
  };

  const handleAnalyze = useCallback(async (targetTab = 'analysis') => {
    if (!text.trim()) {
      message.error(t('please_enter_text'));
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.analyzeText(text.trim(), language, targetTab);

      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }

      const data = response.data;
      
      // Merge with existing results to preserve previously loaded tabs
      if (targetTab !== 'analysis' && results) {
        // Loading additional tab data - merge with existing
        setResults(prev => ({ ...prev, ...data }));
      } else if (results && targetTab === 'analysis') {
        // Re-analyzing analysis tab only (e.g., language change) - preserve other tabs
        setResults(prev => ({ 
          ...prev, 
          analysis: data.analysis,
          statistics: data.statistics,
          language: data.language 
        }));
      } else {
        // Initial analysis - set all data
        setResults(data);
        setAnalyzedText(text.trim()); // Store the analyzed text only on initial analysis
        loadedTabs.current = new Set(['analysis']); // Reset loaded tabs for new analysis
      }
      
      message.success(t('analysis_completed'));
    } catch (error) {
      console.error('Analysis error:', error);
      message.error(t('analysis_failed'));
    } finally {
      setLoading(false);
    }
  }, [text, language, t, message, results]);

  const handleAnalyzeClick = () => {
    handleAnalyze('analysis');
  };

  // Re-analyze when language changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // If there are existing results and text, re-analyze ONLY basic analysis with new language
    // Keep other tabs' data unchanged
    if (resultsRef.current && textRef.current.trim()) {
      handleAnalyze('analysis');
      // Don't reset loadedTabs - keep other tabs' loaded state
    }
  }, [language]); // Only depend on language changes

  const handleTabChange = useCallback((key: string) => {
    setActiveTabKey(key);
    
    // Only load if tab hasn't been loaded before AND has no data
    const currentResults = resultsRef.current;
    const currentText = textRef.current;
    
    if (currentResults && currentText.trim() && !loadedTabs.current.has(key)) {
      const needsLoading = 
        (key === 'translation' && !currentResults.translation) ||
        (key === 'view_alignment' && !currentResults.alignment_result) ||
        (key === 'dependency_tree' && !currentResults.dependency_tree_html);
      
      if (needsLoading) {
        loadedTabs.current.add(key); // Mark as loaded before calling
        handleAnalyze(key);
      }
    }
  }, [handleAnalyze]);

  const languages = [
    { value: 'vi', label: t('vietnamese') },
    { value: 'en', label: t('english') },
  ];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card title={t('text_input')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('enter_text')}</label>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={language === 'vi' ? 'Ví dụ: Chúng tôi đã học bài ở trường cả ngày' : 'Example: We studied at school all day'}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('language')}</label>
              <Select
                value={language}
                onChange={handleLanguageChange}
                className="w-full"
              >
                {languages.map((lang) => (
                  <Option key={lang.value} value={lang.value}>
                    {lang.label}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="primary"
                onClick={handleAnalyzeClick}
                loading={loading}
                className="w-full"
                size="large"
              >
                {t('analyze')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      {loading && (
        <Card>
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">{t('analyzing_text')}</p>
          </div>
        </Card>
      )}

      {results && !loading && (
        <Card title={t('analysis_results')}>
          <Tabs
            defaultActiveKey="analysis"
            activeKey={activeTabKey}
            onChange={handleTabChange}
            items={[
              {
                key: 'analysis',
                label: t('detailed_analysis'),
                children: (
                  <AnalysisTable
                    data={results.analysis}
                    statistics={results.statistics}
                  />
                ),
              },
              {
                key: 'translation',
                label: t('translation_comparison'),
                children: (
                  <TranslationComparison
                    originalText={analyzedText || text}
                    translatedText={results.translation || ''}
                    originalAnalysis={results.analysis}
                    translatedAnalysis={results.translated_analysis || []}
                    language={results.language || 'vi'}
                  />
                ),
              },
              {
                key: 'view_alignment',
                label: t('view_alignment') || 'View Alignment',
                children: (
                  <div className="space-y-4">
                    {results?.alignment_result && results?.translation ? (
                      <AlignmentTable 
                        alignment={results.alignment_result} 
                        srcText={analyzedText || text} 
                        trgText={results.translation}
                      />
                    ) : (
                      <div className="text-gray-500 text-center py-8">{t('no_alignment_data') || 'No alignment data'}</div>
                    )}
                  </div>
                ),
              },
              {
                key: 'dependency_tree',
                label: t('dependency_tree') || 'Dependency Tree',
                children: (
                  <div className="space-y-4">
                    {results?.dependency_tree_html ? (
                      <div dangerouslySetInnerHTML={{ __html: results.dependency_tree_html }} />
                    ) : (
                      <div className="text-gray-500 text-center py-8">{t('no_dependency_tree_data') || 'Không có dữ liệu cây phụ thuộc'}</div>
                    )}
                  </div>
                ),
              },
            ].filter(tab => 
              tab.key !== 'dependency_tree' || language === 'en'
            ).filter(tab => tab.key !== 'translation')}
          />
        </Card>
      )}
    </div>
  );
};

export default TextAnalyzer; 