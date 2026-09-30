import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getProducts, syncProducts } from "@/services/products";
import type { GetProductsProps } from "@/services/products";

export const useProducts = ({
  skip,
  take,
  search,
  sort_by,
  order_by,
  status,
}: GetProductsProps) => {
  return useQuery({
    queryKey: ["products", { skip, take, search, sort_by, order_by, status }],
    queryFn: () =>
      getProducts({ skip, take, search, sort_by, order_by, status }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useSyncProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncProducts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};
