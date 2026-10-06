import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  LoaderCircle,
  Minus,
} from "lucide-react";
import crisbarCoin from "@/assets/crisbar_coin.png";
import crisbarMark from "@/assets/logo_c_crisbar.png";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import StateMessage from "@/components/StateMessage";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useMyPointHistory } from "@/hooks/use-customers";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatShortDateTime } from "@/lib/date";
import type { CustomerPointHistory } from "@/services/customers";

const POINT_TYPE_LABELS: Record<string, string> = {
  earned: "Poin didapat",
  redeemed: "Poin ditukar",
  manual_adjustment: "Penyesuaian poin",
  adjustment_point_from_expired: "Poin kedaluwarsa",
};

const sectionTitleClass = "text-xs font-extrabold tracking-wider text-muted";

// Sama dengan tampilan admin: earned menambah, redeemed mengurangi, tipe lain
// mengikuti tanda angkanya
const signedPoint = (history: CustomerPointHistory) => {
  if (history.point == null) return null;
  if (history.point_type === "earned") return Math.abs(history.point);
  if (history.point_type === "redeemed") return -Math.abs(history.point);
  return history.point;
};

const HistoryRow = ({ history }: { history: CustomerPointHistory }) => {
  const point = signedPoint(history);
  const isGain = point != null && point > 0;
  const isLoss = point != null && point < 0;
  const Icon = isGain ? ArrowDownLeft : isLoss ? ArrowUpRight : Minus;

  const timestamp = history.formatted_created_at ?? history.issued_at_time;
  const title =
    (history.point_type && POINT_TYPE_LABELS[history.point_type]) ||
    history.point_type_description ||
    "Perubahan poin";

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isGain
            ? "bg-success/10 text-success"
            : isLoss
              ? "bg-berry-red/10 text-berry-red"
              : "bg-input text-muted"
        }`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-chocolate">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {timestamp
            ? formatShortDateTime(timestamp)
            : "Tanggal tidak tercatat"}
          {history.sales_no && ` · No. ${history.sales_no}`}
        </p>
      </div>
      <p
        className={`shrink-0 text-sm font-extrabold ${
          isGain ? "text-success" : isLoss ? "text-berry-red" : "text-muted"
        }`}
      >
        {point == null
          ? "-"
          : `${isGain ? "+" : isLoss ? "−" : ""}${Math.abs(point).toLocaleString("id-ID")}`}
      </p>
    </li>
  );
};

const HistoryListSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Memuat riwayat poin"
      className="animate-pulse divide-y divide-chocolate/10 rounded-2xl border border-chocolate/10 bg-white px-4"
    >
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-3 py-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-input" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-1/2 rounded-full bg-input" />
            <div className="h-3 w-2/3 rounded-full bg-input" />
          </div>
          <div className="h-4 w-8 rounded-full bg-input" />
        </div>
      ))}
    </div>
  );
};

const CustomerPointHistoryPage = () => {
  usePageTitle("History Point");

  const { data: user } = useCustomerProfile();
  const historyQuery = useMyPointHistory();

  const availablePoint = user?.customer?.available_point ?? 0;
  const totalPoint = user?.customer?.total_point ?? 0;

  const renderContent = () => {
    if (historyQuery.isPending) {
      return <HistoryListSkeleton />;
    }

    // Gagal memuat halaman berikutnya tidak menyembunyikan riwayat yang sudah tampil
    if (historyQuery.isError && !historyQuery.data) {
      return (
        <StateMessage
          icon={History}
          title="Riwayat poin gagal dimuat"
          description={historyQuery.error.message}
          actionLabel="Coba lagi"
          onAction={() => historyQuery.refetch()}
        />
      );
    }

    const histories = historyQuery.data.pages.flatMap((page) => page.data);
    const total = historyQuery.data.pages[0].meta.total;

    if (histories.length === 0) {
      return (
        <StateMessage
          icon={History}
          title="Belum ada riwayat poin"
          description="Poin yang kamu dapat dan tukar akan tercatat di sini."
        />
      );
    }

    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <h2 className={sectionTitleClass}>RIWAYAT</h2>
          <p className="shrink-0 text-xs text-muted">
            {total.toLocaleString("id-ID")} aktivitas
          </p>
        </div>

        <ul className="mt-2 divide-y divide-chocolate/10 rounded-2xl border border-chocolate/10 bg-white px-4">
          {histories.map((history) => (
            <HistoryRow
              key={history.customer_point_history}
              history={history}
            />
          ))}
        </ul>

        {historyQuery.isFetchNextPageError && (
          <p role="alert" className="mt-3 text-center text-xs text-berry-red">
            Riwayat berikutnya gagal dimuat. Coba lagi.
          </p>
        )}

        {historyQuery.hasNextPage && (
          <button
            type="button"
            onClick={() => historyQuery.fetchNextPage()}
            disabled={historyQuery.isFetchingNextPage}
            className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-chocolate/15 bg-white text-sm font-bold text-chocolate transition-colors hover:bg-chocolate/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {historyQuery.isFetchingNextPage && (
              <LoaderCircle size={16} className="animate-spin" />
            )}
            {historyQuery.isFetchingNextPage
              ? "Memuat..."
              : "Muat lebih banyak"}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader
        title="Riwayat Point"
        backTo="/settings"
        backLabel="Kembali ke Settings"
      />

      {/* Panel kuning senada kartu member di beranda */}
      <section className="relative mt-3 overflow-hidden rounded-2xl bg-sunshine-yellow px-5 py-5 text-chocolate">
        {/* Watermark logo C; brightness-0 + invert mengubah logo kuning jadi putih */}
        <img
          src={crisbarMark}
          alt=""
          className="pointer-events-none absolute top-1/2 -right-10 h-[150%] max-w-none -translate-y-1/2 opacity-30 brightness-0 invert"
        />

        <div className="relative flex items-center gap-3">
          <img
            src={crisbarCoin}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full ring-2 ring-white/50"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold">Poin Tersedia</p>
            <p className="text-3xl font-extrabold leading-none">
              {availablePoint.toLocaleString("id-ID")}
              <span className="ml-1.5 text-base">Poin</span>
            </p>
          </div>
        </div>
        <p className="relative mt-4 border-t border-chocolate/15 pt-3 text-xs font-bold text-chocolate/70">
          TOTAL POIN{" "}
          <span className="ml-1 text-sm font-extrabold text-chocolate">
            {totalPoint.toLocaleString("id-ID")} Poin
          </span>
        </p>
      </section>

      <div className="mt-5">{renderContent()}</div>
    </div>
  );
};

export default CustomerPointHistoryPage;
