import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowLeft, Camera } from "lucide-react";
import { getUser, type AuthUser } from "@/lib/auth";

// State yang dikirim dari cart saat checkout berhasil
export type EstimasiState = {
  items: { name: string; image: string; price: number; quantity: number }[];
  totalPoints: number;
  pointsBefore: number;
};

export const Route = createFileRoute("/estimasi")({
  head: () => ({
    meta: [
      { title: "Estimasi Penukaran — Crisbar" },
      { name: "description", content: "Tiket estimasi penukaran reward poin Crisbar kamu." },
    ],
  }),
  component: EstimasiPage,
});

function EstimasiPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [state, setState] = useState<EstimasiState | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);

    // Ambil data estimasi dari sessionStorage (dikirim oleh cart.tsx)
    const raw = sessionStorage.getItem("crisbar_estimasi");
    if (!raw) {
      navigate({ to: "/menu" });
      return;
    }
    setState(JSON.parse(raw));
  }, [navigate]);

  if (!user || !state) {
    return (
      <main className="px-4 mt-10 pb-16">
        <EstimasiSkeleton />
      </main>
    );
  }

  const pointsAfter = state.pointsBefore - state.totalPoints;
  const customerName = user.customer?.name ?? "Sahabat Crispy";
  const phoneNumber = user.phone_number ?? "-";
  const initials = customerName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <main className="px-4 mt-10 pb-16">
      {/* Back button */}
      <div className="mx-auto max-w-md mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <p className="text-sm font-semibold text-muted-foreground">Kembali ke Dashboard</p>
      </div>

      {/* Ticket Card */}
      <section className="mx-auto max-w-md">
        <div className="rounded-[2rem] overflow-hidden border border-border shadow-(--shadow-soft) bg-card">
          {/* Header merah */}
          <div
            className="px-6 py-5 flex items-center gap-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.52 0.23 27) 0%, oklch(0.42 0.2 15) 100%)",
            }}
          >
            <div className="h-11 w-11 rounded-2xl bg-secondary grid place-items-center font-black text-xl text-secondary-foreground shrink-0">
              C
            </div>
            <div className="text-primary-foreground">
              <p className="text-lg font-extrabold leading-none">Crisbar Rewards</p>
              <p className="text-xs opacity-80 mt-0.5">Ayam Crispy Bakar</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pt-5 pb-4">
            <h1 className="text-2xl font-black text-center tracking-tight mb-5">
              Estimasi Penukaran
            </h1>

            {/* Info member */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-full bg-secondary grid place-items-center font-bold text-sm text-secondary-foreground shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-extrabold text-base leading-tight">{customerName}</p>
                <p className="text-sm text-muted-foreground">{phoneNumber}</p>
              </div>
            </div>

            {/* Garis dashed */}
            <div className="border-t-2 border-dashed border-border my-4" />

            {/* Menu item(s) */}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
              Menu ditukar
            </p>
            <div className="space-y-3 mb-5">
              {state.items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-background"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-xl object-scale-down bg-secondary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-base truncate">{item.name}</p>
                    <p className="text-sm text-primary font-bold">
                      {item.price} Poin / porsi
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          × {item.quantity}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-black text-base shrink-0">
                    {(item.price * item.quantity).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>

            {/* Ringkasan poin */}
            <div className="rounded-2xl bg-secondary/50 p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Poin saat ini</span>
                <span className="font-bold">{state.pointsBefore.toLocaleString("id-ID")} Poin</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Poin pengurangan</span>
                <span className="font-bold text-primary">
                  −{state.totalPoints.toLocaleString("id-ID")} Poin
                </span>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between">
                <span className="font-extrabold text-base">Poin tersisa</span>
                <span className="font-black text-xl">
                  {pointsAfter.toLocaleString("id-ID")} Poin
                </span>
              </div>
            </div>
          </div>

          {/* Punch hole divider */}
          <div className="relative flex items-center px-3 my-1">
            <div className="h-5 w-5 rounded-full bg-background border border-border shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-border mx-1" />
            <div className="h-5 w-5 rounded-full bg-background border border-border shrink-0" />
          </div>

          {/* Footer kuning */}
          <div className="bg-secondary px-6 py-4 flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-bold text-secondary-foreground text-center">
              Silahkan screenshot dan tukar di outlet Crisbar terdekat
            </p>
          </div>
        </div>

        {/* Screenshot hint */}
        <div className="mt-5 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Camera className="h-4 w-4" />
          <span>Screenshot halaman ini sebagai bukti penukaran</span>
        </div>

        {/* Action */}
        <Button
          asChild
          className="mt-5 w-full rounded-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-(--shadow-pop)"
        >
          <Link to="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </section>
    </main>
  );
}

function EstimasiSkeleton() {
  return (
    <>
      <div className="mx-auto max-w-md mb-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <section className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-(--shadow-soft)">
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <div>
                <Skeleton className="mb-2 h-5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="px-6 pt-5 pb-4">
            <Skeleton className="mx-auto mb-5 h-8 w-56" />
            <div className="mb-5 flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div>
                <Skeleton className="mb-2 h-5 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="my-4 border-t-2 border-dashed border-border" />
            <Skeleton className="mb-3 h-4 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
                >
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-5 h-28 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    </>
  );
}
