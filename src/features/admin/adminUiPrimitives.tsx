import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortState } from "./adminFormatters";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// H-5: primitif UI generik yang dipakai lebih dari satu tab AdminPage,
// diekstrak ke modul bersama agar tab yang dipecah jadi lazy component
// terpisah (mis. AdminActivityTab.tsx) tidak perlu meng-import balik dari
// AdminPage.tsx (yang akan membuat siklus impor) maupun menduplikasi
// implementasinya.

export function RequiredLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <>
      {label}
      {required && (
        <span className="ml-1 text-destructive" aria-label="wajib diisi">
          *
        </span>
      )}
    </>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft) ${className}`}
    >
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

// `placeholder` ikut didukung karena beberapa pemanggil (filter Action/Entity
// di tab activity, pencarian transaksi) sudah melewatkannya -- sebelumnya prop
// itu tidak ada di tipe sehingga diam-diam dibuang dan placeholder tidak
// pernah tampil.
export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="mb-3 block text-sm font-bold">
      <RequiredLabel label={label} required={required} />
      <input
        type={type}
        value={value}
        required={required}
        aria-required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-medium"
      />
    </label>
  );
}

// M-10: pembungkus tipis di atas primitive Radix Select (lihat
// src/components/ui/select.tsx) yang sudah menangani seluruh interaksi
// keyboard/ARIA bawaan. Radix Select.Item tidak mengizinkan value=""
// (dipakai Radix sebagai penanda "belum ada yang dipilih"), sedangkan
// filter seperti "Semua outlet" memang memakai string kosong untuk berarti
// "tanpa filter" -- jadi dipetakan bolak-balik ke SELECT_EMPTY_VALUE secara
// transparan di sini, pemanggil tetap bekerja dengan string kosong.
const SELECT_EMPTY_VALUE = "__crisbar_select_empty__";

export function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="mb-3 block text-sm font-bold text-foreground">
      <span className="mb-1.5 block text-xs font-black uppercase text-muted-foreground">
        <RequiredLabel label={label} required={required} />
      </span>
      <SelectRoot
        value={value === "" ? SELECT_EMPTY_VALUE : value}
        onValueChange={(next) => onChange(next === SELECT_EMPTY_VALUE ? "" : next)}
      >
        <SelectTrigger aria-required={required}>
          <SelectValue placeholder="Pilih opsi" />
        </SelectTrigger>
        <SelectContent>
          {(options ?? []).map((option) => (
            <SelectItem
              key={option.value === "" ? SELECT_EMPTY_VALUE : option.value}
              value={option.value === "" ? SELECT_EMPTY_VALUE : option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </label>
  );
}

export function TableScrollArea({
  children,
  maxHeight,
  className = "",
}: {
  children: ReactNode;
  maxHeight?: number;
  className?: string;
}) {
  return (
    <div
      className={`table-scroll-area -mx-1 min-w-0 max-w-full overflow-auto overscroll-x-contain overscroll-y-auto px-1 pb-3 ${
        maxHeight ? "" : "max-h-[70dvh]"
      } ${className}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
}

export function SortableHeader<T extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className = "p-2",
}: {
  label: string;
  sortKey: T;
  sort: SortState<T>;
  onSort: (sortKey: T) => void;
  className?: string;
}) {
  const active = sort.sort_by === sortKey;
  const Icon = active ? (sort.sort_order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className={className}
      aria-sort={active ? (sort.sort_order === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 rounded-md text-left font-black transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 ${
          active ? "text-primary" : ""
        }`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </th>
  );
}
