import { apiFetch, apiUrl } from "./api";
import type {
  LoyaltySummary,
  Reward,
  RewardPage,
  CatalogMenuItem,
  CatalogMenuCategory,
  CatalogMenuResponse,
  RedeemCategory,
  RedeemItem,
  RedeemItemPage,
  Redemption,
  RedemptionPage,
  AdminUser,
  AdminUserPage,
  AdminUserPayload,
  AdminBrand,
  AdminLocation,
  RunchiseSyncResult,
  ActivationEmailResult,
  AdminCustomer,
  AdminCustomerPayload,
  AdminCustomerPage,
  CustomerTimestampSyncJob,
  CustomerImportSyncJob,
  AdminActivityLog,
  AdminActivityLogPage,
  CustomerSalesTransactionReport,
  CustomerSalesTransactionReportPage,
  SortOrder,
  AdminSort,
  CustomerEmailStatus,
} from "./admin/types";

export type {
  LoyaltySummary,
  Reward,
  RewardPage,
  CatalogMenuItem,
  CatalogMenuCategory,
  CatalogMenuResponse,
  RedeemCategory,
  RedeemItem,
  RedeemItemPage,
  Redemption,
  RedemptionPage,
  AdminUser,
  AdminUserPage,
  AdminUserPayload,
  AdminBrand,
  AdminLocation,
  RunchiseSyncResult,
  ActivationEmailResult,
  AdminCustomer,
  AdminCustomerPayload,
  AdminCustomerPage,
  CustomerTimestampSyncJob,
  CustomerImportSyncJob,
  AdminActivityLog,
  AdminActivityLogPage,
  CustomerSalesTransactionReport,
  CustomerSalesTransactionReportPage,
  SortOrder,
  AdminSort,
  CustomerEmailStatus,
} from "./admin/types";

const ADMIN_PATH = "/admin";

// Production may briefly run an older backend release which returns the
// redeem list as a plain array. Keep the admin UI usable while frontend and
// backend deployments roll out independently.
export function normalizeRedeemItemPage(
  data: RedeemItemPage | RedeemItem[],
  limit: number,
): RedeemItemPage {
  if (!Array.isArray(data)) return data;

  const total = data.length;
  return {
    items: data,
    page: 1,
    limit: Math.max(limit, total),
    total,
    total_pages: 1,
  };
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(apiUrl(`${ADMIN_PATH}${path}`), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const responseText = await res.text();
  let data: unknown = null;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorBody = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const detail =
      typeof errorBody?.message === "string"
        ? errorBody.message
        : typeof errorBody?.error === "string"
          ? errorBody.error
          : null;
    throw new Error(
      detail
        ? `HTTP ${res.status} — ${detail}`
        : `HTTP ${res.status} — respons backend tidak valid`,
    );
  }

  return data as T;
}

export const adminApi = {
  customerSalesTransactionReports: (
    filters: {
      search?: string;
      outlet?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {},
  ) => {
    const params = new URLSearchParams({
      page: String(filters.page ?? 1),
      limit: String(filters.limit ?? 20),
    });
    if (filters.search) params.set("search", filters.search);
    if (filters.outlet) params.set("outlet", filters.outlet);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    return adminRequest<CustomerSalesTransactionReportPage>(
      `/customer-sales-transaction-reports?${params.toString()}`,
    );
  },
  // M-8: dulu daftar outlet ikut dikirim di setiap respons
  // customerSalesTransactionReports (field `outlets`), dihitung ulang lewat
  // distinct scan di setiap page/filter change. Sekarang endpoint sendiri,
  // dipanggil sekali oleh caller (bukan di setiap loadSalesTransactions).
  customerSalesTransactionReportOutlets: () =>
    adminRequest<string[]>("/customer-sales-transaction-reports/outlets"),
  activityLogs: (
    filters: {
      search?: string;
      action?: string;
      entity_type?: string;
      actor_user_id?: number;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {},
  ) => {
    const params = new URLSearchParams({
      page: String(filters.page ?? 1),
      limit: String(filters.limit ?? 50),
    });
    if (filters.search) params.set("search", filters.search);
    if (filters.action) params.set("action", filters.action);
    if (filters.entity_type) params.set("entity_type", filters.entity_type);
    if (filters.actor_user_id) params.set("actor_user_id", String(filters.actor_user_id));
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    return adminRequest<AdminActivityLogPage>(`/activity-logs?${params.toString()}`);
  },
  users: (search = "", sort: AdminSort = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (sort.sort_by) params.set("sort_by", sort.sort_by);
    if (sort.sort_order) params.set("sort_order", sort.sort_order);
    const query = params.toString();
    return adminRequest<AdminUserPage>(`/users${query ? `?${query}` : ""}`);
  },
  createUser: (payload: AdminUserPayload) =>
    adminRequest<AdminUser>("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id: number, payload: AdminUserPayload) =>
    adminRequest<AdminUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id: number) =>
    adminRequest<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
  customers: (
    search = "",
    page = 1,
    limit = 20,
    sort: AdminSort = {},
    filters: { from?: string; to?: string; email_status?: CustomerEmailStatus } = {},
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    if (sort.sort_by) params.set("sort_by", sort.sort_by);
    if (sort.sort_order) params.set("sort_order", sort.sort_order);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.email_status && filters.email_status !== "all") {
      params.set("email_status", filters.email_status);
    }
    return adminRequest<AdminCustomerPage>(`/customers?${params.toString()}`);
  },
  syncCustomers: () =>
    adminRequest<{ message: string; created: boolean; job: CustomerImportSyncJob }>(
      "/sync/customers",
      { method: "POST" },
    ),
  // sync_enabled: saklar server (RUNCHISE_CUSTOMER_SYNC_ENABLED). Saat false,
  // dashboard tidak boleh menggerakkan worker import sama sekali.
  customerImportSyncStatus: () =>
    adminRequest<{ job: CustomerImportSyncJob | null; sync_enabled: boolean }>(
      "/sync/customers/status",
    ),
  processCustomerImportSync: () =>
    adminRequest<{
      status:
        | "idle"
        | "already_running"
        | "running"
        | "completed"
        | "completed_with_errors"
        | "disabled";
      job: CustomerImportSyncJob | null;
    }>("/sync/customers/process", { method: "POST" }),
  syncCustomerTimestamps: () =>
    adminRequest<{
      message: string;
      created: boolean;
      job: CustomerTimestampSyncJob;
    }>("/sync/customer-timestamps", { method: "POST" }),
  customerTimestampSyncStatus: () =>
    adminRequest<{ job: CustomerTimestampSyncJob | null }>("/sync/customer-timestamps/status"),
  processCustomerTimestampSync: () =>
    adminRequest<{
      status: "idle" | "already_running" | "running" | "completed";
      job: CustomerTimestampSyncJob | null;
    }>("/sync/customer-timestamps/process", { method: "POST" }),
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
    filters: {
      redemption_from?: string;
      redemption_to?: string;
      outlet_id?: number;
      redemption_history_page?: number;
      redemption_history_limit?: number;
    } = {},
  ) => {
    const params = new URLSearchParams();
    if (filters.redemption_from) params.set("redemption_from", filters.redemption_from);
    if (filters.redemption_to) params.set("redemption_to", filters.redemption_to);
    if (filters.outlet_id) params.set("outlet_id", String(filters.outlet_id));
    if (filters.redemption_history_page) {
      params.set("redemption_history_page", String(filters.redemption_history_page));
    }
    if (filters.redemption_history_limit) {
      params.set("redemption_history_limit", String(filters.redemption_history_limit));
    }
    const query = params.toString();
    return adminRequest<LoyaltySummary>(`/loyalty-summary${query ? `?${query}` : ""}`);
  },
  rewards: (page = 1, limit = 50) =>
    adminRequest<RewardPage>(`/rewards?page=${page}&limit=${limit}`),
  createReward: (payload: Partial<Reward>) =>
    adminRequest<Reward>("/rewards", { method: "POST", body: JSON.stringify(payload) }),
  updateReward: (id: number, payload: Partial<Reward>) =>
    adminRequest<Reward>(`/rewards/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  menuItems: (search = "") =>
    adminRequest<CatalogMenuResponse>(
      `/catalog/menu-items?limit=1000${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    ),
  redeemItems: (sort: AdminSort = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (sort.sort_by) params.set("sort_by", sort.sort_by);
    if (sort.sort_order) params.set("sort_order", sort.sort_order);
    const query = params.toString();
    return adminRequest<RedeemItemPage | RedeemItem[]>(
      `/redeem-menu/items${query ? `?${query}` : ""}`,
    ).then((data) => normalizeRedeemItemPage(data, limit));
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
  // M-8: dulu backend selalu mengembalikan take:200 tanpa skip (redemption
  // ke-201+ tidak pernah terlihat). Sekarang dipaginasi sungguhan lewat
  // page/limit, responsnya jadi amplop RedemptionPage (bukan array polos).
  redemptions: (filters: { status?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams({
      page: String(filters.page ?? 1),
      limit: String(filters.limit ?? 50),
    });
    if (filters.status) params.set("status", filters.status);
    return adminRequest<RedemptionPage>(`/redemptions?${params.toString()}`);
  },
  updateRedemptionStatus: (id: number, status: string) =>
    adminRequest<Redemption>(`/redemptions/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};
