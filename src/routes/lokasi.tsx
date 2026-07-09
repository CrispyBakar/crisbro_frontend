import { createFileRoute } from "@tanstack/react-router";
import { apiUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ExternalLink, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

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

function LokasiPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

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

      <section className="mx-auto max-w-6xl grid md:grid-cols-2 gap-6">
        {locations.map((o) => (
          <article
            key={o.id}
            className="rounded-xl bg-card border border-border p-7 shadow-(--shadow-soft) hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-lg bg-secondary grid place-items-center shrink-0">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                {o.city && (
                  <p className="text-sm font-bold text-primary uppercase tracking-wide">{o.city}</p>
                )}
                <h3 className="text-2xl font-extrabold mb-3">{o.name}</h3>
                {o.address && <p className="text-muted-foreground">{o.address}</p>}
              </div>
            </div>
            <a
              href={o.maps_url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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
    <section className="mx-auto max-w-6xl grid gap-6 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-7 shadow-(--shadow-soft)"
        >
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="mb-4 h-7 w-3/4" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-4 h-4 w-5/6" />
            </div>
          </div>
          <Skeleton className="mt-5 h-10 w-full rounded-lg" />
        </div>
      ))}
    </section>
  );
}
