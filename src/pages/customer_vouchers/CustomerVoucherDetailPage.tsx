import { useState } from "react";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  CalendarCheck,
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
import { usePageTitle } from "@/hooks/use-page-title";
import { useMyVouchers } from "@/hooks/use-vouchers";
import { formatShortDate } from "@/lib/date";
import type { Voucher } from "@/services/vouchers";
import VoucherMenuImage from "./VoucherMenuImage";

// Teks sementara — ganti dengan syarat dan ketentuan resmi dari Crisbar
const VOUCHER_TERMS = [
  "Voucher hanya berlaku untuk menu yang tertera.",
  "Satu kode voucher hanya bisa dipakai satu kali.",
  "Voucher tidak bisa diuangkan atau ditukar kembali menjadi poin.",
];

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

const VoucherDetail = ({ voucher }: { voucher: Voucher }) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const menu = voucher.loyalty_product;
  const isUsed = voucher.status === "used";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setIsCopied(true);
    } catch {
      // Clipboard diblokir browser: kode tetap bisa diblok dan disalin manual
    }
  };

  return (
    <>
      {/* Panel kuning senada kartu member di beranda; voucher terpakai tampil pudar */}
      <section
        className={`relative overflow-hidden rounded-2xl px-5 py-6 text-center ${
          isUsed ? "bg-input" : "bg-sunshine-yellow"
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
            src={menu.product_image_url}
            className={`h-32 w-32 rounded-2xl object-cover shadow-md ring-4 ring-white ${
              isUsed ? "grayscale" : ""
            }`}
          />
          <p className="mt-4 text-xs font-extrabold tracking-wider text-chocolate/70">
            MENU DITUKAR
          </p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight text-chocolate">
            {menu.product_name}
          </h2>
          {menu.product_description && (
            <p className="mt-1.5 text-sm leading-relaxed text-chocolate/80">
              {menu.product_description}
            </p>
          )}
          <p className="mt-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-chocolate">
            <Coins
              size={16}
              className={isUsed ? "text-muted" : "text-berry-red"}
            />
            <span className={isUsed ? "text-muted" : "text-berry-red"}>
              {voucher.point_used.toLocaleString("id-ID")} Poin
            </span>
            <span className="font-bold text-muted">
              · {voucher.quantity.toLocaleString("id-ID")} porsi
            </span>
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
              isUsed ? "text-muted line-through" : "text-chocolate"
            }`}
          >
            {voucher.code}
          </p>

          <div className="mt-4 border-t-2 border-dashed border-peach pt-4">
            {isUsed ? (
              <p className="text-sm text-muted">
                Voucher ini sudah dipakai
                {voucher.used_at
                  ? ` pada ${formatShortDate(voucher.used_at)}`
                  : ""}
                .
              </p>
            ) : (
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
            )}
          </div>
        </div>
      </section>

      <dl className="mt-5 divide-y divide-chocolate/10 rounded-2xl border border-chocolate/10 bg-white px-4">
        <DetailRow icon={BadgeCheck} label="Status">
          <span
            className={`rounded-full px-2.5 py-1 text-xs ${
              isUsed ? "bg-input text-muted" : "bg-success/10 text-success"
            }`}
          >
            {isUsed ? "Terpakai" : "Aktif"}
          </span>
        </DetailRow>
        <DetailRow icon={CalendarDays} label="Tanggal ditukar">
          {formatShortDate(voucher.created_at)}
        </DetailRow>
        {voucher.used_at && (
          <DetailRow icon={CalendarCheck} label="Tanggal dipakai">
            {formatShortDate(voucher.used_at)}
          </DetailRow>
        )}
      </dl>

      <section className="mt-6">
        <h2 className={sectionTitleClass}>SYARAT DAN KETENTUAN</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:font-bold marker:text-berry-red">
          {VOUCHER_TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ol>
      </section>
    </>
  );
};

const CustomerVoucherDetailPage = () => {
  usePageTitle("Detail Voucher");

  const { voucher_id: voucherId } = useParams();
  const navigate = useNavigate();
  const vouchersQuery = useMyVouchers();

  // Belum ada endpoint detail, jadi voucher dicari dari daftar milik customer
  const voucher = vouchersQuery.data?.find(
    (item) => item.voucher_id === voucherId,
  );

  // Kembali ke tab tempat voucher ini berada
  const listUrl =
    voucher?.status === "used" ? "/vouchers?status=terpakai" : "/vouchers";

  const renderContent = () => {
    if (vouchersQuery.isPending) {
      return <LoadingCircle className="py-20" />;
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
