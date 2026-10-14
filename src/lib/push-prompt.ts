const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

// user_id ikut di key supaya penundaan tidak terbawa ke akun lain yang login
// di perangkat yang sama
const storageKey = (userId: string) => `push-prompt:${userId}`;

// true bila ajakan belum pernah ditutup di perangkat ini, atau terakhir
// ditutup sudah lewat 7 hari
export const isPushPromptDue = (userId: string) => {
  try {
    const dismissedAt = Number(localStorage.getItem(storageKey(userId)));
    return !dismissedAt || Date.now() - dismissedAt >= SNOOZE_MS;
  } catch {
    // localStorage diblokir browser: penundaan tidak bisa diingat
    return true;
  }
};

export const markPushPromptDismissed = (userId: string) => {
  try {
    localStorage.setItem(storageKey(userId), String(Date.now()));
  } catch {
    // Diabaikan: lihat isPushPromptDue
  }
};
