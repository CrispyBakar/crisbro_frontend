import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, RotateCcw, Sparkles } from "lucide-react";
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
const RESEND_SECONDS = 60;

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
            Kami telah mengirimkan kode verifikasi 6 digit. Masukkan kode tersebut untuk
            melanjutkan.
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
                  <Mail className="h-4 w-4 text-primary" /> Kode Verifikasi
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
                  {countdown > 0 ? `Kirim ulang dalam ${countdown} detik` : "Kirim ulang kode"}
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
