import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAllOutlets,
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
  branch_type,
}: ParamsLocation) => {
  return useQuery({
    queryKey: ["locations", { skip, city, query, status, take, branch_type }],
    queryFn: () =>
      getLocations({ skip, city, query, status, take, branch_type }),
    // GeneralTable butuh `id` sebagai key baris; API memakai location_id
    staleTime: 5 * 60_000,
    // Agar tabel tidak flash "Memuat lokasi..." saat ganti halaman / search
    placeholderData: keepPreviousData,
  });
};

// Semua outlet sekaligus, untuk halaman lokasi customer yang difilter di client
export const useOutlets = () => {
  return useQuery({
    queryKey: ["locations", "outlets"],
    queryFn: getAllOutlets,
    staleTime: 5 * 60_000,
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
