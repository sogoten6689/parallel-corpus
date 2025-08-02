'use client';
import { Card, Row, Col, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import AnalysisTable from './analysis-table';

interface TranslationComparisonProps {
  originalText: string;
  translatedText: string;
  originalAnalysis: any;
  translatedAnalysis: any;
  language: string;
}

const TranslationComparison: React.FC<TranslationComparisonProps> = ({
  originalText,
  translatedText,
  originalAnalysis,
  translatedAnalysis,
  language,
}) => {
  const { t } = useTranslation();

  if (!translatedText) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card title={t('translation_comparison')}>
        <Row gutter={16}>
          <Col span={12}>
            <div className="text-center mb-4">
              <h4 className="font-semibold text-blue-600">
                {language === 'vi' ? t('vietnamese') : t('english')}
              </h4>
            </div>
            <Card size="small" className="bg-gray-50">
              <p className="text-lg leading-relaxed">{originalText}</p>
            </Card>
          </Col>
          <Col span={12}>
            <div className="text-center mb-4">
              <h4 className="font-semibold text-green-600">
                {language === 'vi' ? t('english') : t('vietnamese')}
              </h4>
            </div>
            <Card size="small" className="bg-green-50">
              <p className="text-lg leading-relaxed">{translatedText}</p>
            </Card>
          </Col>
        </Row>
      </Card>

      <Divider />

      <Row gutter={16}>
        <Col span={12}>
          <Card title={`${language === 'vi' ? t('vietnamese') : t('english')} ${t('analysis')}`}>
            {originalAnalysis && originalAnalysis.length > 0 ? (
              <AnalysisTable
                data={originalAnalysis}
                statistics={getStatistics(originalAnalysis)}
              />
            ) : (
              <p className="text-gray-500 text-center py-4">
                {t('no_analysis_available')}
              </p>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title={`${language === 'vi' ? t('english') : t('vietnamese')} ${t('analysis')}`}>
            {translatedAnalysis && translatedAnalysis.length > 0 ? (
              <AnalysisTable
                data={translatedAnalysis}
                statistics={getStatistics(translatedAnalysis)}
              />
            ) : (
              <p className="text-gray-500 text-center py-4">
                {t('no_analysis_available')}
              </p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

function getStatistics(analysis: any[]) {
  if (!analysis || analysis.length === 0) {
    return { posCounts: [], nerCounts: [] };
  }

  const posCounts = analysis.reduce((acc, item) => {
    const pos = item.POS || 'N/A';
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nerCounts = analysis.reduce((acc, item) => {
    const ner = item.NER || 'O';
    acc[ner] = (acc[ner] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    posCounts: Object.entries(posCounts).map(([pos, count]) => ({ POS: pos, Count: count as number })),
    nerCounts: Object.entries(nerCounts).map(([ner, count]) => ({ NER: ner, Count: count as number }))
  };
}

export default TranslationComparison; 