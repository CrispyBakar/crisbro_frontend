export interface CreatePromoRequest {
  channel: "pos";
  name: string;
  goal: "increase_average_sale" | "increase_number_sale";
  customer_allowed_dine_in: boolean;
  customer_allowed_online_ordering: boolean;
  applicable_for_loyalty: boolean;
  start_date: string;
  end_date: string;
  subdize_promo_subject_mdr: boolean;
  is_select_all_location: boolean;
  location_type: string | null;
  location_ids: number[];
  exclude_location_ids: number[];
  is_select_all_location_group: boolean;
  location_group_ids: number[];
  exclude_location_group_ids: number[];
  owner_location_id: number;
  promo_schedules: null;
  promo_rule_attributes: {
    order_type_ids: number[]; // 2699 dine_in
    member_only: boolean;
    payment_type_ids: number[];
    product_ids: number[];
    product_condition: string | null;
    product_category_ids: number[];
    product_category_condition: string | null;
    total_min: string | null;
    maximum_redemption: string | null;
    maximum_redemption_user: string | null;
    maximum_redemption_location_setting: string | null;
    maximum_qty_applied_to_products: {
      id: number;
      name: string;
      maximum_purchase: string;
    }[];
    use_promotion_code: true;
    promotion_code_usage_type: string;
    promotion_code_source: string;
    promotion_code_number_of_generated_code: string;
    promotion_code_maximum_usage: number;
  };
  promo_reward_attributes: {
    template: string;
    get_product_allow_multiple: boolean;
    discount_is_percentage: boolean;
    discount_amount: string | null;
    discount_maximum: string | null;
    discount_external_cost: string | null;
    discount_in_house_cost: string | null;
    get_product_ids: number[];
    get_product_category_ids: number[];
    reward_products: {
      product_id: number;
      category_id: number;
      quantity: string;
    }[];
    free_of_charge: boolean;
    apply_to_option_set: boolean;
  };
}

export const createPromo = async (request: CreatePromoRequest) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/promos`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-protection": "1",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat lokasi");
  }

  const result = await res.json();
  const promo = result.data;

  return promo;
};

export interface Promo {
  promo_id: string;
  runchise_id: number;
  name: string | null;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  owner_location_id: string;
  location_type: string | null;
  channel: string | null;
  // location_id lokal (UUID), bukan runchise_id
  location_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PromoListItem {
  promo: Promo;
  promo_rule: Record<string, unknown> | null;
  promo_reward: Record<string, unknown> | null;
}

export interface GetPromos {
  data: PromoListItem[];
  meta: { page: number; limit: number; total: number; total_pages: number };
}

export type GetPromosProps = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: "created_at" | "updated_at" | "name" | "status" | "start_date" | "end_date";
  sort_order?: "asc" | "desc";
};

export const getPromos = async ({
  page,
  limit,
  search,
  status,
  sort_by,
  sort_order,
}: GetPromosProps): Promise<GetPromos> => {
  const params = new URLSearchParams({
    ...(page ? { page: String(page) } : {}),
    ...(limit ? { limit: String(limit) } : {}),
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(sort_by ? { sort_by } : {}),
    ...(sort_by && sort_order ? { sort_order } : {}),
  });

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/promos?${params}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat promo");
  }

  const result = await res.json();

  return result.data;
};

export interface PromoCode {
  promo_code_id: string;
  promo_id: string;
  runchise_id: number | null;
  code: string | null;
  usage_type: string | null;
  status: string | null;
  maximum_usage: number | null;
  number_of_usage: number | null;
  last_usage: string | null;
  deactivate_at: string | null;
  deactivate_reason: string | null;
  created_at: string;
  updated_at: string;
}
