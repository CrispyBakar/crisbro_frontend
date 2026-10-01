import { useState } from "react";
import { Check, Copy, Search, X } from "lucide-react";
import type { PromoCode } from "@/services/promo";

// TODO: ganti dengan data dari GET /promos/:promo_id (field promo_codes)
const createDummyPromoCodes = (promoId: string): PromoCode[] =>
  ["H1OBPQRC1", "K7ZMWT3QA", "P2XNLD8VE", "R9CUYH4BS", "T5GJKE6WN"].map(
    (code, index) => ({
      promo_code_id: `${promoId}-${index}`,
      promo_id: promoId,
      runchise_id: 900000 + index,
      code,
      usage_type: "single",
      status: index < 2 ? "used" : "active",
      maximum_usage: 1,
      number_of_usage: index < 2 ? 1 : 0,
      last_usage: index < 2 ? "2026-09-28T10:15:00.000Z" : null,
      deactivate_at: null,
      deactivate_reason: null,
      created_at: "2026-09-25T08:00:00.000Z",
      updated_at: "2026-09-28T10:15:00.000Z",
    }),
  );

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const statusClassName = (status: string | null) =>
  status === "active"
    ? "text-success"
    : status === "used"
      ? "text-gray-500"
      : "text-red-500";

type PromoCodesModalProps = {
  promoId: string;
  promoName: string;
  onClose: () => void;
};

// Modal daftar promo code yang telah di-generate untuk sebuah promo
const PromoCodesModal = ({
  promoId,
  promoName,
  onClose,
}: PromoCodesModalProps) => {
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const promoCodes = createDummyPromoCodes(promoId);
  const filteredCodes = promoCodes.filter((promoCode) =>
    (promoCode.code ?? "")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(
      () => setCopiedCode((current) => (current === code ? null : current)),
      1500,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-chocolate">Promo Codes</h3>
            <span className="block truncate text-xs text-gray-500">
              {promoName} · {promoCodes.length} kode
            </span>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search promo code..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>

          <div className="max-h-[55dvh] overflow-auto rounded-2xl border border-gray-100">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Usage</th>
                  <th className="px-4 py-3 font-semibold">Used</th>
                  <th className="px-4 py-3 font-semibold">Last Usage</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((promoCode) => (
                  <tr
                    key={promoCode.promo_code_id}
                    className="border-t border-gray-100"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">
                          {promoCode.code ?? "-"}
                        </span>
                        {promoCode.code && (
                          <button
                            type="button"
                            onClick={() => copyCode(promoCode.code!)}
                            className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-cream hover:text-orange"
                            aria-label="Salin kode"
                          >
                            {copiedCode === promoCode.code ? (
                              <Check size={14} className="text-success" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {promoCode.usage_type ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {promoCode.number_of_usage ?? 0}/
                      {promoCode.maximum_usage ?? "∞"}
                    </td>
                    <td className="px-4 py-3">
                      {formatDateTime(promoCode.last_usage)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full bg-orange/10 px-3 py-1 font-semibold ${statusClassName(promoCode.status)}`}
                      >
                        {promoCode.status ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCodes.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Tidak ada promo code
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCodesModal;
