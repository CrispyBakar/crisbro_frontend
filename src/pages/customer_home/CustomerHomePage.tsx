import crisbarLogo from "@/assets/logo-crisbar-spotlight.png";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useRewardMenus } from "@/hooks/use-loyalty-products";
import BannerSlider from "./BannerSlider";
import HomeOutlets from "./HomeOutlets";
import HomeRewards from "./HomeRewards";
import CustomerMemberCard from "@/components/CustomerMemberCard";
import { Bell } from "lucide-react";

const CustomerHomePage = () => {
  const { data: user } = useCustomerProfile();
  const rewardMenus = useRewardMenus();
  const firstName = user?.customer?.name.trim().split(/\s+/)[0];

  return (
    <div className="flex w-full flex-col gap-6 px-4 pt-5">
      <header className="flex justify-between items-center gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center justify-start">
            <h3 className="font-extrabold text-3xl text-chocolate word-spacing-0.10em">
              CRISBRO
            </h3>
            <div className="px-2 py-1 text-xs uppercase font-bold text-sunshine-yellow bg-chocolate rounded-lg">
              Member
            </div>
          </div>
          <div>
            <span>Hai, {firstName || "Crisbro"}. Yuk, jajan lagi!</span>
          </div>
        </div>
        <div className="relative p-3 rounded-full flex bg-amber-200">
          <div className="absolute h-2 w-2 rounded-full bg-berry-red right-2.5" />
          <Bell />
        </div>
      </header>

      <CustomerMemberCard
        user={user}
        menus={rewardMenus.data}
        isMenusError={rewardMenus.isError}
      />

      <HomeRewards />

      <BannerSlider />

      <HomeOutlets registeredOutletId={user?.customer?.runchise_location_id} />
    </div>
  );
};

export default CustomerHomePage;
