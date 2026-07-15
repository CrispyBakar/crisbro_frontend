import { createFileRoute } from "@tanstack/react-router";
import { apiUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import gofoodLogo from "@/assets/gofood-logo.webp";
import grabfoodLogo from "@/assets/grabfood-logo.svg";
import shopeefoodLogo from "@/assets/shopeefood-logo.png";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Smartphone,
  Tag,
} from "lucide-react";

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

type ChannelBrand = {
  label: string;
  logoSrc: string;
  textClassName: string;
};

const channelBrands: Record<string, ChannelBrand> = {
  shopeefood: {
    label: "ShopeeFood",
    logoSrc: shopeefoodLogo,
    textClassName: "text-[#ee4d2d]",
  },
  shopee: {
    label: "ShopeeFood",
    logoSrc: shopeefoodLogo,
    textClassName: "text-[#ee4d2d]",
  },
  grabfood: {
    label: "GrabFood",
    logoSrc: grabfoodLogo,
    textClassName: "text-[#00a650]",
  },
  grab: {
    label: "GrabFood",
    logoSrc: grabfoodLogo,
    textClassName: "text-[#00a650]",
  },
  gofood: {
    label: "GoFood",
    logoSrc: gofoodLogo,
    textClassName: "text-[#d92030]",
  },
  gojek: {
    label: "GoFood",
    logoSrc: gofoodLogo,
    textClassName: "text-[#d92030]",
  },
};

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
  const [showBackToTop, setShowBackToTop] = useState(false);
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

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 600);
    };

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateBackToTopVisibility);
    };
  }, []);

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

  function scrollToPageTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const hasOnlineOnlyPromo = promos.some((promo) => promo.is_online_only);

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-6xl text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
          🎉 Promo Spesial
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
          Promo <span className="text-primary">Hari Ini</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Dapatkan penawaran terbaik di setiap kunjunganmu.
        </p>
      </section>

      {/* Filter status */}
      {!loading && !error && (
        <section className="mx-auto mb-10 max-w-6xl overflow-x-auto px-1 pb-1">
          <div className="mx-auto flex w-max gap-2 rounded-full border border-border bg-card p-2 shadow-(--shadow-soft)">
            {(["semua", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => changeFilter(f)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all sm:px-5 ${
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

        {!loading && !error && hasOnlineOnlyPromo && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary shadow-(--shadow-soft) sm:mb-5 sm:px-4 sm:text-sm">
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Hanya berlaku untuk pemesanan online
          </div>
        )}

        {!loading && !error && promos.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {promos.map((promo) => {
              const st = statusLabel[promo.status] ?? {
                label: promo.status,
                color: "bg-gray-100 text-gray-500",
              };
              const channelBrand = getChannelBrand(promo.channel);
              return (
                <article
                  key={promo.id}
                  className="rounded-xl bg-card border border-border p-4 shadow-(--shadow-soft) hover:-translate-y-1 transition-transform sm:p-7"
                >
                  <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
                    <ChannelIcon brand={channelBrand} />
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-xs ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="mb-2 line-clamp-3 text-base font-extrabold leading-snug sm:line-clamp-2 sm:text-xl">
                    {promo.name}
                  </h3>

                  {promo.discount_amount !== null && (
                    <p className="mb-3 text-xl font-black text-primary sm:text-2xl">
                      {promo.discount_is_percentage
                        ? `Diskon ${promo.discount_amount}%`
                        : `Hemat Rp ${promo.discount_amount.toLocaleString("id-ID")}`}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                    <span className="inline-flex items-start gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                      {promo.start_date ?? "Tanggal mulai belum tersedia"}
                      {promo.end_date ? ` — ${promo.end_date}` : " (tidak ada batas)"}
                    </span>
                  </div>

                  {promo.is_all_outlets ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary sm:px-3 sm:py-1.5 sm:text-xs">
                        <MapPin className="h-3 w-3" /> Berlaku di semua outlet
                      </span>
                    </div>
                  ) : (
                    promo.locations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                        {promo.locations.slice(0, 3).map((loc) => (
                          <span
                            key={loc.id}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground sm:px-2.5 sm:py-1 sm:text-xs"
                          >
                            <MapPin className="h-3 w-3" /> {loc.name}
                          </span>
                        ))}
                        {promo.locations.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground sm:px-2.5 sm:py-1 sm:text-xs">
                            +{promo.locations.length - 3} outlet lainnya
                          </span>
                        )}
                      </div>
                    )
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

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToPageTop}
          aria-label="Kembali ke atas"
          className="fixed bottom-5 right-5 z-30 grid h-11 w-11 place-items-center rounded-full border border-primary bg-primary text-primary-foreground shadow-(--shadow-pop) transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-12 sm:w-12"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </main>
  );
}

function getChannelBrand(channel: string | null): ChannelBrand | null {
  if (!channel) return null;

  const normalized = channel.toLowerCase().replace(/[^a-z0-9]/g, "");
  return channelBrands[normalized] ?? null;
}

function ChannelIcon({ brand }: { brand: ChannelBrand | null }) {
  const sizeClass = "h-9 w-14 rounded-lg sm:h-12 sm:w-20";

  if (!brand) {
    return (
      <span className={`${sizeClass} grid shrink-0 place-items-center bg-secondary text-primary`}>
        <Tag className="h-4 w-4 sm:h-6 sm:w-6" />
      </span>
    );
  }

  return (
    <span
      aria-label={brand.label}
      className={`${sizeClass} grid shrink-0 place-items-center overflow-hidden border border-border bg-white px-1.5 shadow-(--shadow-pop)`}
    >
      <img src={brand.logoSrc} alt="" aria-hidden className="h-full w-full object-contain" />
    </span>
  );
}

function PromoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      {Array.from({ length: promoLimit }).map((_, index) => (
        <div
          key={index}
          className="min-h-48 rounded-xl border border-border bg-card p-4 shadow-(--shadow-soft) sm:min-h-55 sm:p-7"
        >
          <div className="mb-4 flex items-start justify-between sm:mb-5">
            <Skeleton className="h-9 w-9 rounded-lg sm:h-12 sm:w-12" />
            <Skeleton className="h-5 w-14 rounded-full sm:h-7 sm:w-20" />
          </div>
          <Skeleton className="mb-3 h-4 w-3/4 sm:h-6" />
          <Skeleton className="mb-5 h-6 w-1/2 sm:h-8" />
          <Skeleton className="h-3 w-full sm:h-4" />
          <Skeleton className="mt-3 h-3 w-2/3 sm:h-4" />
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
