import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type OrderTypeOption = { id: number; name: string };

type OrderTypeSelectProps = {
  value: number[];
  onChange: (ids: number[]) => void;
  options: OrderTypeOption[];
  placeholder?: string;
};

// Dropdown multi-select order type dengan search → order_type_ids
const OrderTypeSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select order type",
}: OrderTypeSelectProps) => {
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

  const selectedIds = new Set(value);
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const triggerText = options
    .filter((option) => selectedIds.has(option.id))
    .map((option) => option.name)
    .join(", ");

  const toggleOption = (id: number) =>
    onChange(
      selectedIds.has(id)
        ? value.filter((selectedId) => selectedId !== id)
        : [...value, id],
    );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition-colors ${
          isOpen ? "border-orange" : "border-gray-200"
        }`}
      >
        <span
          className={`truncate ${triggerText ? "text-black" : "text-gray-400"}`}
        >
          {triggerText || placeholder}
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
              className="w-full rounded-xl border border-orange bg-white py-2.5 pr-3 pl-10 text-sm focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-1 py-2 text-sm text-gray-400">
                Tidak ada order type
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedIds.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-1 py-2.5 text-left text-sm transition-colors hover:bg-cream ${
                      isSelected ? "font-medium text-orange" : ""
                    }`}
                  >
                    {option.name}
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTypeSelect;
