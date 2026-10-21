import { useEffect, useMemo, useRef, useState } from "react";
import { getImageBanner, type Banner } from "@/services/banner";
import { useBanners } from "@/hooks/use-banner";

const AUTOPLAY_MS = 5000;

const scrollToSlide = (track: HTMLDivElement | null, index: number) => {
  track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
};

interface DisplayBanner {
  id: string;
  alt: string;
}

function BannerImage({ bannerId, alt }: { bannerId: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await getImageBanner(bannerId);
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        /* biarkan kosong */
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bannerId]);

  if (!src) return <div className="h-full w-full animate-pulse bg-gray-200" />;

  return (
    <img
      src={src}
      alt={alt}
      className="aspect-43/25 w-full object-cover object-[50%_67%]"
    />
  );
}

const BannerSlider = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const { data: rawBanners } = useBanners();

  const banners: DisplayBanner[] = useMemo(() => {
    const now = new Date();

    // helper: ambil menit sejak 00:00 (UTC) dari kolom Time Prisma
    const toMinutesUTC = (value: string | Date) => {
      const d = new Date(value);
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    };

    // menit sejak 00:00 untuk waktu sekarang, dalam zona yang sama dengan data (UTC)
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    return (
      rawBanners?.flatMap((v: Banner) => {
        if (v.status !== "active") return [];

        if (v.type === "temporary") {
          const start = v.start_date ? new Date(v.start_date) : null;
          const end = v.end_date ? new Date(v.end_date) : null;

          if (start && now < start) return [];
          if (end && now > end) return [];
        } else if (v.type === "default") {
          if (v.start_time && v.end_time) {
            const startMin = toMinutesUTC(v.start_time);
            const endMin = toMinutesUTC(v.end_time);

            const inRange =
              startMin <= endMin
                ? nowMinutes >= startMin && nowMinutes < endMin // contoh 08:00-17:00
                : nowMinutes >= startMin || nowMinutes < endMin; // lewat tengah malam, contoh 22:00-02:00

            if (!inRange) return [];
          }
        } else {
          return [];
        }

        return [{ id: String(v.banner_id), alt: v.title }];
      }) ?? []
    );
  }, [rawBanners]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  useEffect(() => {
    if (banners.length < 2 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      scrollToSlide(trackRef.current, (activeIndex + 1) % banners.length);
    }, AUTOPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, banners.length]);

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
            <BannerImage bannerId={banner.id} alt={banner.alt} />
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
