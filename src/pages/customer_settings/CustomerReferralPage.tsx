import { useState } from "react";
import { Check, Copy, Gift, LoaderCircle } from "lucide-react";
import crisbarMark from "@/assets/logo_c_crisbar.png";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { usePageTitle } from "@/hooks/use-page-title";
import { useGenerateReferralCode } from "@/hooks/use-referrals";
import { formatShortDate } from "@/lib/date";
import { FormAlert } from "@/pages/auth/AuthFormParts";

const REFERRAL_STEPS = [
  "Bagikan kode referral kamu ke teman.",
  "Temanmu memasukkan kode itu saat mendaftar Crisbro Member.",
  "Setelah pendaftaran temanmu diverifikasi Crisbar, kalian berdua mendapat poin.",
];

const sectionTitleClass = "text-xs font-extrabold tracking-wider text-muted";

const primaryButtonClass =
  "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-berry-red text-sm font-bold text-white transition-colors hover:bg-berry-red/90 disabled:cursor-not-allowed disabled:opacity-60";

const CustomerReferralPage = () => {
  usePageTitle("Referral");

  const [isCopied, setIsCopied] = useState<boolean>(false);

  const { data: user } = useCustomerProfile();
  const generate = useGenerateReferralCode();

  const referralCode = user?.referral_code;
  // Masa berlaku hanya dikirim backend saat kode dibuat, jadi tidak tampil lagi
  // setelah halaman dimuat ulang
  const expiresAt = generate.data?.referral_expires_at;

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setIsCopied(true);
    } catch {
      // Clipboard diblokir browser: kode tetap bisa diblok dan disalin manual
    }
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader
        title="Referral"
        backTo="/settings"
        backLabel="Kembali ke Settings"
      />

      {/* Panel kuning senada kartu member di beranda */}
      <section className="relative mt-3 overflow-hidden rounded-2xl bg-sunshine-yellow px-5 py-6">
        {/* Watermark logo C; brightness-0 + invert mengubah logo kuning jadi putih */}
        <img
          src={crisbarMark}
          alt=""
          className="pointer-events-none absolute top-1/2 -right-14 h-[140%] max-w-none -translate-y-1/2 opacity-30 brightness-0 invert"
        />

        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-berry-red">
            <Gift size={24} />
          </span>
          <h2 className="mt-4 text-xl font-extrabold leading-tight text-chocolate">
            Ajak teman, dapat poin
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-chocolate/80">
            Bagikan kode referral kamu. Kamu dan temanmu sama-sama mendapat poin
            saat dia bergabung jadi Crisbro Member.
          </p>
        </div>
      </section>

      {/* Bentuk kupon: sisi kiri-kanan bergerigi (lihat coupon di global.css) */}
      <section className="coupon mt-5">
        <div className="coupon-edges rounded-sm bg-white px-5 py-5 text-center">
          {referralCode ? (
            <>
              <p className={sectionTitleClass}>KODE REFERRAL KAMU</p>
              <p
                // select-all: sekali tap memblok seluruh kode untuk disalin manual
                className="mt-1.5 font-mono text-3xl font-bold tracking-widest break-all text-chocolate select-all"
              >
                {referralCode}
              </p>
              {expiresAt && (
                <p className="mt-1.5 text-xs text-muted">
                  Berlaku sampai {formatShortDate(expiresAt)}
                </p>
              )}

              <div className="mt-4 border-t-2 border-dashed border-peach pt-4">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={primaryButtonClass}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  {isCopied ? "Kode tersalin" : "Salin kode"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={sectionTitleClass}>KODE REFERRAL</p>
              <p className="mt-1.5 text-base font-extrabold text-chocolate">
                Kamu belum punya kode referral
              </p>
              <p className="mt-1 text-sm text-muted">
                Buat kode kamu sekarang, lalu bagikan ke teman.
              </p>

              <div className="mt-4 flex flex-col gap-3 border-t-2 border-dashed border-peach pt-4 text-left">
                {generate.isError && (
                  <FormAlert message={generate.error.message} />
                )}
                <button
                  type="button"
                  onClick={() => generate.mutate()}
                  disabled={generate.isPending}
                  className={primaryButtonClass}
                >
                  {generate.isPending && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {generate.isPending
                    ? "Membuat kode..."
                    : "Buat kode referral"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className={sectionTitleClass}>CARA KERJA</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {REFERRAL_STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-input text-xs font-extrabold text-berry-red">
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default CustomerReferralPage;
