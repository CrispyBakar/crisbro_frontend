import { CircleAlert, Lock, SearchX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  isRouteErrorResponse,
  Link,
  useLocation,
  useRouteError,
} from "react-router";
import crisbarLogo from "@/assets/logo-crisbar-spotlight.png";
import { usePageTitle } from "@/hooks/use-page-title";

type ErrorContent = {
  icon: LucideIcon;
  title: string;
  description: string;
  // Muat ulang hanya masuk akal untuk kegagalan yang mungkin sementara
  canRetry: boolean;
};

const contentFor = (status: number | undefined): ErrorContent => {
  if (status === 404) {
    return {
      icon: SearchX,
      title: "Halaman tidak ditemukan",
      description:
        "Alamat yang kamu buka tidak ada atau sudah dipindahkan. Periksa lagi alamatnya, atau kembali ke halaman utama.",
      canRetry: false,
    };
  }
  if (status === 401 || status === 403) {
    return {
      icon: Lock,
      title: "Akses ditolak",
      description: "Kamu tidak punya izin untuk membuka halaman ini.",
      canRetry: false,
    };
  }
  return {
    icon: CircleAlert,
    title: "Terjadi kesalahan",
    description:
      "Halaman ini gagal dimuat. Coba muat ulang; kalau masih terjadi, coba lagi beberapa saat lagi.",
    canRetry: true,
  };
};

type ErrorPageProps = {
  // Diisi saat dipasang langsung sebagai halaman (mis. /403 atau rute "*").
  // Sebagai errorElement, status dibaca dari error yang dilempar rute.
  status?: number;
};

// Satu halaman error untuk admin dan customer. Area ditentukan dari URL,
// karena alamat yang tidak cocok dengan rute mana pun tidak punya layout.
const ErrorPage = ({ status: statusProp }: ErrorPageProps) => {
  const routeError = useRouteError();
  const { pathname } = useLocation();

  const status =
    statusProp ??
    (isRouteErrorResponse(routeError) ? routeError.status : undefined);
  const { icon: Icon, title, description, canRetry } = contentFor(status);
  usePageTitle(title);

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const home = isAdmin
    ? { to: "/admin/dashboard", label: "Kembali ke dashboard" }
    : { to: "/", label: "Kembali ke beranda" };

  // Detail teknis hanya untuk development; pengguna tidak perlu melihat stack trace
  const debugDetail =
    import.meta.env.DEV && routeError
      ? routeError instanceof Error
        ? (routeError.stack ?? routeError.message)
        : isRouteErrorResponse(routeError)
          ? `${routeError.status} ${routeError.statusText}`
          : String(routeError)
      : null;

  return (
    <div className="flex min-h-dvh w-full justify-center bg-gray-100">
      {/* Customer memakai kolom mobile seperti layout-nya; admin memakai lebar penuh */}
      <main
        className={`flex min-h-dvh w-full flex-col items-center justify-center bg-cream px-6 py-10 text-center ${
          isAdmin ? "" : "max-w-mobile shadow-md"
        }`}
      >
        <img src={crisbarLogo} alt="Crisbar" className="h-12 w-12" />

        <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-input text-berry-red">
          <Icon size={30} />
        </span>
        {status && (
          <p className="mt-5 text-xs font-extrabold tracking-widest text-muted">
            ERROR {status}
          </p>
        )}
        <h1
          className={`text-2xl font-extrabold leading-tight text-chocolate ${
            status ? "mt-1" : "mt-5"
          }`}
        >
          {title}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link
            to={home.to}
            className="flex h-12 items-center justify-center rounded-full bg-berry-red text-base font-bold text-white transition-colors hover:bg-berry-red/90"
          >
            {home.label}
          </Link>
          {canRetry && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-chocolate/20 bg-white text-base font-bold text-chocolate transition-colors hover:bg-chocolate/5"
            >
              Muat ulang
            </button>
          )}
        </div>

        {debugDetail && (
          <details className="mt-8 w-full max-w-xl text-left">
            <summary className="cursor-pointer text-xs font-semibold text-muted">
              Detail error (hanya tampil saat development)
            </summary>
            <pre className="mt-2 max-h-60 overflow-auto rounded-xl border border-border bg-white p-3 text-xs whitespace-pre-wrap text-chocolate">
              {debugDetail}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
};

export default ErrorPage;
