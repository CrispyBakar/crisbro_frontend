import type { RedeemedVoucher } from "@/services/redeem-transactions";

export type VoucherState = "active" | "used" | "inactive";

// Status promo code ikut sync Runchise: "active", "redeemed" (sudah dipakai di
// kasir), atau "deactivate". Selain active dan redeemed dianggap tidak berlaku.
export const getVoucherState = (
  voucher: Pick<RedeemedVoucher, "promo_code">,
): VoucherState => {
  const { status } = voucher.promo_code;
  if (status === "redeemed") return "used";
  return status === "active" ? "active" : "inactive";
};

export const VOUCHER_STATE_LABELS: Record<VoucherState, string> = {
  active: "Aktif",
  used: "Terpakai",
  inactive: "Tidak berlaku",
};

// Promo loyalty hanya punya satu produk, jadi menu yang ditukar adalah produk
// pertama; null bila produknya sudah tidak ada
export const getVoucherMenu = (voucher: Pick<RedeemedVoucher, "products">) =>
  voucher.products[0] ?? null;

export const getVoucherName = (
  voucher: Pick<RedeemedVoucher, "products" | "promo">,
) => getVoucherMenu(voucher)?.name ?? voucher.promo.name ?? "Voucher";
