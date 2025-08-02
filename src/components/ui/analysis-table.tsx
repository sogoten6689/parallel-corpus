'use client';
import { Table, Tag, Card, Row, Col, Statistic, Select, Button, message, Modal, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { apiService } from '@/services/api';

const { Option } = Select;

interface AnalysisData {
  Word: string;
  Lemma: string;
  Links: string;
  Morph: string;
  POS: string;
  Phrase: string;
  Grm: string;
  NER: string;
  Semantic: string;
}

interface StatisticsData {
  posCounts: Array<{ POS: string; Count: number }>;
  nerCounts: Array<{ NER: string; Count: number }>;
}

interface AnalysisTableProps {
  data: AnalysisData[];
  statistics: StatisticsData;
  loading?: boolean;
}

// Options for dropdowns
const POS_OPTIONS = [
  'NOUN', 'VERB', 'ADJ', 'ADV', 'PRON', 'DET', 'PREP', 'CONJ', 'INTJ', 'NUM', 'PART', 'X'
];

const PHRASE_OPTIONS = [
  'NP', 'VP', 'PP', 'ADJP', 'ADVP', 'QP', 'WHNP', 'WHPP', 'WHADJP', 'WHADVP', 'FRAG', 'X'
];

const GRM_OPTIONS = [
  'nsubj', 'dobj', 'iobj', 'prep', 'det', 'amod', 'advmod', 'aux', 'cop', 'mark', 'cc', 'conj',
  'punct', 'root', 'ccomp', 'xcomp', 'acl', 'advcl', 'relcl', 'nummod', 'appos', 'compound',
  'nmod', 'case', 'obl', 'vocative', 'discourse', 'expl', 'dislocated', 'parataxis', 'orphan',
  'goeswith', 'reparandum', 'dep', 'ROOT'
];

const NER_OPTIONS = [
  'PERSON', 'ORG', 'LOC', 'MISC', 'O', 'B-PERSON', 'I-PERSON', 'B-ORG', 'I-ORG', 'B-LOC', 'I-LOC'
];

const MORPH_OPTIONS = [
  'Number=Sing', 'Number=Plur', 'Person=1', 'Person=2', 'Person=3', 'Tense=Past', 'Tense=Present',
  'Tense=Future', 'Voice=Active', 'Voice=Passive', 'Mood=Ind', 'Mood=Sub', 'Mood=Imp',
  'Gender=Masc', 'Gender=Fem', 'Gender=Neut', 'Case=Nom', 'Case=Acc', 'Case=Dat', 'Case=Gen',
  'Degree=Pos', 'Degree=Comp', 'Degree=Sup', 'Definite=Def', 'Definite=Ind'
];

const AnalysisTable: React.FC<AnalysisTableProps> = ({ data, statistics, loading = false }) => {
  const { t } = useTranslation();
  const [editableData, setEditableData] = useState<AnalysisData[]>(data);
  const [updating, setUpdating] = useState<number | null>(null); // row index being updated
  const [updatingAll, setUpdatingAll] = useState(false);
  const originalDataRef = useRef<AnalysisData[]>(data);

  // Update editable data when props change
  useEffect(() => {
    setEditableData(data);
    originalDataRef.current = data;
  }, [data]);

  const handleCellChange = (recordIndex: number, field: keyof AnalysisData, value: string) => {
    const newData = [...editableData];
    newData[recordIndex] = { ...newData[recordIndex], [field]: value };
    setEditableData(newData);
  };

  const handleUpdateRow = async (recordIndex: number) => {
    setUpdating(recordIndex);
    try {
      const rowData = editableData[recordIndex];
      const originalRow = originalDataRef.current[recordIndex];
      
      // Only update if there are changes
      const hasChanges = Object.keys(rowData).some(key => 
        rowData[key as keyof AnalysisData] !== originalRow[key as keyof AnalysisData]
      );

      if (!hasChanges) {
        message.info('No changes to update');
        return;
      }

      const response = await apiService.updateAnalysisRow(rowData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update row');
      }
      
      message.success('Row updated successfully');
      originalDataRef.current[recordIndex] = { ...rowData };
    } catch (error) {
      console.error('Update error:', error);
      message.error('Failed to update row');
    } finally {
      setUpdating(recordIndex);
    }
  };

  const handleUpdateAll = async () => {
    Modal.confirm({
      title: 'Confirm Update All',
      content: 'Are you sure you want to update all modified rows?',
      onOk: async () => {
        setUpdatingAll(true);
        try {
          const changedRows = editableData.filter((row, index) => {
            const originalRow = originalDataRef.current[index];
            return Object.keys(row).some(key => 
              row[key as keyof AnalysisData] !== originalRow[key as keyof AnalysisData]
            );
          });

          if (changedRows.length === 0) {
            message.info('No changes to update');
            return;
          }

          const response = await apiService.updateAnalysisRows(changedRows);
          
          if (!response.success) {
            throw new Error(response.error || 'Failed to update rows');
          }
          
          message.success(`${changedRows.length} rows updated successfully`);
          originalDataRef.current = [...editableData];
        } catch (error) {
          console.error('Update all error:', error);
          message.error('Failed to update rows');
        } finally {
          setUpdatingAll(false);
        }
      }
    });
  };

  const getPOSColor = (pos: string) => {
    const colors: Record<string, string> = {
      'NOUN': 'blue',
      'VERB': 'green',
      'ADJ': 'orange',
      'ADV': 'purple',
      'PRON': 'cyan',
      'DET': 'magenta',
      'PREP': 'geekblue',
      'CONJ': 'lime',
    };
    return colors[pos] || 'default';
  };

  const getPhraseColor = (phrase: string) => {
    const colors: Record<string, string> = {
      'NP': 'blue',
      'VP': 'green',
      'PP': 'orange',
      'ADJP': 'purple',
    };
    return colors[phrase] || 'default';
  };

  const getDependencyColor = (dep: string) => {
    const colors: Record<string, string> = {
      'nsubj': 'blue',
      'dobj': 'green',
      'prep': 'orange',
      'det': 'purple',
      'amod': 'cyan',
      'advmod': 'magenta',
    };
    return colors[dep] || 'default';
  };

  const getNERColor = (ner: string) => {
    const colors: Record<string, string> = {
      'PERSON': 'red',
      'ORG': 'blue',
      'LOC': 'green',
      'MISC': 'orange',
      'O': 'default',
    };
    return colors[ner] || 'default';
  };

  const columns = [
    {
      title: t('word'),
      dataIndex: 'Word',
      key: 'word',
      render: (text: string) => <strong>{text}</strong>,
      width: 120,
    },
    {
      title: t('lemma'),
      dataIndex: 'Lemma',
      key: 'lemma',
      width: 120,
    },
    {
      title: t('links'),
      dataIndex: 'Links',
      key: 'links',
      render: (text: string) => <span className="text-blue-600">{text}</span>,
      width: 80,
    },
    {
      title: t('morph'),
      dataIndex: 'Morph',
      key: 'morph',
      width: 150,
      render: (value: string, record: AnalysisData, index: number) => (
        <Select
          value={value}
          onChange={(val) => handleCellChange(index, 'Morph', val)}
          style={{ width: '100%' }}
          showSearch
          allowClear
        >
          {MORPH_OPTIONS.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('pos'),
      dataIndex: 'POS',
      key: 'pos',
      width: 120,
      render: (value: string, record: AnalysisData, index: number) => (
        <Select
          value={value}
          onChange={(val) => handleCellChange(index, 'POS', val)}
          style={{ width: '100%' }}
        >
          {POS_OPTIONS.map(option => (
            <Option key={option} value={option}>
              <Tag color={getPOSColor(option)}>{option}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('phrase'),
      dataIndex: 'Phrase',
      key: 'phrase',
      width: 120,
      render: (value: string, record: AnalysisData, index: number) => (
        <Select
          value={value}
          onChange={(val) => handleCellChange(index, 'Phrase', val)}
          style={{ width: '100%' }}
        >
          {PHRASE_OPTIONS.map(option => (
            <Option key={option} value={option}>
              <Tag color={getPhraseColor(option)}>{option}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('grm'),
      dataIndex: 'Grm',
      key: 'grm',
      width: 120,
      render: (value: string, record: AnalysisData, index: number) => (
        <Select
          value={value}
          onChange={(val) => handleCellChange(index, 'Grm', val)}
          style={{ width: '100%' }}
          showSearch
        >
          {GRM_OPTIONS.map(option => (
            <Option key={option} value={option}>
              <Tag color={getDependencyColor(option)}>{option}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('ner'),
      dataIndex: 'NER',
      key: 'ner',
      width: 120,
      render: (value: string, record: AnalysisData, index: number) => (
        <Select
          value={value}
          onChange={(val) => handleCellChange(index, 'NER', val)}
          style={{ width: '100%' }}
        >
          {NER_OPTIONS.map(option => (
            <Option key={option} value={option}>
              <Tag color={getNERColor(option)}>{option}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('semantic'),
      dataIndex: 'Semantic',
      key: 'semantic',
      width: 100,
      render: (value: string, record: AnalysisData, index: number) => (
        <span className={`font-mono ${parseFloat(value) > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record: AnalysisData, index: number) => (
        <Button
          type="primary"
          size="small"
          loading={updating === index}
          onClick={() => handleUpdateRow(index)}
        >
          Update
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title={t('pos_statistics')} size="small">
            <div className="space-y-2">
              {statistics.posCounts.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Tag color={getPOSColor(item.POS)}>{item.POS}</Tag>
                  <span className="font-semibold">{item.Count}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={t('ner_statistics')} size="small">
            <div className="space-y-2">
              {statistics.nerCounts.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Tag color={getNERColor(item.NER)}>{item.NER}</Tag>
                  <span className="font-semibold">{item.Count}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Update All Button */}
      <Card>
        <Space>
          <Button
            type="primary"
            loading={updatingAll}
            onClick={handleUpdateAll}
          >
            Update All Changes
          </Button>
          <span className="text-gray-500 text-sm">
            Click to update all modified rows to database
          </span>
        </Space>
      </Card>

      {/* Analysis Table */}
      <Card title={t('detailed_analysis')}>
        <Table
          columns={columns}
          dataSource={editableData.map((item, index) => ({ ...item, key: index }))}
          loading={loading}
          pagination={false}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AnalysisTable; 