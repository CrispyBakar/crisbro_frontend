import { ChevronRight, Ticket } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import FilterPill from "@/components/FilterPill";
import StateMessage from "@/components/StateMessage";
import { usePageTitle } from "@/hooks/use-page-title";
import { useMyVouchers } from "@/hooks/use-redeem-transactions";
import { formatShortDate } from "@/lib/date";
import {
  getVoucherMenu,
  getVoucherName,
  getVoucherState,
} from "@/lib/vouchers";
import type { RedeemedVoucher } from "@/services/redeem-transactions";
import VoucherMenuImage from "./VoucherMenuImage";

// "used" memuat semua voucher yang sudah tidak aktif: terpakai maupun yang
// kodenya dinonaktifkan
type Filter = "active" | "used";

// Di layar sempit foto diperkecil supaya kode voucher tetap muat satu baris
const menuImageClass =
  "h-12 w-12 shrink-0 rounded-xl min-[390px]:h-14 min-[390px]:w-14";

const getVoucherCaption = (voucher: RedeemedVoucher) => {
  const state = getVoucherState(voucher);
  if (state === "inactive") return "Sudah tidak berlaku";
  if (state === "used" && voucher.promo_code.last_usage) {
    return `Dipakai ${formatShortDate(voucher.promo_code.last_usage)}`;
  }
  return `Ditukar ${formatShortDate(voucher.redeemed_at)}`;
};

const VoucherCard = ({ voucher }: { voucher: RedeemedVoucher }) => {
  const isActive = getVoucherState(voucher) === "active";

  return (
    // Bentuk kupon: sisi kiri-kanan bergerigi (lihat coupon di global.css)
    <article className="coupon">
      <Link
        to={`/vouchers/${voucher.redeem_transaction_id}`}
        className="coupon-edges flex items-stretch rounded-sm bg-white"
      >
        <div
          className={`flex min-w-0 flex-1 items-center gap-3 py-3 pr-3 pl-4 ${isActive ? "" : "opacity-60"}`}
        >
          <VoucherMenuImage
            src={getVoucherMenu(voucher)?.image_url ?? null}
            className={`${menuImageClass} object-cover`}
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-extrabold leading-tight text-chocolate">
              {getVoucherName(voucher)}
            </h3>
            <p
              className={`mt-1 truncate font-mono text-sm font-bold leading-tight tracking-wide ${
                isActive ? "text-chocolate" : "text-muted line-through"
              }`}
            >
              {voucher.promo_code.code}
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              {getVoucherCaption(voucher)}
            </p>
          </div>
        </div>

        {/* Garis putus-putus: sobekan kupon di depan tombol detail */}
        <span className="flex shrink-0 items-center gap-0.5 border-l-2 border-dashed border-chocolate/15 pr-4 pl-3 text-xs font-bold text-chocolate">
          Detail
          <ChevronRight size={14} />
        </span>
      </Link>
    </article>
  );
};

const VoucherListSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Memuat voucher"
      className="flex animate-pulse flex-col gap-3"
    >
      {[0, 1, 2].map((item) => (
        <div key={item} className="coupon">
          <div className="coupon-edges flex items-center gap-3 rounded-sm bg-white px-4 py-3">
            <div className={`${menuImageClass} bg-input`} />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3.5 w-3/4 rounded-full bg-input" />
              <div className="h-3.5 w-1/2 rounded-full bg-input" />
              <div className="h-3 w-2/5 rounded-full bg-input" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CustomerVouchersPage = () => {
  usePageTitle("Voucherku");

  // Filter disimpan di URL supaya bertahan saat refresh dan tombol back
  const [searchParams, setSearchParams] = useSearchParams();
  const filter: Filter =
    searchParams.get("status") === "terpakai" ? "used" : "active";
  const changeFilter = (next: Filter) => {
    setSearchParams(next === "used" ? { status: "terpakai" } : {}, {
      replace: true,
    });
  };

  const navigate = useNavigate();
  const vouchersQuery = useMyVouchers();

  const renderContent = () => {
    if (vouchersQuery.isPending) {
      return <VoucherListSkeleton />;
    }

    if (vouchersQuery.isError) {
      return (
        <StateMessage
          icon={Ticket}
          title="Voucher gagal dimuat"
          description={vouchersQuery.error.message}
          actionLabel="Coba lagi"
          onAction={() => vouchersQuery.refetch()}
        />
      );
    }

    const vouchers = vouchersQuery.data;

    if (vouchers.length === 0) {
      return (
        <StateMessage
          icon={Ticket}
          title="Belum ada voucher"
          description="Tukar poin kamu dengan menu Crisbar, lalu vouchernya muncul di sini."
          actionLabel="Lihat menu redeem"
          onAction={() => navigate("/redeem")}
        />
      );
    }

    const activeVouchers = vouchers.filter(
      (voucher) => getVoucherState(voucher) === "active",
    );
    const usedVouchers = vouchers.filter(
      (voucher) => getVoucherState(voucher) !== "active",
    );
    const visibleVouchers = filter === "used" ? usedVouchers : activeVouchers;

    return (
      <>
        <div className="flex flex-wrap gap-2">
          <FilterPill
            label="Aktif"
            count={activeVouchers.length}
            active={filter === "active"}
            onClick={() => changeFilter("active")}
          />
          <FilterPill
            label="Terpakai"
            count={usedVouchers.length}
            active={filter === "used"}
            onClick={() => changeFilter("used")}
          />
        </div>

        <div className="mt-5">
          {visibleVouchers.length === 0 ? (
            filter === "active" ? (
              <StateMessage
                icon={Ticket}
                title="Tidak ada voucher aktif"
                description="Semua voucher kamu sudah terpakai. Tukar poin lagi untuk mendapatkan voucher baru."
                actionLabel="Lihat menu redeem"
                onAction={() => navigate("/redeem")}
              />
            ) : (
              <StateMessage
                icon={Ticket}
                title="Belum ada voucher terpakai"
                description="Voucher yang sudah kamu pakai akan muncul di sini."
              />
            )
          ) : (
            <ul className="flex flex-col gap-3">
              {visibleVouchers.map((voucher) => (
                <li key={voucher.redeem_transaction_id}>
                  <VoucherCard voucher={voucher} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader title="Voucherku" />
      <div className="mt-3">{renderContent()}</div>
    </div>
  );
};

export default CustomerVouchersPage;
