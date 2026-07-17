import { createFileRoute } from "@tanstack/react-router";
import { apiUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ExternalLink, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/lokasi")({
  head: () => ({
    meta: [
      { title: "Lokasi — Crisbar" },
      { name: "description", content: "Temukan outlet Crisbar terdekat di kotamu." },
    ],
  }),
  component: LokasiPage,
});

type Location = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  maps_url: string;
};

type LocationFilterId = "all" | "bandung-cimahi" | "jabodeta";

const LOCATION_FILTERS: { id: LocationFilterId; label: string }[] = [
  { id: "all", label: "Semua Lokasi" },
  { id: "bandung-cimahi", label: "Bandung & Cimahi" },
  { id: "jabodeta", label: "Jabodeta" },
];

const BANDUNG_CIMAHI_CITIES = new Set(["bandung", "kota bandung", "kabupaten bandung", "cimahi"]);

const JABODETA_CITIES = new Set([
  "jakarta",
  "jakarta barat",
  "jakarta selatan",
  "jakarta timur",
  "jakarta pusat",
  "jakarta utara",
  "kota jakarta barat",
  "kota jakarta selatan",
  "kota jakarta timur",
  "kota jakarta pusat",
  "kota jakarta utara",
  "bogor",
  "kota bogor",
  "kabupaten bogor",
  "depok",
  "kota depok",
  "tangerang",
  "kota tangerang",
  "tangerang selatan",
  "kota tangerang selatan",
]);

async function readLocationsResponse(response: Response): Promise<Location[]> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error("Data lokasi tidak valid");
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : `Gagal memuat lokasi (HTTP ${response.status})`;
    throw new Error(message);
  }

  if (!Array.isArray(data) || !data.every(isLocation)) {
    throw new Error("Format data lokasi tidak valid");
  }

  return data;
}

function isLocation(item: unknown): item is Location {
  if (!item || typeof item !== "object") return false;

  const location = item as Partial<Location>;
  return (
    Number.isFinite(location.id) &&
    typeof location.name === "string" &&
    (location.address === null || typeof location.address === "string") &&
    (location.city === null || typeof location.city === "string") &&
    (location.province === null || typeof location.province === "string") &&
    (location.latitude === null || Number.isFinite(location.latitude)) &&
    (location.longitude === null || Number.isFinite(location.longitude)) &&
    typeof location.maps_url === "string"
  );
}

function normalizeCity(city: string | null) {
  return (city ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getLocationFilterId(city: string | null): Exclude<LocationFilterId, "all"> | "other" {
  const normalizedCity = normalizeCity(city);

  if (BANDUNG_CIMAHI_CITIES.has(normalizedCity)) return "bandung-cimahi";
  if (JABODETA_CITIES.has(normalizedCity)) return "jabodeta";

  return "other";
}

function LokasiPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LocationFilterId>("all");

  useEffect(() => {
    fetch(apiUrl("/locations"))
      .then(readLocationsResponse)
      .then((data) => setLocations(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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

  const scrollToPageTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const filteredLocations = useMemo(() => {
    if (activeFilter === "all") return locations;
    return locations.filter((location) => getLocationFilterId(location.city) === activeFilter);
  }, [activeFilter, locations]);

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-6xl text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          Mampir ke <span className="text-primary">Outlet</span> Kami 📍
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Cari Crisbar terdekat dan nikmati pengalaman sweet langsung di tempat.
        </p>
      </section>

      {loading && <LocationSkeleton />}

      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      {!loading && !error && locations.length === 0 && (
        <p className="text-center text-muted-foreground mt-10">Belum ada outlet yang tersedia.</p>
      )}

      {!loading && !error && locations.length > 0 && (
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="flex flex-wrap justify-start gap-2">
            {LOCATION_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              const inactiveClass =
                filter.id === "all"
                  ? "bg-background border-border hover:bg-secondary"
                  : "bg-secondary border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary/70";

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-all ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-(--shadow-pop)"
                      : inactiveClass
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && locations.length > 0 && filteredLocations.length === 0 && (
        <p className="text-center text-muted-foreground mt-10">
          Belum ada outlet untuk kategori ini.
        </p>
      )}

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
        {filteredLocations.map((o) => (
          <article
            key={o.id}
            className="rounded-xl bg-card border border-border p-3 shadow-(--shadow-soft) hover:-translate-y-1 transition-transform sm:p-7"
          >
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary sm:h-14 sm:w-14">
                <MapPin className="h-4 w-4 text-primary sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0 flex-1">
                {o.city && (
                  <p className="truncate text-[10px] font-bold uppercase tracking-wide text-primary sm:text-sm">
                    {o.city}
                  </p>
                )}
                <h3 className="mb-2 line-clamp-2 text-sm font-extrabold leading-tight sm:mb-3 sm:text-2xl">
                  {o.name}
                </h3>
                {o.address && (
                  <p className="text-xs text-muted-foreground sm:text-base">{o.address}</p>
                )}
              </div>
            </div>
            <a
              href={o.maps_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:mt-5 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <MapPin className="h-4 w-4" />
              Lihat di Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </article>
        ))}
      </section>

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

function LocationSkeleton() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-3 shadow-(--shadow-soft) sm:p-7"
        >
          <div className="flex items-start gap-2 sm:gap-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg sm:h-14 sm:w-14" />
            <div className="min-w-0 flex-1">
              <Skeleton className="mb-3 h-3 w-20 sm:h-4 sm:w-24" />
              <Skeleton className="mb-4 h-4 w-3/4 sm:h-7" />
              <Skeleton className="mb-2 h-3 w-full sm:h-4" />
              <Skeleton className="mb-4 h-3 w-5/6 sm:h-4" />
            </div>
          </div>
          <Skeleton className="mt-4 h-9 w-full rounded-lg sm:mt-5 sm:h-10" />
        </div>
      ))}
    </section>
  );
}
