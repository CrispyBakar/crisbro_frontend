import type { Redeemer } from "@/services/redeem-transactions";

// "+62 81234567890", mengikuti tampilan nomor di halaman detail customer
export const formatRedeemerPhone = (
  customer: Pick<Redeemer, "phone_number" | "phone_number_country_code">,
) =>
  customer.phone_number
    ? `+${customer.phone_number_country_code} ${customer.phone_number}`
    : "-";

// Status promo code ikut sync Runchise: active, redeemed (sudah dipakai di
// kasir), atau deactivate
export const renderVoucherStatus = (value: unknown) => {
  const status = String(value ?? "");
  const colorClass =
    status === "active"
      ? "bg-green-50 text-success"
      : status === "redeemed"
        ? "bg-amber-100 text-orange"
        : "bg-gray-100 text-gray-500";

  return (
    <span
      className={`inline-block py-1 px-3 rounded-full font-semibold ${colorClass}`}
    >
      {status || "-"}
    </span>
  );
};
