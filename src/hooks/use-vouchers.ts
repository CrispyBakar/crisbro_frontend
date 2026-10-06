import { useQuery } from "@tanstack/react-query";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { getMyVouchers } from "@/services/vouchers";
import type { Voucher } from "@/services/vouchers";

// Voucher terbaru tampil lebih dulu
const sortByNewest = (vouchers: Voucher[]) =>
  [...vouchers].sort((a, b) => b.created_at.localeCompare(a.created_at));

export const useMyVouchers = () => {
  const { data: user } = useCustomerProfile();
  const userId = user?.user_id;

  return useQuery({
    // user_id ikut di key supaya voucher tidak terbawa ke akun lain yang login
    // di perangkat yang sama
    queryKey: ["vouchers", userId],
    queryFn: getMyVouchers,
    select: sortByNewest,
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
};
