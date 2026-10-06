export type Coordinates = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Jarak garis lurus (haversine), bukan jarak tempuh di jalan
export const distanceKm = (from: Coordinates, to: Coordinates) => {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

// 0,85 -> "850 m", 2,34 -> "2,3 km", 18,6 -> "19 km"
export const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  return `${km.toLocaleString("id-ID", {
    maximumFractionDigits: km < 10 ? 1 : 0,
  })} km`;
};
