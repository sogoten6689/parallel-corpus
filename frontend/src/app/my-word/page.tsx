'use client';


import { Divider, Button, Select, App, Cascader, Typography, Form } from 'antd';
import Tabs, { TabsProps } from 'antd/lib/tabs';
import { useTranslation } from 'react-i18next';


const MyWord: React.FC = () => {
  const { t } = useTranslation();

const items: TabsProps['items'] = [
  {
    key: '1',
    label: t('word'),
    children: 'Đang phát triển...',
  },
  {
    key: '2',
    label: t('create_sequence'),
    children: 'Đang phát triển...',
  },
  {
    key: '3',
    label: t('tag'),
    children: 'Đang phát triển...',
  },
];
  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3">
          <Tabs defaultActiveKey="1" items={items} onChange={() => { }} />
        </div>
      </div >
    </>
  );
};

export default MyWord;
