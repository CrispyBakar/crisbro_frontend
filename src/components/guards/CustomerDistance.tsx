import { useCallback, useState } from "react";

const RADIUS_METER = 30;

// Haversine: jarak dua koordinat dalam meter
function getDistanceMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371000; // radius bumi (meter)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Result = {
  locationId: string;
  dineInUrl: string | null;
  distance: number;
  accuracy: number;
  inRadius: boolean;
};

type LocationTarget = {
  location_id: string;
  latitude: string;
  longitude: string;
  dine_in_url?: string | null;
};

export function useCheckLocation() {
  const [result, setResult] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(
    (locations: LocationTarget[]) => {
      if (loading) return;

      setResult(null);
      setError(null);

      if (!window.isSecureContext) {
        setError("Izin lokasi memerlukan koneksi aman (HTTPS).");
        return;
      }

      if (!navigator.geolocation) {
        setError("Browser tidak mendukung geolocation");
        return;
      }

      setLoading(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setResult(
            locations.flatMap((location) => {
              const targetLatitude = Number(location.latitude);
              const targetLongitude = Number(location.longitude);
              if (
                !Number.isFinite(targetLatitude) ||
                !Number.isFinite(targetLongitude)
              ) {
                return [];
              }

              const distance = getDistanceMeter(
                latitude,
                longitude,
                targetLatitude,
                targetLongitude,
              );

              return [
                {
                  locationId: location.location_id,
                  dineInUrl: location.dine_in_url ?? null,
                  distance,
                  accuracy,
                  inRadius: distance <= RADIUS_METER,
                },
              ];
            }),
          );
          setLoading(false);
        },
        (err) => {
          const messages: Record<number, string> = {
            1: "Izin lokasi ditolak",
            2: "Lokasi tidak tersedia",
            3: "Request lokasi timeout",
          };
          setError(messages[err.code] ?? err.message);
          setLoading(false);
        },
        {
          enableHighAccuracy: true, // pakai GPS kalau ada
          timeout: 10000,
          maximumAge: 0, // jangan pakai cache
        },
      );
    },
    [loading],
  );

  return { check, result, error, loading };
}
