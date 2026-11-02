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
  updateBanner,
  type BannerPayload,
  type UpdateBannerPayload,
  clickBanner,
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

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      banner_id,
      payload,
    }: {
      banner_id: string;
      payload: UpdateBannerPayload;
    }) => updateBanner(banner_id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
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

export const useClickBanner = () => {
  return useMutation({
    mutationFn: (banner_id: string) => clickBanner(banner_id),
  });
};
