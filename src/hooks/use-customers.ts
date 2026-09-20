import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ParamsCustomers } from "@/services/customers";
import {
  changeCustomerStatus,
  getCustomerById,
  getCustomerPointHistory,
  getCustomers,
  updateCustomer,
} from "@/services/customers";

export const useCustomers = ({
  page,
  limit,
  search,
  sort_by,
  sort_order,
}: ParamsCustomers) => {
  return useQuery({
    queryKey: ["customers", { page, limit, search, sort_by, sort_order }],
    queryFn: () => getCustomers({ page, limit, search, sort_by, sort_order }),
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

export const useChangeStatusCustomer = (customer_id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => changeCustomerStatus(customer_id),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: ["customer", customer],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
