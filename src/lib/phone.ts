// Sama dengan normalisasi backend: buang non-digit, lalu awalan 62 / 0
export const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
};
