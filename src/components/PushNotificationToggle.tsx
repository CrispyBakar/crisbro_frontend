import { Bell, BellOff } from "lucide-react";
import {
  useDisablePush,
  useEnablePush,
  usePushStatus,
} from "@/hooks/use-push-notification";
import type { PushStatus } from "@/lib/push";

const DESCRIPTIONS: Record<PushStatus, string> = {
  on: "Aktif di perangkat ini",
  off: "Dapatkan info poin & promo terbaru",
  denied: "Diblokir. Izinkan notifikasi di pengaturan situs browser",
  "needs-install": "Di iPhone, tambahkan Crisbro ke Home Screen dulu",
  unsupported: "Browser ini belum mendukung notifikasi",
};

type PushNotificationToggleProps = {
  // Teks saat notifikasi belum aktif; staf admin menerima info referral, bukan promo
  offDescription?: string;
};

const PushNotificationToggle = ({
  offDescription,
}: PushNotificationToggleProps) => {
  const { data: status } = usePushStatus();
  const enable = useEnablePush();
  const disable = useDisablePush();

  const isOn = status === "on";
  const canToggle = status === "on" || status === "off";
  const isPending = enable.isPending || disable.isPending;
  const error = enable.error ?? disable.error;
  const Icon = isOn ? Bell : BellOff;

  const handleToggle = () => {
    if (isOn) {
      disable.mutate();
      return;
    }
    // Wajib dipanggil langsung di handler klik, bukan setelah await
    enable.mutate(Notification.requestPermission());
  };

  return (
    <section className="mt-4 rounded-2xl border border-chocolate/10 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon
          size={20}
          strokeWidth={1.75}
          className="shrink-0 text-chocolate"
        />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-chocolate">Notifikasi</p>
          <p className="text-sm text-muted">
            {!status
              ? "Memeriksa…"
              : status === "off" && offDescription
                ? offDescription
                : DESCRIPTIONS[status]}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Notifikasi"
          disabled={!canToggle || isPending}
          onClick={handleToggle}
          className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isOn ? "bg-success" : "bg-border"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${isOn ? "translate-x-5" : ""}`}
          />
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-berry-red">{error.message}</p>}
    </section>
  );
};

export default PushNotificationToggle;
