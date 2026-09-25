/* ------------------------------------------------------------------ */
/* Helper periode dashboard → rentang tanggal (bisa dipakai query API) */
/* ------------------------------------------------------------------ */

/** Opsi periode standar dashboard — dipahami oleh getPeriodRange */
export const DASHBOARD_PERIODS = [
  "Minggu ini",
  "Bulan ini",
  "3 bulan",
  "Tahun ini",
] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/** Nilai query `?period=` yang diterima endpoint dashboard backend */
export type DashboardPeriodKey = "week" | "month" | "3_months" | "year";

const PERIOD_KEYS: Record<DashboardPeriod, DashboardPeriodKey> = {
  "Minggu ini": "week",
  "Bulan ini": "month",
  "3 bulan": "3_months",
  "Tahun ini": "year",
};

export const toPeriodKey = (period: string): DashboardPeriodKey =>
  PERIOD_KEYS[period as DashboardPeriod] ?? "month";

/** Opsi tanpa filter tanggal — hanya untuk chart customer per outlet */
export const ALL_TIME_PERIOD = "Semua waktu";

export const OUTLET_PERIODS = [...DASHBOARD_PERIODS, ALL_TIME_PERIOD] as const;

export type OutletPeriodKey = DashboardPeriodKey | "all";

export const toOutletPeriodKey = (period: string): OutletPeriodKey =>
  period === ALL_TIME_PERIOD ? "all" : toPeriodKey(period);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatRange(start: Date, end: Date) {
  const full = (d: Date) =>
    `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (start.getTime() === end.getTime()) return full(end);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const left = sameMonth
    ? `${start.getDate()}`
    : sameYear
      ? `${start.getDate()} ${MONTHS[start.getMonth()]}`
      : full(start);

  return `${left} – ${full(end)}`;
}

/** Parse "YYYY-MM-DD" sebagai tanggal lokal (new Date(str) membacanya UTC) */
const parseDateOnly = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Label rentang dari periode yang dikembalikan API, mis. "1 – 25 Sep 2026" */
export const formatApiRange = ({ start, end }: { start: string; end: string }) =>
  formatRange(parseDateOnly(start), parseDateOnly(end));

export function getPeriodRange(period: string, now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);

  if (period === "Minggu ini") {
    start.setDate(end.getDate() - ((end.getDay() + 6) % 7)); // mulai Senin
  } else if (period === "Bulan ini") {
    start.setDate(1);
  } else if (period === "3 bulan") {
    // Bulan berjalan + 2 bulan sebelumnya, dimulai tanggal 1
    start.setMonth(end.getMonth() - 2, 1);
  } else if (period === "Tahun ini") {
    start.setMonth(0, 1);
  }

  return { start, end, label: formatRange(start, end) };
}
