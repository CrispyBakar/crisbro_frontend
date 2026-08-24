import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, isPhoneVerified, saveAuth } from "@/lib/auth";

export const Route = createFileRoute("/otp")({
  head: () => ({
    meta: [
      { title: "Verifikasi OTP — Crisbar" },
      { name: "description", content: "Masukkan kode OTP untuk memverifikasi akun Crisbar." },
    ],
  }),
  component: OtpPage,
});

const OTP_LENGTH = 6;
const RESEND_SECONDS = 90;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.9 6.989c-.002 5.45-4.437 9.884-9.892 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05.005C5.495.005.16 5.338.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.3-1.652a11.882 11.882 0 0 0 5.688 1.448h.005c6.554 0 11.89-5.334 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function OtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(() => Array<string>(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const user = getUser();
    if (user && isPhoneVerified(user)) {
      void navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const code = otp.join("");

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setError("");
    setOtp((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedCode) return;

    event.preventDefault();
    const digits = Array<string>(OTP_LENGTH).fill("");
    pastedCode.split("").forEach((digit, index) => {
      digits[index] = digit;
    });
    setOtp(digits);
    setError("");
    inputRefs.current[Math.min(pastedCode.length, OTP_LENGTH) - 1]?.focus();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (code.length !== OTP_LENGTH) {
      setError("Masukkan 6 digit kode OTP dengan lengkap.");
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      const user = getUser();
      if (user) {
        saveAuth({
          ...user,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        });
      }
      setSubmitting(false);
      setSuccess(true);
    }, 700);
  }

  function handleResend() {
    if (countdown > 0) return;
    setOtp(Array<string>(OTP_LENGTH).fill(""));
    setError("");
    setSuccess(false);
    setCountdown(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
  }

  return (
    <main className="mt-10 px-4">
      <section className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
            <Sparkles className="h-4 w-4" /> Verifikasi Akun
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Masukkan <span className="text-primary">Kode OTP</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Masukkan kode verifikasi 6 digit dari Fazpass yang telah dikirim melalui WhatsApp
            untuk melanjutkan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-border bg-card p-7 shadow-(--shadow-soft)"
        >
          {success ? (
            <div className="py-3 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </span>
              <h2 className="mt-4 text-xl font-black">Verifikasi berhasil!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Kode OTP berhasil diverifikasi. Kamu dapat melanjutkan ke tahap berikutnya.
              </p>
              <Button asChild className="mt-6 h-12 w-full rounded-full font-bold">
                <Link to={getUser() ? "/dashboard" : "/profile"}>Lanjutkan</Link>
              </Button>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold text-foreground/80">
                  <WhatsAppIcon className="h-4 w-4 text-emerald-600" /> Kode Verifikasi WhatsApp
                </div>
                <div
                  className="grid grid-cols-6 gap-2 sm:gap-3"
                  onPaste={handlePaste}
                  aria-label="Kode OTP 6 digit"
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(event) => updateDigit(index, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(index, event.key)}
                      onFocus={(event) => event.currentTarget.select()}
                      aria-label={`Digit OTP ${index + 1}`}
                      className="aspect-square min-w-0 rounded-xl border-2 border-input bg-background text-center text-xl font-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:rounded-2xl sm:text-2xl"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || code.length !== OTP_LENGTH}
                className="h-12 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-(--shadow-pop) hover:bg-primary/90"
              >
                <KeyRound className="h-5 w-5" />
                {submitting ? "Memverifikasi..." : "Verifikasi Kode"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>Belum menerima kode?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className="mt-1 inline-flex items-center gap-1.5 font-bold text-primary transition hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                >
                  <RotateCcw className="h-4 w-4" />
                  {countdown > 0
                    ? `Kirim ulang dalam ${formatCountdown(countdown)}`
                    : "Kirim ulang kode"}
                </button>
              </div>
            </>
          )}
        </form>

        <Link
          to="/login"
          className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Login
        </Link>
      </section>
    </main>
  );
}
