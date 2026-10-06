import { useEffect, useRef, useState } from "react";
import heroBanner from "@/assets/banners/hero_banner.png";

// Data sementara sampai tersambung ke API; semua slide masih memakai gambar yang sama
const banners = [
  {
    id: 1,
    image: heroBanner,
    alt: "Crisbar Rewards: makan enak, poin nambah. Bonus 2x poin tiap Jumat.",
  },
  {
    id: 2,
    image: heroBanner,
    alt: "Crisbar Rewards: makan enak, poin nambah. Bonus 2x poin tiap Jumat.",
  },
  {
    id: 3,
    image: heroBanner,
    alt: "Crisbar Rewards: makan enak, poin nambah. Bonus 2x poin tiap Jumat.",
  },
];

const AUTOPLAY_MS = 5000;

const scrollToSlide = (track: HTMLDivElement | null, index: number) => {
  track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
};

const BannerSlider = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Geser otomatis. Timer diulang tiap slide berganti, jadi geseran manual
  // tidak langsung ditimpa; berhenti selama banner disentuh atau di-hover.
  useEffect(() => {
    if (banners.length < 2 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      scrollToSlide(trackRef.current, (activeIndex + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <section aria-roledescription="carousel" aria-label="Promo Crisbar">
      {/* Geser pakai scroll-snap bawaan browser supaya swipe terasa natural */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onPointerEnter={() => setIsPaused(true)}
        onPointerLeave={() => setIsPaused(false)}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} dari ${banners.length}`}
            className="w-full shrink-0 snap-center"
          >
            {/* Gambar asli 1290x900; dipangkas ke 43/25 dengan fokus agak ke bawah
                supaya yang terbuang pita merah kosong di atas, bukan isi banner */}
            <img
              src={banner.image}
              alt={banner.alt}
              className="aspect-43/25 w-full object-cover object-[50%_67%]"
            />
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="mt-2 flex justify-center">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => scrollToSlide(trackRef.current, index)}
              aria-label={`Tampilkan banner ${index + 1}`}
              aria-current={index === activeIndex ? true : undefined}
              className="cursor-pointer p-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-5 bg-chocolate"
                    : "w-1.5 bg-chocolate/20"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default BannerSlider;
