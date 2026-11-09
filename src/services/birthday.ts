const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

export interface BirthdayTreat {
  has_claimable_treat: boolean;
  treat: {
    user_birthday_id: string;
    birthday_date: string;
    treat_year: number;
    promo_code_id: string;
    status:
      | "pending"
      | "claimed"
      | "expired_unclaimed"
      | "expired_redeem_timeout"
      | "failed";
    created_at: Date;
  } | null;
}

export interface PromoInformation {
  promo_code_id: string;
  usage_type: string;
  status: string;
  maximum_usage: number;
  runchise_id: number;
  is_claimed: boolean;
  promo: {
    promo_id: string;
    runchise_id: number;
    name: string;
    status: string;
    channel: string;
    created_at: string;
    updated_at: string;
    goal: string;
    promo_type: string;
    location_ids: string[];
    product_ids: string[];
    terms_conditions: string;
  };
}

export const isHasBirthdayTreat = async (): Promise<BirthdayTreat> => {
  const res = await fetch(`${BASE_API_URL}/birthday-treat/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat birthday treat status");
  }

  const data = await res.json();
  return data.data as BirthdayTreat;
};

export interface ClaimBirthdayTreatPayload {
  user_birthday_id: string;
}

// Hasil klaim birthday treat: kode voucher untuk ditunjukkan ke kasir.
// Catatan: endpoint klaim masih asumsi — sesuaikan saat backend siap.
export interface ClaimedBirthdayTreat {
  user_birthday_id: string;
  // Kode voucher yang didapat customer
  promo_code: string;
  // Terisi bila voucher tersimpan sebagai transaksi redeem (tautan ke Voucherku)
  redeem_transaction_id?: string;
  claimed_at: string;
}

// Klaim birthday treat yang sedang bisa diambil. Customer diambil backend dari
// sesi login, body cukup menunjuk treat yang diklaim.
// Catatan: endpoint masih asumsi (POST /birthday-treat/me/claim) — sesuaikan bila
// backend memakai alamat/struktur respons yang berbeda.
export const claimBirthdayTreat = async (
  payload: ClaimBirthdayTreatPayload,
): Promise<ClaimedBirthdayTreat> => {
  const res = await fetch(`${BASE_API_URL}/birthday-treat/me/claim`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-protection": "1",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    const message = typeof error?.message === "string" ? error.message : null;
    throw new Error(
      message ?? "Gagal mengklaim birthday treat, coba lagi nanti",
    );
  }

  const data = await res.json();
  return data.data as ClaimedBirthdayTreat;
};

export const getPromoInformation = async (
  promoCodeId: string,
): Promise<PromoInformation> => {
  const res = await fetch(
    `${BASE_API_URL}/birthday-treat/promo/promoCode/${promoCodeId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    const message = typeof error?.message === "string" ? error.message : null;
    throw new Error(message ?? "Gagal mendapatkan promo ifnromation");
  }

  const data = await res.json();

  return data.data as PromoInformation;
};
