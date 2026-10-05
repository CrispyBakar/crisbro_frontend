import { useQuery } from "@tanstack/react-query";
import { getCustomerProfile } from "@/services/auth";

export const useCustomerProfile = () => {
  return useQuery({
    queryKey: ["auth", "profile"],
    queryFn: getCustomerProfile,
    staleTime: 5 * 60_000,
    retry: false,
  });
};
