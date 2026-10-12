import { useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  Coins,
  Copy,
  Gift,
  Store,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import crisbarMark from "@/assets/logo_c_crisbar.png";
import productImageFallback from "@/assets/ProductImageFallback.png";
import ConfirmDialog from "@/components/ConfirmDialog";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import LoadingCircle from "@/components/LoadingCircle";
import StateMessage from "@/components/StateMessage";
import VoucherOutlets from "@/components/VoucherOutlets";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useRewardMenus } from "@/hooks/use-loyalty-products";
import { usePageTitle } from "@/hooks/use-page-title";
import { useRedeemLoyaltyVoucher } from "@/hooks/use-redeem-transactions";
import { formatShortCalendarDate } from "@/lib/date";
import type { LoyaltyProduct } from "@/services/loyalty-products";
import type { RedeemTransaction } from "@/services/redeem-transactions";

const sectionTitleClass = "text-xs font-extrabold tracking-wider text-muted";

const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="flex items-center gap-3 text-sm text-muted">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-input text-berry-red">
          <Icon size={18} />
        </span>
        {label}
      </dt>
      <dd className="text-right text-sm font-bold text-chocolate">
        {children}
      </dd>
    </div>
  );
};

type RedeemSuccessProps = {
  result: RedeemTransaction;
  // Kosong bila menunya sudah tidak ada di daftar saat penukaran selesai
  menuName?: string;
};

const RedeemSuccess = ({ result, menuName }: RedeemSuccessProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.promo_code);
      setIsCopied(true);
    } catch {
      // Clipboard diblokir browser: kode tetap bisa diblok dan disalin manual
    }
  };

  return (
    <>
      <div className="flex flex-col items-center pt-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={24} strokeWidth={2.5} />
        </span>
        <h2 className="mt-4 text-xl font-extrabold leading-tight text-chocolate">
          Penukaran berhasil
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {result.points_spent.toLocaleString("id-ID")} poin ditukar dengan
          voucher{menuName ? ` ${menuName}` : ""}. Sisa poin kamu{" "}
          {result.remaining_points.toLocaleString("id-ID")}.
        </p>
      </div>

      {/* Bentuk kupon: sisi kiri-kanan bergerigi (lihat coupon di global.css) */}
      <section className="coupon mt-5">
        <div className="coupon-edges rounded-sm bg-white px-5 py-5 text-center">
          <p className={sectionTitleClass}>KODE VOUCHER</p>
          <p
            // select-all: sekali tap memblok seluruh kode untuk disalin manual
            className="mt-1.5 font-mono text-2xl font-bold tracking-widest break-all text-chocolate select-all"
          >
            {result.promo_code}
          </p>

          <div className="mt-4 border-t-2 border-dashed border-peach pt-4">
            <p className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-input px-3 py-1.5 text-xs font-bold text-chocolate">
              <Store size={14} className="shrink-0 text-berry-red" />
              Perlihatkan kode ini ke kasir saat memesan
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-berry-red text-sm font-bold text-white transition-colors hover:bg-berry-red/90"
            >
              {isCopied ? <Check size={16} /> : <Copy size={16} />}
              {isCopied ? "Kode tersalin" : "Salin kode"}
            </button>
          </div>
        </div>
      </section>

      <p className="mt-4 text-center text-xs text-muted">
        Voucher ini tersimpan di Voucherku dan bisa dibuka lagi kapan saja.
      </p>
      <Link
        to={`/vouchers/${result.redeem_transaction_id}`}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-chocolate/10 bg-white text-sm font-bold text-chocolate transition-colors hover:bg-chocolate/5"
      >
        Lihat di Voucherku
      </Link>
    </>
  );
};

type RedeemDetailProps = {
  menu: LoyaltyProduct;
  // Poin customer saat ini
  points: number;
  onRedeem: () => void;
};

const RedeemDetail = ({ menu, points, onRedeem }: RedeemDetailProps) => {
  const promo = menu.promo;
  const terms = promo?.terms_conditions.trim();
  const missingPoints = menu.point_needed - points;

  return (
    <>
      {/* Panel kuning senada detail voucher dan kartu member di beranda */}
      <section className="relative overflow-hidden rounded-2xl bg-sunshine-yellow px-5 py-6 text-center">
        {/* Watermark logo C; brightness-0 + invert mengubah logo kuning jadi putih */}
        <img
          src={crisbarMark}
          alt=""
          className="pointer-events-none absolute top-1/2 -right-14 h-[120%] max-w-none -translate-y-1/2 opacity-30 brightness-0 invert"
        />

        <div className="relative flex flex-col items-center">
          <img
            src={menu.product_image_url ?? productImageFallback}
            alt=""
            decoding="async"
            onError={(event) => {
              // Lepas handler dulu supaya tidak berulang kalau fallback ikut gagal
              event.currentTarget.onerror = null;
              event.currentTarget.src = productImageFallback;
            }}
            className="h-32 w-32 rounded-2xl object-cover shadow-md ring-4 ring-white"
          />
          <p className="mt-4 text-xs font-extrabold tracking-wider text-chocolate/70">
            MENU YANG DITUKAR
          </p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight text-chocolate">
            {menu.product_name}
          </h2>
          {menu.product_description && (
            <p className="mt-1.5 text-sm leading-relaxed text-chocolate/80">
              {menu.product_description}
            </p>
          )}
          <p className="mt-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-berry-red">
            <Coins size={16} />
            {menu.point_needed.toLocaleString("id-ID")} Poin
          </p>
        </div>
      </section>

      <dl className="mt-5 divide-y divide-chocolate/10 rounded-2xl border border-chocolate/10 bg-white px-4">
        <DetailRow icon={Wallet} label="Poin kamu">
          {points.toLocaleString("id-ID")} Poin
        </DetailRow>
        {promo?.start_date && (
          <DetailRow icon={CalendarDays} label="Berlaku mulai">
            {formatShortCalendarDate(promo.start_date)}
          </DetailRow>
        )}
        {promo?.end_date && (
          <DetailRow icon={CalendarCheck} label="Berlaku sampai">
            {formatShortCalendarDate(promo.end_date)}
          </DetailRow>
        )}
      </dl>

      {promo && <VoucherOutlets locationIds={promo.location_ids} />}

      <section className="mt-6">
        <h2 className={sectionTitleClass}>SYARAT DAN KETENTUAN</h2>
        {terms ? (
          // pre-line: baris baru yang diketik admin tetap tampil
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {terms}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Belum ada syarat dan ketentuan untuk menu ini.
          </p>
        )}
      </section>

      {!menu.is_voucher_available ? (
        // Belum ada promo, atau semua kode vouchernya sudah diklaim
        <button
          type="button"
          disabled
          className="mt-6 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-input text-sm font-bold text-muted"
        >
          Voucher Habis
        </button>
      ) : missingPoints > 0 ? (
        <p className="mt-6 rounded-full bg-input px-4 py-3 text-center text-sm font-bold text-muted">
          Kurang {missingPoints.toLocaleString("id-ID")} poin untuk menukar menu
          ini
        </p>
      ) : (
        <button
          type="button"
          onClick={onRedeem}
          className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-berry-red text-sm font-bold text-white shadow-md transition-colors hover:bg-berry-red/90"
        >
          Tukar Poin
        </button>
      )}
    </>
  );
};

const CustomerRedeemDetailPage = () => {
  usePageTitle("Detail Menu Redeem");

  const { loyalty_product_id: loyaltyProductId } = useParams();
  const navigate = useNavigate();
  const { data: user } = useCustomerProfile();
  const rewardMenus = useRewardMenus();
  const redeem = useRedeemLoyaltyVoucher();
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // Belum ada endpoint detail, jadi menu dicari dari daftar menu redeem
  const menu = rewardMenus.data?.find(
    (item) => item.loyalty_product_id === loyaltyProductId,
  );
  const points = user?.customer?.available_point ?? 0;

  // Kembali ke filter tempat menu ini berada. Setelah penukaran, poin dan stok
  // sudah berubah, jadi cukup kembali ke daftar utama.
  const isRedeemable =
    !menu || (menu.is_voucher_available && menu.point_needed <= points);
  const listUrl =
    redeem.isSuccess || isRedeemable ? "/redeem" : "/redeem?filter=semua";

  const renderContent = () => {
    // Dicek paling awal: kode voucher harus tetap tampil walau daftar menu yang
    // dimuat ulang setelah penukaran gagal atau tidak lagi memuat menu ini
    if (redeem.isSuccess) {
      return (
        <RedeemSuccess result={redeem.data} menuName={menu?.product_name} />
      );
    }

    if (rewardMenus.isPending) {
      return <LoadingCircle className="py-20" />;
    }

    if (rewardMenus.isError) {
      return (
        <StateMessage
          icon={Gift}
          title="Menu redeem gagal dimuat"
          description={rewardMenus.error.message}
          actionLabel="Coba lagi"
          onAction={() => rewardMenus.refetch()}
        />
      );
    }

    if (!menu) {
      return (
        <StateMessage
          icon={Gift}
          title="Menu tidak ditemukan"
          description="Menu ini sudah tidak ada di daftar menu redeem."
          actionLabel="Lihat semua menu"
          onAction={() => navigate("/redeem?filter=semua")}
        />
      );
    }

    return (
      <RedeemDetail
        menu={menu}
        points={points}
        onRedeem={() => setIsConfirmOpen(true)}
      />
    );
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader
        title="Detail Menu Redeem"
        backTo={listUrl}
        backLabel="Kembali ke Menu Redeem"
      />
      <div className="mt-3">{renderContent()}</div>

      {isConfirmOpen && menu && (
        <ConfirmDialog
          title="Tukar poin sekarang?"
          message={
            <>
              {menu.point_needed.toLocaleString("id-ID")} poin kamu akan ditukar
              dengan voucher{" "}
              <strong className="text-chocolate">{menu.product_name}</strong>.
              Poin yang sudah ditukar tidak bisa dikembalikan.
            </>
          }
          icon={Gift}
          confirmLabel="Ya, tukar"
          isPending={redeem.isPending}
          error={redeem.error?.message}
          onConfirm={() =>
            redeem.mutate(
              { loyalty_product_id: menu.loyalty_product_id },
              { onSuccess: () => setIsConfirmOpen(false) },
            )
          }
          onCancel={() => {
            setIsConfirmOpen(false);
            redeem.reset();
          }}
        />
      )}
    </div>
  );
};

export default CustomerRedeemDetailPage;
