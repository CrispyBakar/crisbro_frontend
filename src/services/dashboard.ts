import type { DashboardPeriodKey, OutletPeriodKey } from "@/lib/period";

export interface DashboardCountValue {
  current_value: number;
  last_week_value: number;
}

export interface DashboardTotalCounts {
  customers: DashboardCountValue;
  redeemed_points: DashboardCountValue;
  member_points: DashboardCountValue;
  loyalty_products: DashboardCountValue;
}

/** Rentang tanggal (YYYY-MM-DD, inklusif, zona Asia/Jakarta) */
export interface DashboardPeriodRange {
  start: string;
  end: string;
}

export interface OutletCustomerCount {
  location_id: string;
  location_name: string;
  customers: number;
  // null bila period=all (tidak ada periode pembanding)
  previous_customers: number | null;
}

export interface GetCustomersPerOutlet {
  // Untuk period=all: dari customer pertama mendaftar sampai hari ini
  period: DashboardPeriodRange;
  previous_period: DashboardPeriodRange | null;
  // Customer dikelompokkan per owner_location_id; untuk periode waktu yang
  // dihitung adalah customer yang mendaftar di periode tersebut
  total_customers: number;
  previous_total_customers: number | null;
  outlets: OutletCustomerCount[];
}

export interface TopRedeemedProduct {
  loyalty_product_id: string;
  product_name: string;
  point_needed: number;
  redeem_count: number;
}

export interface GetTopRedeemedProducts {
  period: DashboardPeriodRange;
  // Total redeem seluruh produk, bukan hanya top `limit`
  total_redeem: number;
  products: TopRedeemedProduct[];
}

export type GetTopRedeemedProductsProps = {
  period: DashboardPeriodKey;
  limit?: number;
};

export const getDashboardTotalCounts =
  async (): Promise<DashboardTotalCounts> => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/dashboard/total-counts`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message ?? "Gagal memuat ringkasan dashboard");
    }

    const result = await res.json();

    return result.data;
  };

export const getCustomersPerOutlet = async (
  period: OutletPeriodKey,
): Promise<GetCustomersPerOutlet> => {
  const params = new URLSearchParams({ period });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/dashboard/customers-per-outlet?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat customer per outlet");
  }

  const result = await res.json();

  return result.data;
};

export const getTopRedeemedProducts = async ({
  period,
  limit,
}: GetTopRedeemedProductsProps): Promise<GetTopRedeemedProducts> => {
  const params = new URLSearchParams({
    period,
    ...(limit ? { limit: String(limit) } : {}),
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/dashboard/top-redeemed-products?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat produk yang di-redeem");
  }

  const result = await res.json();

  return result.data;
};

export interface RecentTransaction {
  transaction_id: string;
  sales_no: string | null;
  customer: {
    customer_id: string;
    name: string;
  };
  gross_sales: number | null;
  location_name: string | null;
  order_type: string | null;
  net_sales_after_tax: number | null;
  sales_time: string | null;
}

export interface GetRecentTransactions {
  total: number;
  total_page: number;
  transactions: RecentTransaction[];
}

export type GetRecentTransactionsProps = {
  take?: number;
  skip?: number;
  search?: string;
};

export const getRecentTransactions = async ({
  take,
  skip,
  search,
}: GetRecentTransactionsProps): Promise<GetRecentTransactions> => {
  const params = new URLSearchParams({
    ...(take ? { take: String(take) } : {}),
    ...(skip ? { skip: String(skip) } : {}),
    ...(search ? { search: String(search) } : {}),
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/dashboard/recent-transactions?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat transaksi terbaru");
  }

  const result = await res.json();

  return result.data;
};
