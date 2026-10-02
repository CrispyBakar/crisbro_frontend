import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getReferral, validateReferral } from "@/services/referral";
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
