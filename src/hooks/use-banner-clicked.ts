import {
  getBannerClickedAnalytics,
  type BannerClickedAnalyticsParams,
} from "@/services/banner-click";
import { useQuery } from "@tanstack/react-query";

export const useBannerClicked = (params: BannerClickedAnalyticsParams) => {
  return useQuery({
    queryKey: ["banner-clicked", "analytics", params],
    queryFn: () => getBannerClickedAnalytics(params),
    enabled: Boolean(
      params.startDate &&
        params.endDate &&
        params.startDate <= params.endDate,
    ),
  });
};
