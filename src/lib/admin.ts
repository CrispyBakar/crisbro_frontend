import { getToken } from "./auth";

const API_BASE = "/api/admin";

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Token admin tidak ditemukan");

  const res = await fetch(`${API_BASE}${path}`, {
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
  pending_redemptions: number;
  claimed_redemptions: number;
  top_rewards: Array<{
    reward_id: number;
    reward_name: string;
    redemption_count: number;
    points_spent: number;
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
  category?: { id: number; name: string };
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
  is_active: boolean;
  badge: string | null;
  sort_order: number;
  menu_item: CatalogMenuItem;
  category: RedeemCategory;
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

export const adminApi = {
  summary: () => adminRequest<LoyaltySummary>("/loyalty-summary"),
  rewards: () => adminRequest<Reward[]>("/rewards"),
  createReward: (payload: Partial<Reward>) =>
    adminRequest<Reward>("/rewards", { method: "POST", body: JSON.stringify(payload) }),
  updateReward: (id: number, payload: Partial<Reward>) =>
    adminRequest<Reward>(`/rewards/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  menuItems: (search = "") =>
    adminRequest<CatalogMenuItem[]>(
      `/catalog/menu-items?limit=100${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    ),
  redeemCategories: () => adminRequest<RedeemCategory[]>("/redeem-menu/categories"),
  createRedeemCategory: (payload: Partial<RedeemCategory>) =>
    adminRequest<RedeemCategory>("/redeem-menu/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRedeemCategory: (id: number, payload: Partial<RedeemCategory>) =>
    adminRequest<RedeemCategory>(`/redeem-menu/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  redeemItems: () => adminRequest<RedeemItem[]>("/redeem-menu/items"),
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
  redemptions: (status = "") =>
    adminRequest<Redemption[]>(`/redemptions${status ? `?status=${status}` : ""}`),
  updateRedemptionStatus: (id: number, status: string) =>
    adminRequest<Redemption>(`/redemptions/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};
