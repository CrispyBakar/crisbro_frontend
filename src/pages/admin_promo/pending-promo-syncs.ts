import { useSyncExternalStore } from "react";

// Promo yang sudah dibuat di Runchise tapi gagal tersimpan ke DB lokal.
// Disimpan di localStorage agar runchise_id tidak hilang saat modal ditutup
// atau halaman di-refresh (hanya berlaku di browser yang sama).
export type PendingPromoSync = {
  runchise_id: number;
  name: string;
  failed_at: string;
};

const STORAGE_KEY = "crisbro:pending-promo-syncs";
const EMPTY: PendingPromoSync[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedValue: PendingPromoSync[] = EMPTY;

const readRaw = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

// Snapshot harus stabil antar-render selama isi storage tidak berubah
const getSnapshot = () => {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed)
      ? (parsed as PendingPromoSync[]).filter(
          (item) => typeof item?.runchise_id === "number",
        )
      : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
};

const write = (items: PendingPromoSync[]) => {
  try {
    if (items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage tidak tersedia (mis. private mode) — abaikan
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Sinkron dengan tab lain
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
};

export const addPendingPromoSync = (item: Omit<PendingPromoSync, "failed_at">) =>
  write([
    ...getSnapshot().filter(
      (pending) => pending.runchise_id !== item.runchise_id,
    ),
    { ...item, failed_at: new Date().toISOString() },
  ]);

export const removePendingPromoSync = (runchiseId: number) =>
  write(getSnapshot().filter((pending) => pending.runchise_id !== runchiseId));

export const usePendingPromoSyncs = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
