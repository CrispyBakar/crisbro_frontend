import { useState } from "react";
import { ArrowUpRight, Bell, Ticket } from "lucide-react";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import FilterPill from "@/components/FilterPill";
import NotificationCardSkeleton from "@/components/NotificationCardSkeleton";
import StateMessage from "@/components/StateMessage";
import { usePageTitle } from "@/hooks/use-page-title";
import { usePushUserBroadcasts } from "@/hooks/use-push-notification";
import type { PushBroadcast } from "@/services/push";

type NotificationFilter = "all" | "today";

const isToday = (date: string, today: Date) => {
  const createdAt = new Date(date);
  return (
    createdAt.getFullYear() === today.getFullYear() &&
    createdAt.getMonth() === today.getMonth() &&
    createdAt.getDate() === today.getDate()
  );
};

const formatTime = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const isVoucherNotification = (notification: PushBroadcast) =>
  `${notification.title} ${notification.body}`
    .toLowerCase()
    .includes("voucher");

const NotificationCard = ({
  notification,
}: {
  notification: PushBroadcast;
}) => {
  const isVoucher = isVoucherNotification(notification);

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunshine-yellow/35 text-chocolate">
        {isVoucher ? (
          <Ticket size={19} strokeWidth={2.5} />
        ) : (
          <Bell size={19} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-extrabold leading-none tracking-wide text-muted">
            {isVoucher ? "VOUCHER" : "NOTIFIKASI"}
          </p>
        </div>

        <h2 className="mt-2 text-sm font-extrabold leading-tight text-chocolate">
          {notification.title}
        </h2>
        <p className="mt-1 text-xs leading-[1.4] text-muted">
          {notification.body}
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <time
            dateTime={notification.created_at}
            className="text-[10px] leading-none text-muted"
          >
            {formatTime(notification.created_at)}
          </time>
          {notification.url && (
            <a
              href={notification.url}
              className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-extrabold leading-none text-chocolate"
            >
              {isVoucher ? "Lihat voucher" : "Lihat selengkapnya"}
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

const CustomerNotificationPage = () => {
  usePageTitle("Notifikasi");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const {
    data: notifications,
    isPending,
    isError,
    error,
    refetch,
  } = usePushUserBroadcasts();

  const renderContent = () => {
    if (isPending) {
      return (
        <div
          role="status"
          aria-label="Memuat notifikasi"
          className="flex animate-pulse flex-col gap-3"
        >
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
        </div>
      );
    }

    if (isError) {
      return (
        <StateMessage
          icon={Bell}
          title="Notifikasi gagal dimuat"
          description={error.message}
          actionLabel="Coba lagi"
          onAction={() => refetch()}
        />
      );
    }

    const today = new Date();
    const todayNotifications = notifications.filter((notification) =>
      isToday(notification.created_at, today),
    );
    const earlierNotifications = notifications.filter(
      (notification) => !isToday(notification.created_at, today),
    );
    const visibleNotifications =
      filter === "today" ? todayNotifications : notifications;

    if (notifications.length === 0) {
      return (
        <StateMessage
          icon={Bell}
          title="Belum ada notifikasi"
          description="Notifikasi akan muncul di sini."
        />
      );
    }

    return (
      <>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <FilterPill
            label="Semua"
            count={notifications.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterPill
            label="Hari ini"
            count={todayNotifications.length}
            active={filter === "today"}
            onClick={() => setFilter("today")}
          />
        </div>

        {filter === "all" && todayNotifications.length > 0 && (
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between px-2">
              <h2 className="text-xs font-extrabold tracking-wider text-chocolate">
                Hari ini
              </h2>
              <p className="text-xs font-extrabold tracking-wider text-chocolate">
                {today.getDate()}{" "}
                {today.toLocaleString("id-ID", { month: "long" })}
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {todayNotifications.map((notification) => (
                <li key={notification.push_broadcast_id}>
                  <NotificationCard notification={notification} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {filter === "all" && earlierNotifications.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-3 px-2 text-xs font-extrabold tracking-wider text-chocolate">
              Sebelumnya
            </h2>
            <ul className="flex flex-col gap-3">
              {earlierNotifications.map((notification) => (
                <li key={notification.push_broadcast_id}>
                  <NotificationCard notification={notification} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {filter === "today" && (
          <div className="mt-5">
            {todayNotifications.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {visibleNotifications.map((notification) => (
                  <li key={notification.push_broadcast_id}>
                    <NotificationCard notification={notification} />
                  </li>
                ))}
              </ul>
            ) : (
              <StateMessage
                icon={Bell}
                title="Belum ada notifikasi hari ini"
                description="Notifikasi terbaru akan muncul di sini."
              />
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader title="Notifikasi" />
      <div className="mt-3">{renderContent()}</div>
    </div>
  );
};

export default CustomerNotificationPage;
