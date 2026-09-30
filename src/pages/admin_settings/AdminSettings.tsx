import HeaderMain from "@/components/HeaderMain";
import { User2 } from "lucide-react";
import { Link } from "react-router";

const AdminSettings = () => {
  return (
    <main className="w-full space-y-6">
      <HeaderMain title={"Settings"} subtitle={""} />

      <div className="px-4 py-6 sm:py-10 rounded-2xl bg-white border border-gray-100 shadow-sm w-full">
        <div className="w-full space-y-12">
          {/* Akun Pengguna */}
          <Link to={"/admin/settings/profile"}>
            <h3 className="text-xl font-bold mb-3">Akun Pengguna</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="p-2 rounded-2xl bg-white border border-gray-200 flex gap-2 cursor-pointer">
                <User2 className="shrink-0" />
                <div className="max-w-md">
                  <p className="text-base font-bold">Informasi Profil</p>
                  <span className="text-sm">
                    Informasi mengenai email, username dan akun dibuat. Menu ini
                    dapat mengupdate informasi akun anda.
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AdminSettings;
