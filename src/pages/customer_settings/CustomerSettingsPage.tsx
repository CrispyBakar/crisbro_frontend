import { useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  History,
  KeyRound,
  LogOut,
  UserPlus,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import ConfirmDialog from "@/components/ConfirmDialog";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useCustomerLogout } from "@/hooks/use-login";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatPhone } from "@/lib/phone";

type SettingsItem = {
  icon: LucideIcon;
  label: string;
  endpoint: string;
};

const settingsItems: SettingsItem[] = [
  { icon: UserRound, label: "Profil Saya", endpoint: "/settings/profile" },
  { icon: KeyRound, label: "Ubah Password", endpoint: "/settings/password" },
  { icon: UserPlus, label: "Referral", endpoint: "/settings/referral" },
  {
    icon: History,
    label: "Riwayat Point",
    endpoint: "/settings/point-history",
  },
];

const rowClass =
  "flex h-14 w-full items-center gap-3 px-4 text-base font-semibold transition-colors";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const CustomerSettingsPage = () => {
  usePageTitle("Settings");

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] =
    useState<boolean>(false);

  const { data: user } = useCustomerProfile();
  const logout = useCustomerLogout();
  const name = user?.customer?.name.trim() || "Crisbro Member";

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader title="Settings" />

      <section className="mt-5 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-chocolate text-lg font-extrabold text-sunshine-yellow">
          {getInitials(name)}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xl font-extrabold leading-tight text-chocolate">
              {name}
            </p>
            {/* Verifikasi akun customer = aktivasi nomor telepon lewat WhatsApp */}
            {user?.phone_verified && (
              <BadgeCheck
                size={22}
                role="img"
                aria-label="Akun terverifikasi"
                className="shrink-0 fill-success stroke-white"
              />
            )}
          </div>
          {user?.phone && (
            <p className="mt-1 text-sm text-muted">{formatPhone(user.phone)}</p>
          )}
        </div>
      </section>

      <nav
        aria-label="Pengaturan akun"
        className="mt-7 overflow-hidden rounded-2xl border border-chocolate/10 bg-white"
      >
        <ul className="divide-y divide-chocolate/10">
          {settingsItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.endpoint}>
                <Link
                  to={item.endpoint}
                  className={`${rowClass} text-chocolate hover:bg-chocolate/5`}
                >
                  <Icon size={20} strokeWidth={1.75} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ChevronRight size={18} className="shrink-0 text-muted/50" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setIsLogoutConfirmOpen(true)}
        className={`${rowClass} mt-4 cursor-pointer rounded-2xl border border-chocolate/10 bg-white text-berry-red hover:bg-berry-red/5`}
      >
        <LogOut size={20} strokeWidth={1.75} className="shrink-0" />
        Log out
      </button>

      {isLogoutConfirmOpen && (
        <ConfirmDialog
          title="Keluar dari akun?"
          message="Kamu perlu masuk lagi untuk melihat poin dan menukar reward."
          icon={LogOut}
          variant="danger"
          confirmLabel="Ya, log out"
          isPending={logout.isPending}
          error={logout.isError ? "Gagal log out, coba lagi." : undefined}
          onConfirm={() => logout.mutate()}
          onCancel={() => {
            setIsLogoutConfirmOpen(false);
            logout.reset();
          }}
        />
      )}
    </div>
  );
};

export default CustomerSettingsPage;
