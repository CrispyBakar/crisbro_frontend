import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Clock } from "lucide-react";
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
  phone?: string | null; // belum ada di schema, tapi bisa ditambah nanti
  hours?: string | null; // belum ada di schema, bisa ditambah nanti
};

const API_BASE = "/api";

function LokasiPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/locations`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
        return data;
      })
      .then((data: Location[]) => setLocations(data))
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

      {loading && <p className="text-center text-muted-foreground mt-10">Memuat lokasi...</p>}

      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      {!loading && !error && locations.length === 0 && (
        <p className="text-center text-muted-foreground mt-10">Belum ada outlet yang tersedia.</p>
      )}

      <section className="mx-auto max-w-6xl grid md:grid-cols-2 gap-6">
        {locations.map((o) => (
          <article
            key={o.id}
            className="rounded-3xl bg-card border border-border p-7 shadow-(--shadow-soft) hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center shrink-0">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                {o.city && (
                  <p className="text-sm font-bold text-primary uppercase tracking-wide">{o.city}</p>
                )}
                <h3 className="text-2xl font-extrabold mb-3">{o.name}</h3>
                {o.address && <p className="text-muted-foreground mb-3">{o.address}</p>}
                <div className="flex flex-wrap gap-4 text-sm">
                  {o.phone && (
                    <span className="inline-flex items-center gap-1.5 text-foreground/80">
                      <Phone className="h-4 w-4 text-primary" /> {o.phone}
                    </span>
                  )}
                  {o.hours && (
                    <span className="inline-flex items-center gap-1.5 text-foreground/80">
                      <Clock className="h-4 w-4 text-primary" /> {o.hours}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
