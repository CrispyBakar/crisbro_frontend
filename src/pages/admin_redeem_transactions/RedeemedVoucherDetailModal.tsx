import { useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router";
import LoadingCircle from "@/components/LoadingCircle";
import { useRedeemedVoucher } from "@/hooks/use-redeem-transactions";
import { formatShortCalendarDate, formatShortDateTime } from "@/lib/date";
import { getVoucherName } from "@/lib/vouchers";
import {
  formatRedeemerPhone,
  renderVoucherStatus,
} from "./redeemed-voucher-utils";

const DetailItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium uppercase text-gray-500">{label}</span>
    <div className="text-sm text-gray-900">{children}</div>
  </div>
);

type RedeemedVoucherDetailModalProps = {
  redeemTransactionId: string;
  onClose: () => void;
};

// Modal detail voucher dari GET /redeem-transactions/:redeem_transaction_id
const RedeemedVoucherDetailModal = ({
  redeemTransactionId,
  onClose,
}: RedeemedVoucherDetailModalProps) => {
  const { data: voucher, isPending, error } = useRedeemedVoucher(
    redeemTransactionId,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detail Redeemed Voucher"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-chocolate">
              {voucher ? getVoucherName(voucher) : "Detail Redeemed Voucher"}
            </h3>
            <span className="font-mono text-sm text-gray-500">
              {voucher?.promo_code.code ?? "-"}
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

        {isPending ? (
          <LoadingCircle className="py-16" />
        ) : error ? (
          <p className="p-6 text-sm text-red-500">
            Gagal memuat detail voucher: {error.message}
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <section className="flex flex-col gap-5">
              <h4 className="text-base font-bold">Voucher</h4>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem label="Voucher Code">
                  <span className="font-mono">
                    {voucher.promo_code.code ?? "-"}
                  </span>
                </DetailItem>
                <DetailItem label="Status">
                  {renderVoucherStatus(voucher.promo_code.status)}
                </DetailItem>
                <DetailItem label="Points Spent">
                  {voucher.points_spent.toLocaleString("id-ID")}
                </DetailItem>
                <DetailItem label="Redeemed At">
                  {formatShortDateTime(voucher.redeemed_at)}
                </DetailItem>
                <DetailItem label="Usage">
                  {voucher.promo_code.number_of_usage ?? 0} /{" "}
                  {voucher.promo_code.maximum_usage ?? "-"}
                </DetailItem>
                <DetailItem label="Last Usage">
                  {voucher.promo_code.last_usage
                    ? formatShortDateTime(voucher.promo_code.last_usage)
                    : "-"}
                </DetailItem>
              </div>
            </section>

            <hr className="my-6 border-gray-100" />

            <section className="flex flex-col gap-5">
              <h4 className="text-base font-bold">Customer</h4>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem label="Name">
                  <Link
                    to={`/admin/customers/${voucher.customer.customer_id}`}
                    className="font-medium text-orange hover:underline"
                  >
                    {voucher.customer.name}
                  </Link>
                </DetailItem>
                <DetailItem label="Phone">
                  {formatRedeemerPhone(voucher.customer)}
                </DetailItem>
                <DetailItem label="Email">
                  {voucher.customer.email ?? "-"}
                </DetailItem>
              </div>
            </section>

            <hr className="my-6 border-gray-100" />

            <section className="flex flex-col gap-5">
              <h4 className="text-base font-bold">Redeemed Menu</h4>
              {voucher.products.length ? (
                <ul className="flex flex-col gap-2">
                  {voucher.products.map((product) => (
                    <li
                      key={product.product_id}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">-</p>
              )}
            </section>

            <hr className="my-6 border-gray-100" />

            <section className="flex flex-col gap-5 pb-2">
              <h4 className="text-base font-bold">Promo</h4>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem label="Promo Name">
                  {voucher.promo.name ?? "-"}
                </DetailItem>
                <DetailItem label="Promo Status">
                  <span className="capitalize">{voucher.promo.status}</span>
                </DetailItem>
                <DetailItem label="Period">
                  {voucher.promo.start_date
                    ? formatShortCalendarDate(voucher.promo.start_date)
                    : "-"}{" "}
                  -{" "}
                  {voucher.promo.end_date
                    ? formatShortCalendarDate(voucher.promo.end_date)
                    : "Onwards"}
                </DetailItem>
              </div>
              <DetailItem label="Terms and Conditions">
                {/* pre-line: baris baru yang diketik admin tetap tampil */}
                {voucher.promo.terms_conditions ? (
                  <p className="whitespace-pre-line">
                    {voucher.promo.terms_conditions}
                  </p>
                ) : (
                  "-"
                )}
              </DetailItem>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedeemedVoucherDetailModal;
