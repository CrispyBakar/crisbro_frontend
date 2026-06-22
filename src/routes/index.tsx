import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Coins, MapPin, UtensilsCrossed, Heart, Star, LogIn, Sparkles, Smile } from "lucide-react";
import heroImg from "@/assets/katsu-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crisbar — Nikmati Katsu Favoritmu & Kumpulkan Poinnya!" },
      {
        name: "description",
        content:
          "Katsu crispy gurih dengan saus rahasia. Pesan favoritmu & kumpulkan poin di Crisbar.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="px-4">
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl mt-10 rounded-[2.5rem] overflow-hidden border border-border">
        {/* Playful background patterns */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(135deg, oklch(0.97 0.04 85) 0%, oklch(0.94 0.08 60) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage: "radial-gradient(oklch(0.62 0.22 27 / 0.18) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-12 -left-10 h-48 w-48 rounded-full bg-secondary/70 blur-2xl -z-10"
        />
        <div
          aria-hidden
          className="absolute top-16 right-1/3 h-20 w-20 rounded-[2rem] bg-primary/20 rotate-12 -z-10"
        />
        <div
          aria-hidden
          className="absolute bottom-10 left-10 h-16 w-16 rounded-full bg-accent/70 -z-10"
        />
        <div aria-hidden className="absolute top-6 right-6 text-4xl rotate-12 opacity-40 -z-10">
          ⭐
        </div>
        <div
          aria-hidden
          className="absolute bottom-8 right-1/4 text-3xl -rotate-12 opacity-40 -z-10"
        >
          ✨
        </div>
        <div aria-hidden className="absolute top-1/2 left-4 text-3xl opacity-30 -z-10">
          🌟
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center p-6 md:p-12">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-bold text-primary shadow-[var(--shadow-pop)]">
              <Coins className="h-4 w-4" /> Crisbar Rewards
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight text-foreground">
              Nikmati <span className="text-primary">Katsu</span> Favoritmu & Kumpulkan{" "}
              <span className="text-[oklch(0.65_0.2_45)] text-[#e82c2c]">Poinnya!</span> 🍱
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Katsu crispy gurih dengan saus rahasia. Tiap gigitan bikin happy, tiap pesanan dapat
              poin manis.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-7 shadow-[var(--shadow-pop)]"
              >
                <Link to="/menu">
                  <UtensilsCrossed className="h-5 w-5" /> Lihat Menu
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full h-12 px-7 font-bold border-2 bg-card hover:bg-secondary"
              >
                <Link to="/login">
                  <LogIn className="h-5 w-5" /> Login untuk Cek Poin
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-[oklch(0.78_0.18_70)]" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">4.9/5</span> dari 12rb+ pelanggan
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-[3rem] rotate-3 bg-secondary/80" />
            <div className="absolute inset-0 rounded-[3rem] -rotate-2 bg-accent/70" />
            <img
              src={heroImg}
              alt="Katsu ayam crispy Crisbar with special sauce"
              width={1024}
              height={1024}
              className="relative rounded-[3rem] w-full h-auto object-cover shadow-[var(--shadow-soft)]"
            />
            <div className="absolute -bottom-3 -left-3 rounded-2xl bg-card px-4 py-2.5 shadow-[var(--shadow-soft)] border border-border rotate-[-6deg]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Best Seller
              </p>
              <p className="text-base font-black text-primary">Crispy Katsu 🍗</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl mt-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: Heart, title: "Momen Manis", desc: "Crisbar menemani di setiap momen manis-mu" },
          {
            icon: Smile,
            title: "Senyum Manis",
            desc: "Crisbar menjadi sumber senyum manis untuk hari-mu",
          },
          { icon: Heart, title: "Rasa Manis", desc: "Crisbar memiliki cita rasa otentik" },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-3xl bg-card p-7 border border-border shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-transform"
          >
            <div className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center mb-5 border-[#fddd0d]">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-extrabold mb-2">{title}</h3>
            <p className="text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl mt-24">
        <div className="rounded-[3rem] p-10 md:p-16 text-center bg-[#fddd0d]">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            BIG ORDER BIG UNTUNG 📦🎉
          </h2>
          <p className="text-foreground/80 text-lg mb-7 max-w-xl mx-auto">
            Temukan outlet terdekat dan nikmati promo spesial hari ini.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-7 shadow-[var(--shadow-pop)]"
            >
              <Link to="/lokasi">
                <MapPin className="h-5 w-5" /> Cari Lokasi
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full h-12 px-7 font-bold border-2 bg-card hover:bg-card/80"
            >
              <Link to="/dashboard">Tukar Sekarang</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
