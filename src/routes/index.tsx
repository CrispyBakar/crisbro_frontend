import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins, MapPin, UtensilsCrossed, Heart, Star, LogIn, Sparkles, Smile } from "lucide-react";
import heroImg from "@/assets/crisbarbar-crisbar-hero.jpg";
import ayamGeprekSambalIjoImg from "@/assets/ayam-geprek-sambal-ijo.jpg";
import chickenKatsuNashvilleImg from "@/assets/chicken-katsu-nashville.jpg";
import nikmatNashvilleCheeseImg from "@/assets/nikmat-nashville-cheese.jpg";

const heroSlides = [
  {
    src: heroImg,
    alt: "Rayakan dengan Crisbarbar Crisbar Whole Chicken",
    label: "crisbarbar crisbar",
  },
  {
    src: nikmatNashvilleCheeseImg,
    alt: "Menu Nikmat Nashville Cheese Crisbar",
    label: "nikmat nashville cheese",
  },
  {
    src: chickenKatsuNashvilleImg,
    alt: "Chicken Katsu Nashville Crisbar",
    label: "chicken katsu nashville",
  },
  {
    src: ayamGeprekSambalIjoImg,
    alt: "Ayam Geprek Sambal Ijo Crisbar",
    label: "ayam geprek sambal ijo",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crisbar — Nikmati Menu Favoritmu & Kumpulkan Poinnya!" },
      {
        name: "description",
        content:
          "Pilih menu kesukaanmu dan kumpulin poin di setiap pesanan buat dituker dengan hadiah seru selanjutnya.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = heroSlides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((slide) => (slide + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="px-4">
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl mt-10 rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-border">
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
        <Sparkles
          aria-hidden
          className="absolute bottom-8 right-1/4 h-8 w-8 -rotate-12 opacity-40 -z-10 text-primary"
        />
        <div aria-hidden className="absolute top-1/2 left-4 text-3xl opacity-30 -z-10">
          🌟
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center p-6 md:p-12">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-bold text-primary shadow-(--shadow-pop)">
              <Coins className="h-4 w-4" /> Crisbar Rewards
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-[1.05] tracking-tight text-foreground">
              Nikmati <span className="text-primary">Menu</span> Favoritmu & Kumpulkan{" "}
              <span className="text-[oklch(0.65_0.2_45)]">Poinnya!</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Pilih menu kesukaanmu dan kumpulin poin di setiap pesanan buat dituker dengan hadiah
              seru selanjutnya.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-7 shadow-(--shadow-pop)"
              >
                <Link to="/menu">
                  <UtensilsCrossed className="h-5 w-5" /> Lihat Menu
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full h-12 px-7 font-bold border-2 bg-card hover:bg-secondary"
              >
                <Link to="/login">
                  <LogIn className="h-5 w-5" /> Login untuk Cek Poin
                </Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-2">
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
            <div className="relative">
              <div className="absolute -inset-x-4 -inset-y-2 rounded-3xl md:rounded-[3rem] rotate-[7deg] bg-secondary/70" />
              <div className="absolute -inset-x-5 -inset-y-3 rounded-3xl md:rounded-[3rem] -rotate-[6deg] bg-accent/70" />
              <div className="absolute -inset-x-3 -inset-y-4 rounded-3xl md:rounded-[3rem] rotate-[4deg] bg-primary/25" />
              <div className="absolute -inset-x-2 -inset-y-2 rounded-3xl md:rounded-[3rem] -rotate-[3deg] bg-card/90" />
              <img
                src={currentSlide.src}
                alt={currentSlide.alt}
                width={1024}
                height={1024}
                className="relative mx-auto aspect-square w-[94%] rounded-2xl object-cover shadow-(--shadow-soft) transition-opacity duration-500 md:rounded-[1.75rem]"
              />
              <div className="absolute -bottom-3 -left-3 rounded-2xl bg-card px-4 py-2.5 shadow-(--shadow-soft) border border-border -rotate-6">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Best Seller
                </p>
                <p className="text-base font-black uppercase text-primary">{currentSlide.label}</p>
              </div>
            </div>
            <div className="relative mt-9 flex justify-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  aria-label={`Tampilkan ${slide.label}`}
                  aria-current={activeSlide === index}
                  onClick={() => setActiveSlide(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    activeSlide === index ? "bg-[#fddd0d]" : "bg-muted-foreground/35"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl mt-14 md:mt-24 grid md:grid-cols-3 gap-6">
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
            className="rounded-3xl bg-card p-7 border border-border shadow-(--shadow-soft) hover:-translate-y-1 transition-transform"
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
      <section className="mx-auto max-w-6xl mt-14 md:mt-24">
        <div className="rounded-3xl md:rounded-[3rem] p-6 sm:p-10 md:p-16 text-center bg-[#fddd0d]">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            BIG ORDER BIG UNTUNG 📦🎉
          </h2>
          <p className="text-foreground/80 text-lg mb-7 max-w-xl mx-auto">
            Temukan outlet terdekat dan nikmati promo spesial hari ini.
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-7 shadow-(--shadow-pop)"
            >
              <Link to="/lokasi">
                <MapPin className="h-5 w-5" /> Cari Lokasi
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-full h-12 px-7 font-bold border-2 bg-card hover:bg-card/80"
            >
              <Link to="/dashboard">Tukar Sekarang</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
