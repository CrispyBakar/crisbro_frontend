// Sama dengan normalisasi backend: buang non-digit, lalu awalan 62 / 0
export const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
};

// Tampilan lokal berkelompok 4 digit: 83809062003 -> 0838 0906 2003
export const formatPhone = (raw: string) =>
  `0${normalizePhone(raw)}`.replace(/(\d{4})(?=\d)/g, "$1 ");
