import { CheckCircle2, RefreshCw, TriangleAlert, X } from "lucide-react";
import { useSyncPromo } from "@/hooks/use-promos";
import { removePendingPromoSync } from "./pending-promo-syncs";

type PromoSyncFailedModalProps = {
  runchiseId: number;
  promoName: string;
  onClose: () => void;
};

// Ditampilkan menggantikan form create saat backend membalas PROMO_SYNC_FAILED:
// promo sudah ada di Runchise, jadi yang diulang hanya sinkronisasinya.
const PromoSyncFailedModal = ({
  runchiseId,
  promoName,
  onClose,
}: PromoSyncFailedModalProps) => {
  const {
    mutate: syncPromo,
    isPending,
    isSuccess,
    error,
  } = useSyncPromo();

  const handleSync = () =>
    syncPromo(
      { runchise_id: runchiseId },
      { onSuccess: () => removePendingPromoSync(runchiseId) },
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white shadow-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isSuccess ? "bg-green-50 text-success" : "bg-cream text-orange"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 size={20} />
              ) : (
                <TriangleAlert size={20} />
              )}
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-chocolate">
                {isSuccess ? "Promo tersinkron" : "Promo belum tersimpan"}
              </h3>
              <span className="block truncate text-xs text-gray-500">
                {promoName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4 text-sm text-gray-700 sm:p-6">
          {isSuccess ? (
            <p>Promo berhasil disimpan dan sudah muncul di daftar promo.</p>
          ) : (
            <>
              <p>
                Promo <b>sudah berhasil dibuat di Runchise</b>, tetapi gagal
                disimpan ke sistem. Klik <b>Sinkronkan ulang</b> untuk
                menyimpannya.
              </p>
              <p className="text-gray-500">
                Jangan membuat promo yang sama lagi karena akan tercatat dua
                kali di Runchise. Jika ditutup, promo ini tetap bisa
                disinkronkan dari halaman Promo.
              </p>
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-red-500">
                  {error.message}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 p-4 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer rounded-3xl border border-gray-100 py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream"
          >
            Tutup
          </button>
          {!isSuccess && (
            <button
              type="button"
              onClick={handleSync}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500 disabled:opacity-70"
            >
              <RefreshCw
                size={16}
                className={isPending ? "animate-spin" : undefined}
              />
              {isPending ? "Menyinkronkan..." : "Sinkronkan ulang"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoSyncFailedModal;
