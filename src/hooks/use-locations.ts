import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getLocations,
  deleteLocation,
  generateLocations,
} from "@/services/locations";
import type { ParamsLocation, ParamDeleteLocation } from "@/services/locations";

export const useLocations = ({
  skip,
  city,
  query,
  status,
  take,
}: ParamsLocation) => {
  return useQuery({
    queryKey: ["locations", { skip, city, query, status, take }],
    queryFn: () => getLocations({ skip, city, query, status, take }),
    // GeneralTable butuh `id` sebagai key baris; API memakai location_id
    staleTime: 5 * 60_000,
    // Agar tabel tidak flash "Memuat lokasi..." saat ganti halaman / search
    placeholderData: keepPreviousData,
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ location_id }: ParamDeleteLocation) =>
      deleteLocation({ location_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};

export const useGenerateLocations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateLocations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};
