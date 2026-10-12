// Pilihan jawaban "tahu Crisbar dari mana"; teksnya disimpan apa adanya
// sebagai source
export const ACQUISITION_SOURCES = [
  "GrabFood",
  "ShopeeFood",
  "GoFood",
  "Teman/Kerabat",
  "Instagram",
  "Tiktok",
] as const;

// Pilihan terakhir: customer mengetik sendiri jawabannya
export const ACQUISITION_OTHER = "Lainnya";

// Backend membatasi source 100 karakter, termasuk awalan "Lainnya: "
export const ACQUISITION_OTHER_MAX_LENGTH =
  100 - `${ACQUISITION_OTHER}: `.length;

// Jawaban bebas diberi awalan supaya bisa dibedakan dari pilihan tetap
export const toAcquisitionSource = (choice: string, otherText: string) =>
  choice === ACQUISITION_OTHER
    ? `${ACQUISITION_OTHER}: ${otherText.trim()}`
    : choice;

// Penanda bahwa jawaban dicatat dari aplikasi customer, bukan input admin
export const ACQUISITION_CAPTURED_VIA = "crisbro_app";

const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

// user_id ikut di key supaya penundaan tidak terbawa ke akun lain yang login
// di perangkat yang sama
const storageKey = (userId: string) => `acquisition-prompt:${userId}`;

// true bila pertanyaan belum pernah tampil di perangkat ini, atau terakhir
// tampil sudah lewat 3 hari
export const isAcquisitionPromptDue = (userId: string) => {
  try {
    const shownAt = Number(localStorage.getItem(storageKey(userId)));
    return !shownAt || Date.now() - shownAt >= SNOOZE_MS;
  } catch {
    // localStorage diblokir browser: penundaan tidak bisa diingat
    return true;
  }
};

export const markAcquisitionPromptShown = (userId: string) => {
  try {
    localStorage.setItem(storageKey(userId), String(Date.now()));
  } catch {
    // Diabaikan: lihat isAcquisitionPromptDue
  }
};
