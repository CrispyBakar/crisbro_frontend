export const REFERRAL_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
};

export interface Referral {
  referral_id: string;
  referral_code: string;
  status: (typeof REFERRAL_STATUS)[keyof typeof REFERRAL_STATUS];
  referrer: {
    user_id: string;
    username: string;
    point_reward: number;
  };
  referred: {
    user_id: string;
    username: string;
    phone: string;
    phone_verified: boolean;
    account_status: string;
    point_given: number;
  };
  expires_at: string;
  created_at: string;
  can_validate: boolean;
}

export interface ReferralLists {
  items: Referral[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    status: string;
  };
}

export interface ParamsReferral {
  page?: number;
  limit?: number;
  status?: string;
}

export const getReferral = async ({
  page,
  limit,
  status,
}: ParamsReferral): Promise<ReferralLists> => {
  const params = new URLSearchParams({
    ...(page ? { page: page.toString() } : {}),
    ...(limit ? { limit: limit.toString() } : {}),
    ...(status ? { status } : {}),
  });

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/referral/usages?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat referral");
  }

  // Respons backend: { success, data: { items, meta }, message }
  const data = await response.json();
  return data.data;
};

// Validasi referral pending milik customer yang di-referral (referred.user_id)
export const validateReferral = async (user_id: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/referral/validate/${user_id}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "x-csrf-protection": "1",
      },
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    // Error validasi zod dikirim sebagai array (formErrors)
    const message = Array.isArray(error?.message)
      ? error.message.join(", ")
      : error?.message;
    throw new Error(message ?? "Gagal memvalidasi referral");
  }

  const data = await response.json();
  return data.data;
};
