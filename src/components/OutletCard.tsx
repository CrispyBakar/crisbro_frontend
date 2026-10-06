import { ExternalLink, MapPin } from "lucide-react";

type OutletCardProps = {
  city: string;
  name: string;
  address: string;
  mapsUrl: string;
  // Jarak dari posisi customer, contoh "2,3 km"; kosong bila posisi tidak diketahui
  distance?: string;
};

const OutletCard = ({
  city,
  name,
  address,
  mapsUrl,
  distance,
}: OutletCardProps) => {
  return (
    <div className="rounded-2xl shadow-sm bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-input">
          <MapPin size={20} className="text-chocolate" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-muted">{city}</p>
            {distance && (
              <p className="shrink-0 text-xs font-bold text-chocolate">
                {distance}
              </p>
            )}
          </div>
          <h3 className="text-sm font-bold leading-snug text-chocolate">
            {name}
          </h3>
          {address && (
            <p className="mt-1 text-xs leading-relaxed text-muted">{address}</p>
          )}
        </div>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-full border border-chocolate/15 text-sm font-bold text-chocolate transition-colors hover:bg-chocolate/5"
      >
        Lihat di Maps
        <ExternalLink size={14} />
      </a>
    </div>
  );
};

// Pembungkusnya yang memberi animate-pulse dan role="status"
export const OutletCardSkeleton = () => {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-input" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-1/4 rounded-full bg-input" />
          <div className="h-4 w-1/2 rounded-full bg-input" />
          <div className="h-3 w-full rounded-full bg-input" />
        </div>
      </div>
      <div className="mt-4 h-10 rounded-full bg-input" />
    </div>
  );
};

export default OutletCard;
