export interface RedeemLoyaltyVoucherPayload {
  loyalty_product_id: string;
}

export interface RedeemTransaction {
  redeem_transaction_id: string;
  // Kode voucher yang didapat customer
  promo_code: string;
  points_spent: number;
  // Saldo poin customer setelah dipotong
  remaining_points: number;
  redeemed_at: string;
}

// Pesan backend yang masih berbahasa Inggris; pesan penukaran lainnya (voucher
// habis, poin kurang, promo berakhir) sudah siap tampil apa adanya
const REDEEM_ERRORS: Record<string, string> = {
  "Please validate your phone number":
    "Verifikasi nomor WhatsApp kamu dulu sebelum menukar poin.",
};

// Khusus role customer dengan nomor terverifikasi. Customer diambil backend
// dari sesi login, jadi body cukup berisi menu yang ditukar.
export const redeemLoyaltyVoucher = async (
  payload: RedeemLoyaltyVoucherPayload,
): Promise<RedeemTransaction> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/redeem-transactions`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-protection": "1",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    // Error validasi zod dikirim sebagai objek (fieldErrors), bukan teks
    const message = typeof error?.message === "string" ? error.message : null;
    throw new Error(
      (message && (REDEEM_ERRORS[message] ?? message)) ??
        "Gagal menukar poin, coba lagi nanti",
    );
  }

  const result = await res.json();

  return result.data;
};

// Menu yang ditukar, diambil backend dari produk promo
export interface RedeemedProduct {
  product_id: string;
  name: string;
  sku: string;
  description: string | null;
  image_url: string | null;
}

export interface RedeemedVoucher {
  redeem_transaction_id: string;
  points_spent: number;
  redeemed_at: string;
  promo_code: {
    promo_code_id: string;
    code: string | null;
    // Ikut sync Runchise: "active", "redeemed" (sudah dipakai di kasir), atau
    // "deactivate"
    status: string | null;
    maximum_usage: number | null;
    number_of_usage: number | null;
    last_usage: string | null;
  };
  promo: {
    promo_id: string;
    name: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  products: RedeemedProduct[];
}

// terms_conditions dan location_ids (location_id outlet tempat voucher
// berlaku) hanya dikirim di endpoint detail
export type RedeemedVoucherDetail = RedeemedVoucher & {
  promo: RedeemedVoucher["promo"] & {
    terms_conditions: string;
    location_ids: string[];
  };
};

// Customer yang menukar; hanya dikirim ke admin dan marketing
export interface Redeemer {
  customer_id: string;
  name: string;
  phone_number: string | null;
  phone_number_country_code: number;
  email: string | null;
}

export type AdminRedeemedVoucher = RedeemedVoucher & { customer: Redeemer };
export type AdminRedeemedVoucherDetail = RedeemedVoucherDetail & {
  customer: Redeemer;
};

export interface RedeemedVoucherList<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export type GetMyVouchersProps = {
  page?: number;
  limit?: number;
  // Urutan waktu penukaran; default backend "desc" (terbaru dulu)
  sort_order?: "asc" | "desc";
};

export type GetRedeemedVouchersProps = GetMyVouchersProps & {
  // Nama / nomor customer, kode voucher, atau nama promo
  search?: string;
  customer_id?: string;
  promo_id?: string;
};

const toParams = (props: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(props).flatMap(([key, value]) =>
      value === undefined || value === "" ? [] : [[key, String(value)]],
    ),
  );

const fetchRedeemTransactions = async <T>(
  path: string,
  fallbackMessage: string,
): Promise<T> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/redeem-transactions${path}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      typeof error?.message === "string" ? error.message : fallbackMessage,
    );
  }

  const result = await res.json();

  return result.data;
};

// Voucher milik customer yang sedang login
export const getMyVouchers = ({
  page,
  limit,
  sort_order,
}: GetMyVouchersProps = {}): Promise<RedeemedVoucherList<RedeemedVoucher>> =>
  fetchRedeemTransactions(
    `/me?${toParams({ page, limit, sort_order })}`,
    "Gagal memuat voucher",
  );

// Backend membatasi 100 voucher per permintaan
const MY_VOUCHERS_PAGE_SIZE = 100;

// Seluruh voucher customer sekaligus, untuk daftar yang difilter di sisi client
export const getAllMyVouchers = async (): Promise<RedeemedVoucher[]> => {
  const vouchers: RedeemedVoucher[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await getMyVouchers({ page, limit: MY_VOUCHERS_PAGE_SIZE });
    vouchers.push(...result.data);
    totalPages = result.meta.total_pages;
    page++;
  }

  return vouchers;
};

// null bila voucher tidak ada atau milik customer lain (backend menjawab 404),
// atau ID di alamatnya bukan UUID (422)
export const getMyVoucher = async (
  redeem_transaction_id: string,
): Promise<RedeemedVoucherDetail | null> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/redeem-transactions/me/${encodeURIComponent(redeem_transaction_id)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (res.status === 404 || res.status === 422) return null;

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      typeof error?.message === "string"
        ? error.message
        : "Gagal memuat voucher",
    );
  }

  const result = await res.json();

  return result.data;
};

// Khusus admin dan marketing: semua voucher yang ditukar beserta customernya
export const getRedeemedVouchers = ({
  page,
  limit,
  sort_order,
  search,
  customer_id,
  promo_id,
}: GetRedeemedVouchersProps = {}): Promise<
  RedeemedVoucherList<AdminRedeemedVoucher>
> =>
  fetchRedeemTransactions(
    `?${toParams({ page, limit, sort_order, search, customer_id, promo_id })}`,
    "Gagal memuat voucher yang ditukar",
  );

export const getRedeemedVoucher = (
  redeem_transaction_id: string,
): Promise<AdminRedeemedVoucherDetail> =>
  fetchRedeemTransactions(
    `/${encodeURIComponent(redeem_transaction_id)}`,
    "Gagal memuat detail voucher",
  );
