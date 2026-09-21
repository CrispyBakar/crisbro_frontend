import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getLoyaltyProducts,
  syncLoyaltyProducts,
} from "@/services/loyalty-products";
import type { GetLoyaltyProductsProps } from "@/services/loyalty-products";

export const useLoyaltyProducts = ({
  skip,
  take,
  query,
}: GetLoyaltyProductsProps) => {
  return useQuery({
    queryKey: ["loyalty-products", { skip, take, query }],
    queryFn: () => getLoyaltyProducts({ skip, take, query }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useSyncLoyaltyProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncLoyaltyProducts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-products"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};
