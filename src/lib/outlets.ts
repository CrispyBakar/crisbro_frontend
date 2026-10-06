import type { Coordinates } from "@/lib/geo";
import type { Location } from "@/services/locations";

// Data kota dari Runchise tidak seragam ("BANDUNG", "Kota Bandung"), jadi
// disamakan dulu supaya outlet di kota yang sama tampil dengan nama yang sama
export const normalizeCity = (city: string | null) => {
  const cleaned = (city ?? "").trim().replace(/^(kota|kabupaten)\s+/i, "");
  if (!cleaned) return "Lainnya";
  return cleaned
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
};

export const outletCoordinates = (outlet: Location): Coordinates | null => {
  const latitude = Number.parseFloat(outlet.latitude);
  const longitude = Number.parseFloat(outlet.longitude);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude };
};

// Titik koordinat lebih presisi daripada alamat; alamat dipakai bila koordinat kosong
export const outletMapsUrl = (outlet: Location) => {
  const coordinates = outletCoordinates(outlet);
  const query = coordinates
    ? `${coordinates.latitude},${coordinates.longitude}`
    : `${outlet.name} ${outlet.shipping_address ?? ""}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
