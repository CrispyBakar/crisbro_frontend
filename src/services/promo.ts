// Angka diterima backend sebagai string maupun number
type NumericValue = string | number;

export type PromoType = "general_promo" | "loyalty_promo";

// Mengikuti createPromoSchema di backend (validation/runchise/runchise-validation.js)
export interface CreatePromoRequest {
  channel: "pos";
  name: string;
  goal: "increase_average_sale" | "increase_number_sale";
  customer_allowed_dine_in: boolean;
  customer_allowed_online_ordering: boolean;
  applicable_for_loyalty: boolean;
  start_date: string; // DD/MM/YYYY
  end_date: string | null; // DD/MM/YYYY
  subdize_promo_subject_mdr: boolean;
  is_select_all_location: boolean;
  location_type: string;
  location_ids: number[];
  exclude_location_ids: number[];
  is_select_all_location_group: boolean;
  location_group_ids: number[];
  exclude_location_group_ids: number[];
  owner_location_id: number;
  // promo_type & terms_conditions hanya disimpan di database lokal, tidak
  // dikirim ke Runchise
  promo_type: PromoType;
  terms_conditions: string;
  promo_schedules: Record<string, unknown>[] | null;
  promo_rule_attributes: {
    order_type_ids: number[];
    member_only: boolean;
    payment_type_ids: number[];
    product_ids: number[];
    product_condition: string | null;
    product_category_ids: number[];
    product_category_condition: string | null;
    total_min: NumericValue | null;
    maximum_redemption: NumericValue | null;
    maximum_redemption_user: NumericValue | null;
    maximum_qty_applied_to_products: {
      id: number;
      name: string;
      maximum_purchase: NumericValue;
    }[];
    use_promotion_code: boolean;
    promotion_code_usage_type?: string;
    promotion_code_source?: string;
    promotion_code_number_of_generated_code?: NumericValue;
    promotion_code_maximum_usage?: NumericValue;
  };
  promo_reward_attributes: {
    template: string;
    get_product_allow_multiple: boolean;
    discount_is_percentage: boolean;
    discount_amount: NumericValue;
    discount_maximum: NumericValue | null;
    discount_external_cost: NumericValue;
    discount_in_house_cost: NumericValue;
    get_product_ids: number[];
    get_product_category_ids: number[];
    reward_products: {
      product_id: number;
      category_id: number | null;
      quantity: NumericValue;
    }[];
    free_of_charge: boolean;
    apply_to_option_set: boolean;
  };
}

// Pesan error backend bisa string, objek { message }, atau hasil zod flatten()
const toErrorMessage = (message: unknown, fallback: string): string => {
  if (typeof message === "string") return message;
  if (message && typeof message === "object") {
    const {
      message: nested,
      formErrors,
      fieldErrors,
    } = message as {
      message?: unknown;
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
    if (typeof nested === "string") return nested;
    const errors = [
      ...(formErrors ?? []),
      ...Object.entries(fieldErrors ?? {}).map(
        ([field, fieldMessages]) => `${field}: ${fieldMessages.join(", ")}`,
      ),
    ];
    if (errors.length) return errors.join("; ");
  }
  return fallback;
};

// Error API promo yang tetap membawa `code` & `runchise_id` dari backend.
// PROMO_SYNC_FAILED: promo sudah ada di Runchise tapi gagal tersimpan lokal →
// pulihkan lewat POST /promos/sync/:runchise_id, jangan ulangi create.
export class PromoApiError extends Error {
  code?: string;
  runchiseId?: number;

  constructor(message: string, code?: string, runchiseId?: number) {
    super(message);
    this.name = "PromoApiError";
    this.code = code;
    this.runchiseId = runchiseId;
  }
}

const toPromoApiError = (body: unknown, fallback: string) => {
  const message = (body as { message?: unknown } | null)?.message;
  const { code, runchise_id } =
    message && typeof message === "object"
      ? (message as { code?: unknown; runchise_id?: unknown })
      : {};

  return new PromoApiError(
    toErrorMessage(message, fallback),
    typeof code === "string" ? code : undefined,
    typeof runchise_id === "number" ? runchise_id : undefined,
  );
};

export const isPromoSyncFailed = (
  error: unknown,
): error is PromoApiError & { runchiseId: number } =>
  error instanceof PromoApiError &&
  error.code === "PROMO_SYNC_FAILED" &&
  error.runchiseId !== undefined;

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
    throw toPromoApiError(error, "Gagal membuat promo");
  }

  const result = await res.json();

  return result.data;
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
  promo_type: PromoType;
  // Kosong ("") bila belum diisi
  terms_conditions: string;
  created_at: string;
  updated_at: string;
}

// Mengikuti model PromoRule di Prisma backend
export interface PromoRule {
  promo_rule_id: string;
  promo_id: string;
  runchise_promo_rule_id: number;
  // JSON string array objek order type Runchise, mis. [{ id, name }]
  order_types: string;
  // JSON string [{ id, name, maximum_purchase }]
  maximum_qty_applied_to_products: string;
  use_promotion_code: boolean | null;
  promotion_code_usage_type: string | null;
  promotion_code_source: string | null;
  promotion_code_number_of_generated_code: number | null;
  promotion_code_maximum_usage: number | null;
  combine_promo_rule: string | null;
  member_only: boolean | null;
  maximum_redemption_location_setting: string | null;
  created_at: string;
  updated_at: string;
}

// Mengikuti model PromoReward di Prisma backend
export interface PromoReward {
  promo_reward_id: string;
  promo_id: string;
  runchise_promo_reward_id: number | null;
  template: string | null;
  free_of_charge: boolean | null;
  reward_product_condition: string | null;
  discount_amount: string | null;
  discount_is_percentage: boolean | null;
  discount_maximum: string | null;
  discount_in_house_cost: string | null;
  discount_external_cost: string | null;
  apply_to_option_set: boolean | null;
  // Hanya nama produk (tanpa ID)
  get_products: string[];
  get_product_allow_multiple: boolean | null;
  special_price_product_price: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromoListItem {
  promo: Promo;
  promo_rule: PromoRule | null;
  promo_reward: PromoReward | null;
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
  sort_by?:
    | "created_at"
    | "updated_at"
    | "name"
    | "status"
    | "start_date"
    | "end_date";
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

// Respons GET /promos/:promo_id (formatPromo di backend)
export interface PromoDetail extends PromoListItem {
  promo_codes: PromoCode[];
}

export const getPromo = async (promoId: string): Promise<PromoDetail> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/promos/${promoId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      toErrorMessage(error?.message, "Gagal memuat detail promo"),
    );
  }

  const result = await res.json();

  return result.data;
};

// PATCH hanya mengirim field yang berubah (updatePromoSchema = createPromoSchema.partial()).
// `id` pada atribut bersarang menunjuk rule/reward Runchise yang sudah ada.
export type UpdatePromoRequest = Partial<
  Omit<CreatePromoRequest, "promo_rule_attributes" | "promo_reward_attributes">
> & {
  promo_rule_attributes?: Partial<
    CreatePromoRequest["promo_rule_attributes"]
  > & { id?: number };
  promo_reward_attributes?: Partial<
    CreatePromoRequest["promo_reward_attributes"]
  > & { id?: number };
};

export type ParamUpdatePromo = {
  promo_id: string;
  request: UpdatePromoRequest;
};

export const updatePromo = async ({
  promo_id,
  request,
}: ParamUpdatePromo): Promise<PromoDetail> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/promos/${promo_id}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-protection": "1",
      },
      body: JSON.stringify(request),
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(toErrorMessage(error?.message, "Gagal mengubah promo"));
  }

  const result = await res.json();

  return result.data;
};

export type ParamPromoStatus = {
  promo_id: string;
};

const changePromoStatus = async (
  promo_id: string,
  action: "activate" | "deactivate",
  fallbackMessage: string,
): Promise<PromoDetail> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/promos/${promo_id}/${action}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "x-csrf-protection": "1",
      },
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(toErrorMessage(error?.message, fallbackMessage));
  }

  const result = await res.json();

  return result.data;
};

export const activatePromo = ({ promo_id }: ParamPromoStatus) =>
  changePromoStatus(promo_id, "activate", "Gagal mengaktifkan promo");

export const deactivatePromo = ({ promo_id }: ParamPromoStatus) =>
  changePromoStatus(promo_id, "deactivate", "Gagal menonaktifkan promo");

export type ParamSyncPromo = {
  runchise_id: number;
};

// Ambil ulang promo dari Runchise & simpan ke DB lokal tanpa membuat ulang
export const syncPromo = async ({
  runchise_id,
}: ParamSyncPromo): Promise<PromoDetail> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/promos/sync/${runchise_id}`,
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
    throw toPromoApiError(error, "Gagal sinkronisasi promo");
  }

  const result = await res.json();

  return result.data;
};
