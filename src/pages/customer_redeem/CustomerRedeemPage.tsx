import { Coins, Gift } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import productImageFallback from "@/assets/ProductImageFallback.png";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import FilterPill from "@/components/FilterPill";
import StateMessage from "@/components/StateMessage";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useRewardMenus } from "@/hooks/use-loyalty-products";
import { usePageTitle } from "@/hooks/use-page-title";
import type { LoyaltyProduct } from "@/services/loyalty-products";

type Filter = "redeemable" | "all";

type RewardCardProps = {
  menu: LoyaltyProduct;
  // Poin customer saat ini; null untuk tamu yang belum login
  points: number | null;
};

const redeemButtonClass =
  "flex h-10 shrink-0 cursor-pointer items-center rounded-full bg-berry-red px-4 text-sm font-bold text-white shadow-md transition-colors hover:bg-berry-red/90";

// Melihat menu boleh tanpa login, tapi menukar poin wajib login
const RewardAction = ({ menu, points }: RewardCardProps) => {
  if (points === null) {
    return (
      <Link to="/login" className={redeemButtonClass}>
        Tukar Poin
      </Link>
    );
  }

  const missingPoints = menu.point_needed - points;
  if (missingPoints > 0) {
    return (
      <p className="shrink-0 rounded-full bg-input px-3 py-1.5 text-xs font-bold text-muted">
        Kurang {missingPoints.toLocaleString("id-ID")} poin
      </p>
    );
  }

  return (
    // Belum ada aksi: backend belum punya endpoint penukaran poin
    <button type="button" className={redeemButtonClass}>
      Tukar Poin
    </button>
  );
};

const RewardCard = ({ menu, points }: RewardCardProps) => {
  return (
    <article className="flex gap-3 rounded-2xl bg-white p-2 shadow-md">
      <img
        src={menu.product_image_url ?? productImageFallback}
        alt=""
        loading="lazy"
        decoding="async"
        onError={(event) => {
          // Lepas handler dulu supaya tidak berulang kalau fallback ikut gagal
          event.currentTarget.onerror = null;
          event.currentTarget.src = productImageFallback;
        }}
        className="aspect-square w-[28%] max-w-28 shrink-0 self-start rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <h3 className="line-clamp-2 text-base font-extrabold leading-tight text-chocolate">
          {menu.product_name}
        </h3>
        {menu.product_description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">
            {menu.product_description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-3">
          <p className="flex items-center gap-1.5">
            <Coins size={18} className="shrink-0 text-berry-red" />
            <span className="text-lg font-extrabold leading-none text-berry-red">
              {menu.point_needed.toLocaleString("id-ID")}
            </span>
            <span className="text-xs font-bold text-muted">Poin</span>
          </p>
          <RewardAction menu={menu} points={points} />
        </div>
      </div>
    </article>
  );
};

type RewardSectionProps = {
  title: string;
  dotClass: string;
  menus: LoyaltyProduct[];
  points: number | null;
};

const RewardSection = ({
  title,
  dotClass,
  menus,
  points,
}: RewardSectionProps) => {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-chocolate">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
          {title}
        </h2>
        <p className="shrink-0 text-xs text-muted">{menus.length} menu</p>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {menus.map((menu) => (
          <li key={menu.loyalty_product_id}>
            <RewardCard menu={menu} points={points} />
          </li>
        ))}
      </ul>
    </section>
  );
};

const RewardListSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Memuat menu redeem"
      className="flex animate-pulse flex-col gap-3"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="flex gap-3 rounded-2xl bg-white p-2 shadow-md"
        >
          <div className="aspect-square w-[28%] max-w-28 shrink-0 rounded-xl bg-input" />
          <div className="flex flex-1 flex-col gap-2 py-1 pr-1">
            <div className="h-4 w-3/4 rounded-full bg-input" />
            <div className="h-3 w-full rounded-full bg-input" />
            <div className="mt-auto h-8 w-1/2 rounded-full bg-input" />
          </div>
        </div>
      ))}
    </div>
  );
};

const CustomerRedeemPage = () => {
  usePageTitle("Menu Redeem");

  // Filter disimpan di URL supaya bertahan saat refresh dan tombol back
  const [searchParams, setSearchParams] = useSearchParams();
  const filter: Filter =
    searchParams.get("filter") === "semua" ? "all" : "redeemable";
  const changeFilter = (next: Filter) => {
    setSearchParams(next === "all" ? { filter: "semua" } : {}, {
      replace: true,
    });
  };

  const { data: user, isPending: isProfilePending } = useCustomerProfile();
  const rewardMenus = useRewardMenus();

  // null untuk tamu: menu tetap tampil, tapi tanpa pengelompokan berdasarkan poin
  const points = user ? (user.customer?.available_point ?? 0) : null;
  const menus = rewardMenus.data ?? [];

  const renderContent = () => {
    if (isProfilePending || rewardMenus.isPending) {
      return <RewardListSkeleton />;
    }

    if (rewardMenus.isError) {
      return (
        <StateMessage
          icon={Gift}
          title="Menu redeem gagal dimuat"
          description={rewardMenus.error.message}
          actionLabel="Coba lagi"
          onAction={() => rewardMenus.refetch()}
        />
      );
    }

    if (menus.length === 0) {
      return (
        <StateMessage
          icon={Gift}
          title="Belum ada menu redeem"
          description="Menu yang bisa ditukar dengan poin akan muncul di sini."
        />
      );
    }

    if (points === null) {
      return (
        <>
          <p className="mb-5 text-sm text-muted">
            Sudah jadi member?{" "}
            <Link to="/login" className="font-semibold text-berry-red">
              Masuk
            </Link>{" "}
            untuk menukar poin kamu.
          </p>
          <RewardSection
            title="SEMUA MENU"
            dotClass="bg-muted/40"
            menus={menus}
            points={null}
          />
        </>
      );
    }

    const redeemableMenus = menus.filter((menu) => menu.point_needed <= points);
    const lockedMenus = menus.filter((menu) => menu.point_needed > points);

    return (
      <>
        <div className="flex flex-wrap gap-2">
          <FilterPill
            label="Bisa Ditukar"
            count={redeemableMenus.length}
            active={filter === "redeemable"}
            onClick={() => changeFilter("redeemable")}
          />
          <FilterPill
            label="Semua"
            count={menus.length}
            active={filter === "all"}
            onClick={() => changeFilter("all")}
          />
        </div>

        <div className="mt-5 flex flex-col gap-6">
          {redeemableMenus.length > 0 && (
            <RewardSection
              title="BISA DITUKAR SEKARANG"
              dotClass="bg-success"
              menus={redeemableMenus}
              points={points}
            />
          )}

          {filter === "all" && lockedMenus.length > 0 && (
            <RewardSection
              title="POIN BELUM CUKUP"
              dotClass="bg-muted/40"
              menus={lockedMenus}
              points={points}
            />
          )}

          {filter === "redeemable" && redeemableMenus.length === 0 && (
            <StateMessage
              icon={Gift}
              title="Poin kamu belum cukup"
              description={`Kamu punya ${points.toLocaleString("id-ID")} poin. Kumpulkan lagi untuk menukar menu pertamamu.`}
              actionLabel="Lihat semua menu"
              onAction={() => changeFilter("all")}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader title="Menu Redeem" />
      <div className="mt-3">{renderContent()}</div>
    </div>
  );
};

export default CustomerRedeemPage;
