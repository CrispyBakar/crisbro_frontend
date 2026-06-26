import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, UserPlus, Eye, EyeOff } from "lucide-react";
import { apiRegister } from "@/lib/auth";

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

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const normalized = normalizePhone(tel);

    if (!name.trim()) {
      setError("Nama lengkapnya jangan lupa diisi ya Kak 🙏");
      return;
    }
    if (!normalized || !normalized.startsWith("8")) {
      setError("Nomor telepon harus diawali 8 (tanpa 0 atau +62) 🙏");
      return;
    }
    if (password.length < 4) {
      setError("Password minimal 4 karakter ya.");
      return;
    }

    setLoading(true);
    try {
      await apiRegister(name.trim(), normalized, password);
      navigate({ to: "/login" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);

        const registerError = err as RegisterError;
        setWhatsappUrl(registerError.whatsappUrl || "");
      } else {
        setError("Registrasi gagal, coba lagi.");
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
            Daftar gratis sekarang dan kumpulkan reward makan katsu gratisan!
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-card border border-border p-7 shadow-(--shadow-soft) space-y-4"
        >
          <label className="block">
            <span className="text-sm font-bold text-foreground/80">Nama Lengkap</span>
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
            <span className="text-sm font-bold text-foreground/80">Nomor Telepon</span>
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
            <span className="text-sm font-bold text-foreground/80">Password</span>
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="buat password minimal 4 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl h-12 bg-background border-2 text-base pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

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
