import type {
  CreatePromoRequest,
  PromoType,
  UpdatePromoRequest,
} from "@/services/promo";
import type { SelectedProduct } from "./ProductSelect";
import type { SelectedLocation } from "./LocationSelect";
import type { LocationSelection } from "./LocationMultiSelect";

export type PromoCodeUsageType = "single" | "multiple";

export type ProductRow = {
  key: number;
  product: SelectedProduct | null;
  maxQty: string;
};

let productRowKey = 0;
export const createProductRow = (
  product: SelectedProduct | null = null,
  maxQty = "1",
): ProductRow => ({ key: productRowKey++, product, maxQty });

export type PromoFormValues = {
  name: string;
  goal: CreatePromoRequest["goal"] | "";
  // Kosong selama belum dipilih; wajib dipilih di form
  promoType: PromoType | "";
  termsConditions: string;
  startDate: string; // YYYY-MM-DD (input date)
  endDate: string; // YYYY-MM-DD, kosong = tanpa batas
  discountValue: string;
  productRows: ProductRow[];
  applyToOptionSet: boolean;
  ownerLocation: SelectedLocation | null;
  validLocation: LocationSelection;
  excludeLocationIds: number[];
  isOrderTypeEnabled: boolean;
  orderTypeIds: number[];
  usePromoCode: boolean;
  promoCodeUsageType: PromoCodeUsageType;
  promoCodeSource: string;
  promoCodeCount: string;
};

export const emptyPromoFormValues = (): PromoFormValues => ({
  name: "",
  goal: "",
  promoType: "",
  termsConditions: "",
  startDate: "",
  endDate: "",
  discountValue: "",
  productRows: [createProductRow()],
  applyToOptionSet: true,
  ownerLocation: null,
  validLocation: { mode: "locations", selectAll: false, ids: [] },
  excludeLocationIds: [],
  isOrderTypeEnabled: true,
  orderTypeIds: [],
  usePromoCode: true,
  promoCodeUsageType: "single",
  promoCodeSource: "random",
  promoCodeCount: "",
});

// <input type="date"> "YYYY-MM-DD" → format backend "DD/MM/YYYY"
const toPromoDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

// Nilai form → payload create promo (sesuai createPromoSchema di backend)
export const buildPromoPayload = (
  values: PromoFormValues,
): CreatePromoRequest => {
  const isGroupMode = values.validLocation.mode === "groups";
  const { selectAll, ids } = values.validLocation;
  const products = values.productRows.flatMap((row) =>
    row.product ? [{ ...row.product, maxQty: row.maxQty }] : [],
  );

  return {
    channel: "pos",
    name: values.name.trim(),
    goal: values.goal as CreatePromoRequest["goal"],
    customer_allowed_dine_in: false,
    customer_allowed_online_ordering: false,
    applicable_for_loyalty: false,
    start_date: toPromoDate(values.startDate),
    end_date: values.endDate ? toPromoDate(values.endDate) : null,
    subdize_promo_subject_mdr: false,
    is_select_all_location: !isGroupMode && selectAll,
    location_type: "outlet",
    location_ids: !isGroupMode && !selectAll ? ids : [],
    exclude_location_ids:
      !isGroupMode && selectAll ? values.excludeLocationIds : [],
    is_select_all_location_group: isGroupMode && selectAll,
    location_group_ids: isGroupMode && !selectAll ? ids : [],
    exclude_location_group_ids: [],
    // Divalidasi di form; 0 hanya terjadi pada nilai awal edit yang tidak terbaca
    owner_location_id: values.ownerLocation?.id ?? 0,
    promo_type: values.promoType as PromoType,
    terms_conditions: values.termsConditions.trim(),
    promo_schedules: null,
    promo_rule_attributes: {
      order_type_ids: values.isOrderTypeEnabled ? values.orderTypeIds : [],
      member_only: false,
      payment_type_ids: [],
      product_ids: [],
      product_condition: null,
      product_category_ids: [],
      product_category_condition: null,
      total_min: null,
      maximum_redemption: null,
      maximum_redemption_user: null,
      // Setiap produk terpilih wajib masuk ke sini (mengikuti payload_promo.json)
      maximum_qty_applied_to_products: products.map((product) => ({
        id: product.id,
        name: product.name,
        maximum_purchase: Number(product.maxQty),
      })),
      use_promotion_code: values.usePromoCode,
      ...(values.usePromoCode && {
        promotion_code_usage_type: values.promoCodeUsageType,
        promotion_code_source: values.promoCodeSource,
        promotion_code_number_of_generated_code: values.promoCodeCount,
        // Single use: setiap kode hanya bisa dipakai sekali
        promotion_code_maximum_usage: 1,
      }),
    },
    promo_reward_attributes: {
      template: "discount_percentage",
      get_product_allow_multiple: false,
      discount_is_percentage: true,
      discount_amount: values.discountValue,
      discount_maximum: null,
      // Seluruh biaya diskon ditanggung internal (mengikuti payload_promo.json)
      discount_external_cost: "0",
      discount_in_house_cost: "100",
      get_product_ids: products.map((product) => product.id),
      get_product_category_ids: [],
      reward_products: products.map((product) => ({
        product_id: product.id,
        category_id: null,
        quantity: "1",
      })),
      free_of_charge: false,
      apply_to_option_set: values.applyToOptionSet,
    },
  };
};

const isChanged = (next: unknown, prev: unknown) =>
  JSON.stringify(next) !== JSON.stringify(prev);

// Hanya field yang berubah dari nilai awal → payload PATCH. Field yang tidak
// tersimpan lengkap di DB lokal (mis. produk tanpa max qty) tidak ikut
// tertimpa selama user tidak mengubahnya.
export const diffPromoPayload = (
  next: CreatePromoRequest,
  prev: CreatePromoRequest,
): UpdatePromoRequest => {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(next) as (keyof CreatePromoRequest)[]) {
    if (key === "promo_rule_attributes" || key === "promo_reward_attributes") {
      const nextAttributes = next[key] as Record<string, unknown>;
      const prevAttributes = prev[key] as Record<string, unknown>;
      const changed = Object.fromEntries(
        Object.entries(nextAttributes).filter(([attribute, value]) =>
          isChanged(value, prevAttributes[attribute]),
        ),
      );
      if (Object.keys(changed).length) result[key] = changed;
    } else if (isChanged(next[key], prev[key])) {
      result[key] = next[key];
    }
  }

  return result as UpdatePromoRequest;
};
