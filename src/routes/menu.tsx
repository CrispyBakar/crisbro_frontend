import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/api";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu Redeem — Crisbar" },
      {
        name: "description",
        content: "Tukarkan poin kamu dengan menu pilihan dari Crisbar.",
      },
    ],
  }),
  component: MenuPage,
});

type MenuItem = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
  category: string | null;
  category_id: number | null;
  sort_order: number;
};

function MenuPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(apiUrl("/catalog/redeem-menu"))
      .then(async (r) => {
        const data = await r.json();

        if (!r.ok) {
          throw new Error(data?.message || data?.error || "Gagal memuat menu redeem");
        }

        if (!Array.isArray(data)) {
          throw new Error("Format data menu redeem tidak valid");
        }

        return data as MenuItem[];
      })
      .then((data) => {
        setItems(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleTukar = (item: MenuItem) => {
    const user = getUser();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    const availablePoint = user.customer?.customer_point?.available_point ?? 0;

    if (availablePoint < item.points_required) {
      alert("Poin kamu tidak cukup untuk menukarkan menu ini 😭");
      return;
    }

    const estimasiData = {
      items: [
        {
          name: item.name,
          image: item.image_url ?? "",
          price: item.points_required,
          quantity: 1,
        },
      ],
      totalPoints: item.points_required,
      pointsBefore: availablePoint,
    };
    sessionStorage.setItem("crisbar_estimasi", JSON.stringify(estimasiData));

    navigate({ to: "/estimasi" });
  };

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-6xl text-center mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
          🍽️ Menu Redeem
        </span>
        <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
          Tukar Poin dengan <span className="text-primary">Menu Favoritmu</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Menu spesial Crisbar yang bisa kamu dapatkan dengan poin reward.
        </p>
      </section>

      {loading && <MenuSkeleton />}
      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      {/* Grid Menu */}
      <section className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <article
            key={item.id}
            className="group rounded-3xl bg-card border border-border overflow-hidden shadow-(--shadow-soft) hover:-translate-y-1 transition-transform flex flex-col"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-secondary">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  width={768}
                  height={576}
                  loading="lazy"
                  className="h-full w-full group-hover:scale-105 transition-transform duration-500 object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-5xl">🍽️</div>
              )}
              {item.category && (
                <Badge className="absolute top-3 left-3 rounded-full bg-card text-primary hover:bg-card font-bold shadow-(--shadow-pop) border border-border">
                  {item.category}
                </Badge>
              )}
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-extrabold mb-1.5">{item.name}</h3>
              {item.description && (
                <p className="text-muted-foreground text-sm mb-5 flex-1 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-2xl font-black text-primary">
                  {item.points_required.toLocaleString("id-ID")} Poin
                </span>
                <button
                  onClick={() => handleTukar(item)}
                  className="rounded-full bg-primary text-primary-foreground font-bold px-5 py-2 shadow-(--shadow-pop) hover:bg-primary/90 transition-colors"
                >
                  Tukar
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {!loading && !error && items.length === 0 && (
        <div className="text-center mt-12 space-y-2">
          <p className="text-4xl">🍽️</p>
          <p className="text-muted-foreground font-semibold">
            Belum ada menu yang tersedia saat ini.
          </p>
        </div>
      )}
    </main>
  );
}

function MenuSkeleton() {
  return (
    <section className="mx-auto max-w-6xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-(--shadow-soft)"
        >
          <Skeleton className="aspect-4/3 w-full rounded-none" />
          <div className="flex flex-1 flex-col p-6">
            <Skeleton className="mb-3 h-6 w-3/4" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-5 h-4 w-2/3" />
            <div className="mt-auto flex items-center justify-between gap-3">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-10 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
