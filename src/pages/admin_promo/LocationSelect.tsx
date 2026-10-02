import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useLocations } from "@/hooks/use-locations";

export type SelectedLocation = { id: number; name: string };

type LocationSelectProps = {
  label: string;
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
  placeholder?: string;
};

// Daftar lokasi hasil search server; di-mount hanya saat dropdown terbuka
const LocationOptions = ({
  search,
  value,
  onSelect,
}: {
  search: string;
  value: SelectedLocation | null;
  onSelect: (location: SelectedLocation) => void;
}) => {
  const { data, isLoading, isFetching, error } = useLocations({
    take: 20,
    query: search,
  });

  // Payload diteruskan apa adanya ke Runchise → hanya lokasi yang punya runchise_id
  const locations = (data?.locations ?? []).filter(
    (location) => location.runchise_id != null,
  );

  if (isLoading) {
    return <p className="px-1 py-2 text-sm text-gray-400">Memuat lokasi...</p>;
  }
  if (error) {
    return (
      <p className="px-1 py-2 text-sm text-red-500">
        Gagal memuat lokasi: {error.message}
      </p>
    );
  }
  if (locations.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-gray-400">Lokasi tidak ditemukan</p>
    );
  }

  return (
    <div className={isFetching ? "opacity-60" : ""}>
      {locations.map((location) => {
        const isSelected = value?.id === location.runchise_id;
        return (
          <button
            key={location.runchise_id}
            type="button"
            onClick={() =>
              onSelect({ id: location.runchise_id, name: location.name })
            }
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-2.5 text-left text-sm transition-colors hover:bg-cream ${
              isSelected ? "font-medium text-orange" : ""
            }`}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{location.name}</span>
              {location.city && (
                <span className="text-xs text-gray-400">{location.city}</span>
              )}
            </span>
            {isSelected && <Check size={16} className="shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

// Dropdown satu lokasi dengan search (nama / kota / alamat)
const LocationSelect = ({
  label,
  value,
  onChange,
  placeholder = "Pilih lokasi",
}: LocationSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Tunda request search sampai user berhenti mengetik
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Tutup dropdown saat klik di luar komponen
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <label className="font-semibold text-sm">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition-colors ${
          isOpen ? "border-orange" : "border-gray-200"
        }`}
      >
        <span className={`truncate ${value ? "text-black" : "text-gray-400"}`}>
          {value?.name ?? placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-2xl border border-gray-100 bg-white p-3 shadow-lg">
          <div className="relative mb-2">
            <Search
              size={18}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search location name"
              className="w-full rounded-xl border border-orange bg-white py-2.5 pr-3 pl-10 text-sm placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            <LocationOptions
              search={debouncedSearch}
              value={value}
              onSelect={(location) => {
                onChange(location);
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelect;
