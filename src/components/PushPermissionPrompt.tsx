import { useState } from "react";
import { Bell, LoaderCircle, X } from "lucide-react";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEnablePush, usePushStatus } from "@/hooks/use-push-notification";
import { isPushPromptDue, markPushPromptDismissed } from "@/lib/push-prompt";

const STAFF_ROLES = ["admin", "marketing"];

type PushPermissionCardProps = {
  userId: string;
  description: string;
  // Posisi kartu: customer di atas bottom nav, admin di pojok kanan bawah
  positionClassName: string;
};

const PushPermissionCard = ({
  userId,
  description,
  positionClassName,
}: PushPermissionCardProps) => {
  const enable = useEnablePush();
  const [isOpen, setIsOpen] = useState<boolean>(() => isPushPromptDue(userId));

  if (!isOpen) return null;

  const dismiss = () => {
    markPushPromptDismissed(userId);
    setIsOpen(false);
  };

  // Wajib dipanggil langsung di handler klik, bukan setelah await. Prompt izin
  // bawaan browser tidak boleh dipanggil otomatis saat halaman dibuka:
  // Safari/Firefox menolaknya dan Chrome menyembunyikannya bila tanpa klik.
  const allow = () => enable.mutate(Notification.requestPermission());

  return (
    <div className={positionClassName}>
      <section
        role="dialog"
        aria-labelledby="push-prompt-title"
        className="relative rounded-2xl border border-chocolate/10 bg-white px-4 py-4 shadow-lg"
      >
        <button
          type="button"
          onClick={dismiss}
          disabled={enable.isPending}
          aria-label="Tutup"
          className="absolute top-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-chocolate/5 disabled:cursor-not-allowed"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-berry-red/10 text-berry-red">
            <Bell size={20} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="push-prompt-title"
              className="text-base font-bold text-chocolate"
            >
              Aktifkan notifikasi?
            </h2>
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          </div>
        </div>

        {enable.error && (
          <p role="alert" className="mt-2 text-sm text-berry-red">
            {enable.error.message}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            disabled={enable.isPending}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full text-sm font-bold text-muted transition-colors hover:bg-chocolate/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Nanti saja
          </button>
          <button
            type="button"
            onClick={allow}
            disabled={enable.isPending}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-berry-red text-sm font-bold text-white transition-colors hover:bg-berry-red/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enable.isPending && (
              <LoaderCircle size={16} className="animate-spin" />
            )}
            Izinkan
          </button>
        </div>
      </section>
    </div>
  );
};

// Ajakan mengaktifkan notifikasi untuk customer yang login. Muncul saat
// aplikasi dibuka selama notifikasi belum aktif; bila ditutup, baru muncul
// lagi setelah 7 hari. Setelah aktif atau diblokir, status berubah dan kartu
// hilang dengan sendirinya.
const PushPermissionPrompt = () => {
  const { data: user } = useCustomerProfile();
  const { data: status } = usePushStatus();

  if (!user || user.role !== "customer" || status !== "off") return null;

  return (
    // key: akun lain yang login di perangkat yang sama dihitung ulang dari awal
    <PushPermissionCard
      key={user.user_id}
      userId={user.user_id}
      description="Dapatkan info poin & promo terbaru langsung di perangkat kamu."
      positionClassName="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-mobile px-4"
    />
  );
};

// Versi dashboard admin: admin & marketing diajak mengaktifkan notifikasi
// supaya tahu ada referral baru yang perlu divalidasi.
export const AdminPushPermissionPrompt = () => {
  const { data: user } = useCurrentUser();
  const { data: status } = usePushStatus();

  if (!user || !STAFF_ROLES.includes(user.role) || status !== "off")
    return null;

  return (
    <PushPermissionCard
      key={user.user_id}
      userId={user.user_id}
      description="Dapatkan pemberitahuan saat ada referral baru yang perlu divalidasi."
      positionClassName="fixed right-0 bottom-0 z-30 w-full max-w-sm p-4 sm:p-6"
    />
  );
};

export default PushPermissionPrompt;
