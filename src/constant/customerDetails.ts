export const CUSTOMER_DETAIL_TABS = [
  "Overview",
  "Points",
  "Transactions",
  "Activity Log",
] as const;

export type CustomerDetailTab = (typeof CUSTOMER_DETAIL_TABS)[number];

export const CUSTOMER_DETAIL_TAB_HEADERS: Record<
  CustomerDetailTab,
  { title: string; subtitle: string }
> = {
  Overview: {
    title: "Customer Information",
    subtitle: "Data diri customer saat ini.",
  },
  Points: {
    title: "Points",
    subtitle: "Riwayat penggunaan points customer",
  },
  Transactions: {
    title: "Transactions",
    subtitle: "Riwayat transaksi customer",
  },
  "Activity Log": {
    title: "Activity Log",
    subtitle: "Aktivitas terbaru customer",
  },
};

export const CUSTOMER_POINT_COLUMNS = [
  "Date",
  "Sales Number",
  "Outlet",
  "Description",
  "Channel",
  "Point",
] as const;

export const CUSTOMER_GENDERS = ["male", "female", "unknown"] as const;

export const CUSTOMER_FORM_FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm font-normal text-chocolate outline-none focus:border-gray-400";
