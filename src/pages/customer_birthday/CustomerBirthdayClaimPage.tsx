import { useState } from "react";
import type { ReactNode } from "react";
import { Cake, CalendarDays, Check, Copy, Gift, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import crisbarMark from "@/assets/logo_c_crisbar.png";
import ConfirmDialog from "@/components/ConfirmDialog";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import LoadingCircle from "@/components/LoadingCircle";
import StateMessage from "@/components/StateMessage";
import {
  useBirthdayTreatCheck,
  useClaimBirthdayTreat,
} from "@/hooks/use-birthday";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useBirthdayTreatCountdown } from "@/hooks/use-countdown";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatCountdown } from "@/lib/countdown";
import { formatShortCalendarDate } from "@/lib/date";
import type { BirthdayTreat, ClaimedBirthdayTreat } from "@/services/birthday";

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

// Kode voucher hasil klaim; bentuk kupon sama seperti halaman detail redeem
const ClaimSuccess = ({ result }: { result: ClaimedBirthdayTreat }) => {
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
          Hadiah berhasil diklaim!
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Selamat ulang tahun! Tunjukkan kode voucher ini ke kasir saat memesan
          untuk mengambil hadiahmu.
        </p>
      </div>

      {/* Bentuk kupon: sisi kiri-kanan bergerigi (lihat coupon di global.css) */}
      <section className="coupon mt-5">
        <div className="coupon-edges rounded-sm bg-white px-5 py-5 text-center">
          <p className={sectionTitleClass}>KODE VOUCHER</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tracking-widest break-all text-chocolate select-all">
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
        to={
          result.redeem_transaction_id
            ? `/vouchers/${result.redeem_transaction_id}`
            : "/vouchers"
        }
        className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-chocolate/10 bg-white text-sm font-bold text-chocolate transition-colors hover:bg-chocolate/5"
      >
        Lihat di Voucherku
      </Link>
    </>
  );
};

type ClaimDetailProps = {
  // Treat yang sedang bisa diklaim (pasti bukan null)
  treat: NonNullable<BirthdayTreat["treat"]>;
  firstName: string;
  onClaim: () => void;
};

// Kartu ucapan ulang tahun beserta countdown dan tombol klaim
const ClaimDetail = ({ treat, firstName, onClaim }: ClaimDetailProps) => {
  const remaining = useBirthdayTreatCountdown(treat);

  return (
    <>
      {/* Panel kuning senada kartu member dan detail redeem di halaman lain */}
      <section className="relative overflow-hidden rounded-2xl bg-sunshine-yellow px-5 py-6 text-center">
        {/* Watermark logo C; brightness-0 + invert mengubah logo kuning jadi putih */}
        <img
          src={crisbarMark}
          alt=""
          className="pointer-events-none absolute top-1/2 -right-14 h-[120%] max-w-none -translate-y-1/2 opacity-30 brightness-0 invert"
        />

        <div className="relative flex flex-col items-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
            <Cake size={36} className="text-berry-red" />
          </span>
          <p className="mt-4 text-xs font-extrabold tracking-wider text-chocolate/70">
            SELAMAT ULANG TAHUN
          </p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight text-chocolate">
            Hai, {firstName}!
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-chocolate/80">
            Ada hadiah spesial dari Crisbro buat kamu. Klaim hari ini sebelum
            pukul 23.59, ya!
          </p>
          <p className="mt-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold tabular-nums text-berry-red">
            <CalendarDays size={16} />
            {formatCountdown(remaining)}
          </p>
        </div>
      </section>

      <dl className="mt-5 divide-y divide-chocolate/10 rounded-2xl border border-chocolate/10 bg-white px-4">
        <DetailRow icon={Cake} label="Hari ulang tahun">
          {formatShortCalendarDate(treat.birthday_date)}
        </DetailRow>
        <DetailRow icon={CalendarDays} label="Bisa diklaim sampai">
          Hari ini, 23.59
        </DetailRow>
      </dl>

      <section className="mt-6">
        <h2 className={sectionTitleClass}>SYARAT DAN KETENTUAN</h2>
        {/* Belum ada terms dari backend birthday treat; teks sementara di sini */}
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>Hadiah hanya bisa diklaim sekali dan berlaku hari ini saja.</li>
          <li>Tunjukkan kode voucher ke kasir Crisbro saat memesan.</li>
          <li>Hadiah tidak dapat diuangkan atau ditukar dengan menu lain.</li>
        </ul>
      </section>

      <button
        type="button"
        onClick={onClaim}
        className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-berry-red text-sm font-bold text-white shadow-md transition-colors hover:bg-berry-red/90"
      >
        Klaim Hadiah
      </button>
    </>
  );
};

const CustomerBirthdayClaimPage = () => {
  usePageTitle("Klaim Birthday Treat");

  const navigate = useNavigate();
  const { data: user } = useCustomerProfile();
  const check = useBirthdayTreatCheck();
  const claim = useClaimBirthdayTreat();
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const treat = check.data?.treat ?? null;
  // Treat baru bisa diklaim saat has_claimable_treat; null bila sudah/tidak ada
  const claimableTreat = check.data?.has_claimable_treat ? treat : null;
  const firstName =
    user?.customer?.name.trim().split(/\s+/)[0] ?? "Sobat Crisbro";

  const renderContent = () => {
    // Dicek paling awal: kode voucher harus tetap tampil walau status treat
    // dimuat ulang setelah klaim gagal
    if (claim.isSuccess) {
      return <ClaimSuccess result={claim.data} />;
    }

    if (check.isPending) {
      return <LoadingCircle className="py-20" />;
    }

    if (check.isError) {
      return (
        <StateMessage
          icon={Gift}
          title="Birthday treat gagal dimuat"
          description={check.error.message}
          actionLabel="Coba lagi"
          onAction={() => check.refetch()}
        />
      );
    }

    if (!claimableTreat) {
      if (treat?.status === "claimed") {
        return (
          <StateMessage
            icon={Cake}
            title="Hadiah sudah diklaim"
            description="Birthday treat kamu tahun ini sudah diklaim. Lihat kodenya di Voucherku."
            actionLabel="Lihat Voucherku"
            onAction={() => navigate("/vouchers")}
          />
        );
      }
      return (
        <StateMessage
          icon={Cake}
          title="Belum ada birthday treat"
          description="Belum ada hadiah ulang tahun yang bisa kamu klaim saat ini."
          actionLabel="Kembali ke beranda"
          onAction={() => navigate("/")}
        />
      );
    }

    return (
      <ClaimDetail
        treat={claimableTreat}
        firstName={firstName}
        onClaim={() => setIsConfirmOpen(true)}
      />
    );
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader
        title="Klaim Birthday Treat"
        backTo="/"
        backLabel="Kembali ke beranda"
      />
      <div className="mt-3">{renderContent()}</div>

      {isConfirmOpen && claimableTreat && (
        <ConfirmDialog
          title="Klaim hadiah sekarang?"
          message={
            <>
              Birthday treat kamu akan diklaim dan berubah menjadi kode voucher.
              Hadiah hanya bisa diklaim{" "}
              <strong className="text-chocolate">sekali</strong> per tahun.
            </>
          }
          icon={Gift}
          confirmLabel="Ya, klaim"
          isPending={claim.isPending}
          error={claim.error?.message}
          onConfirm={() =>
            claim.mutate(
              { user_birthday_id: claimableTreat.user_birthday_id },
              { onSuccess: () => setIsConfirmOpen(false) },
            )
          }
          onCancel={() => {
            setIsConfirmOpen(false);
            claim.reset();
          }}
        />
      )}
    </div>
  );
};

export default CustomerBirthdayClaimPage;
