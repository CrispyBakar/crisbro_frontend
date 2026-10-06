import { useEffect, useRef, useState } from "react";
import { LoaderCircle, LocateFixed, MapPin, Search, X } from "lucide-react";
import { useSearchParams } from "react-router";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import FilterPill from "@/components/FilterPill";
import OutletCard, { OutletCardSkeleton } from "@/components/OutletCard";
import StateMessage from "@/components/StateMessage";
import { useOutlets } from "@/hooks/use-locations";
import { usePageTitle } from "@/hooks/use-page-title";
import { useUserPosition } from "@/hooks/use-user-position";
import { distanceKm, formatDistance } from "@/lib/geo";
import { normalizeCity, outletCoordinates, outletMapsUrl } from "@/lib/outlets";
import { fieldBoxClass, fieldInputClass } from "@/pages/auth/fieldStyles";

const CITY_PARAM = "kota";

const CustomerLocationsPage = () => {
  usePageTitle("Lokasi Outlet");

  const [search, setSearch] = useState<string>("");
  // Urutan terdekat otomatis aktif begitu posisi diketahui, kecuali dimatikan
  const [isNearestOff, setIsNearestOff] = useState<boolean>(false);
  const { position, locate } = useUserPosition();
  const sortByNearest = Boolean(position) && !isNearestOff;

  // Kota terpilih disimpan di URL supaya bertahan saat refresh
  const [searchParams, setSearchParams] = useSearchParams();
  const changeCity = (city: string | null) => {
    setSearchParams(city ? { [CITY_PARAM]: city } : {}, { replace: true });
  };

  const outletsQuery = useOutlets();

  // Kota terpilih bisa berada di luar layar (misalnya dibuka dari URL), jadi
  // deretan kota digeser sampai pill yang aktif terlihat
  const cityListRef = useRef<HTMLDivElement>(null);
  const cityParam = searchParams.get(CITY_PARAM);
  const isLoaded = outletsQuery.isSuccess;
  useEffect(() => {
    if (!isLoaded) return;
    cityListRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [cityParam, isLoaded]);

  // Izin lokasi hanya diminta saat tombol ditekan, bukan saat halaman dibuka
  const handleNearest = () => {
    if (!position) {
      setIsNearestOff(false);
      locate.mutate();
      return;
    }
    setIsNearestOff((previous) => !previous);
  };

  const renderContent = () => {
    if (outletsQuery.isPending) {
      return (
        <div
          role="status"
          aria-label="Memuat lokasi outlet"
          className="flex animate-pulse flex-col gap-3"
        >
          <OutletCardSkeleton />
          <OutletCardSkeleton />
          <OutletCardSkeleton />
        </div>
      );
    }

    if (outletsQuery.isError) {
      return (
        <StateMessage
          icon={MapPin}
          title="Lokasi outlet gagal dimuat"
          description={outletsQuery.error.message}
          actionLabel="Coba lagi"
          onAction={() => outletsQuery.refetch()}
        />
      );
    }

    const outlets = outletsQuery.data.map((outlet) => {
      const coordinates = outletCoordinates(outlet);
      return {
        ...outlet,
        cityLabel: normalizeCity(outlet.city),
        distance:
          position && coordinates ? distanceKm(position, coordinates) : null,
      };
    });

    if (outlets.length === 0) {
      return (
        <StateMessage
          icon={MapPin}
          title="Belum ada outlet"
          description="Daftar outlet Crisbar akan muncul di sini."
        />
      );
    }

    // Kota dengan outlet terbanyak tampil lebih dulu
    const cityCounts = new Map<string, number>();
    for (const outlet of outlets) {
      cityCounts.set(
        outlet.cityLabel,
        (cityCounts.get(outlet.cityLabel) ?? 0) + 1,
      );
    }
    const cities = [...cityCounts.entries()].sort(
      ([cityA, countA], [cityB, countB]) =>
        countB - countA || cityA.localeCompare(cityB),
    );

    // Nilai kota di URL yang tidak dikenal dianggap "Semua"
    const selectedCity =
      cityParam && cityCounts.has(cityParam) ? cityParam : null;
    const keyword = search.trim().toLowerCase();

    const visibleOutlets = outlets
      .filter((outlet) => !selectedCity || outlet.cityLabel === selectedCity)
      .filter(
        (outlet) =>
          !keyword ||
          [outlet.name, outlet.cityLabel, outlet.shipping_address].some(
            (text) => text?.toLowerCase().includes(keyword),
          ),
      )
      .sort((a, b) =>
        sortByNearest
          ? // Outlet tanpa koordinat ditaruh paling akhir
            (a.distance ?? Infinity) - (b.distance ?? Infinity)
          : a.cityLabel.localeCompare(b.cityLabel) ||
            a.name.localeCompare(b.name),
      );

    return (
      <>
        <div className={fieldBoxClass()}>
          <Search size={18} className="ml-3.5 shrink-0 text-muted/60" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Cari outlet"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama outlet atau alamat"
            className={`${fieldInputClass} pl-2.5`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Hapus pencarian"
              className="mr-1.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-chocolate/5"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* -mx-4 + px-4: deretan kota bisa digeser sampai ke tepi layar */}
        <div
          ref={cityListRef}
          className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <FilterPill
            label="Semua"
            count={outlets.length}
            active={!selectedCity}
            onClick={() => changeCity(null)}
          />
          {cities.map(([city, count]) => (
            <FilterPill
              key={city}
              label={city}
              count={count}
              active={selectedCity === city}
              onClick={() => changeCity(city)}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold tracking-wider text-chocolate">
            {visibleOutlets.length} OUTLET
          </p>
          <button
            type="button"
            aria-pressed={sortByNearest}
            onClick={handleNearest}
            disabled={locate.isPending}
            className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              sortByNearest
                ? "bg-chocolate text-white"
                : "border border-chocolate/15 bg-white text-chocolate"
            }`}
          >
            {locate.isPending ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <LocateFixed size={14} />
            )}
            {sortByNearest ? "Diurutkan terdekat" : "Urutkan terdekat"}
          </button>
        </div>
        {!position && locate.isError && (
          <p role="alert" className="mt-2 text-xs text-berry-red">
            Lokasi kamu tidak bisa diakses. Izinkan akses lokasi di browser,
            lalu coba lagi.
          </p>
        )}

        {visibleOutlets.length === 0 ? (
          <div className="mt-3">
            <StateMessage
              icon={MapPin}
              title="Outlet tidak ditemukan"
              description="Coba kata kunci lain atau lihat semua kota."
              actionLabel="Tampilkan semua outlet"
              onAction={() => {
                setSearch("");
                changeCity(null);
              }}
            />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {visibleOutlets.map((outlet) => (
              <li key={outlet.location_id}>
                <OutletCard
                  city={outlet.cityLabel}
                  name={outlet.name}
                  address={outlet.shipping_address}
                  mapsUrl={outletMapsUrl(outlet)}
                  distance={
                    outlet.distance === null
                      ? undefined
                      : formatDistance(outlet.distance)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader title="Lokasi Outlet" />
      <div className="mt-3">{renderContent()}</div>
    </div>
  );
};

export default CustomerLocationsPage;
