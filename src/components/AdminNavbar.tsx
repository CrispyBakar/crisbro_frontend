import { useCurrentUser } from "@/hooks/use-current-user";
import crisbarCircleLogo from "../assets/crisbar_circle_logo.png";
import { Bell, CircleQuestionMark, Menu } from "lucide-react";
import AdminUserMenu from "./AdminUserMenu";

const getInitials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "-";

type AdminNavbarProps = {
  // Membuka sidebar (drawer) di layar kecil
  onMenuClick?: () => void;
};

const AdminNavbar = ({ onMenuClick }: AdminNavbarProps) => {
  const { data: user } = useCurrentUser();

  return (
    <nav className="w-full rounded-4xl bg-white py-2 px-2 shadow-xs border border-gray-100 sm:py-3 sm:px-4">
      <div className="flex justify-between items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Buka menu"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gray-50 text-chocolate transition-colors hover:bg-gray-100 cursor-pointer lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="bg-gray-50 rounded-full p-1 flex min-w-0 justify-start items-center gap-2 sm:p-2">
            <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden sm:w-11 sm:h-11">
              <img
                src={crisbarCircleLogo}
                alt="Logo Crisbar"
                className="w-full h-full object-cover scale-126" // atau scale-150 sesuai kebutuhan
              />
            </div>
            <div className="mr-2 hidden truncate text-base font-semibold sm:block">
              Crispy Bakar
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-2 sm:gap-3">
          <div className="bg-gray-50 rounded-full p-1.5 hidden justify-start items-center gap-1.5 sm:flex">
            <div className="relative bg-white p-3 rounded-full">
              <div className="absolute top-2 right-2 w-2 h-2  rounded-full bg-berry-red z-20" />
              <Bell size={18} />
            </div>
            <div className="p-3 rounded-full">
              <CircleQuestionMark size={18} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-full p-1 flex justify-start items-center gap-1.5 sm:p-1.5">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-r from-sunshine-yellow via-orange to-berry-red text-lg font-bold text-white sm:h-11 sm:w-11 sm:text-3xl">
                {getInitials(user?.username as string)}
              </div>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">Crisbro Studio</p>
              <p className="text-xs font-light">{user?.role}</p>
            </div>
            <AdminUserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
