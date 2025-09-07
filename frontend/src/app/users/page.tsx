'use client';
import UserTable from "@/components/ui/user-table";

export default function UserList() {

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
