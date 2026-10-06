// Tanggal ringkas untuk halaman customer, contoh "5 Okt 2026"
export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
