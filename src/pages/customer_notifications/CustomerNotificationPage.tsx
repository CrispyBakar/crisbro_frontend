import CustomerPageHeader from "@/components/CustomerPageHeader";
import NotificationCardSkeleton from "@/components/NotificationCardSkeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import React from "react";
import { fieldBoxClass } from "../auth/fieldStyles";
import FilterPill from "@/components/FilterPill";

const CustomerNotificationPage = () => {
  usePageTitle("Notifikasi");

  return (
    <div>
      <div className="flex w-full flex-col px-4 pt-3">
        <CustomerPageHeader title="Notifikasi" />

        {/* <NotificationCardSkeleton /> */}
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <FilterPill
            label="Semua"
            count={0}
            active={false}
            onClick={() => {}}
          />
          <FilterPill
            label="Belum dibaca"
            count={0}
            active={false}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerNotificationPage;
