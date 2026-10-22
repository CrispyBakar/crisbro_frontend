import { useMemo } from "react";
import type { Customer } from "@/services/customers";
import {
  buildCustomerActivities,
  formatDateWIB,
} from "../customer-details.utils";
import CustomerDetailEmptyState from "./CustomerDetailEmptyState";
import CustomerDetailOptionsButton from "./CustomerDetailOptionsButton";

const CustomerActivityLogTab = ({
  customer,
  search,
}: {
  customer: Customer;
  search: string;
}) => {
  const activities = useMemo(
    () => buildCustomerActivities(customer),
    [customer],
  );
  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return activities;

    return activities.filter(
      (activity) =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query),
    );
  }, [activities, search]);

  if (filteredActivities.length === 0) {
    return (
      <CustomerDetailEmptyState
        title="Tidak ada aktivitas ditemukan"
        description="Coba kata kunci lain."
      />
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {filteredActivities.map((activity) => {
        const Icon = activity.icon;

        return (
          <li
            key={`${activity.title}-${activity.timestamp}`}
            className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-4 sm:p-5"
          >
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-muted">
                <Icon size={18} />
              </span>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-chocolate">
                  {activity.title}
                </span>
                <span className="text-sm text-gray-500">
                  {activity.description}
                </span>
                <span className="mt-1 text-xs text-gray-400">
                  {formatDateWIB(activity.timestamp)}
                </span>
              </div>
            </div>

            <CustomerDetailOptionsButton />
          </li>
        );
      })}
    </ul>
  );
};

export default CustomerActivityLogTab;
