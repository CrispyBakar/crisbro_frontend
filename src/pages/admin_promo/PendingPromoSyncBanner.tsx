import { useState } from "react";
import { RefreshCw, TriangleAlert, X } from "lucide-react";
import { useSyncPromo } from "@/hooks/use-promos";
import {
  removePendingPromoSync,
  usePendingPromoSyncs,
} from "./pending-promo-syncs";
import type { PendingPromoSync } from "./pending-promo-syncs";

const PendingPromoSyncRow = ({ item }: { item: PendingPromoSync }) => {
  const { mutate: syncPromo, isPending, error } = useSyncPromo();
  const [isConfirmingDismiss, setIsConfirmingDismiss] = useState(false);

  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-chocolate">
          {item.name}
        </p>
        <p className="text-xs text-gray-500">
          Gagal tersimpan{" "}
          {new Date(item.failed_at).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isConfirmingDismiss ? (
          <>
            <span className="text-xs text-gray-500">Abaikan promo ini?</span>
            <button
              type="button"
              onClick={() => removePendingPromoSync(item.runchise_id)}
              className="cursor-pointer rounded-3xl border border-gray-100 py-1.5 px-3 text-xs font-semibold text-red-500 hover:bg-red-50"
            >
              Ya
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDismiss(false)}
              className="cursor-pointer rounded-3xl border border-gray-100 py-1.5 px-3 text-xs font-semibold text-chocolate hover:bg-cream"
            >
              Batal
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                syncPromo(
                  { runchise_id: item.runchise_id },
                  {
                    onSuccess: () => removePendingPromoSync(item.runchise_id),
                  },
                )
              }
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 rounded-3xl bg-orange py-1.5 px-4 text-sm font-semibold text-white active:bg-orange-500 disabled:opacity-70"
            >
              <RefreshCw
                size={14}
                className={isPending ? "animate-spin" : undefined}
              />
              {isPending ? "Menyinkronkan..." : "Sync"}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDismiss(true)}
              disabled={isPending}
              className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
              aria-label="Abaikan"
              title="Abaikan"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
    </li>
  );
};

// Daftar promo yang sudah dibuat di Runchise tapi belum tersimpan di DB lokal
const PendingPromoSyncBanner = () => {
  const pending = usePendingPromoSyncs();

  if (pending.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-orange/30 bg-cream p-4">
      <div className="flex items-start gap-3">
        <TriangleAlert size={20} className="mt-0.5 shrink-0 text-orange" />
        <div>
          <h4 className="text-sm font-semibold text-chocolate">
            {pending.length} promo belum tersinkron
          </h4>
          <p className="text-xs text-gray-600">
            Promo berikut sudah dibuat di Runchise tetapi belum tersimpan di
            sistem. Klik Sync untuk menyimpannya — jangan membuat ulang
            promonya.
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {pending.map((item) => (
          <PendingPromoSyncRow key={item.runchise_id} item={item} />
        ))}
      </ul>
    </section>
  );
};

export default PendingPromoSyncBanner;
