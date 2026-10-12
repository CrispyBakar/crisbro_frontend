import { useState } from "react";
import { Ticket } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useGeneratePromoCodes } from "@/hooks/use-promos";
import { isPromoSyncFailed } from "@/services/promo";
import { addPendingPromoSync } from "./pending-promo-syncs";

// Batas total_code di backend (generatePromoCodeSchema)
const MAX_TOTAL_CODE = 1000;

const inputClassName =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange";

type PromoCodeGeneratorProps = {
  promoId: string;
  promoName: string;
  // Jumlah promo code yang sudah ada
  codeCount: number;
  // false bila promo tidak memakai promo code (backend menolak generate)
  isEnabled: boolean;
};

// Bagian "Generate Promo Codes" di form edit promo: menambah kode baru lewat
// POST /promos/:promo_id/promo-codes/generate, terpisah dari tombol simpan form
const PromoCodeGenerator = ({
  promoId,
  promoName,
  codeCount,
  isEnabled,
}: PromoCodeGeneratorProps) => {
  const [total, setTotal] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const generate = useGeneratePromoCodes();

  const totalCode = Number(total);
  const isValid =
    Number.isInteger(totalCode) &&
    totalCode >= 1 &&
    totalCode <= MAX_TOTAL_CODE;
  // Kode sudah dibuat di Runchise tapi gagal tersimpan lokal: generate ulang
  // akan membuat kode ganda, jadi tombolnya dikunci sampai promo di-sync
  const isSyncFailed = isPromoSyncFailed(generate.error);

  const openConfirm = () => {
    if (isValid && !isSyncFailed) setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    generate.reset();
  };

  const handleGenerate = () =>
    generate.mutate(
      { promo_id: promoId, total_code: totalCode },
      {
        onSuccess: () => {
          setGeneratedCount(totalCode);
          setTotal("");
          setIsConfirmOpen(false);
        },
        onError: (error) => {
          if (!isPromoSyncFailed(error)) return;
          // Simpan dulu agar runchise_id tidak hilang walau modal ditutup
          addPendingPromoSync({
            runchise_id: error.runchiseId,
            name: promoName,
          });
          setIsConfirmOpen(false);
        },
      },
    );

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
      <div>
        <h4 className="text-sm font-semibold">Generate Promo Codes</h4>
        <p className="mt-1 text-xs text-gray-500">
          Promo ini punya {codeCount.toLocaleString("id-ID")} promo code. Kode
          baru langsung dibuat di Runchise, tanpa perlu menyimpan form ini.
        </p>
      </div>

      {isEnabled ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="number"
            // Tanpa min/max: batasnya dicek di sini supaya tidak ikut menahan
            // tombol simpan form promo
            value={total}
            onChange={(event) => {
              setTotal(event.target.value);
              setGeneratedCount(null);
            }}
            onKeyDown={(event) => {
              // Enter di sini tidak boleh ikut menyimpan form promo
              if (event.key !== "Enter") return;
              event.preventDefault();
              openConfirm();
            }}
            placeholder={`Jumlah kode baru (maks. ${MAX_TOTAL_CODE.toLocaleString("id-ID")})`}
            aria-label="Jumlah promo code baru"
            disabled={isSyncFailed}
            className={inputClassName}
          />
          <button
            type="button"
            onClick={openConfirm}
            disabled={!isValid || isSyncFailed}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-3xl border border-orange px-5 py-3 text-sm font-semibold text-orange transition-colors hover:bg-orange/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
          >
            <Ticket size={16} />
            Generate
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Promo ini tidak memakai promo code, jadi kode tidak bisa di-generate.
        </p>
      )}

      {total !== "" && !isValid && (
        <p className="text-xs text-red-500">
          Isi bilangan bulat antara 1 dan{" "}
          {MAX_TOTAL_CODE.toLocaleString("id-ID")}.
        </p>
      )}

      {generatedCount !== null && (
        <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-success">
          {generatedCount.toLocaleString("id-ID")} promo code baru berhasil
          dibuat.
        </p>
      )}

      {isSyncFailed && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">
          Promo code <b>sudah dibuat di Runchise</b>, tetapi gagal disimpan ke
          sistem. Jangan generate ulang. Tutup form ini lalu klik Sync pada
          promo ini di halaman Promo.
        </p>
      )}

      {isConfirmOpen && (
        <ConfirmDialog
          title="Generate promo code?"
          message={
            <>
              <b>{totalCode.toLocaleString("id-ID")}</b> promo code baru akan
              dibuat di Runchise untuk promo <b>{promoName}</b>. Kode yang sudah
              dibuat tidak bisa dihapus dari sini.
            </>
          }
          icon={Ticket}
          confirmLabel="Ya, generate"
          isPending={generate.isPending}
          error={generate.error?.message}
          onConfirm={handleGenerate}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
};

export default PromoCodeGenerator;
