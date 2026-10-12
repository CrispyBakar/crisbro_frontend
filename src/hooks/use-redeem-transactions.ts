import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import {
  getAllMyVouchers,
  getMyVoucher,
  getRedeemedVoucher,
  getRedeemedVouchers,
  redeemLoyaltyVoucher,
} from "@/services/redeem-transactions";
import type { CustomerUser } from "@/services/auth";
import type {
  GetRedeemedVouchersProps,
  RedeemLoyaltyVoucherPayload,
} from "@/services/redeem-transactions";

export const useRedeemLoyaltyVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RedeemLoyaltyVoucherPayload) =>
      redeemLoyaltyVoucher(payload),
    onSuccess: (data) => {
      // Saldo baru langsung ditaruh di sesi supaya tampil tanpa memuat ulang /profile
      queryClient.setQueryData<CustomerUser | null>(
        ["auth", "profile"],
        (user) =>
          user?.customer
            ? {
                ...user,
                customer: {
                  ...user.customer,
                  total_point: user.customer.total_point - data.points_spent,
                  available_point: data.remaining_points,
                },
              }
            : user,
      );
      // Satu kode voucher terpakai, jadi stok menu ini bisa saja habis
      queryClient.invalidateQueries({ queryKey: ["loyalty-products"] });
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["point-history", "me"] });
    },
    // Penukaran ditolak berarti stok voucher atau poin di layar sudah usang
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-products"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
};

// Seluruh voucher customer yang sedang login, terbaru lebih dulu
export const useMyVouchers = () => {
  const { data: user } = useCustomerProfile();
  const userId = user?.user_id;

  return useQuery({
    // user_id ikut di key supaya voucher tidak terbawa ke akun lain yang login
    // di perangkat yang sama
    queryKey: ["vouchers", userId],
    queryFn: getAllMyVouchers,
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
};

// data null: voucher tidak ada atau bukan milik customer ini
export const useMyVoucher = (redeemTransactionId: string | undefined) => {
  const { data: user } = useCustomerProfile();
  const userId = user?.user_id;

  return useQuery({
    queryKey: ["vouchers", userId, "detail", redeemTransactionId],
    queryFn: () => getMyVoucher(redeemTransactionId ?? ""),
    enabled: Boolean(userId && redeemTransactionId),
    staleTime: 60_000,
  });
};

// Khusus admin dan marketing
export const useRedeemedVouchers = ({
  page,
  limit,
  sort_order,
  search,
  customer_id,
  promo_id,
}: GetRedeemedVouchersProps) => {
  return useQuery({
    queryKey: [
      "redeem-transactions",
      { page, limit, sort_order, search, customer_id, promo_id },
    ],
    queryFn: () =>
      getRedeemedVouchers({
        page,
        limit,
        sort_order,
        search,
        customer_id,
        promo_id,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useRedeemedVoucher = (redeemTransactionId: string) => {
  return useQuery({
    queryKey: ["redeem-transactions", "detail", redeemTransactionId],
    queryFn: () => getRedeemedVoucher(redeemTransactionId),
    staleTime: 60_000,
  });
};
