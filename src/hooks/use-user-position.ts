import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Coordinates } from "@/lib/geo";

const POSITION_KEY = ["user-position"];

const getCurrentPosition = () =>
  new Promise<Coordinates>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Browser tidak mendukung akses lokasi"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(error.message)),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  });

// Posisi diambil diam-diam hanya bila izin lokasi sudah pernah diberikan,
// supaya membuka halaman tidak memunculkan prompt izin
const getPositionIfGranted = async (): Promise<Coordinates | null> => {
  try {
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });
    if (permission.state !== "granted") return null;
    return await getCurrentPosition();
  } catch {
    return null;
  }
};

// Posisi customer, dibagi antar halaman lewat cache react-query
export const useUserPosition = () => {
  const queryClient = useQueryClient();

  const { data: position = null } = useQuery({
    queryKey: POSITION_KEY,
    queryFn: getPositionIfGranted,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  // Dipanggil dari tombol; di sinilah prompt izin lokasi boleh muncul
  const locate = useMutation({
    mutationFn: getCurrentPosition,
    onSuccess: (coordinates) => {
      queryClient.setQueryData(POSITION_KEY, coordinates);
    },
  });

  return { position, locate };
};
