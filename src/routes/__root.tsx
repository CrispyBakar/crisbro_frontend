import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import appCss from "../styles.css?url";
import logoCrisbar from "@/assets/logo-crisbar.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-primary">404</h1>
        <h2 className="mt-4 text-xl font-extrabold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hmm, menu yang kamu cari sepertinya sudah ludes 🍩
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[var(--shadow-pop)]"
          >
            Kembali ke Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Crisbar — Crispy. Sweet. Happy." },
      {
        name: "description",
        content:
          "Crisbar: ayam crispy, kentang renyah, dan dessert manis. Pesan, kunjungi outlet, dan kumpulkan poin!",
      },
      { name: "author", content: "Crisbar" },
      { property: "og:title", content: "Crisbar — Crispy. Sweet. Happy." },
      { property: "og:description", content: "Crispy treats & sweet vibes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/png",
        href: logoCrisbar,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-secondary/40 blur-3xl -z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full bg-accent/50 blur-3xl -z-10"
      />
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
