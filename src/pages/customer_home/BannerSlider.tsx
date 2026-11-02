import { useEffect, useMemo, useRef, useState } from "react";
import { getImageBanner, type Banner } from "@/services/banner";
import { useBanners, useClickBanner } from "@/hooks/use-banner";
import { useNavigate } from "react-router";
import { useCheckLocation } from "@/components/guards/CustomerDistance";
import LoadingCircle from "@/components/LoadingCircle";
import { useOutlets } from "@/hooks/use-locations";
import type { Location } from "@/services/locations";

const AUTOPLAY_MS = 5000;
const WIB_TIME_ZONE = "Asia/Jakarta";

const parseCampaignDate = (value: string | null, isEndDate = false) => {
  if (!value) return null;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const normalized = isDateOnly
    ? `${value}T${isEndDate ? "23:59:59.999" : "00:00:00"}+07:00`
    : /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
      ? value
      : `${value.replace(" ", "T")}+07:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseTimeMinutes = (value: string | null) => {
  if (!value) return null;

  const match = value.match(/(?:^|T|\s)(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/);
  if (!match) return undefined;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
};

const getWibMinutes = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: WIB_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hours = Number(parts.find((part) => part.type === "hour")?.value);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value);
  return hours * 60 + minutes;
};

const scrollToSlide = (track: HTMLDivElement | null, index: number) => {
  track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
};

interface DisplayBanner {
  id: string;
  alt: string;
  redirect_type: string;
  url: string | null;
}

function BannerImage({
  bannerId,
  alt,
  redirect_type,
  url,
  outlets,
}: {
  bannerId: string;
  alt: string;
  redirect_type: string;
  url: string | null;
  outlets: Location[];
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const { mutate: clickBanner } = useClickBanner();

  const { check, result, error, loading } = useCheckLocation();

  useEffect(() => {
    if (!result) return;

    for (const locationResult of result) {
      if (!locationResult.inRadius) continue;
      if (!locationResult.dineInUrl) {
        setLocationMessage("URL pemesanan outlet belum tersedia.");
        return;
      }
      window.location.href = locationResult.dineInUrl;
      return;
    }

    setLocationMessage(
      "Kamu harus berada dalam radius salah satu outlet untuk melanjutkan.",
    );
  }, [result]);

  useEffect(() => {
    if (error) setLocationMessage(error);
  }, [error]);

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

  const handleNavigateRedirect = ({
    redirect_type,
    url,
  }: {
    redirect_type: string;
    url: string | null;
  }) => {
    if (redirect_type === "disable") return;

    if (redirect_type === "internal" && url) {
      navigate(url as string, { replace: true });
    }

    if (redirect_type === "external" && url) {
      window.location.href = url as string;
    }

    if (redirect_type === "orderulang") {
      clickBanner(bannerId);
      setLocationMessage(null);
      check(outlets);
    }
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => handleNavigateRedirect({ redirect_type, url })}
        onKeyDown={(event) => {
          if (
            redirect_type === "orderulang" &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            check(outlets);
          }
        }}
        role={redirect_type === "orderulang" ? "button" : undefined}
        tabIndex={redirect_type === "orderulang" ? 0 : undefined}
        className={`aspect-43/25 w-full object-cover object-[50%_67%] ${
          redirect_type === "orderulang" ? "cursor-pointer" : ""
        }`}
      />
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <LoadingCircle className="h-dvh" />
        </div>
      )}
      {locationMessage && !loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setLocationMessage(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm leading-relaxed text-chocolate">
              {locationMessage}
            </p>
            <button
              type="button"
              onClick={() => setLocationMessage(null)}
              className="mt-5 h-11 w-full rounded-full bg-berry-red px-4 text-sm font-bold text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const BannerSlider = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [scheduleTime, setScheduleTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setScheduleTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: rawBanners } = useBanners();
  const { data: outlets = [] } = useOutlets();

  const banners: DisplayBanner[] = useMemo(() => {
    const nowMinutes = getWibMinutes(scheduleTime);

    return (
      rawBanners?.flatMap((v: Banner) => {
        if (v.status !== "active") return [];

        if (v.type === "campaign") {
          const start = parseCampaignDate(v.start_date);
          const end = parseCampaignDate(v.end_date, true);
          if (start === undefined || end === undefined) return [];
          if (start && scheduleTime < start) return [];
          if (end && scheduleTime >= end) return [];
        } else if (v.type === "default") {
          const startMin = parseTimeMinutes(v.start_time);
          const endMin = parseTimeMinutes(v.end_time);
          if (startMin === undefined || endMin === undefined) return [];

          if (startMin !== null && endMin !== null) {
            const inRange =
              startMin <= endMin
                ? nowMinutes >= startMin && nowMinutes < endMin
                : nowMinutes >= startMin || nowMinutes < endMin;
            if (!inRange) return [];
          } else if (startMin !== null && nowMinutes < startMin) {
            return [];
          } else if (endMin !== null && nowMinutes >= endMin) {
            return [];
          }
        } else {
          return [];
        }

        return [
          {
            id: String(v.banner_id),
            alt: v.title,
            redirect_type: v.redirect_type,
            url: v.url,
          },
        ];
      }) ?? []
    );
  }, [rawBanners, scheduleTime]);

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
    <>
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold leading-tight text-chocolate">
          Spesial crisbro member
        </h2>
      </div>

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
              <BannerImage
                bannerId={banner.id}
                alt={banner.alt}
                redirect_type={banner.redirect_type}
                url={banner.url}
                outlets={outlets}
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
    </>
  );
};

export default BannerSlider;
