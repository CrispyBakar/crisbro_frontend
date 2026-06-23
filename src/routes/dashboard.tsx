import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Gift } from "lucide-react";
import { apiProfile, getUser, logout, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Crisbar" },
      { name: "description", content: "Kartu member digital & riwayat poin Crisbar kamu." },
    ],
  }),
  component: DashboardPage,
});

const REWARD_THRESHOLD = 2000;

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const cachedUser = getUser();
    if (!cachedUser) {
      navigate({ to: "/login" });
      return;
    }

    async function refreshProfile({ silent = false } = {}) {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const freshUser = await apiProfile();

        if (cancelled) return;

        setUser(freshUser);
        setError("");
      } catch (err: unknown) {
        if (cancelled) return;

        if (err instanceof Error && err.message.toLowerCase().includes("token")) {
          logout();
          navigate({ to: "/login" });
          return;
        }

        setError(err instanceof Error ? err.message : "Gagal memperbarui data profil");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    function handleWindowFocus() {
      refreshProfile({ silent: true });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshProfile({ silent: true });
      }
    }

    refreshProfile();
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate]);

  if (loading) {
    return (
      <main className="px-4 mt-10">
        <section className="mx-auto max-w-3xl">
          <p className="text-center text-muted-foreground font-semibold">Memuat dashboard...</p>
        </section>
      </main>
    );
  }

  if (!user) return null;

  const customerName = user.customer?.name ?? "Sahabat Crispy";
  const availablePoint = user.customer?.customer_point?.available_point ?? 0;
  const totalPoint = user.customer?.customer_point?.total_point ?? 0;
  const progress = Math.min(100, Math.round((availablePoint / REWARD_THRESHOLD) * 100));
  const remaining = Math.max(0, REWARD_THRESHOLD - availablePoint);
  const formattedPoints = availablePoint.toLocaleString("id-ID");

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-3xl">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-muted-foreground">Selamat datang kembali,</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{customerName} 👋</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-full font-bold border-2 bg-card hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}
        {refreshing && !error && (
          <div className="mb-5 rounded-2xl bg-secondary/70 px-4 py-3 text-sm font-bold text-secondary-foreground">
            Memperbarui data poin...
          </div>
        )}

        {/* Membership Card */}
        <div
          className="relative rounded-[2rem] p-7 md:p-9 text-primary-foreground shadow-(--shadow-soft) overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.62 0.22 27) 0%, oklch(0.55 0.2 15) 60%, oklch(0.7 0.18 45) 100%)",
          }}
        >
          <div
            aria-hidden
            className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/15 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          />
          <div aria-hidden className="absolute top-6 right-6 text-3xl opacity-50">
            ✨
          </div>
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center font-black text-lg">
                C
              </div>
              <div>
                <p className="text-lg font-extrabold leading-none">Crisbar</p>
                <p className="text-xs opacity-80">Member Card</p>
              </div>
            </div>
            <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Crispy Club
            </span>
          </div>

          <div className="relative">
            <p className="text-sm font-bold opacity-80">Poin Tersedia</p>
            <p className="text-6xl md:text-7xl font-black tracking-tight mt-1">
              {formattedPoints} <span className="text-2xl font-bold opacity-80">Poin</span>
            </p>
          </div>

          {/* Progress */}
          <div className="relative mt-7">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-bold inline-flex items-center gap-1.5">
                <Gift className="h-4 w-4" /> Reward berikutnya
              </span>
              <span className="opacity-90 font-semibold">
                {formattedPoints} / {REWARD_THRESHOLD.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs mt-2 opacity-90">
              {remaining > 0
                ? `Tinggal ${remaining.toLocaleString("id-ID")} poin lagi untuk dapat reward gratis 🎁`
                : "Yeay! Kamu sudah bisa tukar reward 🎉"}
            </p>
          </div>

          <div className="relative flex items-center justify-between mt-7 text-xs">
            <div>
              <p className="opacity-70 uppercase tracking-wide font-bold">Total Poin</p>
              <p className="font-bold text-sm">{totalPoint.toLocaleString("id-ID")} Poin</p>
            </div>
            <div className="text-right">
              <p className="opacity-70 uppercase tracking-wide font-bold">Nomor Telepon</p>
              <p className="font-bold text-sm">{user.phone_number ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5">
          <Button
            asChild
            variant="outline"
            className="w-full rounded-full h-12 font-bold border-2 bg-card hover:bg-secondary"
          >
            <Link to="/menu" className="flex w-full items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> Tukar Reward
            </Link>
          </Button>
        </div>

        {/* Info kosong untuk riwayat poin */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold">Riwayat Poin</h2>
          </div>
          <div className="rounded-3xl bg-card border border-border shadow-(--shadow-soft) p-8 text-center text-muted-foreground">
            <p className="font-semibold">Belum ada riwayat transaksi poin.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
