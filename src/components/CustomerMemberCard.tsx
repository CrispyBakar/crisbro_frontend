import crisbarMark from "@/assets/logo_c_crisbar.png";
import type { CustomerUser } from "@/services/auth";
import type { LoyaltyProduct } from "@/services/loyalty-products";
import { formatPhone } from "@/lib/phone";
import { Link } from "react-router";
import { ArrowUpRight, MoveUpRight } from "lucide-react";

interface CustomerMemberCardProps {
  user: CustomerUser | null | undefined;
  // Semua menu reward urut dari poin terkecil; undefined selama belum termuat
  menus: LoyaltyProduct[] | undefined;
  isMenusError: boolean;
}

const memberStatLabelClass =
  "text-xs font-bold tracking-wider text-chocolate/70";

const CustomerMemberCard = ({
  user,
  menus,
  isMenusError,
}: CustomerMemberCardProps) => {
  const points = user?.customer?.available_point ?? 0;
  // const totalPoints = user?.customer?.total_point ?? 0;

  // Reward termurah yang poinnya belum cukup; null bila semua reward sudah bisa ditukar
  const nextReward = menus?.find((menu) => menu.point_needed > points) ?? null;
  const progress = nextReward
    ? points / nextReward.point_needed
    : menus?.length
      ? 1
      : 0;

  const nextRewardText = () => {
    if (nextReward) {
      const missingPoints = nextReward.point_needed - points;
      return `${missingPoints.toLocaleString("id-ID")} poin lagi, dapat ${nextReward.product_name}!`;
    }
    if (menus?.length) return "Poin kamu cukup untuk menukar semua reward";
    if (menus) return "Belum ada reward yang bisa ditukar";
    if (isMenusError) return "Reward berikutnya belum bisa dimuat";
    return "Memuat reward berikutnya...";
  };
  return (
    <section className="relative overflow-hidden rounded-3xl bg-sunshine-yellow px-4 py-6 text-chocolate">
      {/* Watermark logo C; brightness-0 + invert mengubah logo kuning jadi putih */}
      <img
        src={crisbarMark}
        alt=""
        className="pointer-events-none absolute top-1/2 -right-10 h-[130%] max-w-none -translate-y-1/2 opacity-30 brightness-0 invert"
      />

      <div className="relative">
        {user ? (
          <>
            <div className="flex justify-between items-center gap-3">
              <p className="text-xs font-bold">Poin Tersedia</p>
              <div className="shrink-0 flex items-center rounded-full bg-chocolate px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-sunshine-yellow">
                <img
                  src={crisbarMark}
                  alt="crisbar mark"
                  className="h-4 -mr-0.5 -mt-0.5"
                />
                <span className="mt-1">risbro! Insider</span>
              </div>
            </div>

            <p className="text-6xl font-extrabold leading-none">
              {points.toLocaleString("id-ID")}
              <span className="ml-1.5 text-base">Poin</span>
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-3 text-xs font-bold">
              <p className="mt-1.5 text-xs font-semibold">{nextRewardText()}</p>
              {nextReward && (
                <p>
                  {points.toLocaleString("id-ID")}/
                  {nextReward.point_needed.toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <div
              role="progressbar"
              aria-label="Progres menuju reward berikutnya"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/60"
            >
              <div
                className="h-full rounded-full bg-chocolate"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center-safe">
              <p className="mt-2 text-xs font-semibold text-chocolate">
                {user?.customer?.name.toUpperCase()} ·{" "}
                {formatPhone(user?.phone as string)}
              </p>
              <Link
                to={"/settings/point-history"}
                className="mt-2 flex place-items-start gap-1"
              >
                <span className="text-xs text-chocolate font-bold">
                  Riwayat
                </span>
                <ArrowUpRight size={10} />
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Guest: poin disembunyikan sampai login */}
            <h2 className="mt-2.5 text-lg font-extrabold leading-tight">
              Kumpulkan poin, tukar reward
            </h2>
            <p className="mt-1 text-sm text-chocolate/80">
              Masuk untuk melihat poin kamu dan menukarnya dengan menu Crisbar.
            </p>

            <div className="mt-3 flex gap-3">
              <Link
                to="/login"
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-chocolate text-sm font-bold text-sunshine-yellow"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="flex h-10 flex-1 items-center justify-center rounded-full border border-chocolate/40 text-sm font-bold text-chocolate"
              >
                Daftar
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CustomerMemberCard;
