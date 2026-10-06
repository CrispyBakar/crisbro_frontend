import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import type { ParamsCustomers } from "@/services/customers";
import {
  changeCustomerStatus,
  getCustomerById,
  getCustomerPointHistory,
  getCustomers,
  getMyPointHistory,
  updateCustomer,
  updateMyCustomer,
} from "@/services/customers";

export const useCustomers = ({
  page,
  limit,
  search,
  sort_by,
  sort_order,
  start_date,
  end_date,
}: ParamsCustomers) => {
  return useQuery({
    queryKey: [
      "customers",
      { page, limit, search, sort_by, sort_order, start_date, end_date },
    ],
    queryFn: () =>
      getCustomers({
        page,
        limit,
        search,
        sort_by,
        sort_order,
        start_date,
        end_date,
      }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useCustomer = (customerId: string) => {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomerById(customerId),
    enabled: Boolean(customerId),
    staleTime: 5 * 60_000,
  });
};

export const useCustomerPointHistory = (customerId: string) => {
  return useQuery({
    queryKey: ["customer-point-history", customerId],
    queryFn: () => getCustomerPointHistory({ customer_id: customerId }),
    enabled: Boolean(customerId),
    staleTime: 5 * 60_000,
  });
};

const MY_POINT_HISTORY_PAGE_SIZE = 20;

// Riwayat poin customer yang sedang login, dimuat per halaman ("muat lagi")
export const useMyPointHistory = () => {
  const { data: user } = useCustomerProfile();
  const userId = user?.user_id;

  return useInfiniteQuery({
    // user_id ikut di key supaya riwayat tidak terbawa ke akun lain yang login
    // di perangkat yang sama
    queryKey: ["point-history", "me", userId],
    queryFn: ({ pageParam }) =>
      getMyPointHistory({
        page: pageParam,
        limit: MY_POINT_HISTORY_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.total_pages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: ["customer", customer.customer_id],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useUpdateMyCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyCustomer,
    // Promise dikembalikan supaya mutasi baru selesai setelah sesi (/profile)
    // memuat data terbaru
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] }),
  });
};

export const useChangeStatusCustomer = (customer_id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: "active" | "inactive") =>
      changeCustomerStatus(customer_id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer", customer_id],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
