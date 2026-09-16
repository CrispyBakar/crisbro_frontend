// Nullability mengikuti schema Prisma SaleTransaction (hampir semua kolom opsional)
export interface SaleTransactions {
  transaction_id: string;
  customer_id: string;
  location_id: string;
  runchise_id: number | null;
  runchise_brand_id: number | null;
  runchise_sales_no: string | null;
  runchise_customer_id: number | null;
  runchise_location_id: number | null;
  gross_sales: number | null;
  net_sales: number | null;
  location_name: string | null;
  order_type_name: string | null;
  total_point: number | null;
  earned_point: number | null;
  redeemed_point: string | null;
  available_point: number | null;
  products: {
    name: string;
  }[] | null;
  subtotal: number | null;
  net_sales_after_tax: number | null;
  sales_time: string | null;
  note: string | null;
  applied_promos_redeemed_point: string | null;
  loyalty_discount_fee: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const getSaleTransaction = async ({
  customer_id,
}: {
  customer_id: string;
}): Promise<SaleTransactions[]> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/sale-transactions/customer/${customer_id}?page=1&limit=25&sort_by=sales_time&sort_order=desc`,
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
