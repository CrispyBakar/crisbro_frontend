import type { LucideIcon } from "lucide-react";

type StateMessageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  // Tombol aksi opsional, misalnya "Coba lagi"
  actionLabel?: string;
  onAction?: () => void;
};

// Kartu pesan untuk kondisi kosong dan error di halaman customer
const StateMessage = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: StateMessageProps) => {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-input text-berry-red">
        <Icon size={24} />
      </span>
      <h2 className="mt-4 text-base font-extrabold text-chocolate">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 flex h-11 cursor-pointer items-center justify-center rounded-full bg-berry-red px-5 text-sm font-bold text-white transition-colors hover:bg-berry-red/90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default StateMessage;
