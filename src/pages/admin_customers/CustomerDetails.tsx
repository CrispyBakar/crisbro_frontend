import { useState } from "react";
import { X } from "lucide-react";
import { useParams } from "react-router";
import AdjustPointModal from "@/components/AdjustPointModal";
import CustomerDetailHeader from "@/components/CustomerDetailHeader";
import {
  useAdjustCustomerPoint,
  useChangeStatusCustomer,
  useCustomer,
  useSyncCustomer,
} from "@/hooks/use-customers";
import { usePageTitle } from "@/hooks/use-page-title";
import CustomerActivityPanel from "./components/CustomerActivityPanel";
import CustomerProfile from "./components/CustomerProfile";
import EditCustomerModal from "./components/EditCustomerModal";

const CustomerDetails = () => {
  const { customer_id: customerId = "" } = useParams();
  const { data: customer, isPending, error } = useCustomer(customerId);
  const {
    mutate: syncCustomer,
    isPending: isSyncing,
    error: syncError,
  } = useSyncCustomer(customerId);
  const {
    mutate: changeStatus,
    isPending: isChangingStatus,
    error: changeStatusError,
  } = useChangeStatusCustomer(customerId);
  const {
    mutate: adjustPoint,
    isPending: isAdjustingPoint,
    error: adjustPointError,
    reset: resetAdjustPoint,
  } = useAdjustCustomerPoint();

  usePageTitle(customer?.name ?? "Detail Customer");

  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustPoinOpen, setIsAdjustPoinOpen] = useState(false);
  const [adjustPointNotice, setAdjustPointNotice] = useState<string | null>(
    null,
  );

  const closeAdjustPoint = () => {
    setIsAdjustPoinOpen(false);
    resetAdjustPoint();
  };

  if (isPending) {
    return (
      <main className="w-full space-y-6">
        <p className="text-gray-500">Memuat customer...</p>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="w-full space-y-6">
        <p className="text-red-500">
          Gagal memuat customer: {error?.message ?? "Customer tidak ditemukan"}
        </p>
      </main>
    );
  }

  return (
    <main className="w-full space-y-6">
      <CustomerDetailHeader
        changeStatus={(value) => {
          if (value === "active" || value === "inactive") {
            changeStatus(value);
          }
        }}
        changeStatusError={changeStatusError}
        copied={copied}
        customer={customer}
        isChangingStatus={isChangingStatus}
        onCopied={setCopied}
        onIsAdjustPoinOpen={setIsAdjustPoinOpen}
        onIsEditOpen={setIsEditOpen}
        onShowChangeStatus={setShowChangeStatus}
        onAdjustPointNotice={setAdjustPointNotice}
        showChangeStatus={showChangeStatus}
        title="Customer Detail"
        subtitle="Lihat informasi dan riwayat aktivitas customer."
      />

      {adjustPointNotice && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p>{adjustPointNotice}</p>
          <button
            onClick={() => setAdjustPointNotice(null)}
            className="cursor-pointer rounded-full p-0.5 text-amber-700 transition-colors hover:bg-amber-100"
            aria-label="Tutup pemberitahuan"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 rounded-3xl border border-gray-100 bg-white shadow-md lg:grid-cols-[21rem_1fr]">
        <CustomerProfile customer={customer} />
        <CustomerActivityPanel
          customer={customer}
          customerId={customerId}
          onSync={() => syncCustomer()}
          isSyncing={isSyncing}
          syncError={syncError}
        />
      </div>

      {isEditOpen && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {isAdjustPoinOpen && (
        <AdjustPointModal
          currentPoints={customer.available_point}
          isPending={isAdjustingPoint}
          error={adjustPointError?.message}
          onSubmit={(values) =>
            adjustPoint(
              { customer_id: customerId, ...values },
              {
                onSuccess: ({ synced, message }) => {
                  if (!synced) setAdjustPointNotice(message);
                  closeAdjustPoint();
                },
              },
            )
          }
          onClose={closeAdjustPoint}
        />
      )}
    </main>
  );
};

export default CustomerDetails;
