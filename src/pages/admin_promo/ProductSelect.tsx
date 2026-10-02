import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useProducts } from "@/hooks/use-products";

export type SelectedProduct = { id: number; name: string };

type ProductSelectProps = {
  value: SelectedProduct | null;
  onChange: (product: SelectedProduct) => void;
  // runchise_id produk yang sudah dipilih di baris lain
  excludedIds: Set<number>;
  placeholder?: string;
};

// Daftar produk hasil search server; di-mount hanya saat dropdown terbuka
// agar tiap baris tidak memanggil API sebelum dibutuhkan.
const ProductOptions = ({
  search,
  value,
  excludedIds,
  onSelect,
}: {
  search: string;
  value: SelectedProduct | null;
  excludedIds: Set<number>;
  onSelect: (product: SelectedProduct) => void;
}) => {
  const { data, isLoading, isFetching, error } = useProducts({
    take: 20,
    search,
    status: "activated",
    sort_by: "name",
    order_by: "asc",
  });

  // Payload diteruskan apa adanya ke Runchise → hanya produk yang punya runchise_id
  const products = (data?.products ?? []).filter(
    (product) => product.runchise_id != null,
  );

  if (isLoading) {
    return <p className="px-1 py-2 text-sm text-gray-400">Memuat produk...</p>;
  }
  if (error) {
    return (
      <p className="px-1 py-2 text-sm text-red-500">
        Gagal memuat produk: {error.message}
      </p>
    );
  }
  if (products.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-gray-400">Produk tidak ditemukan</p>
    );
  }

  return (
    <div className={isFetching ? "opacity-60" : ""}>
      {products.map((product) => {
        const isSelected = value?.id === product.runchise_id;
        const isUsed = !isSelected && excludedIds.has(product.runchise_id);
        return (
          <button
            key={product.runchise_id}
            type="button"
            disabled={isUsed}
            onClick={() =>
              onSelect({ id: product.runchise_id, name: product.name })
            }
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-2.5 text-left text-sm transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent ${
              isSelected ? "font-medium text-orange" : ""
            }`}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{product.name}</span>
              {product.sku && (
                <span className="text-xs text-gray-400">#{product.sku}</span>
              )}
            </span>
            {isSelected && <Check size={16} className="shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

// Dropdown produk dengan search (nama / SKU) untuk Specific Products
const ProductSelect = ({
  value,
  onChange,
  excludedIds,
  placeholder = "Select product(s)",
}: ProductSelectProps) => {
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
              placeholder="Search product name or SKU"
              className="w-full rounded-xl border border-orange bg-white py-2.5 pr-3 pl-10 text-sm placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            <ProductOptions
              search={debouncedSearch}
              value={value}
              excludedIds={excludedIds}
              onSelect={(product) => {
                onChange(product);
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelect;
