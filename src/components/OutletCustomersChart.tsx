import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

export type OutletCustomers = {
  /** location_id outlet — dipakai sebagai key karena nama outlet bisa kembar */
  id: string;
  outlet: string;
  customers: number;
  /** Jumlah customer periode sebelumnya (opsional, untuk badge % perubahan) */
  previous?: number;
};

type OutletCustomersChartProps = {
  title?: string;
  data: OutletCustomers[];
  period?: string;
  periodOptions?: readonly string[];
  onPeriodChange?: (period: string) => void;
  /** Teks rentang tanggal di bawah judul, mis. "21 – 24 Sep 2026" */
  rangeLabel?: string;
  /** Teks pembanding di samping badge total, mis. "vs bulan lalu" */
  comparisonLabel?: string;
  color?: string;
  /** Kontrol cari + urutan muncul bila jumlah outlet melebihi angka ini */
  searchMinItems?: number;
  /**
   * Tinggi maksimum daftar outlet sebelum scroll (px). Bila kartu diberi
   * tinggi tetap oleh parent, daftar mengisi sisa tinggi kartu lalu scroll.
   */
  listMaxHeight?: number;
  /**
   * Total customer dari API (distinct). Bila kosong, dijumlahkan dari `data`,
   * yang bisa dobel hitung customer yang bertransaksi di beberapa outlet.
   */
  total?: number;
  /** Total customer periode sebelumnya, pasangan `total` */
  previousTotal?: number;
  isLoading?: boolean;
  /** Pesan error; bila diisi menggantikan isi chart */
  errorMessage?: string;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
};

type Order = "desc" | "asc";

const STRIPES =
  "repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 3px, transparent 3px 9px)";

const numberFmt = new Intl.NumberFormat("id-ID");

const percentChange = (current: number, previous?: number) =>
  previous ? ((current - previous) / previous) * 100 : null;

/* ------------------------------------------------------------------ */
/* Sub-komponen                                                        */
/* ------------------------------------------------------------------ */

function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className={`h-3 w-3 ${up ? "" : "rotate-180"}`}
      >
        <path
          d="M6 9.5v-7M3 5l3-3 3 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function PeriodSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
      >
        {value}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="m5 7.5 5 5 5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 min-w-full overflow-hidden rounded-2xl border border-neutral-100 bg-white p-1 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                role="option"
                aria-selected={opt === value}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  opt === value
                    ? "bg-neutral-100 font-medium text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderToggle({
  value,
  onChange,
}: {
  value: Order;
  onChange: (o: Order) => void;
}) {
  const options: { value: Order; label: string }[] = [
    { value: "desc", label: "Terbanyak" },
    { value: "asc", label: "Tersedikit" },
  ];
  return (
    <div className="inline-flex shrink-0 rounded-full bg-neutral-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 ${
            value === opt.value
              ? "bg-white font-medium text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

export function OutletCustomersChart({
  title = "Customer per outlet",
  data,
  period,
  periodOptions,
  onPeriodChange,
  rangeLabel,
  comparisonLabel = "vs periode sebelumnya",
  color = "var(--color-berry-red)",
  searchMinItems = 8,
  listMaxHeight = 320,
  total: totalProp,
  previousTotal,
  isLoading = false,
  errorMessage,
  emptyMessage = "Belum ada customer tercatat di periode ini. Coba periode yang lebih panjang.",
  formatValue = (v) => numberFmt.format(v),
}: OutletCustomersChartProps) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order>("desc");
  const [hovered, setHovered] = useState<string | null>(null);

  // Ranking selalu dihitung dari customer terbanyak (#1 = terbanyak)
  const { ranked, max, total, totalChange } = useMemo(() => {
    const ranked = [...data]
      .sort((a, b) => b.customers - a.customers)
      .map((r, i) => ({ ...r, rank: i + 1 }));
    const total =
      totalProp ?? ranked.reduce((sum, r) => sum + r.customers, 0);
    const hasPrevious =
      ranked.length > 0 && ranked.every((r) => r.previous != null);
    const prevTotal =
      totalProp !== undefined
        ? previousTotal
        : hasPrevious
          ? ranked.reduce((sum, r) => sum + (r.previous ?? 0), 0)
          : undefined;
    return {
      ranked,
      max: Math.max(1, ranked[0]?.customers ?? 0),
      total,
      totalChange: percentChange(total, prevTotal),
    };
  }, [data, totalProp, previousTotal]);

  const needsControls = ranked.length > searchMinItems;

  // Semua outlet ditampilkan; daftar di-scroll di dalam kartu
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = order === "desc" ? ranked : [...ranked].reverse();
    return q ? list.filter((r) => r.outlet.toLowerCase().includes(q)) : list;
  }, [ranked, order, query]);

  const activeId = shown.some((r) => r.id === hovered)
    ? hovered
    : shown[0]?.id;

  // Animasi bar memanjang saat pertama render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const showPeriod = period !== undefined && periodOptions && onPeriodChange;
  const statusMessage = isLoading
    ? "Memuat data customer per outlet..."
    : errorMessage
      ? errorMessage
      : ranked.length === 0
      ? emptyMessage
      : null;

  return (
    <div className="flex h-full w-full flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            {title}
          </h2>
          {rangeLabel && (
            <p className="mt-1 text-sm text-neutral-500">{rangeLabel}</p>
          )}
        </div>
        {showPeriod && (
          <PeriodSelect
            value={period}
            options={periodOptions}
            onChange={onPeriodChange}
          />
        )}
      </div>

      {/* Ringkasan total (disembunyikan saat loading/error agar tidak tampil "0") */}
      {!isLoading && !errorMessage && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">
            {formatValue(total)}
          </span>
          <span className="text-sm text-neutral-500">
            customer di {ranked.length} outlet
          </span>
          {totalChange != null && (
            <span className="flex items-center gap-1.5">
              <ChangeBadge value={totalChange} />
              <span className="text-xs text-neutral-400">
                {comparisonLabel}
              </span>
            </span>
          )}
        </div>
      )}

      {statusMessage ? (
        <p className="mt-6 flex flex-1 items-center justify-center rounded-2xl bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
          {statusMessage}
        </p>
      ) : (
        <>
          {/* Kontrol: cari + urutan (hanya muncul kalau outlet > searchMinItems) */}
          {needsControls && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative w-full sm:max-w-xs">
                <span className="sr-only">Cari outlet</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                >
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 3 3" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari outlet"
                  className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                />
              </label>
              <OrderToggle value={order} onChange={setOrder} />
            </div>
          )}

          {/* Daftar outlet: mengisi sisa tinggi kartu (flex-1 min-h-0) lalu
              scroll; maxHeight membatasi saat kartu tidak diberi tinggi tetap */}
          <div
            className="-mr-2 mt-4 min-h-0 flex-1 overflow-y-auto pr-2"
            style={{ maxHeight: listMaxHeight }}
          >
            {shown.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">
                Tidak ada outlet yang cocok dengan “{query.trim()}”.
              </p>
            ) : (
              <ul className="space-y-3" onMouseLeave={() => setHovered(null)}>
                {shown.map((r) => {
                  const isActive = r.id === activeId;
                  const change = percentChange(r.customers, r.previous);
                  return (
                    <li
                      key={r.id}
                      onMouseEnter={() => setHovered(r.id)}
                      className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[1.75rem_9rem_1fr_auto] sm:gap-x-4"
                    >
                      {/* Peringkat */}
                      <span className="text-xs tabular-nums text-neutral-400">
                        #{r.rank}
                      </span>

                      {/* Nama outlet */}
                      <span
                        className={`truncate text-sm transition-colors ${
                          isActive
                            ? "font-semibold text-neutral-900"
                            : "text-neutral-600"
                        }`}
                        title={r.outlet}
                      >
                        {r.outlet}
                      </span>

                      {/* Bar (di mobile pindah ke baris kedua, sejajar nama) */}
                      <div className="order-last col-span-2 col-start-2 h-7 rounded-full bg-neutral-100 sm:order-none sm:col-span-1 sm:col-start-auto">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                          style={{
                            width: mounted
                              ? `${(r.customers / max) * 100}%`
                              : "0%",
                            minWidth:
                              mounted && r.customers > 0 ? "1.75rem" : 0,
                            backgroundColor: color,
                            backgroundImage: isActive ? "none" : STRIPES,
                          }}
                        />
                      </div>

                      {/* Nilai + perubahan */}
                      <div className="flex items-center justify-end gap-2 sm:w-32">
                        <span className="text-sm font-semibold tabular-nums text-neutral-900">
                          {formatValue(r.customers)}
                        </span>
                        {change != null && <ChangeBadge value={change} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
