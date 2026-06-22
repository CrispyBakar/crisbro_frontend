import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tag, MapPin, Calendar, Smartphone } from "lucide-react";

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
  start_date: string;
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

const API_BASE = "/api";

const statusLabel: Record<string, { label: string; color: string }> = {
  active: { label: "Aktif", color: "bg-green-100 text-green-700" },
  completed: { label: "Selesai", color: "bg-gray-100 text-gray-500" },
  inactive: { label: "Tidak Aktif", color: "bg-red-100 text-red-500" },
};

function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<"semua" | "active" | "completed">("semua");

  useEffect(() => {
    fetch(`${API_BASE}/promos`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
      })
      .then((data: Promo[]) => setPromos(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeFilter === "semua" ? promos : promos.filter((p) => p.status === activeFilter);

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
                onClick={() => setActiveFilter(f)}
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

      {loading && <p className="text-center text-muted-foreground mt-10">Memuat promo...</p>}
      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      <section className="mx-auto max-w-6xl grid md:grid-cols-2 gap-6">
        {filtered.map((promo) => {
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
                  {promo.start_date}
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
      </section>

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-muted-foreground mt-12">Tidak ada promo saat ini 😢</p>
      )}
    </main>
  );
}
