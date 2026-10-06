import { Check } from "lucide-react";

type FilterPillProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

// Tombol filter berbentuk pill dengan jumlah item; yang aktif berwarna merah
const FilterPill = ({ label, count, active, onClick }: FilterPillProps) => {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap transition-colors ${
        active
          ? "bg-berry-red text-white"
          : "border border-border bg-white text-chocolate"
      }`}
    >
      {active && <Check size={16} strokeWidth={3} />}
      {label}
      <span
        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-extrabold ${
          active ? "bg-white/25" : "bg-input text-berry-red"
        }`}
      >
        {count}
      </span>
    </button>
  );
};

export default FilterPill;
