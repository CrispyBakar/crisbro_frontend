// Nomor WhatsApp bot aktivasi Crisbro (format 62xxx)
const ACTIVATION_WA_NUMBER: string | undefined = import.meta.env
  .VITE_ACTIVATION_WA_NUMBER;

// Link wa.me dengan pesan aktivasi terisi; null bila nomor bot belum dikonfigurasi
export const activationWaUrl = (text: string) =>
  ACTIVATION_WA_NUMBER
    ? `https://wa.me/${ACTIVATION_WA_NUMBER}?text=${encodeURIComponent(text)}`
    : null;
