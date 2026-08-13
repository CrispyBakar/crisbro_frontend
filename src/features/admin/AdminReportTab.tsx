import type { ReactNode } from "react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Gift, TicketCheck, UserCheck, Users, WalletCards } from "lucide-react";
import type { AdminLocation, LoyaltySummary } from "@/lib/admin";
import {
  currencyFormat,
  dateFormat,
  nextSortState,
  numberFormat,
  type SortState,
} from "./adminFormatters";
import { FormInput, Panel, Select, SortableHeader, TableScrollArea } from "./adminUiPrimitives";

// H-5: tab Report dipecah dari AdminPage.tsx jadi modul lazy tersendiri,
// melanjutkan pola yang sudah divalidasi di AdminActivityTab dan
// AdminSalesTransactionsTab. Tab ini read-only juga (kartu metrik, tabel,
// grafik), jadi risikonya setara.
//
// Metric, DataTable, dan ReportChartBoundary ikut pindah ke sini karena
// ketiganya HANYA dipakai tab ini (diverifikasi lewat grep) -- jadi tidak
// perlu menghuni modul bersama, dan bobotnya ikut keluar dari chunk utama.
//
// Import lazy ke AdminReportCharts (recharts) tetap dipertahankan: chunk
// grafik yang berat itu baru diunduh saat grafiknya benar-benar dirender,
// bukan sekadar saat tab ini dibuka.
//
// Sama seperti dua tab sebelumnya: state (summary, filter) dan loadReport()
// TETAP dikelola AdminPage.tsx; komponen ini murni presentational.

const ReportTopRewardsChart = lazy(() =>
  import("./AdminReportCharts").then((module) => ({ default: module.TopRewardsChart })),
);
const ReportTopRedeemOutletsChart = lazy(() =>
  import("./AdminReportCharts").then((module) => ({ default: module.TopRedeemOutletsChart })),
);
const ReportRedemptionHistoryChart = lazy(() =>
  import("./AdminReportCharts").then((module) => ({ default: module.RedemptionHistoryChart })),
);

const metricToneClasses = {
  primary: {
    border: "border-primary/20",
    icon: "bg-primary/10 text-primary",
    accent: "bg-primary",
  },
  success: {
    border: "border-emerald-500/20",
    icon: "bg-emerald-500/10 text-emerald-700",
    accent: "bg-emerald-500",
  },
  gold: {
    border: "border-amber-500/20",
    icon: "bg-amber-500/10 text-amber-700",
    accent: "bg-amber-500",
  },
  info: {
    border: "border-sky-500/20",
    icon: "bg-sky-500/10 text-sky-700",
    accent: "bg-sky-500",
  },
  muted: {
    border: "border-muted-foreground/20",
    icon: "bg-muted text-muted-foreground",
    accent: "bg-muted-foreground",
  },
  danger: {
    border: "border-rose-500/20",
    icon: "bg-rose-500/10 text-rose-700",
    accent: "bg-rose-500",
  },
} as const;

function Metric({
  title,
  value,
  icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone?: keyof typeof metricToneClasses;
}) {
  const classes = metricToneClasses[tone];

  return (
    <div
      className={`relative flex min-h-26 min-w-0 flex-col overflow-hidden rounded-xl border bg-card px-3 pb-2.5 pt-3.5 shadow-(--shadow-soft) sm:min-h-29.5 sm:rounded-2xl sm:px-4 sm:pb-3 sm:pt-4 lg:min-h-28 ${classes.border}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${classes.accent}`} />
      <div className="flex min-h-12 flex-col items-center justify-center gap-1.5 text-center sm:min-h-13 sm:gap-2 lg:min-h-9 lg:flex-row lg:justify-start lg:text-left">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full [&>svg]:h-3.5 [&>svg]:w-3.5 sm:h-8 sm:w-8 sm:[&>svg]:h-4 sm:[&>svg]:w-4 ${classes.icon}`}
        >
          {icon}
        </span>
        <p className="min-w-0 text-[9px] font-black uppercase leading-tight text-muted-foreground sm:text-[11px] lg:text-xs">
          {title}
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-1 pt-1.5">
        <p className="max-w-full truncate text-lg font-black leading-none tracking-normal tabular-nums sm:text-[1.4rem] lg:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function parseTableNumber(value: string) {
  const normalized = value
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (!normalized || normalized === "-") return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function compareTableCell(a = "", b = "") {
  const firstDate = Date.parse(a);
  const secondDate = Date.parse(b);
  if (!Number.isNaN(firstDate) && !Number.isNaN(secondDate)) {
    return firstDate - secondDate;
  }

  const firstNumber = parseTableNumber(a);
  const secondNumber = parseTableNumber(b);
  if (firstNumber !== null && secondNumber !== null) {
    return firstNumber - secondNumber;
  }

  return a.localeCompare(b, "id-ID", { numeric: true, sensitivity: "base" });
}

function DataTable({
  headers,
  rows,
  emptyMessage = "Belum ada data.",
  minWidth,
  maxHeight,
}: {
  headers: string[];
  rows?: string[][];
  emptyMessage?: string;
  minWidth?: number;
  maxHeight?: number;
}) {
  const [sort, setSort] = useState<SortState<string>>({ sort_by: "", sort_order: "asc" });
  const hasRows = (rows ?? []).length > 0;
  const tableMinWidth = minWidth ?? Math.max(640, headers.length * 160);
  const sortedRows = useMemo(() => {
    if (!sort.sort_by) return rows ?? [];
    const columnIndex = Number(sort.sort_by);
    if (!Number.isInteger(columnIndex)) return rows ?? [];

    return [...(rows ?? [])].sort((a, b) => {
      const direction = sort.sort_order === "asc" ? 1 : -1;
      return compareTableCell(a[columnIndex], b[columnIndex]) * direction;
    });
  }, [rows, sort]);

  return (
    <TableScrollArea maxHeight={maxHeight}>
      <table className="w-full text-sm" style={{ minWidth: tableMinWidth }}>
        <thead>
          <tr className="text-left text-muted-foreground">
            {(headers ?? []).map((header, index) => (
              <SortableHeader
                key={header}
                label={header}
                sortKey={String(index)}
                sort={sort}
                onSort={(sortKey) => setSort((current) => nextSortState(current, sortKey))}
                className={maxHeight ? "sticky top-0 z-10 bg-background p-2 shadow-sm" : "p-2"}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            sortedRows.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {(row ?? []).map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-2 font-medium">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="border-t border-border">
              <td className="p-2 font-medium text-muted-foreground" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableScrollArea>
  );
}

function ReportChartBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<Skeleton className="h-65 w-full rounded-2xl" aria-label="Memuat grafik" />}
    >
      {children}
    </Suspense>
  );
}

export default function AdminReportTab({
  summary,
  locations,
  redemptionFrom,
  onRedemptionFromChange,
  redemptionTo,
  onRedemptionToChange,
  outletId,
  onOutletIdChange,
  loading,
  onApplyFilter,
}: {
  summary: LoyaltySummary;
  locations: AdminLocation[];
  redemptionFrom: string;
  onRedemptionFromChange: (value: string) => void;
  redemptionTo: string;
  onRedemptionToChange: (value: string) => void;
  outletId: string;
  onOutletIdChange: (value: string) => void;
  loading: boolean;
  onApplyFilter: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6 lg:gap-4">
        <Metric
          title="Total Member"
          value={numberFormat(summary.total_members)}
          icon={<Users className="h-4 w-4" />}
          tone="primary"
        />
        <Metric
          title="Customer Berpoin"
          value={numberFormat(summary.runchise_customers_with_points)}
          icon={<UserCheck className="h-4 w-4" />}
          tone="success"
        />
        <Metric
          title="Poin Diberikan"
          value={numberFormat(summary.total_points_given)}
          icon={<Coins className="h-4 w-4" />}
          tone="gold"
        />
        <Metric
          title="Poin Ditukar"
          value={numberFormat(summary.points_redeemed)}
          icon={<TicketCheck className="h-4 w-4" />}
          tone="info"
        />
        <Metric
          title="Poin Tersedia"
          value={numberFormat(summary.total_points_available)}
          icon={<WalletCards className="h-4 w-4" />}
          tone="muted"
        />
        <Metric
          title="Total Redeem"
          value={numberFormat(summary.redemption_count)}
          icon={<Gift className="h-4 w-4" />}
          tone="danger"
        />
      </div>
      {/* Kolom "Customer di Outlet" tidak menjumlah ke kartu "Customer
          Tersimpan": kartu menghitung customer unik, sedangkan satu
          customer dapat terdaftar di beberapa outlet sekaligus. */}
      <Panel title="Jumlah customer Runchise per outlet (satu customer dapat terdaftar di beberapa outlet)">
        <DataTable
          headers={[
            "Outlet",
            "Source ID",
            "Kota",
            "Customer di Outlet",
            "Customer Berpoin",
            "Jumlah Poin yang Diredeem",
            "Snapshot Terakhir",
            "Status",
          ]}
          rows={(summary.runchise_customers_by_outlet ?? []).map((outlet) => [
            outlet.outlet_name,
            String(outlet.source_location_id),
            outlet.city ?? "-",
            numberFormat(outlet.stored_customers),
            numberFormat(outlet.customers_with_points),
            numberFormat(outlet.points_redeemed ?? 0),
            outlet.last_snapshot_at ? dateFormat(outlet.last_snapshot_at) : "-",
            outlet.status === "capped"
              ? "Dibatasi API"
              : outlet.status === "mismatch"
                ? "Mismatch"
                : outlet.status === "empty"
                  ? "Belum ada data"
                  : "Tersedia",
          ])}
          emptyMessage="Belum ada outlet Runchise yang terdaftar."
          maxHeight={440}
        />
      </Panel>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Panel title="Reward paling sering ditukar">
          <ReportChartBoundary>
            <ReportTopRewardsChart rewards={summary.top_rewards ?? []} />
          </ReportChartBoundary>
        </Panel>
        <Panel title="5 outlet paling sering redeem">
          <ReportChartBoundary>
            <ReportTopRedeemOutletsChart outlets={summary.top_redeem_outlets ?? []} />
          </ReportChartBoundary>
        </Panel>
      </div>
      <Panel title="Riwayat semua reward yang ditukar">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto] md:items-end">
          <FormInput
            label="Dari tanggal"
            type="date"
            value={redemptionFrom}
            onChange={onRedemptionFromChange}
          />
          <FormInput
            label="Hingga tanggal"
            type="date"
            value={redemptionTo}
            onChange={onRedemptionToChange}
          />
          <Select
            label="Outlet"
            value={outletId}
            onChange={onOutletIdChange}
            options={[
              { value: "0", label: "Semua outlet" },
              ...(locations ?? []).map((location) => ({
                value: String(location.id),
                label: `${location.name}${location.city ? ` - ${location.city}` : ""}`,
              })),
            ]}
          />
          <Button
            onClick={onApplyFilter}
            disabled={loading}
            className="mb-3 rounded-full font-bold"
          >
            Terapkan Filter
          </Button>
        </div>
        <ReportChartBoundary>
          <ReportRedemptionHistoryChart data={summary.redemption_trend ?? []} />
        </ReportChartBoundary>
        <div className="mt-5">
          <DataTable
            headers={["Tanggal", "Reward/Menu", "Outlet", "Poin", "Harga Jual"]}
            rows={(summary.redemption_history ?? []).map((item) => [
              dateFormat(item.redeemed_at),
              item.reward_name,
              item.outlet_city ? `${item.outlet_name} (${item.outlet_city})` : item.outlet_name,
              numberFormat(item.points_spent),
              item.menu_price !== null ? currencyFormat(item.menu_price) : "-",
            ])}
            emptyMessage="Belum ada riwayat reward yang ditukar pada rentang tanggal ini."
          />
        </div>
      </Panel>
    </section>
  );
}
