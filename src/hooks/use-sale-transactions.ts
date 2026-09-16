import { useQuery } from "@tanstack/react-query";
import { getSaleTransaction } from "@/services/sale-transactions";

export const useSaleTransaction = (customerId: string) => {
  return useQuery({
    queryKey: ["sale-transaction", customerId],
    queryFn: () => getSaleTransaction({ customer_id: customerId }),
    enabled: Boolean(customerId),
    staleTime: 5 * 60_000,
  });
};
