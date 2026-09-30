export interface Product {
  product_id: string;
  runchise_id: number;
  name: string;
  sku: string;
  upc: string;
  description: string | null;
  internal_price: string | null;
  sell_price: string | null;
  status: string;
  product_category: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface GetProducts {
  total: number;
  total_page: number;
  products: Product[];
}

export type GetProductsProps = {
  take?: number;
  skip?: number;
  search?: string;
  sort_by?:
    | "runchise_id"
    | "name"
    | "product_category"
    | "internal_price"
    | "sell_price"
    | "status";
  order_by?: "asc" | "desc";
  status?: "activated" | "deactivated";
};

export const getProducts = async ({
  take,
  skip,
  search,
  sort_by,
  order_by,
  status,
}: GetProductsProps): Promise<GetProducts> => {
  const params = new URLSearchParams({
    ...(take ? { take: String(take) } : {}),
    ...(skip ? { skip: String(skip) } : {}),
    ...(search ? { search: String(search) } : {}),
    // Backend products memakai `order_by` (bukan `sort_order` seperti customers)
    ...(sort_by ? { sort_by: String(sort_by) } : {}),
    ...(sort_by && order_by ? { order_by: String(order_by) } : {}),
    ...(status ? { status: String(status) } : {}),
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/products?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat lokasi");
  }

  const result = await res.json();
  const products = result.data;

  return products;
};

export const syncProducts = async (): Promise<Product[]> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/products/sync-products`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "x-csrf-protection": "1",
      },
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat product");
  }

  const result = await res.json();

  return result.data;
};
