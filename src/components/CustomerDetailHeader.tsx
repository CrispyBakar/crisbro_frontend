import { STATUS_OPTIONS } from "@/constant/customerStatus";
import type { Customer } from "@/services/customers";
import { Check, CoinsIcon, Copy, Pencil, Power } from "lucide-react";

interface CustomerDetailHeaderProps {
  title: string;
  subtitle: string;
  customer: Customer;
  copied: boolean;
  onCopied: (value: boolean) => void;
  showChangeStatus: boolean;
  onShowChangeStatus: (value: boolean) => void;
  isChangingStatus: boolean;
  changeStatus: (value: Customer["status"]) => void;
  changeStatusError: Error | null;
  onAdjustPointNotice: (v: string | null) => void;
  onIsAdjustPoinOpen: (v: boolean) => void;
  onIsEditOpen: (v: boolean) => void;
}

const CustomerDetailHeader = ({
  onIsAdjustPoinOpen,
  onIsEditOpen,
  title,
  subtitle,
  customer,
  copied,
  onCopied,
  showChangeStatus,
  onShowChangeStatus,
  isChangingStatus,
  changeStatus,
  changeStatusError,
  onAdjustPointNotice,
}: CustomerDetailHeaderProps) => {
  const handleCopyId = async () => {
    if (!customer) return;

    try {
      await navigator.clipboard.writeText(customer.customer_id);
      onCopied(true);
      setTimeout(() => onCopied(false), 2000);
    } catch {
      // Nothing
    }
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-chocolate sm:text-3xl">
          {title}
        </h2>
        <span className="text-xs text-gray-500">{subtitle}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={handleCopyId}
          className="flex items-center gap-2 rounded-3xl border border-gray-100 bg-white py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream active:bg-gray-100 cursor-pointer"
        >
          {copied ? (
            <Check size={16} className="text-success" />
          ) : (
            <Copy size={16} className="text-muted" />
          )}
          {copied ? "ID Tersalin" : "Copy ID"}
        </button>

        <div className="relative">
          <button
            onClick={() => onShowChangeStatus(!showChangeStatus)}
            disabled={isChangingStatus}
            className="flex items-center gap-2 rounded-3xl border border-gray-100 bg-white py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream active:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Power size={16} />
            {isChangingStatus ? "Mengubah..." : "Ubah Status"}
          </button>

          {showChangeStatus && (
            <ul className="absolute z-10 mt-1 w-full p-0.5 bg-white border border-gray-100 shadow-sm rounded-2xl">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <li key={value}>
                  <button
                    onClick={() => {
                      onShowChangeStatus(false);
                      changeStatus(value);
                    }}
                    disabled={customer.status === value}
                    className="w-full text-left px-2 py-1.5 hover:bg-gray-200 rounded-2xl text-sm cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {changeStatusError && (
            <p className="absolute left-0 mt-1 w-max max-w-[80vw] text-xs text-red-500 sm:left-auto sm:right-0">
              {changeStatusError.message}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            onAdjustPointNotice(null);
            onIsAdjustPoinOpen(true);
          }}
          className="flex items-center gap-2 rounded-3xl border border-gray-100 bg-white py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream active:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CoinsIcon size={16} />
          <span>Atur Poin</span>
        </button>

        <button
          onClick={() => onIsEditOpen(true)}
          className="flex items-center gap-2 rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500 cursor-pointer"
        >
          <Pencil size={16} />
          Edit customer
        </button>
      </div>
    </div>
  );
};

export default CustomerDetailHeader;
