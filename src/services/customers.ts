export interface ParamsCustomers {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: "name" | "status" | "created_at" | "phone_number";
  sort_order?: "asc" | "desc";
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
}: ParamsCustomers): Promise<GetCustomersResponse> => {
  const params = new URLSearchParams({
    ...(page ? { page: String(page) } : {}),
    ...(limit ? { limit: String(limit) } : {}),
    ...(search ? { search: String(search) } : {}),
    ...(sort_by ? { sort_by: String(sort_by) } : {}),
    ...(sort_order ? { sort_order: String(sort_order) } : {}),
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
