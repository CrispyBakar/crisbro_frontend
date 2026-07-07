import { createFileRoute } from "@tanstack/react-router";
import { apiUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { Tag, MapPin, Calendar, Smartphone, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/promo")({
  head: () => ({
    meta: [
      { title: "Promo — Crisbar" },
      { name: "description", content: "Promo spesial Crisbar hari ini." },
    ],
  }),
  component: PromoPage,
});

type Promo = {
  id: number;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  channel: string | null;
  // Dikirim langsung dari backend supaya logic "khusus online" konsisten
  // di semua tempat yang konsumsi endpoint ini.
  is_online_only: boolean;
  locations: { id: number; name: string }[];
  is_all_outlets: boolean;
  discount_amount: number | null;
  discount_is_percentage: boolean;
  template: string | null;
};

type PromoResponse = {
  items: Promo[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

const promoLimit = 8;

const statusLabel: Record<string, { label: string; color: string }> = {
  active: { label: "Aktif", color: "bg-green-100 text-green-700" },
  completed: { label: "Selesai", color: "bg-gray-100 text-gray-500" },
  inactive: { label: "Tidak Aktif", color: "bg-red-100 text-red-500" },
};

async function readPromoResponse(response: Response): Promise<PromoResponse> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error("Data promo tidak valid");
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : `Gagal memuat promo (HTTP ${response.status})`;
    throw new Error(message);
  }

  if (!isPromoResponse(data)) {
    throw new Error("Format data promo tidak valid");
  }

  return data;
}

function isPromoResponse(data: unknown): data is PromoResponse {
  if (!data || typeof data !== "object") return false;

  const response = data as Partial<PromoResponse>;
  return (
    Array.isArray(response.items) &&
    response.items.every(isPromo) &&
    isPositiveInteger(response.page) &&
    isPositiveInteger(response.limit) &&
    isNonNegativeInteger(response.total) &&
    isPositiveInteger(response.total_pages)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && value >= 1;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && value >= 0;
}

function isPromo(item: unknown): item is Promo {
  if (!item || typeof item !== "object") return false;

  const promo = item as Partial<Promo>;
  return (
    Number.isFinite(promo.id) &&
    typeof promo.name === "string" &&
    typeof promo.status === "string" &&
    (promo.start_date === null || typeof promo.start_date === "string") &&
    (promo.end_date === null || typeof promo.end_date === "string") &&
    (promo.channel === null || typeof promo.channel === "string") &&
    typeof promo.is_online_only === "boolean" &&
    Array.isArray(promo.locations) &&
    promo.locations.every(isPromoLocation) &&
    typeof promo.is_all_outlets === "boolean" &&
    (promo.discount_amount === null || Number.isFinite(promo.discount_amount)) &&
    typeof promo.discount_is_percentage === "boolean" &&
    (promo.template === null || typeof promo.template === "string")
  );
}

function isPromoLocation(item: unknown): item is Promo["locations"][number] {
  if (!item || typeof item !== "object") return false;

  const location = item as Partial<Promo["locations"][number]>;
  return Number.isFinite(location.id) && typeof location.name === "string";
}

function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPromos, setTotalPromos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<"semua" | "active" | "completed">("semua");
  const promoListRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(promoLimit),
    });

    if (activeFilter !== "semua") {
      params.set("status", activeFilter);
    }

    setLoading(true);
    setError("");

    fetch(apiUrl(`/promos?${params.toString()}`), { signal: controller.signal })
      .then(readPromoResponse)
      .then((data) => {
        if (ignore) return;
        setPromos(data.items);
        setPage(data.page);
        setTotalPages(data.total_pages);
        setTotalPromos(data.total);
      })
      .catch((err) => {
        if (!ignore && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [activeFilter, page]);

  function changeFilter(filter: typeof activeFilter) {
    setActiveFilter(filter);
    setPage(1);
  }

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    requestAnimationFrame(() => {
      promoListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-6xl text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
          🎉 Promo Spesial
        </span>
        <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
          Promo <span className="text-primary">Hari Ini</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Dapatkan penawaran terbaik di setiap kunjunganmu.
        </p>
      </section>

      {/* Filter status */}
      {!loading && !error && (
        <section className="mx-auto max-w-6xl mb-10 flex justify-center">
          <div className="inline-flex gap-2 rounded-full bg-card border border-border p-2 shadow-(--shadow-soft)">
            {(["semua", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => changeFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground shadow-(--shadow-pop)"
                    : "text-foreground/70 hover:bg-secondary"
                }`}
              >
                {f === "semua" ? "Semua" : f === "active" ? "Aktif" : "Selesai"}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      <section ref={promoListRef} className="mx-auto max-w-6xl scroll-mt-24">
        {loading && <PromoSkeleton />}

        {!loading && !error && promos.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {promos.map((promo) => {
              const st = statusLabel[promo.status] ?? {
                label: promo.status,
                color: "bg-gray-100 text-gray-500",
              };
              return (
                <article
                  key={promo.id}
                  className="rounded-3xl bg-card border border-border p-7 shadow-(--shadow-soft) hover:-translate-y-1 transition-transform"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-secondary grid place-items-center shrink-0">
                      <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold mb-2">{promo.name}</h3>

                  {promo.discount_amount !== null && (
                    <p className="text-2xl font-black text-primary mb-3">
                      {promo.discount_is_percentage
                        ? `Diskon ${promo.discount_amount}%`
                        : `Hemat Rp ${promo.discount_amount.toLocaleString("id-ID")}`}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {promo.start_date ?? "Tanggal mulai belum tersedia"}
                      {promo.end_date ? ` — ${promo.end_date}` : " (tidak ada batas)"}
                    </span>
                    {promo.channel && (
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        📱 {promo.channel}
                      </span>
                    )}
                  </div>

                  {promo.is_all_outlets ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                        <MapPin className="h-3 w-3" /> Berlaku di semua outlet
                      </span>
                    </div>
                  ) : (
                    promo.locations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {promo.locations.map((loc) => (
                          <span
                            key={loc.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full"
                          >
                            <MapPin className="h-3 w-3" /> {loc.name}
                          </span>
                        ))}
                      </div>
                    )
                  )}

                  {/* Penanda Online Baru - Ditaruh sebagai Footer */}
                  {promo.is_online_only && (
                    <div className="mt-4 pt-3 border-t border-dashed border-border text-xs text-muted-foreground/80 flex items-center gap-1.5">
                      <Smartphone className="h-3 w-3" />
                      <span>Hanya berlaku untuk pemesanan online</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!loading && !error && promos.length === 0 && (
        <p className="text-center text-muted-foreground mt-12">Tidak ada promo saat ini 😢</p>
      )}

      {!loading && !error && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={totalPromos}
          onPageChange={changePage}
        />
      )}
    </main>
  );
}

function PromoSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: promoLimit }).map((_, index) => (
        <div
          key={index}
          className="min-h-55 rounded-3xl border border-border bg-card p-7 shadow-(--shadow-soft)"
        >
          <div className="mb-5 flex items-start justify-between">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="mb-3 h-6 w-3/4" />
          <Skeleton className="mb-5 h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = getVisiblePages(page, totalPages);

  return (
    <>
      <nav
        aria-label="Navigasi halaman promo"
        className="mx-auto max-w-6xl mt-10 flex items-center justify-center gap-2"
      >
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
          className="h-10 w-10 grid place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="h-10 w-10 grid place-items-center text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`h-10 w-10 grid place-items-center rounded-full text-sm font-bold transition-all border ${
                item === page
                  ? "bg-primary text-primary-foreground border-primary shadow-(--shadow-pop)"
                  : "bg-card border-border hover:bg-secondary"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Halaman berikutnya"
          className="h-10 w-10 grid place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>

      <p className="text-center text-xs text-muted-foreground mt-3">
        Halaman {page} dari {totalPages} · {total.toLocaleString("id-ID")} promo total
      </p>
    </>
  );
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "..."> = [1];
  const start = Math.max(page - 1, 2);
  const end = Math.min(page + 1, totalPages - 1);

  if (start > 2) pages.push("...");
  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);

  return pages;
}
