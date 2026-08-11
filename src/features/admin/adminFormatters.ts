import type { AdminCustomer, SortOrder } from "@/lib/admin";

type CustomerSyncSource = Pick<
  AdminCustomer,
  "runchise_sync" | "runchise_sync_status" | "runchise_sync_error"
>;

// H-5: fungsi murni (bukan komponen) dipisahkan dari adminUiPrimitives.tsx.
// Vite/React Fast Refresh hanya bekerja bila satu file mengekspor komponen
// saja; mencampur helper di file komponen membuat HMR jatuh ke full reload
// (aturan react-refresh/only-export-components). Dipakai bersama oleh
// AdminPage.tsx dan modul tab yang dipecah darinya.

export function numberFormat(value: number) {
  return value.toLocaleString("id-ID");
}

export function currencyFormat(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

export function dateFormat(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function dateTimeFormat(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function paginationItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

export type SortState<T extends string> = { sort_by: T; sort_order: SortOrder };

export function nextSortState<T extends string>(
  current: SortState<T>,
  sortBy: T,
  defaultOrder: SortOrder = "asc",
): SortState<T> {
  if (current.sort_by !== sortBy) {
    return { sort_by: sortBy, sort_order: defaultOrder };
  }

  return { sort_by: sortBy, sort_order: current.sort_order === "asc" ? "desc" : "asc" };
}

// L-7: helper status customer/Runchise dipindahkan dari AdminPage.tsx karena
// sekarang dipakai bersama oleh AdminPage (saat menyimpan customer) dan modul
// tab customer yang dipecah darinya. Isinya tidak diubah.
export function accountStatusLabel(status?: string | null) {
  if (status === "not_linked") return "Belum Terhubung";
  return status === "pending_activation" ? "Pending Aktivasi" : "Aktif";
}

export function runchiseSyncLabel(status?: string | null) {
  if (status === "synced") return "Runchise OK";
  if (status === "not_linked") return "Belum Terhubung";
  if (status === "failed") return "Sync Gagal";
  if (status === "skipped") return "Belum Sync";
  return "Pending Sync";
}

export function runchiseSyncClassName(status?: string | null) {
  if (status === "synced") return "bg-emerald-500/10 text-emerald-700";
  if (status === "failed") return "bg-red-500/10 text-red-700";
  if (status === "skipped") return "bg-amber-500/10 text-amber-700";
  return "bg-slate-500/10 text-slate-700";
}

export function getCustomerSyncStatus(customer: CustomerSyncSource) {
  return customer.runchise_sync?.status ?? customer.runchise_sync_status ?? "not_linked";
}

export function getCustomerSyncMessage(customer: CustomerSyncSource) {
  return (
    customer.runchise_sync?.error ??
    customer.runchise_sync_error ??
    customer.runchise_sync?.reason ??
    null
  );
}

export function getCustomerSyncNotice(customer: CustomerSyncSource) {
  const status = getCustomerSyncStatus(customer);

  if (status === "failed") {
    return "Perubahan lokal belum terkirim ke Runchise.";
  }
  if (status === "pending") {
    return "Data lokal menunggu sync Runchise.";
  }
  if (status === "skipped") {
    return "Sync Runchise dilewati.";
  }
  if (status === "not_linked") {
    return "Customer Runchise belum terhubung ke data lokal.";
  }

  return null;
}
