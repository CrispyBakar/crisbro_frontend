import HeaderMain from "@/components/HeaderMain";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { Ad, User2 } from "lucide-react";
import { Link } from "react-router";

const AdminSettings = () => {
  return (
    <main className="w-full space-y-6">
      <HeaderMain title={"Settings"} subtitle={""} />

      <div className="px-4 py-6 sm:py-10 rounded-2xl bg-white border border-gray-100 shadow-sm w-full">
        <div className="w-full space-y-6">
          {/* Akun Pengguna */}
          <h3 className="text-xl font-bold mb-3">Akun Pengguna</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <Link to={"/admin/settings/profile"}>
              <div className="p-2 rounded-2xl bg-white border border-gray-200 flex gap-3 cursor-pointer items-center">
                <User2 className="shrink-0" />
                <div className="max-w-md">
                  <p className="text-base font-bold">Informasi Profil</p>
                  <span className="text-sm text-chocolate">
                    Informasi mengenai email, username dan akun dibuat. Menu ini
                    dapat mengupdate informasi akun anda.
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Akun Pengguna */}
          <h3 className="text-xl font-bold mb-3">System</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <Link to={"/admin/settings/banner"}>
              <div className="p-2 rounded-2xl bg-white border border-gray-200 flex gap-3 cursor-pointer items-center">
                <Ad className="shrink-0" />
                <div className="max-w-md">
                  <p className="text-base font-bold">Customer Banner</p>
                  <span className="text-sm text-chocolate">
                    Atur banner yang tampil pada halaman home customer
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Notifikasi */}
          <div>
            <h3 className="text-xl font-bold mb-3">Notifikasi</h3>
            <div className="max-w-md">
              <PushNotificationToggle offDescription="Dapatkan pemberitahuan referral baru yang perlu divalidasi" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminSettings;
