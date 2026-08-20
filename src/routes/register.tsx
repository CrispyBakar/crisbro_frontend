import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Sparkles, UserPlus } from "lucide-react";
import { apiRegister, saveAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar Akun — Crisbar" },
      {
        name: "description",
        content: "Daftar jadi member Crisbar untuk mulai mengumpulkan poin & reward manis.",
      },
    ],
  }),
  component: RegisterPage,
});

type RegisterError = Error & {
  whatsappUrl?: string;
};

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function requiredFieldsMessage(fields: string[]) {
  return `Lengkapi field wajib: ${fields.join(", ")}.`;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setWhatsappUrl("");

    const normalized = normalizePhone(tel);
    const missingFields: string[] = [];

    if (!name.trim()) missingFields.push("Nama Lengkap");
    if (!tel.trim()) missingFields.push("Nomor Telepon");
    if (!email.trim()) missingFields.push("Email");
    if (!password) missingFields.push("Password");

    if (missingFields.length > 0) {
      setError(requiredFieldsMessage(missingFields));
      return;
    }

    if (!normalized || !normalized.startsWith("8")) {
      setError("Nomor telepon harus diawali 8 (tanpa 0 atau +62).");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRegister({
        name: name.trim(),
        phone_number: normalized,
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.user) {
        saveAuth(result.user);
      } else {
        sessionStorage.setItem(
          "crisbar_pending_profile",
          JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: normalized,
          }),
        );
      }
      void navigate({ to: "/profile" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);

        const registerError = err as RegisterError;
        setWhatsappUrl(registerError.whatsappUrl || "");
      } else {
        setError("Permintaan aktivasi gagal, coba lagi.");
        setWhatsappUrl("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-md">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
            <Sparkles className="h-4 w-4" /> Crisbar Rewards
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
            Gabung <span className="text-primary">Crispy Club!</span> 🍗
          </h1>
          <p className="text-muted-foreground mt-3">
            Daftarkan akunmu untuk mulai mengumpulkan poin dan menikmati reward Crisbar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-card border border-border p-7 shadow-(--shadow-soft) space-y-4"
        >
          <label className="block">
            <span className="text-sm font-bold text-foreground/80">
              Nama Lengkap <span className="text-destructive">*</span>
            </span>
            <Input
              type="text"
              placeholder="masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 rounded-2xl h-12 bg-background border-2 text-base"
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-foreground/80">
              Nomor Telepon <span className="text-destructive">*</span>
            </span>
            <div className="flex mt-2 rounded-2xl overflow-hidden border-2 bg-background focus-within:ring-2 focus-within:ring-ring">
              <span className="flex items-center px-3 text-sm font-bold text-muted-foreground bg-muted border-r border-border">
                +62
              </span>
              <Input
                type="tel"
                placeholder="8123456789"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                className="rounded-none border-0 h-12 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                autoComplete="tel"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-foreground/80">
              Email <span className="text-destructive">*</span>
            </span>
            <Input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 rounded-2xl h-12 bg-background border-2 text-base"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-foreground/80">
              Password <span className="text-destructive">*</span>
            </span>
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl h-12 bg-background border-2 pr-12 text-base"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-foreground/80">Kode Referral</span>
            <Input
              type="text"
              placeholder="masukkan kode referral (opsional)"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
              className="mt-2 h-12 rounded-2xl border-2 bg-background text-base uppercase"
              autoComplete="off"
            />
            <span className="mt-1.5 block text-xs font-medium text-muted-foreground">
              Kosongkan jika kamu tidak memiliki kode referral.
            </span>
          </label>

          {notice && (
            <div className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm font-medium text-secondary-foreground">
              <p>{notice}</p>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-bold underline text-primary"
                >
                  Hubungi Admin via WhatsApp
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-destructive/10 text-destructive text-sm font-medium px-4 py-3">
              <p>{error}</p>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-bold underline text-primary"
                >
                  Hubungi Admin via WhatsApp
                </a>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-(--shadow-pop)"
          >
            <UserPlus className="h-5 w-5" /> {loading ? "Memproses..." : "Daftar Sekarang"}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Login di sini
          </Link>
        </p>
      </section>
    </main>
  );
}
