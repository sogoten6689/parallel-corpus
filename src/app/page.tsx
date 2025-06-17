'use client';
import CorpusTable from "@/components/ui/corpus-table";
import FileUploader from "@/components/ui/file-uploader";
import { RootState } from "@/redux";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
export default function Home() {
  const { t } = useTranslation();
  const rows = useSelector((state: RootState) => state.dataSlice.rows);

  return (
    <div className="grid items-center justify-items-center">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-[32px] sm:text-[48px]">{t("app_name")}</h1>
         <div className="p-4">
        <CorpusTable data={rows} />
      </div>
      </main>

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
