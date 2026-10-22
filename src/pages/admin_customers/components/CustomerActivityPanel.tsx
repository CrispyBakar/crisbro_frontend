import { Search, EllipsisIcon } from "lucide-react";
import { useState } from "react";
import type { Customer } from "@/services/customers";
import {
  CUSTOMER_DETAIL_TAB_HEADERS,
  CUSTOMER_DETAIL_TABS,
  type CustomerDetailTab,
} from "@/constant/customerDetails";
import CustomerActivityLogTab from "./CustomerActivityLogTab";
import CustomerOverviewTab from "./CustomerOverviewTab";
import CustomerPointsTab from "./CustomerPointsTab";
import CustomerTransactionsTab from "./CustomerTransactionsTab";

const CustomerActivityPanel = ({
  customer,
  customerId,
  onSync,
  isSyncing,
  syncError,
}: {
  customer: Customer;
  customerId: string;
  onSync: () => void;
  isSyncing: boolean;
  syncError: Error | null;
}) => {
  const [activeTab, setActiveTab] =
    useState<CustomerDetailTab>("Activity Log");
  const [search, setSearch] = useState("");
  const { title, subtitle } = CUSTOMER_DETAIL_TAB_HEADERS[activeTab];

  return (
    <section className="flex min-w-0 flex-col p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <nav className="flex flex-wrap items-center gap-2">
          {CUSTOMER_DETAIL_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "border border-gray-200 bg-cream text-chocolate"
                  : "text-gray-500 hover:bg-cream hover:text-chocolate"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="relative">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex w-fit cursor-pointer justify-center rounded-3xl bg-orange px-4 py-1.5 font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!isSyncing ? (
              "Sync Customer"
            ) : (
              <EllipsisIcon
                size={20}
                color="white"
                className="[&>circle]:animate-bounce [&>circle:nth-child(2)]:[animation-delay:150ms] [&>circle:nth-child(3)]:[animation-delay:300ms]"
              />
            )}
          </button>

          {syncError && (
            <p className="absolute right-0 mt-1 w-max max-w-[80vw] text-xs text-red-500">
              {syncError.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
        <div>
          <h3 className="text-lg font-bold text-chocolate">{title}</h3>
          <span className="text-xs text-gray-500">{subtitle}</span>
        </div>
        {activeTab === "Activity Log" && (
          <div className="relative w-full sm:w-auto">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity..."
              className="w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm text-chocolate placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-border/40 sm:w-64"
            />
          </div>
        )}
      </div>

      {activeTab === "Overview" ? (
        <CustomerOverviewTab customer={customer} />
      ) : activeTab === "Points" ? (
        <CustomerPointsTab customerId={customerId} />
      ) : activeTab === "Transactions" ? (
        <CustomerTransactionsTab customerId={customerId} />
      ) : (
        <CustomerActivityLogTab customer={customer} search={search} />
      )}
    </section>
  );
};

export default CustomerActivityPanel;
