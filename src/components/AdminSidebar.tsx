import {
  CircleQuestionMark,
  CreditCard,
  HandCoins,
  LayoutGrid,
  Link2,
  LogOut,
  Map,
  Settings,
  ShoppingCart,
  TicketPercent,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { useNavigate } from "react-router";

type SidebarItem = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: string;
  logout?: boolean;
  endpoint: string;
};

// TODO: ganti item aktif berdasarkan route (NavLink) saat routing siap
const sidebarSections: { label: string; items: SidebarItem[] }[] = [
  {
    label: "Menu",
    items: [
      {
        icon: LayoutGrid,
        label: "Dashboard",
        endpoint: "/admin/dashboard",
      },
      {
        icon: Map,
        label: "Locations",
        badge: "8",
        endpoint: "/admin/locations",
      },
      { icon: Users, label: "Customers", endpoint: "/admin/customers" },
      // {
      //   icon: CreditCard,
      //   label: "Transactions",
      //   endpoint: "/admin/transactions",
      // },
    ],
  },
  {
    label: "Products",
    items: [
      {
        icon: ShoppingCart,
        label: "Loyalty Products",
        badge: "99+",
        endpoint: "/admin/products",
      },
      { icon: TicketPercent, label: "Promos", endpoint: "/admin/promos" },
      { icon: Link2, label: "Integration", endpoint: "/admin/integrations" },
      { icon: HandCoins, label: "Referrals", endpoint: "/admin/referrals" },
    ],
  },
  {
    label: "General",
    items: [
      { icon: Settings, label: "Settings", endpoint: "/admin/settings" },
      {
        icon: CircleQuestionMark,
        label: "Help Desk",
        endpoint: "/admin/helpdesk",
      },
      { icon: LogOut, label: "Log out", logout: true, endpoint: "#" },
    ],
  },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  const logout = useMutation({
    mutationFn: () =>
      fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "x-csrf-protection": "1",
        },
      }),
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.removeQueries();
      navigate("/admin/login", { replace: true });
    },
  });

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-4xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Sidebar */}
      <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        {sidebarSections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1.5">
            <p className="px-3 text-xs font-bold uppercase tracking-widest text-muted">
              {section.label}
            </p>

            {section.items.map((item) => {
              const Icon = item.icon;

              // Item aktif: pill oranye, ikon putih di lingkaran merah
              if (item.active) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl bg-berry-red px-5 py-3"
                  >
                    <Icon size={16} color="white" />
                    <span className="text-sm font-bold text-white">
                      {item.label}
                    </span>
                  </button>
                );
              }

              // Log out: pill abu-abu, teks & ikon merah
              if (item.logout) {
                return (
                  <button
                    onClick={() => logout.mutate()}
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5 cursor-pointer"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-white text-berry-red shadow-xs">
                      <Icon size={16} />
                    </span>
                    <span className="text-sm font-bold text-berry-red">
                      {item.label}
                    </span>
                  </button>
                );
              }

              // Item biasa
              return (
                <Link
                  to={{
                    pathname: item.endpoint,
                  }}
                  key={item.label}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <Icon size={16} />
                  <span className="text-sm font-semibold text-chocolate">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-berry-red px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
