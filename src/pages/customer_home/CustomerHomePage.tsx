import crisbarLogo from "@/assets/logo-crisbar-spotlight.png";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useRewardMenus } from "@/hooks/use-loyalty-products";
import BannerSlider from "./BannerSlider";
import HomeOutlets from "./HomeOutlets";
import HomeRewards from "./HomeRewards";
import CustomerMemberCard from "@/components/CustomerMemberCard";

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

      <CustomerMemberCard
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
