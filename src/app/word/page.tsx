'use client';

import TagTable from "@/components/ui/tag-table";
import { useTranslation } from "react-i18next";
import { Divider } from 'antd';

const Word: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-4">
          <Divider>
            {t('source_language')}
          </Divider>
          <TagTable data={[]} />
          <Divider>
            {t('target_language')}
          </Divider>
          <TagTable data={[]} />
        </div>
      </div>
    </>
  );
}

export default Word;
