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

export interface CustomerLoginPayload {
  phone: string;
  password: string;
}

export type CustomerUser = Omit<CurrentUser, "customer"> & {
  customer?: {
    customer_id: string;
    name: string;
    total_point: number;
    available_point: number;
    // runchise_id outlet tempat member terdaftar
    runchise_location_id?: number | null;
    // Data diri — /login dan /profile mengirim seluruh kolom Customer
    address?: string | null;
    province?: string | null;
    city?: string | null;
    postal_code?: string | null;
    // ISO date, mis. "1995-03-12T00:00:00.000Z"
    dob?: string | null;
    // male | female | unknown
    gender?: string | null;
  } | null;
};

export interface CustomerLoginResponse {
  expiresIn: string;
  user: CustomerUser;
}

export const loginCustomer = async (
  payload: CustomerLoginPayload,
): Promise<CustomerLoginResponse> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // Wajib bila masih ada cookie sesi lama, misalnya login ulang setelah
      // popup aktivasi ditutup
      "x-csrf-protection": "1",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Nomor HP atau password salah");
  }

  return res.json();
};

export const logout = async (): Promise<void> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "x-csrf-protection": "1",
    },
  });

  if (!res.ok) throw new Error("Gagal keluar");
};

// Butuh sesi login. Tiap panggilan membuat no. referensi baru, jadi teks
// aktivasi yang lama tidak berlaku lagi.
export const requestActivationText = async (): Promise<string> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/send-otp`, {
    method: "POST",
    credentials: "include",
    headers: {
      "x-csrf-protection": "1",
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal menyiapkan pesan aktivasi");
  }

  const body: { data: { text: string } } = await res.json();
  return body.data.text;
};

export interface CustomerRegisterPayload {
  name: string;
  phone: string;
  username: string;
  email: string;
  password: string;
  // runchise_id outlet yang dipilih
  location_id: number;
  referral_code?: string;
}

export interface CustomerRegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: CustomerUser;
    // Teks aktivasi yang harus dikirim user lewat WhatsApp tanpa diubah
    text: string;
  };
}

export const registerCustomer = async (
  payload: CustomerRegisterPayload,
): Promise<CustomerRegisterResponse> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/register`, {
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
    // Gagal validasi: { success: false, errors: { field: [pesan] } } tanpa message
    const fieldError = error?.errors
      ? Object.values(error.errors).flat()[0]
      : null;
    throw new Error(
      error?.message ?? fieldError ?? "Gagal mendaftar, coba lagi nanti",
    );
  }

  return res.json();
};

// /me khusus admin & marketing — sesi customer diambil dari /profile
export const getCustomerProfile = async (): Promise<CustomerUser | null> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile`, {
    method: "GET",
    credentials: "include",
  });

  // 401: belum login, 403: nomor HP belum diverifikasi
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error("Gagal memuat sesi");

  const user: CustomerUser = await res.json();
  // Akun yang dinonaktifkan saat masih punya sesi diperlakukan seperti belum login
  if (user.status === "inactive") return null;
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
