import { useEffect, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { useLocations } from "@/hooks/use-locations";
import { fieldBoxClass, fieldInputClass } from "./fieldStyles";

// id = runchise_id outlet, dipakai sebagai location_id saat register
export type SelectedOutlet = { id: number; name: string };

type OutletSelectProps = {
  id: string;
  value: SelectedOutlet | null;
  onChange: (outlet: SelectedOutlet | null) => void;
  invalid?: boolean;
};

// Daftar outlet hasil search server; di-mount hanya saat daftar terbuka
const OutletOptions = ({
  search,
  value,
  onSelect,
}: {
  search: string;
  value: SelectedOutlet | null;
  onSelect: (outlet: SelectedOutlet) => void;
}) => {
  const { data, isLoading, isFetching, error } = useLocations({
    take: 20,
    query: search,
    // Central kitchen dan tipe lokasi lain bukan outlet yang bisa dipilih customer
    branch_type: "outlet",
  });

  // Register butuh runchise_id → outlet tanpa runchise_id tidak bisa dipilih
  const outlets = (data?.locations ?? []).filter(
    (outlet) => outlet.runchise_id != null,
  );

  if (isLoading) {
    return <p className="px-3 py-2.5 text-sm text-muted">Memuat outlet...</p>;
  }
  if (error) {
    return (
      <p className="px-3 py-2.5 text-sm text-berry-red">
        Gagal memuat outlet: {error.message}
      </p>
    );
  }
  if (outlets.length === 0) {
    return (
      <p className="px-3 py-2.5 text-sm text-muted">Outlet tidak ditemukan</p>
    );
  }

  return (
    <div className={isFetching ? "opacity-60" : ""}>
      {outlets.map((outlet) => {
        const isSelected = value?.id === outlet.runchise_id;
        return (
          <button
            key={outlet.runchise_id}
            type="button"
            onClick={() =>
              onSelect({ id: outlet.runchise_id, name: outlet.name })
            }
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-chocolate/5 ${
              isSelected ? "bg-chocolate/5" : ""
            }`}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-chocolate">
                {outlet.name}
              </span>
              {outlet.city && (
                <span className="truncate text-xs text-muted">
                  {outlet.city}
                </span>
              )}
            </span>
            {isSelected && (
              <Check size={16} className="shrink-0 text-berry-red" />
            )}
          </button>
        );
      })}
    </div>
  );
};

// Pencarian outlet (nama / kota) dengan daftar hasil di bawah input
const OutletSelect = ({ id, value, onChange, invalid }: OutletSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Tunda request search sampai user berhenti mengetik
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Tutup daftar saat klik di luar komponen
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
    <div ref={containerRef}>
      <div className={fieldBoxClass(invalid)}>
        <Search size={18} className="ml-3.5 shrink-0 text-muted/60" />
        <input
          id={id}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            // Mengetik ulang berarti pilihan sebelumnya tidak berlaku lagi
            onChange(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          className={`${fieldInputClass} pl-2.5`}
          placeholder="Cari nama outlet atau kota"
        />
        {value && !isOpen && (
          <Check size={18} className="mr-3.5 shrink-0 text-success" />
        )}
      </div>

      {isOpen && (
        <div className="mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-chocolate/15 bg-white p-1 shadow-[0_8px_24px_rgb(54_23_21/0.08)]">
          <OutletOptions
            search={debouncedSearch}
            value={value}
            onSelect={(outlet) => {
              onChange(outlet);
              setSearch(outlet.name);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OutletSelect;
