'use client'

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { apiService } from '@/services/api';
import { useTranslation } from 'react-i18next';

interface StatisticsData {
  total_words: number;
  unique_words: number;
  unique_pos: number;
  unique_ner: number;
  pos_distribution: Record<string, number>;
  ner_distribution: Record<string, number>;
}

const StatisticsTable: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatisticsData | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await apiService.request('/api/words/stats/');
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        console.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const posColumns = [
    {
      title: 'POS Tag',
      dataIndex: 'pos',
      key: 'pos',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: 'Percentage',
      key: 'percentage',
      render: (_: any, record: any) => {
        if (!stats) return '-';
        const percentage = ((record.count / stats.total_words) * 100).toFixed(2);
        return `${percentage}%`;
      },
    },
  ];

  const nerColumns = [
    {
      title: 'NER Tag',
      dataIndex: 'ner',
      key: 'ner',
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: 'Percentage',
      key: 'percentage',
      render: (_: any, record: any) => {
        if (!stats) return '-';
        const percentage = ((record.count / stats.total_words) * 100).toFixed(2);
        return `${percentage}%`;
      },
    },
  ];

  const posData = stats ? Object.entries(stats.pos_distribution).map(([pos, count]) => ({
    key: pos,
    pos,
    count,
  })) : [];

  const nerData = stats ? Object.entries(stats.ner_distribution).map(([ner, count]) => ({
    key: ner,
    ner,
    count,
  })) : [];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Words"
              value={stats?.total_words || 0}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unique Words"
              value={stats?.unique_words || 0}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unique POS Tags"
              value={stats?.unique_pos || 0}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Unique NER Tags"
              value={stats?.unique_ner || 0}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="POS Distribution" loading={loading}>
            <Table
              columns={posColumns}
              dataSource={posData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="NER Distribution" loading={loading}>
            <Table
              columns={nerColumns}
              dataSource={nerData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsTable;