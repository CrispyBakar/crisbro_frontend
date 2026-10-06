import { LoaderCircle, LocateFixed } from "lucide-react";
import OutletCard, { OutletCardSkeleton } from "@/components/OutletCard";
import { useOutlets } from "@/hooks/use-locations";
import { useUserPosition } from "@/hooks/use-user-position";
import { distanceKm, formatDistance } from "@/lib/geo";
import { normalizeCity, outletCoordinates, outletMapsUrl } from "@/lib/outlets";
import SectionHeader from "./SectionHeader";

const OUTLET_COUNT = 3;

const messageClass = "mt-4 text-sm text-muted";

type HomeOutletsProps = {
  // runchise_id outlet tempat member terdaftar; kosong untuk tamu
  registeredOutletId?: number | null;
};

// Tiga outlet terdekat di beranda; daftar lengkapnya ada di halaman Lokasi Outlet
const HomeOutlets = ({ registeredOutletId }: HomeOutletsProps) => {
  const { data: outlets, isPending, isError } = useOutlets();
  const { position, locate } = useUserPosition();

  // Titik acuan "terdekat": posisi perangkat. Selama posisi belum diketahui,
  // dipakai outlet tempat member terdaftar supaya daftarnya tetap relevan.
  const registeredOutlet = outlets?.find(
    (outlet) => outlet.runchise_id === registeredOutletId,
  );
  const reference =
    position ?? (registeredOutlet ? outletCoordinates(registeredOutlet) : null);

  const nearestOutlets = (outlets ?? [])
    .map((outlet) => {
      const coordinates = outletCoordinates(outlet);
      return {
        outlet,
        distance:
          reference && coordinates ? distanceKm(reference, coordinates) : null,
      };
    })
    // Tanpa titik acuan urutan dari API (kota, lalu nama) dipertahankan
    .sort((a, b) =>
      reference ? (a.distance ?? Infinity) - (b.distance ?? Infinity) : 0,
    )
    .slice(0, OUTLET_COUNT);

  const subtitle = position
    ? "Terdekat dari lokasi kamu"
    : registeredOutlet
      ? "Terdekat dari outlet pilihan kamu"
      : "Kunjungi outlet terdekat";

  const renderContent = () => {
    if (isPending) {
      return (
        <div
          role="status"
          aria-label="Memuat outlet"
          className="mt-4 flex animate-pulse flex-col gap-3"
        >
          <OutletCardSkeleton />
          <OutletCardSkeleton />
        </div>
      );
    }

    if (isError) {
      return <p className={messageClass}>Outlet belum bisa dimuat.</p>;
    }

    if (nearestOutlets.length === 0) {
      return <p className={messageClass}>Belum ada outlet.</p>;
    }

    return (
      <>
        {/* Izin lokasi hanya diminta saat tombol ini ditekan */}
        {!position && (
          <button
            type="button"
            onClick={() => locate.mutate()}
            disabled={locate.isPending}
            className="mt-3 flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-chocolate transition-colors hover:bg-chocolate/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locate.isPending ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <LocateFixed size={14} />
            )}
            Gunakan lokasi saya
          </button>
        )}
        {!position && locate.isError && (
          <p role="alert" className="mt-2 text-xs text-berry-red">
            Lokasi kamu tidak bisa diakses. Izinkan akses lokasi di browser,
            lalu coba lagi.
          </p>
        )}

        <div className="mt-3 flex flex-col gap-3">
          {nearestOutlets.map(({ outlet, distance }) => (
            <OutletCard
              key={outlet.location_id}
              city={normalizeCity(outlet.city)}
              name={outlet.name}
              address={outlet.shipping_address}
              mapsUrl={outletMapsUrl(outlet)}
              // Jarak hanya ditampilkan bila dihitung dari posisi customer sendiri
              distance={
                position && distance !== null
                  ? formatDistance(distance)
                  : undefined
              }
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <section>
      <SectionHeader
        title="Makan dine in lebih nikmat"
        subtitle={subtitle}
        endpoint="/locations"
      />
      {renderContent()}
    </section>
  );
};

export default HomeOutlets;
