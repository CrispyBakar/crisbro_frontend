export type LoyaltySummary = {
  total_members: number;
  active_members: number;
  total_points_given: number;
  total_points_available: number;
  points_earned: number;
  /** Diturunkan dari total_points_given - total_points_available. */
  points_redeemed: number;
  /** Versi PointHistory; selalu 0 karena penukaran terjadi di POS Runchise. */
  points_redeemed_from_history?: number;
  redemption_count: number;
  /** Jumlah baris customer-per-outlet; satu orang bisa terhitung berulang. */
  runchise_customers_stored: number;
  /** Penjumlahan kolom Customer Berpoin pada tabel per outlet. */
  runchise_customers_with_points: number;
  /** Customer unik, angka yang ditampilkan di kartu ringkasan. */
  runchise_customers_unique?: number;
  runchise_customers_by_outlet: Array<{
    outlet_id: number;
    source_location_id: number;
    outlet_name: string;
    city: string | null;
    stored_customers: number;
    customers_with_points: number;
    points_redeemed?: number;
    api_reported_total: number | null;
    last_snapshot_at: string | null;
    status: "completed" | "complete" | "available" | "empty" | "capped" | "mismatch" | string;
  }>;
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
  redemption_history_pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
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

export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type RewardPage = Page<Reward>;

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

export type RedeemCategoryPage = Page<RedeemCategory>;

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

export type RedeemItemPage = Page<RedeemItem>;

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

// M-8: GET /admin/redemptions dulu memakai take:200 tanpa skip, jadi
// redemption ke-201+ tidak akan pernah terlihat. Sekarang dipaginasi
// sungguhan, jadi responsnya berupa amplop halaman (sama seperti
// CustomerSalesTransactionReportPage/AdminActivityLogPage), bukan array
// polos lagi.
export type RedemptionPage = {
  items: Redemption[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type AdminUser = {
  id: number;
  email: string | null;
  phone_number: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type AdminUserPage = Page<AdminUser>;

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
  user_id?: number;
  name: string;
  runchise_id?: number | null;
  runchise_created_at?: string | null;
  runchise_updated_at?: string | null;
  date_source?: "runchise" | "runchise_sync" | "local";
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
  location_ids?: number[];
  customer_locations?: Array<{
    location_id: number;
    location?: AdminLocation;
  }>;
  user: {
    id: number | null;
    email: string | null;
    phone_number: string | null;
    role: string;
    activation_status?: string;
    activated_at?: string | null;
  };
  brand?: AdminBrand;
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
  registration_range: {
    earliest: string | null;
    latest: string | null;
  };
};

export type CustomerTimestampSyncJob = {
  id: number;
  status: "queued" | "running" | "completed" | "failed";
  current_location: number | null;
  current_page: number;
  target_total: number;
  total_api: number;
  processed: number;
  updated: number;
  unchanged: number;
  unmatched: number;
  invalid: number;
  locations_total: number;
  locations_completed: number;
  error: string | null;
  started_at: string;
  heartbeat_at: string;
  finished_at: string | null;
};

export type CustomerImportSyncJob = {
  id: number;
  status: "queued" | "running" | "completed" | "completed_with_errors" | "failed";
  source: string;
  phase: "recent" | "backfill" | "completed";
  current_location: number | null;
  current_page: number;
  total_api: number;
  processed: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped_conflicts: number;
  failed: number;
  latest_runchise_created_at: string | null;
  latest_local_created_at: string | null;
  locations_total: number;
  locations_completed: number;
  error: string | null;
  started_at: string;
  heartbeat_at: string;
  finished_at: string | null;
};

export type AdminActivityLog = {
  id: number;
  actor_user_id: number | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: {
    id: number;
    email: string | null;
    phone_number: string | null;
    role: string;
  } | null;
};

export type AdminActivityLogPage = {
  items: AdminActivityLog[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type CustomerSalesTransactionReport = {
  id: number;
  runchise_sales_transaction_id: number;
  runchise_customer_id: number | null;
  customer_id: number | null;
  runchise_location_id: number | null;
  nama_pelanggan: string | null;
  no_telepon: string | null;
  lokasi_dibuat: string | null;
  pelanggan_sejak: string | null;
  poin_pelanggan: number;
  tanggal_transaksi: string | null;
  nama_outlet: string | null;
  tipe_order: string | null;
  pembelian_per_order: string | number;
  penambahan_poin: number;
  penggunaan_poin: string | number;
  redeemed_rewards: Array<{
    id: string;
    runchise_product_id: number;
    redeem_menu_item_id: number | null;
    product_name: string;
    quantity: number;
    point_per_item: number;
    points_spent: number;
    is_managed_reward: boolean;
  }>;
  created_at: string;
  updated_at: string;
};

export type CustomerSalesTransactionReportPage = {
  items: CustomerSalesTransactionReport[];
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

// Penyaring daftar customer berdasarkan ketersediaan email. Customer tanpa
// email tidak bisa dikirimi tautan aktivasi, jadi daftar ini yang dikejar
// petugas outlet.
export type CustomerEmailStatus = "all" | "missing" | "present";
