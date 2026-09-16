import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/auth";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60_000,
    retry: false,
  });
};
