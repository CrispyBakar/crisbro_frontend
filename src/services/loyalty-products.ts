export interface LoyaltyProduct {
  loyalty_product_id: string;
  runchise_loyalty_product_id: number;
  runchise_product_id: number;
  point_needed: number;
  product_name: string;
  product_sku: string;
  product_description: string | null;
  product_image_url: string | null;
  product_unit_name: string | null;
  max_redeem: number;
  is_select_all_location: boolean;
  location_ids: string[];
  product_location_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface GetLoyaltyProducts {
  total: number;
  total_page: number;
  loyalty_products: LoyaltyProduct[];
}

export type GetLoyaltyProductsProps = {
  take?: number;
  skip?: number;
  query?: string;
  locationId?: string;
};

export const getLoyaltyProducts = async ({
  take,
  skip,
  query,
  locationId,
}: GetLoyaltyProductsProps): Promise<GetLoyaltyProducts> => {
  const params = new URLSearchParams({
    ...(take ? { take: String(take) } : {}),
    ...(skip ? { skip: String(skip) } : {}),
    ...(query ? { query: String(query) } : {}),
    ...(locationId ? { location_id: locationId } : {}),
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/products/loyalty?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat produk loyalty");
  }

  const result = await res.json();

  return result.data;
};

// Backend membatasi 100 produk per permintaan
const LOYALTY_PRODUCTS_PAGE_SIZE = 100;

// Seluruh produk loyalty sekaligus, untuk daftar yang difilter di sisi client
export const getAllLoyaltyProducts = async (): Promise<LoyaltyProduct[]> => {
  const products: LoyaltyProduct[] = [];
  let total = Infinity;

  while (products.length < total) {
    const page = await getLoyaltyProducts({
      take: LOYALTY_PRODUCTS_PAGE_SIZE,
      skip: products.length,
    });
    total = page.total;
    if (page.loyalty_products.length === 0) break;
    products.push(...page.loyalty_products);
  }

  return products;
};

export const syncLoyaltyProducts = async (): Promise<LoyaltyProduct[]> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/products/sync-loyalty-products`,
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
    throw new Error(error?.message ?? "Gagal sync produk loyalty");
  }

  const result = await res.json();

  return result.data;
};
