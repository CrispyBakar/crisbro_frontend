import { MapPin } from "lucide-react";
import { Link } from "react-router";
import type { Customer } from "@/services/customers";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { getCustomerInitials } from "../customer-details.utils";
import CustomerInfoRow from "./CustomerInfoRow";
import CustomerStatItem from "./CustomerStatItem";

const CustomerProfile = ({ customer }: { customer: Customer }) => {
  const isActive = customer.status === "active";

  return (
    <aside className="flex min-w-0 flex-col gap-6 border-b border-gray-100 p-5 sm:p-8 lg:border-r lg:border-b-0">
      <div className="flex w-full flex-col items-start gap-4">
        <div className="relative">
          <div className="flex size-20 items-center justify-center rounded-full bg-sunshine-yellow text-2xl font-bold text-chocolate">
            {getCustomerInitials(customer.name)}
          </div>
        </div>

        <div className="flex w-full flex-col items-start justify-start gap-1.5">
          <h3 className="wrap-break-word text-xl font-bold text-chocolate">
            {customer.name}
          </h3>
          <span className="text-sm text-gray-500">
            Runchise ID - {customer.runchise_id}
          </span>
          <span
            className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              isActive
                ? "bg-green-100 text-success"
                : "bg-red-100 text-red-500"
            }`}
          >
            {customer.status}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
        <h4 className="text-sm font-bold text-chocolate">
          Contact Information
        </h4>
        <ul className="flex flex-col gap-3">
          <li>
            <Link
              to={`https://wa.me/${customer.phone_number_country_code}${customer.phone_number}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3"
            >
              <img
                src={whatsappIcon}
                alt=""
                className="h-8 w-8 cursor-pointer rounded-md p-1 hover:bg-cream"
              />
              <span className="text-sm text-chocolate">
                +{customer.phone_number_country_code} {customer.phone_number}
              </span>
            </Link>
          </li>
          <CustomerInfoRow icon={MapPin}>
            {customer.address ? (
              <span className="text-sm text-chocolate">{customer.address}</span>
            ) : (
              <span className="text-sm text-gray-400">
                Alamat belum tersedia
              </span>
            )}
          </CustomerInfoRow>
        </ul>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
        <h4 className="text-sm font-bold text-chocolate">Loyalty Summary</h4>
        <div className="grid grid-cols-3 gap-2">
          <CustomerStatItem
            label="Total point"
            value={String(customer.total_point)}
            accent
          />
          <CustomerStatItem
            label="Available"
            value={String(customer.available_point)}
            accent
          />
          <CustomerStatItem
            label="Balance"
            value={String(Number(customer.balance ?? 0))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
        <h4 className="text-sm font-bold text-chocolate">Account</h4>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Location ID</dt>
            <dd className="font-semibold text-chocolate">
              {customer.owner_location_id ?? customer.runchise_location_id}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">Member since</dt>
            <dd
              className={
                customer.member_since
                  ? "font-semibold text-chocolate"
                  : "text-gray-400"
              }
            >
              {customer.member_since ?? "—"}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
};

export default CustomerProfile;
