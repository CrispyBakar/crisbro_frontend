import { useState } from "react";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  Coins,
  Copy,
  Store,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import crisbarMark from "@/assets/logo_c_crisbar.png";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import LoadingCircle from "@/components/LoadingCircle";
import StateMessage from "@/components/StateMessage";
import VoucherOutlets from "@/components/VoucherOutlets";
import { usePageTitle } from "@/hooks/use-page-title";
import { useMyVoucher } from "@/hooks/use-redeem-transactions";
import { formatShortCalendarDate, formatShortDate } from "@/lib/date";
import {
  VOUCHER_STATE_LABELS,
  getVoucherMenu,
  getVoucherName,
  getVoucherState,
} from "@/lib/vouchers";
import type { RedeemedVoucherDetail } from "@/services/redeem-transactions";
import VoucherMenuImage from "./VoucherMenuImage";

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

const VoucherDetail = ({ voucher }: { voucher: RedeemedVoucherDetail }) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const menu = getVoucherMenu(voucher);
  const state = getVoucherState(voucher);
  const isActive = state === "active";
  const code = voucher.promo_code.code ?? "";
  const usedAt = state === "used" ? voucher.promo_code.last_usage : null;
  const terms = voucher.promo.terms_conditions.trim();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
    } catch {
      // Clipboard diblokir browser: kode tetap bisa diblok dan disalin manual
    }
  };

  return (
    <>
      {/* Panel kuning senada kartu member di beranda; voucher yang sudah tidak aktif tampil pudar */}
      <section
        className={`relative overflow-hidden rounded-2xl px-5 py-6 text-center ${
          isActive ? "bg-sunshine-yellow" : "bg-input"
        }`}
      >
        {/* Watermark logo C; brightness-0 + invert mengubah logo kuning jadi putih */}
        <img
          src={crisbarMark}
          alt=""
          className="pointer-events-none absolute top-1/2 -right-14 h-[120%] max-w-none -translate-y-1/2 opacity-30 brightness-0 invert"
        />

        <div className="relative flex flex-col items-center">
          <VoucherMenuImage
            src={menu?.image_url ?? null}
            className={`h-32 w-32 rounded-2xl object-cover shadow-md ring-4 ring-white ${
              isActive ? "" : "grayscale"
            }`}
          />
          <p className="mt-4 text-xs font-extrabold tracking-wider text-chocolate/70">
            MENU DITUKAR
          </p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight text-chocolate">
            {getVoucherName(voucher)}
          </h2>
          {menu?.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-chocolate/80">
              {menu.description}
            </p>
          )}
          <p
            className={`mt-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold ${
              isActive ? "text-berry-red" : "text-muted"
            }`}
          >
            <Coins size={16} />
            {voucher.points_spent.toLocaleString("id-ID")} Poin
          </p>
        </div>
      </section>

      {/* Bentuk kupon: sisi kiri-kanan bergerigi (lihat coupon di global.css) */}
      <section className="coupon mt-5">
        <div className="coupon-edges rounded-sm bg-white px-5 py-5 text-center">
          <p className={sectionTitleClass}>KODE VOUCHER</p>
          <p
            // select-all: sekali tap memblok seluruh kode untuk disalin manual
            className={`mt-1.5 font-mono text-2xl font-bold tracking-widest break-all select-all ${
              isActive ? "text-chocolate" : "text-muted line-through"
            }`}
          >
            {code}
          </p>

          <div className="mt-4 border-t-2 border-dashed border-peach pt-4">
            {isActive ? (
              <>
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
              </>
            ) : state === "used" ? (
              <p className="text-sm text-muted">
                Voucher ini sudah dipakai
                {usedAt ? ` pada ${formatShortDate(usedAt)}` : ""}.
              </p>
            ) : (
              <p className="text-sm text-muted">
                Voucher ini sudah tidak berlaku.
              </p>
            )}
          </div>
        </div>
      </section>

      <dl className="mt-5 divide-y divide-chocolate/10 rounded-2xl border border-chocolate/10 bg-white px-4">
        <DetailRow icon={BadgeCheck} label="Status">
          <span
            className={`rounded-full px-2.5 py-1 text-xs ${
              isActive ? "bg-success/10 text-success" : "bg-input text-muted"
            }`}
          >
            {VOUCHER_STATE_LABELS[state]}
          </span>
        </DetailRow>
        <DetailRow icon={CalendarDays} label="Tanggal ditukar">
          {formatShortDate(voucher.redeemed_at)}
        </DetailRow>
        {usedAt && (
          <DetailRow icon={CalendarCheck} label="Tanggal dipakai">
            {formatShortDate(usedAt)}
          </DetailRow>
        )}
        {voucher.promo.end_date && (
          <DetailRow icon={CalendarClock} label="Berlaku sampai">
            {formatShortCalendarDate(voucher.promo.end_date)}
          </DetailRow>
        )}
      </dl>

      <VoucherOutlets locationIds={voucher.promo.location_ids} />

      <section className="mt-6">
        <h2 className={sectionTitleClass}>SYARAT DAN KETENTUAN</h2>
        {terms ? (
          // pre-line: baris baru yang diketik admin tetap tampil
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {terms}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Belum ada syarat dan ketentuan untuk voucher ini.
          </p>
        )}
      </section>
    </>
  );
};

const CustomerVoucherDetailPage = () => {
  usePageTitle("Detail Voucher");

  // Parameter rute berisi redeem_transaction_id
  const { voucher_id: voucherId } = useParams();
  const navigate = useNavigate();
  const voucherQuery = useMyVoucher(voucherId);
  const voucher = voucherQuery.data;

  // Kembali ke tab tempat voucher ini berada
  const listUrl =
    voucher && getVoucherState(voucher) !== "active"
      ? "/vouchers?status=terpakai"
      : "/vouchers";

  const renderContent = () => {
    if (voucherQuery.isPending) {
      return <LoadingCircle className="py-20" />;
    }

    if (voucherQuery.isError) {
      return (
        <StateMessage
          icon={Ticket}
          title="Voucher gagal dimuat"
          description={voucherQuery.error.message}
          actionLabel="Coba lagi"
          onAction={() => voucherQuery.refetch()}
        />
      );
    }

    if (!voucher) {
      return (
        <StateMessage
          icon={Ticket}
          title="Voucher tidak ditemukan"
          description="Voucher ini tidak ada di daftar voucher kamu."
          actionLabel="Lihat semua voucher"
          onAction={() => navigate("/vouchers")}
        />
      );
    }

    return <VoucherDetail voucher={voucher} />;
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader
        title="Detail Voucher"
        backTo={listUrl}
        backLabel="Kembali ke Voucherku"
      />
      <div className="mt-3">{renderContent()}</div>
    </div>
  );
};

export default CustomerVoucherDetailPage;
