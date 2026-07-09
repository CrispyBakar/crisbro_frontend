import { createFileRoute } from "@tanstack/react-router";
import { apiUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
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
    (location.city === null || typeof location.city === "string")
  );
}

function LokasiPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(apiUrl("/locations"))
      .then(readLocationsResponse)
      .then((data) => setLocations(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
                {o.address && <p className="text-muted-foreground mb-3">{o.address}</p>}
              </div>
            </div>
          </article>
        ))}
      </section>
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
        </div>
      ))}
    </section>
  );
}
