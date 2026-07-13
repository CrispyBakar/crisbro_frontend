import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiChangePassword, getToken } from "@/lib/auth";
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/change-password")({
  head: () => ({
    meta: [
      { title: "Ganti Password - Crisbar" },
      { name: "description", content: "Ganti password akun Crisbar." },
    ],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Password lama wajib diisi.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiChangePassword(currentPassword, newPassword);
      setSuccess(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengganti password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
            <ShieldCheck className="h-4 w-4" /> Keamanan Akun
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Ganti <span className="text-primary">Password</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Gunakan password baru yang berbeda dan tidak mudah ditebak.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-7 shadow-(--shadow-soft)"
        >
          <label className="block">
            <span className="text-sm font-bold text-foreground/80">Password Lama</span>
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="h-12 rounded-2xl border-2 bg-background pr-12 text-base"
                autoComplete="current-password"
                placeholder="masukkan password lama"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-foreground/80">Password Baru</span>
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 h-12 rounded-2xl border-2 bg-background text-base"
              autoComplete="new-password"
              placeholder="minimal 8 karakter"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-foreground/80">Konfirmasi Password Baru</span>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 h-12 rounded-2xl border-2 bg-background text-base"
              autoComplete="new-password"
              placeholder="ulangi password baru"
            />
          </label>

          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-(--shadow-pop) hover:bg-primary/90"
          >
            <KeyRound className="h-5 w-5" /> {loading ? "Menyimpan..." : "Simpan Password"}
          </Button>

          <Button asChild variant="outline" className="h-12 w-full rounded-full font-bold">
            <Link to="/">Kembali</Link>
          </Button>
        </form>
      </section>
    </main>
  );
}
