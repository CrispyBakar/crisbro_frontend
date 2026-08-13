import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiActivateAccount, apiValidateActivation } from "@/lib/auth";
import { CheckCircle2, Eye, EyeOff, KeyRound, Sparkles } from "lucide-react";

export const Route = createFileRoute("/activate")({
  head: () => ({
    meta: [
      { title: "Aktivasi Akun - Crisbar" },
      { name: "description", content: "Aktivasi akun Crisbar dan buat password baru." },
    ],
  }),
  component: ActivatePage,
});

function ActivatePage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") ?? "";
    setToken(tokenParam);

    if (!tokenParam) {
      setError("Link aktivasi tidak valid.");
      setLoading(false);
      return;
    }

    apiValidateActivation(tokenParam)
      .then((data) => {
        setCustomerName(data.customer_name);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Link aktivasi tidak valid.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiActivateAccount(token, password);
      setSuccess(data.message);
      setTimeout(() => navigate({ to: "/login" }), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Aktivasi akun gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
            <Sparkles className="h-4 w-4" /> Aktivasi Akun
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Buat <span className="text-primary">Password</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            {customerName
              ? `Halo ${customerName}, buat password untuk mengaktifkan akun kamu.`
              : "Buat password untuk mengaktifkan akun Crisbar kamu."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-7 shadow-(--shadow-soft)"
        >
          {loading ? (
            <p className="text-sm font-semibold text-muted-foreground">
              Memvalidasi link aktivasi...
            </p>
          ) : success ? (
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              {success}
            </div>
          ) : error && !token ? (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-bold text-foreground/80">Password Baru</span>
                <div className="relative mt-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border-2 bg-background pr-12 text-base"
                    autoComplete="new-password"
                    placeholder="minimal 8 karakter"
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
                <span className="text-sm font-bold text-foreground/80">Konfirmasi Password</span>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 h-12 rounded-2xl border-2 bg-background text-base"
                  autoComplete="new-password"
                  placeholder="ulangi password"
                />
              </label>

              {error && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-(--shadow-pop) hover:bg-primary/90"
              >
                <KeyRound className="h-5 w-5" /> {submitting ? "Mengaktifkan..." : "Aktifkan Akun"}
              </Button>
            </>
          )}

          {!loading && (success || error) && (
            <Button asChild variant="outline" className="h-12 w-full rounded-full font-bold">
              <Link to="/login">Ke Halaman Login</Link>
            </Button>
          )}
        </form>
      </section>
    </main>
  );
}
