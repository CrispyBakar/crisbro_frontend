import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export type LocationOption = { id: number; name: string };

export type LocationSelection = {
  mode: "locations" | "groups";
  selectAll: boolean;
  ids: number[];
};

type LocationMultiSelectProps = {
  label: string;
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  locations: LocationOption[];
  groups?: LocationOption[];
  isLoading?: boolean;
  disabled?: boolean;
  // Tampilkan radio Locations / Groups dan checkbox "All outlets"
  withModeAndSelectAll?: boolean;
  placeholder?: string;
};

// Dropdown multi-select lokasi bergaya Runchise: radio mode, search, checkbox list
const LocationMultiSelect = ({
  label,
  value,
  onChange,
  locations,
  groups = [],
  isLoading = false,
  disabled = false,
  withModeAndSelectAll = false,
  placeholder = "Select location(s)",
}: LocationMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

  const options = value.mode === "groups" ? groups : locations;
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selectedIds = new Set(value.ids);
  const isOpenAndEnabled = isOpen && !disabled;

  const toggleOption = (id: number) =>
    onChange({
      ...value,
      selectAll: false,
      ids: selectedIds.has(id)
        ? value.ids.filter((selectedId) => selectedId !== id)
        : [...value.ids, id],
    });

  const changeMode = (mode: LocationSelection["mode"]) =>
    onChange({ mode, selectAll: false, ids: [] });

  const reset = () => onChange({ ...value, selectAll: false, ids: [] });

  const selectedNames = options
    .filter((option) => selectedIds.has(option.id))
    .map((option) => option.name);

  const triggerText = value.selectAll
    ? "All outlets"
    : selectedNames.length > 2
      ? `${selectedNames.length} ${value.mode === "groups" ? "groups" : "locations"} selected`
      : selectedNames.join(", ");

  return (
    <div ref={containerRef} className="relative">
      <label className="font-semibold text-sm">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={disabled}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 ${
          isOpenAndEnabled ? "border-orange" : "border-gray-200"
        }`}
      >
        <span
          className={`truncate ${triggerText ? "text-black" : "text-gray-400"}`}
        >
          {triggerText || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform ${
            disabled ? "text-gray-300" : "text-gray-600"
          } ${isOpenAndEnabled ? "rotate-180" : ""}`}
        />
      </button>

      {isOpenAndEnabled && (
        <div className="absolute z-10 mt-1 w-full rounded-2xl border border-gray-100 bg-white p-3 shadow-lg">
          {withModeAndSelectAll && (
            <div className="mb-3 flex items-center gap-6">
              {(["locations", "groups"] as const).map((mode) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    checked={value.mode === mode}
                    onChange={() => changeMode(mode)}
                    className="h-4 w-4 accent-orange"
                  />
                  {mode === "locations" ? "Locations" : "Groups"}
                </label>
              ))}
            </div>
          )}

          <div className="relative mb-2">
            <Search
              size={18}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${value.mode === "groups" ? "group" : "location"} name`}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-10 text-sm placeholder:text-gray-400 focus:border-orange focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            <div className="flex items-center justify-between py-2">
              {withModeAndSelectAll ? (
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={value.selectAll}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        selectAll: event.target.checked,
                        ids: [],
                      })
                    }
                    className="h-4 w-4 accent-orange"
                  />
                  {value.mode === "groups" ? "All groups" : "All outlets"}
                </label>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer text-sm font-medium text-orange"
              >
                Reset All
              </button>
            </div>

            {isLoading ? (
              <p className="py-2 text-sm text-gray-400">Memuat...</p>
            ) : filteredOptions.length === 0 ? (
              <p className="py-2 text-sm text-gray-400">
                Tidak ada{" "}
                {value.mode === "groups" ? "grup lokasi" : "lokasi"}
              </p>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={value.selectAll || selectedIds.has(option.id)}
                    disabled={value.selectAll}
                    onChange={() => toggleOption(option.id)}
                    className="h-4 w-4 accent-orange"
                  />
                  {option.name}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMultiSelect;
