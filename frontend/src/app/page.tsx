'use client';
import { useAppLanguage } from "@/contexts/AppLanguageContext";
import MasterRowWordTable from "@/components/ui/master-row-word-table";

export default function Home() {
  const { appLanguage, setCurrentLanguage } = useAppLanguage();
  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <MasterRowWordTable />
      </div>
    </>
  );
}
