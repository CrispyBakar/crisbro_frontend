// Tanggal ringkas untuk halaman customer, contoh "5 Okt 2026"
export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

// Tanggal kalender tanpa jam (mis. periode promo), contoh "5 Okt 2026".
// Dibaca sebagai UTC supaya tanggalnya tidak bergeser mengikuti zona waktu perangkat
export const formatShortCalendarDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

// Tanggal ringkas beserta jam, contoh "5 Okt 2026, 11.12"
export const formatShortDateTime = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
