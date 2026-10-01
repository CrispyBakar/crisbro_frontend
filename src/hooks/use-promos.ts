import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPromos } from "@/services/promo";
import type { GetPromosProps } from "@/services/promo";

export const usePromos = ({
  page,
  limit,
  search,
  status,
  sort_by,
  sort_order,
}: GetPromosProps) => {
  return useQuery({
    queryKey: ["promos", { page, limit, search, status, sort_by, sort_order }],
    queryFn: () =>
      getPromos({ page, limit, search, status, sort_by, sort_order }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};
