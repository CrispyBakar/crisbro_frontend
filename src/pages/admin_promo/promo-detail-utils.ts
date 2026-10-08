import type { PromoType } from "@/services/promo";

// Kolom JSON string di PromoRule (order_types, maximum_qty_applied_to_products)
export const parseJsonArray = (value: string | null | undefined) => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? (parsed.filter(
          (item) => item && typeof item === "object",
        ) as Record<string, unknown>[])
      : [];
  } catch {
    return [];
  }
};

export type OrderTypeItem = { id: number; name: string };

export const parseOrderTypes = (value: string | null | undefined) =>
  parseJsonArray(value).flatMap((item): OrderTypeItem[] =>
    typeof item.id === "number"
      ? [{ id: item.id, name: String(item.name ?? `#${item.id}`) }]
      : [],
  );

export type MaxQtyItem = { id: number; name: string; maximum_purchase: string };

export const parseMaxQtyProducts = (value: string | null | undefined) =>
  parseJsonArray(value).flatMap((item): MaxQtyItem[] =>
    typeof item.id === "number"
      ? [
          {
            id: item.id,
            name: String(item.name ?? `#${item.id}`),
            maximum_purchase: String(item.maximum_purchase ?? ""),
          },
        ]
      : [],
  );

// Tanggal promo disimpan sebagai tengah malam UTC → ambil bagian tanggalnya saja
export const toInputDate = (value: string | null) =>
  value ? value.slice(0, 10) : "";

// "YYYY-MM-DD..." → "DD/MM/YYYY"
export const formatPromoPeriodDate = (value: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

export const PROMO_GOAL_LABELS: Record<string, string> = {
  increase_average_sale: "Increase average sales",
  increase_number_sale: "Increase number of sales",
};

export const PROMO_TYPE_LABELS: Record<PromoType, string> = {
  general_promo: "General Promo",
  loyalty_promo: "Loyalty Promo",
};
