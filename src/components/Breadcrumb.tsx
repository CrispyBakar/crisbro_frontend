import { ChevronRight, House } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router";

// Label ramah untuk tiap segmen route — segmen lain otomatis di-humanize
const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  locations: "Locations",
  customers: "Customers",
  transactions: "Transactions",
  products: "Loyalty Products",
  promos: "Promos",
  integrations: "Integration",
  referrals: "Referrals",
  settings: "Settings",
  helpdesk: "Help Desk",
};

type BreadcrumbItem = {
  label: string;
  icon?: LucideIcon;
  to?: string; // tanpa `to` = halaman aktif (bukan link)
};

const humanize = (segment: string) =>
  segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;

    // Root "admin" berfungsi sebagai home → arahkan ke dashboard
    const to =
      index === 0
        ? "/admin/dashboard"
        : isLast
          ? undefined
          : `/${segments.slice(0, index + 1).join("/")}`;

    return {
      label: ROUTE_LABELS[segment] ?? humanize(segment),
      icon: index === 0 ? House : undefined,
      to,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="w-full">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight size={14} className="text-gray-400" />
              )}

              {item.to ? (
                <Link
                  to={item.to}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-muted transition-colors hover:bg-gray-50 hover:text-chocolate"
                >
                  {Icon && <Icon size={14} />}
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 font-bold text-chocolate"
                >
                  {Icon && <Icon size={14} />}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
