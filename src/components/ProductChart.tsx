import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

/** Satu produk loyalty beserta jumlah transaksi redeem-nya */
export type RedeemedProduct = {
  id: string;
  name: string;
  /** Jumlah transaksi redeem produk ini dengan poin loyalty */
  redeemCount: number;
  /** Poin yang dibutuhkan untuk sekali redeem (opsional, tampil di tooltip) */
  pointNeeded?: number;
};

type ProductChartProps = {
  title?: string;
  data: RedeemedProduct[];
  /** Jumlah produk teratas yang ditampilkan */
  limit?: number;
  period?: string;
  periodOptions?: readonly string[];
  onPeriodChange?: (period: string) => void;
  /**
   * Total transaksi redeem seluruh produk dari API. Bila kosong, dijumlahkan
   * dari produk top `limit` saja.
   */
  totalRedeem?: number;
  /** Warna utama bar & tooltip */
  color?: string;
  /** Jumlah interval sumbu Y maksimum (step dibulatkan ke bilangan bulat) */
  tickCount?: number;
  /** Tinggi area plot dalam px */
  height?: number;
  isLoading?: boolean;
  /** Pesan error; bila diisi menggantikan isi chart */
  errorMessage?: string;
  emptyMessage?: string;
};

const idNumber = new Intl.NumberFormat("id-ID");
const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCount = (v: number) => `${idNumber.format(v)}x redeem`;
const formatTick = (v: number) => (v >= 1000 ? compact.format(v) : `${v}`);

/** Motif garis diagonal untuk bar yang tidak aktif */
const STRIPES =
  "repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 3px, transparent 3px 9px)";

/**
 * Bulatkan step ke angka "enak dibaca": 1, 2, 5, 10 × 10^n. Jumlah redeem
 * selalu bilangan bulat, jadi step minimal 1 dan tanpa pecahan (tanpa 2.5).
 */
function niceStep(raw: number) {
  if (raw <= 1) return 1;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/* ------------------------------------------------------------------ */
/* Dropdown periode                                                    */
/* ------------------------------------------------------------------ */

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
    <div ref={ref} className="relative">
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

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

export function ProductChart({
  title = "Produk paling sering di-redeem",
  data,
  limit = 7,
  period,
  periodOptions,
  onPeriodChange,
  totalRedeem: totalRedeemProp,
  color = "var(--color-berry-red)",
  tickCount = 6,
  height = 280,
  isLoading = false,
  errorMessage,
  emptyMessage = "Belum ada transaksi redeem produk loyalty.",
}: ProductChartProps) {
  // Urutkan dari redeem terbanyak lalu ambil N teratas. Index 0 selalu
  // produk terlaris sehingga menjadi bar aktif default.
  const products = useMemo(
    () =>
      [...data]
        .filter((d) => d.redeemCount > 0)
        .sort((a, b) => b.redeemCount - a.redeemCount)
        .slice(0, limit),
    [data, limit],
  );

  const { yMax, ticks, totalRedeem } = useMemo(() => {
    const max = Math.max(0, ...products.map((d) => d.redeemCount));
    const step = niceStep(max / tickCount);
    // Kurangi jumlah tick bila nilai kecil agar tidak ada tick kosong berlebih
    const count = Math.max(1, Math.ceil(max / step));
    return {
      yMax: step * count,
      ticks: Array.from({ length: count + 1 }, (_, i) => i * step),
      totalRedeem:
        totalRedeemProp ??
        products.reduce((sum, d) => sum + d.redeemCount, 0),
    };
  }, [products, tickCount, totalRedeemProp]);

  const [activeId, setActiveId] = useState<string>();
  const activeIndex = products.findIndex((d) => d.id === activeId);
  const active = activeIndex >= 0 ? activeIndex : 0;

  // Animasi tumbuh saat pertama render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const pos = (v: number) => `${(v / yMax) * 100}%`;
  const showPeriod = period !== undefined && periodOptions && onPeriodChange;

  return (
    <div className="flex h-full w-full flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            {title}
          </h2>
          <p className="text-xs text-neutral-500 sm:text-sm">
            {`Top ${products.length} produk · ${idNumber.format(totalRedeem)} transaksi redeem poin loyalty`}
          </p>
        </div>
        {showPeriod && (
          <PeriodSelect
            value={period}
            options={periodOptions}
            onChange={onPeriodChange}
          />
        )}
      </div>

      {isLoading || errorMessage || products.length === 0 ? (
        <div
          className="mt-8 flex flex-1 items-center justify-center text-sm text-neutral-500"
          style={{ minHeight: height }}
        >
          {isLoading
            ? "Memuat data redeem..."
            : (errorMessage ?? emptyMessage)}
        </div>
      ) : (
        <>
          {/* Chart body: minimal `height`, tumbuh mengisi tinggi kartu bila
              chart di sebelahnya lebih tinggi */}
          <div className="mt-8 flex flex-1" style={{ minHeight: height }}>
            {/* Sumbu Y */}
            <div className="relative w-11 shrink-0 sm:w-12">
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute right-3 translate-y-1/2 text-xs tabular-nums text-neutral-500 sm:text-sm"
                  style={{ bottom: pos(t) }}
                >
                  {formatTick(t)}
                </span>
              ))}
            </div>

            {/* Area plot */}
            <div className="relative flex-1">
              {/* Grid putus-putus */}
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute inset-x-0 border-t border-dashed border-neutral-200"
                  style={{ bottom: pos(t) }}
                />
              ))}

              {/* Bars */}
              <div className="absolute inset-0 flex">
                {products.map((d, i) => {
                  const isActive = i === active;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onMouseEnter={() => setActiveId(d.id)}
                      onFocus={() => setActiveId(d.id)}
                      onClick={() => setActiveId(d.id)}
                      aria-label={`#${i + 1} ${d.name}: ${formatCount(d.redeemCount)}`}
                      aria-pressed={isActive}
                      className="group flex h-full min-w-0 flex-1 items-end justify-center focus:outline-none"
                    >
                      <div
                        className="relative w-3/5 max-w-[64px] rounded-full transition-[height] duration-700 ease-out group-focus-visible:ring-2 group-focus-visible:ring-neutral-900/20 group-focus-visible:ring-offset-2 motion-reduce:transition-none"
                        style={{
                          height: mounted ? pos(d.redeemCount) : "0%",
                          backgroundColor: color,
                          backgroundImage: isActive ? "none" : STRIPES,
                        }}
                      >
                        {isActive && (
                          <>
                            {/* Titik penanda */}
                            <span
                              className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            {/* Tooltip */}
                            <span
                              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-4 flex -translate-x-1/2 flex-col items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums text-white shadow-md"
                              style={{ backgroundColor: color }}
                            >
                              {formatCount(d.redeemCount)}
                              {d.pointNeeded !== undefined && (
                                <span className="text-xs font-normal text-white/80">
                                  {`${idNumber.format(d.pointNeeded)} poin / redeem`}
                                </span>
                              )}
                              <span
                                className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent"
                                style={{ borderTopColor: color }}
                              />
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Label sumbu X: nama produk (dipotong 2 baris, nama lengkap di title) */}
          <div className="mt-3 flex pl-11 sm:pl-12">
            {products.map((d, i) => (
              <span
                key={d.id}
                title={d.name}
                className={`line-clamp-2 min-w-0 flex-1 px-1 text-center text-xs leading-snug sm:text-sm ${
                  i === active
                    ? "font-medium text-neutral-900"
                    : "text-neutral-500"
                }`}
              >
                {d.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
