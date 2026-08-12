import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ArrowUp, Coins, Sparkles, X } from "lucide-react";

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

function isMenuItem(item: unknown): item is MenuItem {
  if (!item || typeof item !== "object") return false;

  const menuItem = item as Partial<MenuItem>;
  return (
    Number.isFinite(menuItem.id) &&
    typeof menuItem.sku === "string" &&
    typeof menuItem.name === "string" &&
    (menuItem.description === null || typeof menuItem.description === "string") &&
    Number.isFinite(menuItem.points_required) &&
    menuItem.points_required >= 0 &&
    (menuItem.image_url === null || typeof menuItem.image_url === "string") &&
    (menuItem.category === null || typeof menuItem.category === "string") &&
    (menuItem.category_id === null || Number.isFinite(menuItem.category_id)) &&
    Number.isFinite(menuItem.sort_order)
  );
}

function MenuPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [insufficientPoints, setInsufficientPoints] = useState<{
    item: MenuItem;
    availablePoint: number;
  } | null>(null);

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

        if (!data.every(isMenuItem)) {
          throw new Error("Data menu redeem tidak valid");
        }

        return data;
      })
      .then((data) => {
        setItems(data);
      })
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

  const handleTukar = (item: MenuItem) => {
    const user = getUser();

    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    const availablePoint = user.customer?.customer_point?.available_point ?? 0;

    if (availablePoint < item.points_required) {
      setInsufficientPoints({ item, availablePoint });
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
      pointsAfter: availablePoint - item.points_required,
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
          Tukar Poin dengan
          <span className="block text-primary">Menu Favoritmu</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Menu spesial Crisbar yang bisa kamu dapatkan dengan poin reward.
        </p>
      </section>

      {loading && <MenuSkeleton />}
      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      {/* Grid Menu */}
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            role="button"
            tabIndex={0}
            aria-label={`Lihat detail ${item.name}`}
            onClick={() => setSelectedItem(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedItem(item);
              }
            }}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-soft) transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <div className="relative overflow-hidden bg-card">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  width={768}
                  height={576}
                  loading="lazy"
                  className="block h-auto w-full"
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

            <div className="flex flex-1 flex-col p-3 sm:p-6">
              <h3 className="mb-1 break-words text-sm font-extrabold leading-snug sm:mb-1.5 sm:text-xl">
                {item.name}
              </h3>
              {item.description && (
                <p className="mb-3 flex-1 break-words text-xs leading-relaxed text-muted-foreground sm:mb-5 sm:text-sm">
                  {item.description}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-base font-black text-primary sm:text-2xl">
                  {item.points_required.toLocaleString("id-ID")} Poin
                </span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTukar(item);
                  }}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-(--shadow-pop) transition-colors hover:bg-primary/90 sm:px-5 sm:py-2 sm:text-sm"
                >
                  Tukar Poin
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

      <InsufficientPointsDialog
        data={insufficientPoints}
        onClose={() => setInsufficientPoints(null)}
      />
      <RedeemDetailDialog
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onRedeem={(item) => {
          setSelectedItem(null);
          handleTukar(item);
        }}
      />
    </main>
  );
}

function RedeemDetailDialog({
  item,
  onClose,
  onRedeem,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onRedeem: (item: MenuItem) => void;
}) {
  useEffect(() => {
    if (!item) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="redeem-detail-title"
        onClick={(event: ReactMouseEvent<HTMLElement>) => event.stopPropagation()}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg cursor-default overflow-y-auto rounded-3xl border border-border bg-card shadow-(--shadow-pop)"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail menu redeem"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-border bg-card/95 text-muted-foreground shadow-(--shadow-soft) transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative overflow-hidden bg-card">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="block h-auto w-full" />
          ) : (
            <div className="flex min-h-64 w-full items-center justify-center text-5xl">🍽️</div>
          )}
          {item.category && (
            <Badge className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full border border-primary/20 bg-card/95 px-3 py-1 text-xs font-bold text-primary shadow-(--shadow-pop) backdrop-blur-sm hover:bg-card hover:text-primary">
              {item.category}
            </Badge>
          )}
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="space-y-2">
            <h2 id="redeem-detail-title" className="text-2xl font-black leading-tight">
              {item.name}
            </h2>
            <p className="text-2xl font-black text-primary">
              {item.points_required.toLocaleString("id-ID")} Poin
            </p>
          </div>

          {item.description && (
            <p className="break-words text-sm leading-7 text-muted-foreground sm:text-base">
              {item.description}
            </p>
          )}

          <button
            type="button"
            onClick={() => onRedeem(item)}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-(--shadow-pop) transition-colors hover:bg-primary/90"
          >
            Tukar Poin
          </button>
        </div>
      </section>
    </div>
  );
}

function InsufficientPointsDialog({
  data,
  onClose,
}: {
  data: { item: MenuItem; availablePoint: number } | null;
  onClose: () => void;
}) {
  if (!data) return null;

  const requiredPoint = data.item.points_required;
  const shortage = Math.max(0, requiredPoint - data.availablePoint);

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="insufficient-points-title"
        aria-describedby="insufficient-points-description"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md cursor-default overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-(--shadow-pop)"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pesan poin tidak cukup"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-primary shadow-(--shadow-pop)">
          <Coins className="h-8 w-8" />
        </div>
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Poin Belum Cukup
        </p>
        <h2 id="insufficient-points-title" className="text-2xl font-black tracking-tight">
          Poin kamu belum cukup
        </h2>
        <p
          id="insufficient-points-description"
          className="mt-2 text-sm leading-6 text-muted-foreground"
        >
          Kamu butuh tambahan poin untuk menukarkan menu{" "}
          <span className="font-extrabold text-foreground">{data.item.name}</span>.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="text-xs font-black uppercase text-muted-foreground">Poin Kamu</p>
            <p className="mt-1 text-lg font-black text-foreground">
              {data.availablePoint.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="text-xs font-black uppercase text-muted-foreground">Dibutuhkan</p>
            <p className="mt-1 text-lg font-black text-primary">
              {requiredPoint.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-extrabold text-destructive">
          Kurang {shortage.toLocaleString("id-ID")} poin lagi
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-(--shadow-pop) transition-colors hover:bg-primary/90"
        >
          Mengerti
        </button>
      </section>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-soft)"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-1 flex-col p-3 sm:p-6">
            <Skeleton className="mb-3 h-4 w-3/4 sm:h-6" />
            <Skeleton className="mb-2 h-3 w-full sm:h-4" />
            <Skeleton className="mb-4 h-3 w-2/3 sm:mb-5 sm:h-4" />
            <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <Skeleton className="h-6 w-24 sm:h-8 sm:w-28" />
              <Skeleton className="h-8 w-full rounded-full sm:h-10 sm:w-20" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
