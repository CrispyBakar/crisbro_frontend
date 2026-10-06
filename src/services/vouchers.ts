import { getLoyaltyProducts } from "@/services/loyalty-products";
import type { LoyaltyProduct } from "@/services/loyalty-products";

export interface Voucher {
  voucher_id: string;
  // Teks dan angka acak yang didapat customer saat menukar poin
  code: string;
  status: "active" | "used";
  // Jumlah porsi yang ditukar
  quantity: number;
  // Total poin yang dipakai saat menukar
  point_used: number;
  // Waktu penukaran poin
  created_at: string;
  used_at: string | null;
  // Menu yang ditukar
  loyalty_product: Pick<
    LoyaltyProduct,
    | "loyalty_product_id"
    | "product_name"
    | "product_description"
    | "product_image_url"
  >;
}

// DATA CONTOH — backend belum punya endpoint voucher. Menu tiap voucher
// diambil dari menu redeem sungguhan supaya nama, foto, dan poinnya nyata.
const SAMPLE_REDEMPTIONS: Pick<
  Voucher,
  "voucher_id" | "code" | "status" | "quantity" | "created_at" | "used_at"
>[] = [
  {
    voucher_id: "sample-1",
    code: "CRB-7K2M-9XQ4",
    status: "active",
    quantity: 1,
    created_at: "2026-10-05T04:12:00.000Z",
    used_at: null,
  },
  {
    voucher_id: "sample-2",
    code: "CRB-4HZ8-WN3P",
    status: "active",
    quantity: 2,
    created_at: "2026-10-02T09:40:00.000Z",
    used_at: null,
  },
  {
    voucher_id: "sample-3",
    code: "CRB-X2B9-FQ6K",
    status: "active",
    quantity: 1,
    created_at: "2026-09-28T11:05:00.000Z",
    used_at: null,
  },
  {
    voucher_id: "sample-4",
    code: "CRB-T5RC-8Y1V",
    status: "used",
    quantity: 1,
    created_at: "2026-09-14T06:30:00.000Z",
    used_at: "2026-09-16T05:10:00.000Z",
  },
];

// Voucher milik customer yang sedang login. Selama endpoint-nya belum ada,
// fungsi ini mengembalikan data contoh; ganti isinya dengan fetch ke backend
// begitu endpoint tersedia.
export const getMyVouchers = async (): Promise<Voucher[]> => {
  const { loyalty_products: products } = await getLoyaltyProducts({
    take: SAMPLE_REDEMPTIONS.length,
  });
  if (products.length === 0) return [];

  return SAMPLE_REDEMPTIONS.map((redemption, index) => {
    const product = products[index % products.length];

    return {
      ...redemption,
      point_used: product.point_needed * redemption.quantity,
      loyalty_product: {
        loyalty_product_id: product.loyalty_product_id,
        product_name: product.product_name,
        product_description: product.product_description,
        product_image_url: product.product_image_url,
      },
    };
  });
};
