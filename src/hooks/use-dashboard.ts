import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getCustomersPerOutlet,
  getDashboardTotalCounts,
  getRecentTransactions,
  getTopRedeemedProducts,
} from "@/services/dashboard";
import type {
  GetRecentTransactionsProps,
  GetTopRedeemedProductsProps,
} from "@/services/dashboard";
import type { OutletPeriodKey } from "@/lib/period";

export const useDashboardTotalCounts = () => {
  return useQuery({
    queryKey: ["dashboard-total-counts"],
    queryFn: getDashboardTotalCounts,
    staleTime: 5 * 60_000,
  });
};

export const useCustomersPerOutlet = (period: OutletPeriodKey) => {
  return useQuery({
    queryKey: ["dashboard-customers-per-outlet", { period }],
    queryFn: () => getCustomersPerOutlet(period),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useTopRedeemedProducts = ({
  period,
  limit,
}: GetTopRedeemedProductsProps) => {
  return useQuery({
    queryKey: ["dashboard-top-redeemed-products", { period, limit }],
    queryFn: () => getTopRedeemedProducts({ period, limit }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useRecentTransactions = ({
  skip,
  take,
  search,
}: GetRecentTransactionsProps) => {
  return useQuery({
    queryKey: ["dashboard-recent-transactions", { skip, take, search }],
    queryFn: () => getRecentTransactions({ skip, take, search }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};
