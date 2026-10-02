import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  activatePromo,
  createPromo,
  deactivatePromo,
  getPromo,
  getPromos,
  syncPromo,
  updatePromo,
} from "@/services/promo";
import type {
  CreatePromoRequest,
  GetPromosProps,
  ParamPromoStatus,
  ParamSyncPromo,
  ParamUpdatePromo,
} from "@/services/promo";

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

export const usePromo = (promoId: string) => {
  return useQuery({
    queryKey: ["promos", "detail", promoId],
    queryFn: () => getPromo(promoId),
    staleTime: 60_000,
  });
};

export const useCreatePromo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePromoRequest) => createPromo(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};

export const useUpdatePromo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promo_id, request }: ParamUpdatePromo) =>
      updatePromo({ promo_id, request }),
    onSuccess: () => {
      // Termasuk ["promos", "detail", id] agar modal detail ikut ter-refresh
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};

export const useActivatePromo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promo_id }: ParamPromoStatus) => activatePromo({ promo_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};

export const useDeactivatePromo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promo_id }: ParamPromoStatus) =>
      deactivatePromo({ promo_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};

export const useSyncPromo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ runchise_id }: ParamSyncPromo) => syncPromo({ runchise_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promos"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};
