export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  expiresIn: string;
  user: {
    user_id: string;
    email: string;
    username: string;
    phone: string | null;
    role: string;
    email_verification_token: string | null;
    email_verification_expires: string | null;
    email_verified: boolean;
    referral_code: string | null;
    no_referensi: string | null;
    phone_verified: boolean;
    status: string;
    created_at: string;
    updated_at: string;
    customer?: null;
  };
}

export type CurrentUser = LoginResponse["user"];

export const loginAdmin = async (
  payload: AdminLoginPayload,
): Promise<LoginResponse> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Email atau password salah");
  }

  return res.json();
};

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Gagal memuat sesi");

  // endpoint /me mengembalikan user langsung di root, bukan { user: ... }
  const user: CurrentUser = await res.json();
  return user;
};

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

// Backend mencabut semua sesi setelah password diganti — user wajib login ulang
export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<{ message: string }> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/change-password`,
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
    throw new Error(error?.message ?? "Gagal mengganti password");
  }

  return res.json();
};
