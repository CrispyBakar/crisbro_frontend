import { X } from "lucide-react";
import { useEffect } from "react";
import type { TableHead, TableRow } from "./GeneralTable";

type DetailDataModalProps = {
  title?: string;
  imageUrl?: string;
  // Jika tidak diberikan, kolom diturunkan dari seluruh field pada `row`.
  dataHeads?: TableHead[];
  // Field yang dilewati saat kolom diturunkan otomatis dari `row`.
  hiddenKeys?: string[];
  row: TableRow;
  onClose: () => void;
};

// `branch_type` -> "Branch Type", `runchise_id` -> "Runchise Id"
const humanizeKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

// Aman untuk nilai non-string: hindari `[object Object]` pada objek/array.
const formatValue = (value: unknown): string => {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const DetailDataModal = ({
  title = "Detail Data",
  imageUrl,
  dataHeads,
  hiddenKeys,
  row,
  onClose,
}: DetailDataModalProps) => {
  const heads: TableHead[] =
    dataHeads ??
    Object.keys(row)
      .filter((key) => !hiddenKeys?.includes(key))
      .map((key) => ({ key, label: humanizeKey(key) }));
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/45"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-lg max-h-dvh overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-black text-xl">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {imageUrl && imageUrl !== "" && (
          <div className="flex w-full justify-center items-center mt-4">
            <div className="w-36 h-36">
              <img
                src={imageUrl}
                alt=""
                className="object-cover rounded-xl w-fit h-fit"
              />
            </div>
          </div>
        )}

        {/* Detail fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-5 max-h-[70vh]">
          {heads.map((head) => {
            const value = formatValue(row[head.key]);
            return (
              <div key={head.key} className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {head.label}
                </span>
                <div className="text-sm font-semibold text-black break-words">
                  {head.render ? (
                    head.render(row)
                  ) : value ? (
                    value
                  ) : (
                    <span className="font-normal text-gray-400">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-full text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailDataModal;
