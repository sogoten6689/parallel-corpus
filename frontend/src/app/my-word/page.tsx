'use client';

import { useState } from 'react';
import { Button, Select, Tabs, Typography, message } from 'antd';
import type { TabsProps } from 'antd';
import { useTranslation } from 'react-i18next';
import CreateSentencePairTab from '@/components/ui/create-sentence-pair-tab';
import SentencePairsListTab from '@/components/ui/sentence-pairs-list-tab';
import PendingApprovalsTab from '@/components/ui/pending-approvals-tab';

const { Title } = Typography;

const MyWord: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('1');

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: t('create_sentence_pair'),
      children: <CreateSentencePairTab onSuccess={() => setActiveTab('2')} />,
    },
    {
      key: '2',
      label: t('sentence_pair_list'),
      children: <SentencePairsListTab />,
    },
    {
      key: '3',
      label: t('pending_approval'),
      children: <PendingApprovalsTab />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Title level={2} className="mb-6 text-center">
          {t('my_words')}
        </Title>
        
        <div className="bg-white rounded-lg shadow-sm">
          <Tabs 
            defaultActiveKey="1" 
            activeKey={activeTab}
            items={items} 
            onChange={setActiveTab}
            className="p-6"
          />
        </div>
      </div>
    </div>
  );
};

export default MyWord;
