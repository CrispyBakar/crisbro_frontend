import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  generateReferralCode,
  getReferral,
  validateReferral,
} from "@/services/referral";
import type { CustomerUser } from "@/services/auth";
import type { ParamsReferral } from "@/services/referral";

export const useReferrals = ({ page, limit, status }: ParamsReferral) => {
  return useQuery({
    queryKey: ["referrals", { page, limit, status }],
    queryFn: () => getReferral({ page, limit, status }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useValidateReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user_id: string) => validateReferral(user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      // Validasi menambah poin referrer & referred
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
  });
};

export const useGenerateReferralCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateReferralCode,
    // Kode baru langsung ditaruh di sesi supaya tampil tanpa memuat ulang /profile
    onSuccess: (data) => {
      queryClient.setQueryData<CustomerUser | null>(
        ["auth", "profile"],
        (user) =>
          user ? { ...user, referral_code: data.referral_code } : user,
      );
    },
    // Bila gagal karena kodenya ternyata sudah ada, sesi dimuat ulang supaya
    // kode itu tampil
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
};
