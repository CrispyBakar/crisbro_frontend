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
};

export const getProducts = async ({
  take,
  skip,
  search,
}: GetProductsProps): Promise<GetProducts> => {
  const params = new URLSearchParams({
    ...(take ? { take: String(take) } : {}),
    ...(skip ? { skip: String(skip) } : {}),
    ...(search ? { search: String(search) } : {}),
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
