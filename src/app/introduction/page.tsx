'use client';

import InDevelop from "@/components/ui/in-develop";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";
import Image from "next/image";

const Introduction: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="grid items-center justify-items-center">
       <Typography.Title level={5} style={{ margin: 0 }} title="Introduction">{t("introduction")}</Typography.Title> 
      <InDevelop />

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Introduction
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          About us
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Contact us
        </a>
      </footer>
    </div>
  );
}

export default Introduction;
