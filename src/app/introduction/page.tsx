'use client';

import InDevelop from "@/components/ui/in-develop";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";

const Introduction: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="grid items-center justify-items-center">
       <Typography.Title level={5} style={{ margin: 0 }} title="Introduction">{t("introduction")}</Typography.Title> 
      <InDevelop />
    </div>
  );
}

export default Introduction;
