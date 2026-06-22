import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Coins, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import logoCrisbar from "@/assets/logo-crisbar.png";
import { getUser, logout, type AuthUser } from "@/lib/auth";

export function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Baca user dari localStorage setiap kali navbar render
  useEffect(() => {
    setUser(getUser());

    function handleAuthChange() {
      setUser(getUser());
    }

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setDropdownOpen(false);
    navigate({ to: "/" });
  };

  const customerName = user?.customer?.name ?? "";
  const initial = customerName.charAt(0).toUpperCase() || "?";
  const phoneNumber = user?.phone_number ?? "-";

  const linkClass =
    "px-4 py-2 rounded-full text-sm font-semibold text-foreground/80 hover:text-primary hover:bg-secondary/60 transition-all";
  const activeClass = "px-4 py-2 rounded-full text-sm font-semibold text-primary bg-secondary";

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="mx-auto max-w-6xl flex items-center justify-between gap-4 rounded-full bg-card/80 backdrop-blur-md border border-border px-4 py-2 shadow-[var(--shadow-soft)]">
        <Link
          to="/"
          className="flex items-center gap-2 pl-1"
          aria-label="Crisbar - Ayam Crispy Bakar"
        >
          <img
            src={logoCrisbar}
            alt="Crisbar - Ayam Crispy Bakar"
            className="h-16 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={linkClass}
            activeOptions={{ exact: true }}
            activeProps={{ className: activeClass }}
          >
            Home
          </Link>
          <Link to="/menu" className={linkClass} activeProps={{ className: activeClass }}>
            Menu Redeem
          </Link>
          <Link to="/katalog" className={linkClass} activeProps={{ className: activeClass }}>
            Katalog Produk
          </Link>
          <Link to="/promo" className={linkClass} activeProps={{ className: activeClass }}>
            Promo
          </Link>
          <Link to="/lokasi" className={linkClass} activeProps={{ className: activeClass }}>
            Lokasi
          </Link>
        </div>

        {/* Desktop CTA — kondisional */}
        <div className="hidden md:flex items-center">
          {user ? (
            // Sudah login → avatar + dropdown
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground font-black text-base grid place-items-center shadow-[var(--shadow-pop)] hover:bg-primary/90 transition-colors focus:outline-none"
                aria-label="Profil saya"
                aria-expanded={dropdownOpen}
              >
                {initial}
              </button>

              {/* Dropdown card */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden">
                  {/* Arrow */}
                  <div className="absolute -top-2 right-3.5 h-3 w-3 rotate-45 bg-card border-l border-t border-border" />

                  {/* Info user */}
                  <div className="px-4 pt-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground font-black text-base grid place-items-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm truncate">{customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{phoneNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu aksi */}
                  <div className="p-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-primary" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Belum login → button Cek Poin
            <Button
              asChild
              variant="default"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[var(--shadow-pop)]"
            >
              <Link to="/login">
                <Coins className="h-4 w-4" /> Cek Poin
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </nav>

      {/* Mobile menu panel */}
      <div
        className={`md:hidden mx-auto max-w-6xl overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="rounded-2xl bg-[#FDEC80] border border-border shadow-[var(--shadow-soft)] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-foreground/80 px-2">Menu</span>
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/60 hover:bg-background transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={close}
              className="px-4 py-3 rounded-xl text-base font-semibold text-foreground hover:bg-background/60 transition-colors"
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "px-4 py-3 rounded-xl text-base font-semibold text-primary bg-background",
              }}
            >
              Home
            </Link>
            <Link
              to="/menu"
              onClick={close}
              className="px-4 py-3 rounded-xl text-base font-semibold text-foreground hover:bg-background/60 transition-colors"
              activeProps={{
                className:
                  "px-4 py-3 rounded-xl text-base font-semibold text-primary bg-background",
              }}
            >
              Menu
            </Link>
            <Link
              to="/katalog"
              onClick={close}
              className="px-4 py-3 rounded-xl text-base font-semibold text-foreground hover:bg-background/60 transition-colors"
              activeProps={{
                className:
                  "px-4 py-3 rounded-xl text-base font-semibold text-primary bg-background",
              }}
            >
              Katalog Produk
            </Link>
            <Link
              to="/promo"
              onClick={close}
              className="px-4 py-3 rounded-xl text-base font-semibold text-foreground hover:bg-background/60 transition-colors"
              activeProps={{
                className:
                  "px-4 py-3 rounded-xl text-base font-semibold text-primary bg-background",
              }}
            >
              Promo
            </Link>
            <Link
              to="/lokasi"
              onClick={close}
              className="px-4 py-3 rounded-xl text-base font-semibold text-foreground hover:bg-background/60 transition-colors"
              activeProps={{
                className:
                  "px-4 py-3 rounded-xl text-base font-semibold text-primary bg-background",
              }}
            >
              Lokasi
            </Link>
          </div>

          {/* Mobile CTA — kondisional */}
          {user ? (
            <div className="mt-4 rounded-2xl bg-background/60 p-3 space-y-1">
              <div className="flex items-center gap-3 px-2 py-1.5 mb-2">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground font-black text-sm grid place-items-center shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-sm truncate">{customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{phoneNumber}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={close}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-background transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  close();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-background transition-colors"
              >
                <LogOut className="h-4 w-4 text-primary" /> Keluar
              </button>
            </div>
          ) : (
            <Button
              asChild
              className="mt-4 w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[var(--shadow-pop)] h-12 text-base"
            >
              <Link to="/login" onClick={close}>
                <Coins className="h-5 w-5" /> Cek Poin
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
