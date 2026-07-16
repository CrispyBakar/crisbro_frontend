import { getToken } from "./auth";
import { apiUrl } from "./api";

const ADMIN_PATH = "/admin";

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Token admin tidak ditemukan");

  const res = await fetch(apiUrl(`${ADMIN_PATH}${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Request admin gagal");
  }

  return data as T;
}

export type LoyaltySummary = {
  total_members: number;
  active_members: number;
  total_points_given: number;
  total_points_available: number;
  points_earned: number;
  points_redeemed: number;
  redemption_count: number;
  top_rewards: Array<{
    reward_id: number;
    reward_name: string;
    redemption_count: number;
    points_spent: number;
  }>;
  activation_by_outlet?: Array<{
    outlet_id: number;
    outlet_name: string;
    city: string | null;
    activated_count: number;
  }>;
  top_redeem_outlets?: Array<{
    outlet_id: number;
    outlet_name: string;
    city: string | null;
    redemption_count: number;
    points_spent: number;
  }>;
  redemption_trend?: Array<{
    date: string;
    redemption_count: number;
    points_spent: number;
  }>;
  redemption_history?: Array<{
    id: number;
    reward_id: number;
    reward_name: string;
    points_spent: number;
    menu_price: number | null;
    outlet_id: number | null;
    outlet_name: string;
    outlet_city: string | null;
    redeemed_at: string;
  }>;
};

export type Reward = {
  id: number;
  brand_id: number;
  name: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
  is_active: boolean;
};

export type CatalogMenuItem = {
  id: number;
  runchise_id: number | null;
  name: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  is_active: boolean;
  category?: { id: number; name: string; is_active?: boolean };
};

export type CatalogMenuCategory = {
  id: number;
  name: string;
  is_active: boolean;
};

export type CatalogMenuResponse = {
  categories: CatalogMenuCategory[];
  items: CatalogMenuItem[];
};

export type RedeemCategory = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type RedeemItem = {
  id: number;
  menu_item_id: number;
  category_id: number;
  points_required: number;
  pb1_rate: number;
  pb1_amount: number;
  price_with_pb1: number;
  is_active: boolean;
  badge: string | null;
  sort_order: number;
  menu_item: CatalogMenuItem;
  category: RedeemCategory;
  created_at?: string;
  updated_at?: string;
};

export type Redemption = {
  id: number;
  points_spent: number;
  status: string;
  redemption_code: string | null;
  redeemed_at: string | null;
  reward: { id: number; name: string; points_required: number };
  customer: {
    id: number;
    name: string;
    phone_number: string | null;
    user?: { phone_number: string | null; email: string | null };
  };
};

export type AdminUser = {
  id: number;
  email: string | null;
  phone_number: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type AdminUserPayload = {
  email?: string | null;
  phone_number?: string | null;
  password?: string;
  role?: string;
};

export type AdminBrand = {
  id: number;
  name: string;
};

export type AdminLocation = {
  id: number;
  name: string;
  city: string | null;
  runchise_id?: number | null;
};

export type RunchiseSyncResult = {
  status?: "pending" | "synced" | "failed" | "skipped" | string;
  error?: string;
  reason?: string;
  skipped?: boolean;
  runchise_customer_id?: number;
  matched_existing?: boolean;
  relinked_existing?: boolean;
  updated_existing?: boolean;
};

export type ActivationEmailResult = {
  sent?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

export type AdminCustomer = {
  id: number;
  user_id: number;
  name: string;
  runchise_id?: number | null;
  runchise_location_id?: number | null;
  runchise_sync_status?: "pending" | "synced" | "failed" | "skipped" | string | null;
  runchise_sync_error?: string | null;
  runchise_synced_at?: string | null;
  runchise_sync?: RunchiseSyncResult;
  activation_email?: ActivationEmailResult | null;
  phone_number: string | null;
  phone_number_country_code: number;
  address: string | null;
  province: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  dob: string | null;
  gender: string | null;
  status: string | null;
  balance: string | number;
  brand_id: number;
  owner_location_id: number | null;
  customer_locations?: Array<{
    location_id: number;
    location?: AdminLocation;
  }>;
  user: {
    id: number;
    email: string | null;
    phone_number: string | null;
    role: string;
    activation_status?: string;
    activated_at?: string | null;
  };
  brand: AdminBrand;
  owner_location: AdminLocation | null;
  customer_point: {
    total_point: number;
    available_point: number;
    next_reward_threshold: number;
  } | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminCustomerPayload = {
  name?: string;
  email?: string | null;
  phone_number?: string | null;
  phone_number_country_code?: number;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
  dob?: string | null;
  gender?: string;
  status?: string;
  balance?: number;
  brand_id?: number;
  owner_location_id?: number | null;
  location_ids?: number[];
  total_point?: number;
  available_point?: number;
};

export type AdminCustomerPage = {
  items: AdminCustomer[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type SortOrder = "asc" | "desc";

export type AdminSort = {
  sort_by?: string;
  sort_order?: SortOrder;
};

export const adminApi = {
  users: (search = "", sort: AdminSort = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort.sort_by) params.set("sort_by", sort.sort_by);
    if (sort.sort_order) params.set("sort_order", sort.sort_order);
    const query = params.toString();
    return adminRequest<AdminUser[]>(`/users${query ? `?${query}` : ""}`);
  },
  createUser: (payload: AdminUserPayload) =>
    adminRequest<AdminUser>("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id: number, payload: AdminUserPayload) =>
    adminRequest<AdminUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id: number) =>
    adminRequest<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
  customers: (search = "", page = 1, limit = 20, sort: AdminSort = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    if (sort.sort_by) params.set("sort_by", sort.sort_by);
    if (sort.sort_order) params.set("sort_order", sort.sort_order);
    return adminRequest<AdminCustomerPage>(`/customers?${params.toString()}`);
  },
  createCustomer: (payload: AdminCustomerPayload) =>
    adminRequest<AdminCustomer>("/customers", { method: "POST", body: JSON.stringify(payload) }),
  updateCustomer: (id: number, payload: AdminCustomerPayload) =>
    adminRequest<AdminCustomer>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCustomer: (id: number) =>
    adminRequest<{ message: string }>(`/customers/${id}`, { method: "DELETE" }),
  resendCustomerActivation: (id: number) =>
    adminRequest<{ message: string; activation_email?: { sent?: boolean; skipped?: boolean } }>(
      `/customers/${id}/activation`,
      { method: "POST" },
    ),
  retryCustomerRunchiseSync: (id: number) =>
    adminRequest<AdminCustomer>(`/customers/${id}/runchise-sync`, { method: "POST" }),
  brands: () => adminRequest<AdminBrand[]>("/brands"),
  locations: () => adminRequest<AdminLocation[]>("/locations"),
  summary: (
    filters: { redemption_from?: string; redemption_to?: string; outlet_id?: number } = {},
  ) => {
    const params = new URLSearchParams();
    if (filters.redemption_from) params.set("redemption_from", filters.redemption_from);
    if (filters.redemption_to) params.set("redemption_to", filters.redemption_to);
    if (filters.outlet_id) params.set("outlet_id", String(filters.outlet_id));
    const query = params.toString();
    return adminRequest<LoyaltySummary>(`/loyalty-summary${query ? `?${query}` : ""}`);
  },
  rewards: () => adminRequest<Reward[]>("/rewards"),
  createReward: (payload: Partial<Reward>) =>
    adminRequest<Reward>("/rewards", { method: "POST", body: JSON.stringify(payload) }),
  updateReward: (id: number, payload: Partial<Reward>) =>
    adminRequest<Reward>(`/rewards/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  menuItems: (search = "") =>
    adminRequest<CatalogMenuResponse>(
      `/catalog/menu-items?limit=1000${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    ),
  redeemItems: (sort: AdminSort = {}) => {
    const params = new URLSearchParams();
    if (sort.sort_by) params.set("sort_by", sort.sort_by);
    if (sort.sort_order) params.set("sort_order", sort.sort_order);
    const query = params.toString();
    return adminRequest<RedeemItem[]>(`/redeem-menu/items${query ? `?${query}` : ""}`);
  },
  createRedeemItem: (payload: Partial<RedeemItem>) =>
    adminRequest<RedeemItem>("/redeem-menu/items", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRedeemItem: (id: number, payload: Partial<RedeemItem>) =>
    adminRequest<RedeemItem>(`/redeem-menu/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteRedeemItem: (id: number) =>
    adminRequest<{ message: string }>(`/redeem-menu/items/${id}`, { method: "DELETE" }),
  redemptions: (status = "") =>
    adminRequest<Redemption[]>(`/redemptions${status ? `?status=${status}` : ""}`),
  updateRedemptionStatus: (id: number, status: string) =>
    adminRequest<Redemption>(`/redemptions/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};
