// Nomor WhatsApp bot Crisbro untuk aktivasi dan reset password (format 62xxx)
const ACTIVATION_WA_NUMBER: string | undefined = import.meta.env
  .VITE_ACTIVATION_WA_NUMBER;

// Link wa.me dengan pesan terisi; null bila nomor bot belum dikonfigurasi
export const activationWaUrl = (text: string) =>
  ACTIVATION_WA_NUMBER
    ? `https://wa.me/${ACTIVATION_WA_NUMBER}?text=${encodeURIComponent(text)}`
    : null;

// Backend mengenali permintaan reset password dari baris pertama pesan ini,
// lalu bot membalas di chat yang sama dengan tautan reset
export const RESET_PASSWORD_WA_TEXT =
  "RESET PASSWORD CRISBRO\nHarap kirim pesan ini tanpa merubah apapun.";
