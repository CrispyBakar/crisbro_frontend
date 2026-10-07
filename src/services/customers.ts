export interface ParamsCustomers {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?:
    | "name"
    | "status"
    | "created_at"
    | "phone_number"
    | "total_point"
    | "available_point";
  sort_order?: "asc" | "desc";
  start_date?: string;
  end_date?: string;
}

export interface Customer {
  customer_id: string;
  user_id: string;
  runchise_id: number;
  runchise_location_id: number;
  runchise_synced_at: string;
  name: string;
  phone_number: string;
  normalized_phone_number: string | null;
  phone_number_country_code: number;
  address: string | null;
  province: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  dob: string | null;
  gender: string | null;
  status: string;
  balance: string;
  member_since: string | null;
  total_point: number;
  available_point: number;
  // FK UUID internal Location (form memakai runchise_id via owner_location)
  owner_location_id: string | null;
  created_by_id: string | number | null;
  last_updated_by_id: string;
  created_at: string;
  updated_at: string;
  // Hanya ada di respons detail (backend include relasi user)
  user?: {
    email: string | null;
  };
  // Hanya ada di respons detail (backend include relasi owner_location)
  owner_location?: {
    runchise_id: number | null;
    name: string;
  } | null;
}

// Field yang diterima endpoint PATCH /customers/:customer_id (schema strict)
export interface ParamsUpdateCustomer {
  customer_id: string;
  name?: string;
  email?: string;
  address?: string;
  province?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  gender?: "male" | "female" | "unknown";
  status?: "active" | "inactive";
  // Runchise_id lokasi owner (string angka; schema backend z.string())
  owner_location_id?: string;
  dob?: string | null;
}

export interface GetCustomersResponse {
  data: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Nullability mengikuti schema Prisma CustomerPointHistory
export interface CustomerPointHistory {
  customer_point_history: string;
  customer_id: string;
  runchise_id: number | null;
  customer_point_id: number | null;
  point_type: string | null;
  point_snapshot: number | null;
  point: number | null;
  sale_transaction_uuid: string | null;
  sale_transaction_id: number | null;
  sales_return_id: number | null;
  void_by: string | null;
  void_id: number | null;
  void_reason: string | null;
  notes: string;
  created_by_id: number | null;
  location_id: number | null;
  sales_no: string | null;
  expired_point: number | null;
  expired_at: string | null;
  customer_expired_point_id: number | null;
  customer_order_uuid: string | null;
  formatted_created_at: string | null;
  issued_at_time: string | null;
  point_type_description: string | null;
  channel: string | null;
}

export const getCustomerById = async (
  customerId: string,
): Promise<Customer> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customers/${customerId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat detail customer");
  }

  const data = await res.json();

  return data.data;
};

export const getCustomers = async ({
  page,
  limit,
  search,
  sort_by,
  sort_order,
  start_date,
  end_date,
}: ParamsCustomers): Promise<GetCustomersResponse> => {
  const params = new URLSearchParams({
    ...(page ? { page: String(page) } : {}),
    ...(limit ? { limit: String(limit) } : {}),
    ...(search ? { search: String(search) } : {}),
    ...(sort_by ? { sort_by: String(sort_by) } : {}),
    ...(sort_order ? { sort_order: String(sort_order) } : {}),
    ...(start_date ? { start_date: String(start_date) } : {}),
    ...(end_date ? { end_date: String(end_date) } : {}),
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customers?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat lokasi");
  }

  const data = await res.json();

  return data.data;
};

export const getCustomerPointHistory = async ({
  customer_id,
}: {
  customer_id: string;
}): Promise<CustomerPointHistory[]> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customers/${customer_id}/point-history?page=1&limit=25&sort_by=formatted_created_at&sort_order=desc`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat lokasi");
  }

  const data = await res.json();

  return data.data.data;
};

export interface GetPointHistoryResponse {
  data: CustomerPointHistory[];
  meta: GetCustomersResponse["meta"];
}

// Khusus role customer: riwayat poin milik user yang sedang login, terbaru dulu
export const getMyPointHistory = async ({
  page,
  limit,
}: {
  page: number;
  limit: number;
}): Promise<GetPointHistoryResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort_by: "formatted_created_at",
    sort_order: "desc",
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customers/me/point-history?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      typeof error?.message === "string"
        ? error.message
        : "Gagal memuat riwayat poin",
    );
  }

  const data = await res.json();

  return data.data;
};

export const updateCustomer = async ({
  customer_id,
  ...payload
}: ParamsUpdateCustomer): Promise<Customer> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customers/${customer_id}`,
    {
      method: "PATCH",
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
    throw new Error(error?.message ?? "Gagal memperbarui customer");
  }

  const data = await res.json();

  return data.data;
};

// Field yang diterima endpoint PATCH /customers/me (schema strict): sama dengan
// update oleh admin, tanpa status dan owner_location_id
export type ParamsUpdateMyCustomer = Omit<
  ParamsUpdateCustomer,
  "customer_id" | "status" | "owner_location_id"
>;

const UPDATE_MY_CUSTOMER_ERRORS: Record<string, string> = {
  "Email is already registered": "Email ini sudah dipakai akun lain",
  // Customer yang belum terhubung ke Runchise tidak bisa mengubah nama, alamat,
  // dan jenis kelamin; email dan tanggal lahir tetap bisa, disimpan lokal saja
  "Customer belum terhubung ke Runchise, tidak bisa update":
    "Data member kamu belum tersinkron. Untuk sementara hanya email dan tanggal lahir yang bisa diubah.",
};

// Khusus role customer: memperbarui data diri milik user yang sedang login
export const updateMyCustomer = async (
  payload: ParamsUpdateMyCustomer,
): Promise<Customer> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/customers/me`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-protection": "1",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    // Gagal validasi (422) mengirim message berbentuk { field: [pesan] }
    const message = typeof error?.message === "string" ? error.message : null;
    throw new Error(
      (message && (UPDATE_MY_CUSTOMER_ERRORS[message] ?? message)) ??
        "Gagal memperbarui profil, coba lagi nanti",
    );
  }

  const data = await res.json();

  return data.data;
};

export const changeCustomerStatus = async (
  customer_id: string,
  status: string,
) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customers/${customer_id}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-protection": "1",
      },
      body: JSON.stringify({
        status,
      }),
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal mengubah status customer");
  }

  return true;
};
