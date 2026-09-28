import { useCurrentUser } from "@/hooks/use-current-user";
import crisbarCircleLogo from "../assets/crisbar_circle_logo.png";
import { Bell, CircleQuestionMark } from "lucide-react";
import AdminUserMenu from "./AdminUserMenu";

const getInitials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "-";

const AdminNavbar = () => {
  const { data: user } = useCurrentUser();

  return (
    <nav className="w-full rounded-4xl bg-white py-3 px-4 shadow-xs border border-gray-100">
      <div className="flex justify-between items-center">
        <div className="bg-gray-50 rounded-full py-2 px-2 flex justify-start items-center gap-2">
          <div className="w-11 h-11 rounded-full overflow-hidden">
            <img
              src={crisbarCircleLogo}
              alt="Logo Crisbar"
              className="w-full h-full object-cover scale-126" // atau scale-150 sesuai kebutuhan
            />
          </div>
          <div className="mr-2 text-base font-semibold">Crispy Bakar</div>
        </div>

        <div className="flex justify-end items-center gap-3">
          <div className="bg-gray-50 rounded-full p-1.5 flex justify-start items-center gap-1.5">
            <div className="relative bg-white p-3 rounded-full">
              <div className="absolute top-2 right-2 w-2 h-2  rounded-full bg-berry-red z-20" />
              <Bell size={18} />
            </div>
            <div className="p-3 rounded-full">
              <CircleQuestionMark size={18} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-full p-1.5 flex justify-start items-center gap-1.5">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-r from-sunshine-yellow via-orange to-berry-red text-3xl font-bold text-white">
                {getInitials(user?.username as string)}
              </div>
            </div>
            <div>
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
