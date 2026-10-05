import { Gift, House, MapPin, Settings, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { useCustomerProfile } from "@/hooks/use-customer-profile";

type NavItem = {
  icon: LucideIcon;
  label: string;
  endpoint: string;
  // Hanya tampil setelah login
  authOnly?: boolean;
};

const navItems: NavItem[] = [
  { icon: House, label: "Home", endpoint: "/" },
  { icon: Gift, label: "Menu Redeem", endpoint: "/redeem" },
  { icon: Ticket, label: "Voucherku", endpoint: "/vouchers" },
  { icon: MapPin, label: "Lokasi", endpoint: "/locations" },
  { icon: Settings, label: "Settings", endpoint: "/settings", authOnly: true },
];

const CustomerBottomNav = () => {
  const { data: user } = useCustomerProfile();
  const visibleItems = navItems.filter((item) => !item.authOnly || user);

  return (
    // fixed + max-w-mobile mengikuti lebar kolom mobile di CustomerRootLayout
    <nav className="fixed bottom-0 inset-x-0 z-20 mx-auto flex w-full max-w-mobile rounded-t-3xl border-t border-border bg-white px-1 min-[390px]:px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {visibleItems.map((item) => {
        const Icon = item.icon;

        // Item aktif mengikuti route: pill krem dengan ikon & teks merah.
        // Di layar sempit lebar item mengikuti panjang label (flex-auto)
        // supaya "Menu Redeem" tidak menabrak item sebelahnya.
        return (
          <NavLink
            to={item.endpoint}
            key={item.label}
            end
            className={({ isActive }) =>
              `flex min-w-0 flex-auto min-[390px]:flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-2 text-[10px] min-[390px]:text-[11px] font-bold leading-none whitespace-nowrap transition-colors ${
                isActive ? "bg-input text-berry-red" : "text-muted"
              }`
            }
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default CustomerBottomNav;
