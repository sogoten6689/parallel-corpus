'use client';

import { Button, Card, Input, Select, Space, Table } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Radio } from "antd";
const { Option } = Select;

const SearchWord: React.FC = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [language, setLanguage] = useState('vi');
  const [searchType, setSearchType] = useState('matches');

  const handleSearch = () => {
    console.log('Searching for', searchText, 'in', language, 'type', searchType);
  };

  const columns = [
    {
      title: 'Left',
      dataIndex: 'left',
      key: 'left',
    },
    {
      title: 'Word',
      dataIndex: 'word',
      key: 'word',
    },
    {
      title: 'Right',
      dataIndex: 'right',
      key: 'right',
    },
  ];

  const data = [
    {
      key: '1',
      left: 'Tôi đang',
      word: 'học',
      right: 'máy học.',
    },
    {
      key: '2',
      left: 'Anh ấy',
      word: 'phân tích',
      right: 'ngữ nghĩa.',
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      {/* Search Block */}
      <Space direction="vertical" className="w-full">
        <Card title="Search">
          <Space direction="vertical" className="w-full">
            {/* Dòng 1: Input + Search button */}
            <Space wrap className="w-full">
              <Input
                placeholder="Enter keyword"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ flex: 1 }}
                width={700}
              />
              <Button type="primary" onClick={handleSearch}>Search</Button>
            </Space>

            {/* Dòng 2: Language Select + Search type Radio Group */}
            <Space wrap className="w-full">
              <Select value={language} onChange={setLanguage} style={{ width: 120 }}>
                <Option value="vi">Vietnamese</Option>
                <Option value="en">English</Option>
              </Select>
              <Radio.Group
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                options={[
                  { label: t('matches'), value: 'matches' },
                  { label: t('phrase'), value: 'phrase' },
                  { label: t('morphological'), value: 'morphological' },
                ]}
              />
            </Space>
          </Space>

        </Card>
      </Space>

      {/* Language 1 Table */}
      <Space direction="vertical" className="w-full">
        <Card title="Language 1">
          <Table columns={columns} dataSource={data} pagination={false} />
        </Card>
      </Space>

      {/* Language 2 Table */}
      <Space direction="vertical" className="w-full">
        <Card title="Language 2">
          <Table columns={columns} dataSource={data} pagination={false} />
        </Card>
      </Space>
    </Space>
  );
};

export default SearchWord;
