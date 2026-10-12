import { useState } from "react";
import { MapPin } from "lucide-react";
import { Link } from "react-router";
import { useOutlets } from "@/hooks/use-locations";
import { normalizeCity } from "@/lib/outlets";

// Daftar yang lebih panjang dari ini diringkas dulu supaya halaman tidak
// didominasi nama outlet
const VISIBLE_OUTLETS = 5;

const messageClass = "mt-2 text-sm leading-relaxed text-muted";

type VoucherOutletsProps = {
  // location_ids promo: location_id outlet tempat voucher berlaku
  locationIds: string[];
};

// Outlet tempat voucher bisa dipakai; promo tidak selalu berlaku di semua outlet
const VoucherOutlets = ({ locationIds }: VoucherOutletsProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const outletsQuery = useOutlets();

  const renderContent = () => {
    if (outletsQuery.isPending) {
      return <p className={messageClass}>Memuat outlet...</p>;
    }

    if (outletsQuery.isError) {
      return <p className={messageClass}>Daftar outlet gagal dimuat.</p>;
    }

    // location_ids juga bisa memuat lokasi non-outlet (mis. central kitchen)
    // atau lokasi yang sudah dihapus; yang ditampilkan hanya outlet yang ada
    const outlets = outletsQuery.data;
    const validOutlets = outlets.filter((outlet) =>
      locationIds.includes(outlet.location_id),
    );

    if (validOutlets.length === 0) {
      return <p className={messageClass}>Informasi outlet belum tersedia.</p>;
    }

    if (outlets.length > 1 && validOutlets.length === outlets.length) {
      return (
        <p className={messageClass}>
          Berlaku di semua outlet Crisbar.{" "}
          <Link to="/locations" className="font-semibold text-berry-red">
            Lihat lokasi outlet
          </Link>
        </p>
      );
    }

    const visibleOutlets = isExpanded
      ? validOutlets
      : validOutlets.slice(0, VISIBLE_OUTLETS);

    return (
      <>
        <ul className="mt-2 divide-y divide-chocolate/10 rounded-2xl border border-chocolate/10 bg-white px-4">
          {visibleOutlets.map((outlet) => (
            <li
              key={outlet.location_id}
              className="flex items-center gap-3 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-input text-berry-red">
                <MapPin size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-chocolate">
                  {outlet.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {normalizeCity(outlet.city)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {validOutlets.length > VISIBLE_OUTLETS && (
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="mt-2 cursor-pointer text-sm font-semibold text-berry-red"
          >
            {isExpanded
              ? "Tampilkan lebih sedikit"
              : `Lihat semua ${validOutlets.length} outlet`}
          </button>
        )}
      </>
    );
  };

  return (
    <section className="mt-6">
      <h2 className="text-xs font-extrabold tracking-wider text-muted">
        BERLAKU DI OUTLET
      </h2>
      {renderContent()}
    </section>
  );
};

export default VoucherOutlets;
