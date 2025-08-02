'use client';

import { Typography } from "antd";
import { useTranslation } from "react-i18next";

const Introduction: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="grid items-start justify-items-start p-4">
      {/* Phần giới thiệu */}
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        {t("introduction")}
      </Typography.Title>
      <Typography.Paragraph style={{ textAlign: "justify", maxWidth: "1400px" }}>
        {t("introduction_content")}
      </Typography.Paragraph>

      {/* Phần hướng dẫn sử dụng */}
      <Typography.Title level={3} style={{ marginTop: 32, marginBottom: 16 }}>
        {t("usage_guide")}
      </Typography.Title>
      <Typography.Paragraph style={{ textAlign: "justify", maxWidth: "1400px" }}>
        {t("usage_guide_content")}
      </Typography.Paragraph>
      <Typography.Paragraph style={{ textAlign: "justify", maxWidth: "1400px" }}>
        {t("usage_step_1")}
      </Typography.Paragraph>
      <Typography.Paragraph style={{ textAlign: "justify", maxWidth: "1400px" }}>
        {t("usage_step_2")}
      </Typography.Paragraph>
      <Typography.Paragraph style={{ textAlign: "justify", maxWidth: "1400px" }}>
        {t("usage_step_3")}
      </Typography.Paragraph>
      <Typography.Paragraph style={{ textAlign: "justify", maxWidth: "1400px" }}>
        {t("usage_step_4")}
      </Typography.Paragraph>
    </div>
  );
};

export default Introduction;
