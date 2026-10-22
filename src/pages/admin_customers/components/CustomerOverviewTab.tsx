import type { Customer } from "@/services/customers";
import { formatDateWIB } from "../customer-details.utils";
import CustomerDetailRow from "./CustomerDetailRow";

const CustomerOverviewTab = ({ customer }: { customer: Customer }) => {
  const rows = [
    { label: "Customer ID", value: customer.customer_id },
    { label: "Runchise ID", value: String(customer.runchise_id) },
    {
      label: "Sync at",
      value: customer.runchise_synced_at
        ? formatDateWIB(customer.runchise_synced_at)
        : null,
    },
    { label: "Province", value: customer.province },
    { label: "Date of birth", value: customer.dob },
    { label: "Member since", value: customer.member_since },
    {
      label: "Created at",
      value: customer.created_at ? formatDateWIB(customer.created_at) : null,
    },
    { label: "Location ID", value: customer.runchise_location_id },
    { label: "User ID", value: customer.user_id },
    { label: "Normalized Phone", value: customer.normalized_phone_number },
    { label: "Address", value: customer.address },
    { label: "City", value: customer.city },
    { label: "Postal code", value: customer.postal_code },
    { label: "Gender", value: customer.gender },
    { label: "Owner location ID", value: customer.owner_location_id },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 md:gap-6">
      {[rows.slice(0, 10), rows.slice(10)].map((column, columnIndex) => (
        <div key={columnIndex} className="col-span-1 text-xs md:mb-2">
          {column.map((row) => (
            <CustomerDetailRow key={row.label} {...row} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default CustomerOverviewTab;
