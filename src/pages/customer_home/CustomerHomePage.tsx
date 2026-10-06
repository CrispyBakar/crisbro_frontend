import crisbarLogo from "@/assets/logo-crisbar-spotlight.png";
import crisbarMark from "@/assets/logo_c_crisbar.png";
import crisbarCoin from "@/assets/crisbar_coin.png";
import { Gift } from "lucide-react";
import { Link } from "react-router";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useRewardMenus } from "@/hooks/use-loyalty-products";
import { formatPhone } from "@/lib/phone";
import type { CustomerUser } from "@/services/auth";
import type { LoyaltyProduct } from "@/services/loyalty-products";
import BannerSlider from "./BannerSlider";
import HomeOutlets from "./HomeOutlets";
import HomeRewards from "./HomeRewards";

const memberStatLabelClass =
  "text-xs font-bold tracking-wider text-chocolate/70";

type MemberCardProps = {
  user: CustomerUser | null | undefined;
  // Semua menu reward urut dari poin terkecil; undefined selama belum termuat
  menus: LoyaltyProduct[] | undefined;
  isMenusError: boolean;
};

const MemberCard = ({ user, menus, isMenusError }: MemberCardProps) => {
  const points = user?.customer?.available_point ?? 0;
  const totalPoints = user?.customer?.total_point ?? 0;

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
      return `Tinggal ${missingPoints.toLocaleString("id-ID")} poin lagi untuk ${nextReward.product_name}`;
    }
    if (menus?.length) return "Poin kamu cukup untuk menukar semua reward";
    if (menus) return "Belum ada reward yang bisa ditukar";
    if (isMenusError) return "Reward berikutnya belum bisa dimuat";
    return "Memuat reward berikutnya...";
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-sunshine-yellow p-4 text-chocolate">
      {/* Watermark logo C; brightness-0 + invert mengubah logo kuning jadi putih */}
      <img
        src={crisbarMark}
        alt=""
        className="pointer-events-none absolute top-1/2 -right-10 h-[130%] max-w-none -translate-y-1/2 opacity-30 brightness-0 invert"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={crisbarCoin}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full ring-2 ring-white/50"
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-tight">Crisbar</p>
              <p className="text-xs font-semibold leading-tight text-chocolate/70">
                Member Card
              </p>
            </div>
          </div>
          <p className="shrink-0 rounded-full bg-chocolate px-2.5 py-1 text-xs font-bold tracking-wider text-sunshine-yellow">
            CRISBRO MEMBER
          </p>
        </div>

        {user ? (
          <>
            <p className="mt-2.5 text-xs font-bold">Poin Tersedia</p>
            <p className="text-4xl font-extrabold leading-none">
              {points.toLocaleString("id-ID")}
              <span className="ml-1.5 text-base">Poin</span>
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-3 text-xs font-bold">
              <p className="flex items-center gap-1.5">
                <Gift size={14} />
                Reward berikutnya
              </p>
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
            <p className="mt-1.5 text-xs font-semibold">{nextRewardText()}</p>

            <dl className="mt-2.5 flex justify-between gap-3 border-t border-chocolate/15 pt-2">
              <div>
                <dt className={memberStatLabelClass}>TOTAL POIN</dt>
                <dd className="text-sm font-extrabold">
                  {totalPoints.toLocaleString("id-ID")} Poin
                </dd>
              </div>
              <div className="text-right">
                <dt className={memberStatLabelClass}>NOMOR TELEPON</dt>
                <dd className="text-sm font-extrabold">
                  {user.phone ? formatPhone(user.phone) : "-"}
                </dd>
              </div>
            </dl>
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

const CustomerHomePage = () => {
  const { data: user } = useCustomerProfile();
  const rewardMenus = useRewardMenus();
  const firstName = user?.customer?.name.trim().split(/\s+/)[0];

  return (
    <div className="flex w-full flex-col gap-6 px-4 pt-5">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md bg-white">
          <img src={crisbarLogo} alt="Crisbar" className="h-8 w-8" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {user ? "Selamat datang kembali" : "Selamat datang di"}
          </p>
          <h1 className="truncate text-lg font-extrabold leading-tight text-chocolate">
            {user ? `Halo, ${firstName || "Crisbro"}` : "Crisbro Member"}
          </h1>
        </div>
      </header>

      <MemberCard
        user={user}
        menus={rewardMenus.data}
        isMenusError={rewardMenus.isError}
      />

      <BannerSlider />

      <HomeRewards />

      <HomeOutlets registeredOutletId={user?.customer?.runchise_location_id} />
    </div>
  );
};

export default CustomerHomePage;
