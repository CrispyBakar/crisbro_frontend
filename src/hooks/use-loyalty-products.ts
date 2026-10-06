import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAllLoyaltyProducts,
  getLoyaltyProducts,
  syncLoyaltyProducts,
} from "@/services/loyalty-products";
import type {
  GetLoyaltyProductsProps,
  LoyaltyProduct,
} from "@/services/loyalty-products";

export const useLoyaltyProducts = ({
  skip,
  take,
  query,
  locationId,
}: GetLoyaltyProductsProps) => {
  return useQuery({
    queryKey: ["loyalty-products", { skip, take, query, locationId }],
    queryFn: () => getLoyaltyProducts({ skip, take, query, locationId }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
};

// Urut dari poin terkecil supaya reward yang paling dekat tampil lebih dulu
const sortByPointNeeded = (products: LoyaltyProduct[]) =>
  [...products].sort(
    (a, b) =>
      a.point_needed - b.point_needed ||
      a.product_name.localeCompare(b.product_name),
  );

// Daftar reward untuk customer; endpoint-nya publik, jadi tamu juga bisa melihat
export const useRewardMenus = () => {
  return useQuery({
    queryKey: ["loyalty-products", "all"],
    queryFn: getAllLoyaltyProducts,
    select: sortByPointNeeded,
    staleTime: 5 * 60_000,
  });
};

const pickRandom = <T>(items: T[], count: number) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled.slice(0, count);
};

const FEATURED_POOL_SIZE = 5;

// 5 menu untuk beranda: 3 acak dari kelompok poin terkecil dan 2 acak dari
// kelompok poin terbesar, supaya kedua ujung harga selalu terwakili
const pickFeatured = (products: LoyaltyProduct[]) => {
  const sorted = sortByPointNeeded(products);
  if (sorted.length <= 5) return sorted;

  // Dibatasi setengah daftar supaya kedua kelompok tidak tumpang tindih
  const poolSize = Math.min(FEATURED_POOL_SIZE, Math.floor(sorted.length / 2));
  return sortByPointNeeded([
    ...pickRandom(sorted.slice(0, poolSize), 3),
    ...pickRandom(sorted.slice(-poolSize), 2),
  ]);
};

// Memakai cache yang sama dengan useRewardMenus. Pilihan acaknya bertahan
// selama data tidak berubah dan diacak ulang tiap beranda dibuka lagi.
export const useFeaturedRewardMenus = () => {
  return useQuery({
    queryKey: ["loyalty-products", "all"],
    queryFn: getAllLoyaltyProducts,
    select: pickFeatured,
    staleTime: 5 * 60_000,
  });
};

export const useSyncLoyaltyProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncLoyaltyProducts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-products"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};
