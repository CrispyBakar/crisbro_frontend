import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteBanner,
  getBanners,
  uploadBanner,
  type BannerPayload,
} from "@/services/banner";

export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: getBanners,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useUploadBanners = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BannerPayload) => uploadBanner(payload),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (banner_id: string) => deleteBanner(banner_id),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};
