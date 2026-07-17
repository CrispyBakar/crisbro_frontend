import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, Sparkles, LogOut, Gift } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { apiProfile, getToken, getUser, logout, type AuthUser } from "@/lib/auth";
import coinMembershipCard from "@/assets/coin-membership-card.png";
import membershipCardBg from "@/assets/membership-card-bg.png";

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

type PointHistoryItem = {
  id: number;
  points_change: number;
  type: string;
  description: string | null;
  created_at: string;
  redemption: {
    id: number;
    status: string;
    reward: {
      name: string;
      image_url: string | null;
    };
  } | null;
};

type PointHistoryResponse = {
  total: number;
  items: PointHistoryItem[];
};

function isPointHistoryItem(value: unknown): value is PointHistoryItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<PointHistoryItem>;
  return (
    Number.isFinite(item.id) &&
    Number.isFinite(item.points_change) &&
    typeof item.type === "string" &&
    (item.description === null ||
      item.description === undefined ||
      typeof item.description === "string") &&
    typeof item.created_at === "string"
  );
}

function isPointHistoryResponse(value: unknown): value is PointHistoryResponse {
  if (!value || typeof value !== "object") return false;

  const response = value as Partial<PointHistoryResponse>;
  return (
    Number.isFinite(response.total) &&
    Array.isArray(response.items) &&
    response.items.every(isPointHistoryItem)
  );
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);
  const [pointHistoryTotal, setPointHistoryTotal] = useState(0);
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
    setUser(cachedUser);

    async function refreshProfile({ silent = false } = {}) {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [freshUser, freshPointHistory] = await Promise.all([
          apiProfile(),
          fetchPointHistory(),
        ]);

        if (cancelled) return;

        setUser(freshUser);
        setPointHistory(freshPointHistory.items);
        setPointHistoryTotal(freshPointHistory.total);
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
        <DashboardSkeleton />
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
          className="relative overflow-hidden rounded-[2rem] bg-[#fddd0d] bg-cover bg-center p-7 text-[#251608] shadow-(--shadow-soft) md:p-9"
          style={{ backgroundImage: `url(${membershipCardBg})` }}
        >
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center">
                <img
                  src={coinMembershipCard}
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 object-contain drop-shadow-[0_3px_6px_rgba(37,22,8,0.28)]"
                />
              </div>
              <div>
                <p className="text-xs font-extrabold leading-none">Crisbar</p>
                <p className="text-xs font-bold text-[#3a240e]">Member Card</p>
              </div>
            </div>
            <span className="rounded-full bg-[#251608]/35 px-3 py-1 text-xs font-bold tracking-wide text-white">
              Cribro Club
            </span>
          </div>

          <div className="relative">
            <p className="text-sm font-bold text-[#3a240e]">Poin Tersedia</p>
            <p className="text-6xl md:text-7xl font-black tracking-tight mt-1">
              {formattedPoints}{" "}
              <span className="text-2xl font-black tracking-wide text-[#3a240e]">Poin</span>
            </p>
          </div>

          {/* Progress */}
          <div className="relative mt-7">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-bold inline-flex items-center gap-1.5">
                <Gift className="h-4 w-4" /> Reward berikutnya
              </span>
              <span className="font-bold text-[#3a240e]">
                {formattedPoints} / {REWARD_THRESHOLD.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/45 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs mt-2 font-semibold text-[#3a240e]">
              {remaining > 0
                ? `Tinggal ${remaining.toLocaleString("id-ID")} poin lagi untuk dapat reward gratis 🎁`
                : "Yeay! Kamu sudah bisa tukar reward 🎉"}
            </p>
          </div>

          <div className="relative flex items-center justify-between mt-7 text-xs">
            <div>
              <p className="uppercase tracking-wide font-black text-[#3a240e]">Total Poin</p>
              <p className="font-bold text-sm">{totalPoint.toLocaleString("id-ID")} Poin</p>
            </div>
            <div className="text-right">
              <p className="uppercase tracking-wide font-black text-[#3a240e]">Nomor Telepon</p>
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

        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold">Riwayat Poin</h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
              {pointHistoryTotal.toLocaleString("id-ID")} transaksi
            </span>
          </div>
          {pointHistory.length === 0 ? (
            <div className="rounded-3xl bg-card border border-border shadow-(--shadow-soft) p-8 text-center text-muted-foreground">
              <p className="font-semibold">Belum ada riwayat transaksi poin.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-soft)">
              <div className="overflow-x-auto">
                <table className="w-full min-w-140 border-collapse text-left">
                  <thead className="bg-secondary text-secondary-foreground">
                    <tr>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-wide">
                        Tanggal
                      </th>
                      <th className="px-5 py-4 text-xs font-black uppercase tracking-wide">
                        Nama Reward
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide">
                        Poin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointHistory.map((history) => {
                      const isRedeem = history.points_change < 0;
                      const rewardName =
                        history.redemption?.reward.name ??
                        history.description ??
                        (isRedeem ? "Penukaran reward" : "Penambahan poin");
                      const formattedPoint = `${history.points_change > 0 ? "+" : ""}${history.points_change.toLocaleString("id-ID")}`;
                      const PointIcon = isRedeem ? ArrowDownLeft : ArrowUpRight;

                      return (
                        <tr key={history.id} className="border-b border-border last:border-b-0">
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-muted-foreground">
                            {formatHistoryDate(history.created_at)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-foreground">{rewardName}</p>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span
                              className={`inline-flex items-center justify-end gap-2 rounded-full px-3 py-1 text-sm font-black ${
                                isRedeem
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              <PointIcon className="h-4 w-4" />
                              {formattedPoint}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

async function fetchPointHistory() {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan");

  const response = await fetch(apiUrl("/points/history"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Gagal mengambil riwayat poin";
    throw new Error(message);
  }

  if (!isPointHistoryResponse(data)) {
    throw new Error("Format riwayat poin tidak valid");
  }

  return data;
}

function DashboardSkeleton() {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Skeleton className="mb-3 h-4 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-(--shadow-soft)">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="mb-3 h-5 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="mb-4 h-14 w-52" />
        <Skeleton className="mb-6 h-4 w-full rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
    </section>
  );
}
