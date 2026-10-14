import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type {
  AdjustPointType,
  ParamsAdjustPoint,
} from "@/services/customers";

export type AdjustPointValues = Omit<ParamsAdjustPoint, "customer_id">;

const ADJUST_TYPES: { value: AdjustPointType; label: string }[] = [
  { value: "add", label: "Add" },
  { value: "subtract", label: "Subtract" },
];

const inputClassName =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange";

type AdjustPointModalProps = {
  currentPoints: number;
  isPending?: boolean;
  error?: string;
  onSubmit: (values: AdjustPointValues) => void;
  onClose: () => void;
};

const AdjustPointModal = ({
  currentPoints,
  isPending = false,
  error: submitError,
  onSubmit,
  onClose,
}: AdjustPointModalProps) => {
  const [typeAdjust, setTypeAdjust] = useState<AdjustPointType>("add");
  const [points, setPoints] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const error = formError ?? submitError;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const pointAdjustment = Number(points);
    if (!Number.isInteger(pointAdjustment) || pointAdjustment <= 0) {
      setFormError("Poin harus berupa bilangan bulat lebih dari 0.");
      return;
    }
    // Poin customer tidak boleh menjadi minus
    if (typeAdjust === "subtract" && pointAdjustment > currentPoints) {
      setFormError("Poin yang dikurangi melebihi poin customer saat ini.");
      return;
    }
    setFormError(null);
    onSubmit({
      type: typeAdjust,
      point: pointAdjustment,
      // Backend menolak notes kosong, jadi hanya dikirim jika diisi
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-point-title"
        className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white shadow-md"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
          <h3
            id="adjust-point-title"
            className="text-lg font-bold text-chocolate"
          >
            Adjust Points
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid max-h-[60dvh] grid-cols-1 gap-4 overflow-y-auto p-4 sm:max-h-[65vh] sm:grid-cols-2 sm:p-6">
            {/* Poin customer saat ini */}
            <div className="col-span-1 flex items-center justify-between gap-4 rounded-2xl bg-gray-100 px-5 py-6 sm:col-span-2 sm:px-8">
              <span className="font-semibold text-chocolate">
                Current Points
              </span>
              <span className="text-xl font-bold text-orange sm:text-2xl">
                {currentPoints.toLocaleString("id-ID")} Points
              </span>
            </div>

            <div className="col-span-1">
              <label
                htmlFor="adjust-point-type"
                className="font-semibold text-sm"
              >
                Adjust Type
              </label>
              <div className="relative">
                <select
                  id="adjust-point-type"
                  value={typeAdjust}
                  onChange={(event) => {
                    setTypeAdjust(event.target.value as AdjustPointType);
                    setFormError(null);
                  }}
                  className={`${inputClassName} cursor-pointer appearance-none pr-10`}
                >
                  {ADJUST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-chocolate"
                />
              </div>
            </div>

            <div className="col-span-1">
              <label
                htmlFor="adjust-point-value"
                className="font-semibold text-sm"
              >
                Points
              </label>
              <input
                id="adjust-point-value"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                max={typeAdjust === "subtract" ? currentPoints : undefined}
                value={points}
                onChange={(event) => {
                  setPoints(event.target.value);
                  setFormError(null);
                }}
                className={inputClassName}
                required
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label
                htmlFor="adjust-point-notes"
                className="font-semibold text-sm"
              >
                Notes
              </label>
              <textarea
                id="adjust-point-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                maxLength={255}
                className={`${inputClassName} resize-y`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 p-4 sm:p-6">
            {error && <p className="mr-auto text-sm text-red-500">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer rounded-3xl border border-gray-200 py-2 px-5 text-sm font-semibold transition-colors hover:bg-cream"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Menyimpan..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustPointModal;
