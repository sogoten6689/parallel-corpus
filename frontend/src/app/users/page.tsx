'use client';
import { useTranslation } from "react-i18next";
import UserTable from "@/components/ui/user-table";

export default function UserList() {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-rows-[auto_1fr]">
        <div className="p-3 flex items-center gap-4">
        </div>
        {<UserTable />}
      </div>
    </>
  );
}
