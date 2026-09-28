import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";

type ConfirmDialogProps = {
  title: string;
  message: React.ReactNode;
  icon?: LucideIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  // "danger" untuk aksi destruktif (logout, hapus), tombol konfirmasi merah
  variant?: "default" | "danger";
  isPending?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  title,
  message,
  icon: Icon,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  variant = "default",
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const isDanger = variant === "danger";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onCancel, isPending]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/45"
      onClick={() => !isPending && onCancel()}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 px-6 pt-7 pb-5 text-center">
          {Icon && (
            <span
              className={`flex size-14 items-center justify-center rounded-full ${
                isDanger ? "bg-berry-red/10 text-berry-red" : "bg-cream text-orange"
              }`}
            >
              <Icon size={24} />
            </span>
          )}
          <h3 className="font-bold text-black text-lg">{title}</h3>
          <div className="text-sm text-gray-500">{message}</div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 cursor-pointer rounded-3xl border border-gray-100 py-2.5 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            autoFocus
            className={`flex-1 cursor-pointer rounded-3xl py-2.5 px-5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger
                ? "bg-berry-red shadow-red-800"
                : "bg-orange shadow-amber-600 active:bg-orange-500"
            }`}
          >
            {isPending ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
