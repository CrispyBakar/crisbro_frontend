import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUploadBanners } from "@/hooks/use-banner";
import { createBannerSchema, type CreateBannerValues } from "@/schemas/banner";

const MAX_SIZE_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface UploadBannerModalProps {
  onClose: (value: boolean) => void;
}

const UploadBannerModal = ({ onClose }: UploadBannerModalProps) => {
  const { mutate, isPending, error: mutationError } = useUploadBanners();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [values, setValues] = useState<CreateBannerValues>({
    title: "",
    status: "inactive",
    type: "temporary",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED.includes(selected.type)) {
      setError("Format harus JPG, PNG, atau WEBP");
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Ukuran maksimal ${MAX_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    setError(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(selected);
    previewUrlRef.current = url;
    setFile(selected);
    setPreview(url);
  };

  const handleRemove = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const result = createBannerSchema.safeParse(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Data banner tidak valid");
      return;
    }
    if (!file) {
      setError("Image wajib diisi");
      return;
    }

    mutate(
      {
        ...result.data,
        image: file,
        start_date: result.data.start_date ?? "",
        end_date: result.data.end_date ?? "",
        start_time: result.data.start_time ?? "",
        end_time: result.data.end_time ?? "",
      },
      { onSuccess: () => onClose(false) },
    );
  };

  return (
    <div
      onClick={() => onClose(false)}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-md overflow-y-auto max-h-2/2"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-chocolate">Upload Banner</h3>
            <span className="text-xs text-gray-500">
              Upload dan atur banner halaman customer
            </span>
          </div>
          <button
            onClick={() => onClose(false)}
            disabled={isPending}
            className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form className="p-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={values.title}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-chocolate"
                placeholder="Masukkan judul banner"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={values.status}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    status: event.target.value as CreateBannerValues["status"],
                  }))
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-chocolate"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="text-sm font-medium">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={values.type}
                onChange={(event) =>
                  setValues((current) => {
                    const type = event.target.value as CreateBannerValues["type"];
                    return {
                      ...current,
                      type,
                      ...(type === "default"
                        ? {
                            start_date: "",
                            end_date: "",
                            start_time: current.start_time,
                            end_time: current.end_time,
                          }
                        : {
                            start_time: "",
                            end_time: "",
                          }),
                    };
                  })
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-chocolate"
              >
                <option value="default">Default</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            {values.type === "temporary" && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="start_date" className="text-sm font-medium">
                    Start Date{" "}
                    <span className="font-normal text-gray-500">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    value={values.start_date}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-chocolate"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="end_date" className="text-sm font-medium">
                    End Date{" "}
                    <span className="font-normal text-gray-500">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    value={values.end_date}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-chocolate"
                  />
                </div>
              </>
            )}

            {values.type === "default" && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="start_time" className="text-sm font-medium">
                    Start Time{" "}
                    <span className="font-normal text-gray-500">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={values.start_time}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        start_time: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-chocolate"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="end_time" className="text-sm font-medium">
                    End Time{" "}
                    <span className="font-normal text-gray-500">
                      (opsional)
                    </span>
                  </label>
                  <input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={values.end_time}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        end_time: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-chocolate"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="image" className="text-sm font-medium">
                Image
              </label>

              {preview ? (
                <div className="relative w-full overflow-hidden rounded-lg border border-gray-100">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-80 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-gray-500 hover:bg-gray-50"
                >
                  <span>Klik untuk pilih gambar</span>
                  <span className="text-xs">
                    JPG, PNG, WEBP (maks {MAX_SIZE_MB}MB)
                  </span>
                </label>
              )}

              <input
                ref={inputRef}
                id="image"
                name="image"
                type="file"
                accept={ACCEPTED.join(",")}
                onChange={handleChange}
                className="sr-only"
              />

            </div>
          </div>
          {(error || mutationError) && (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {error ?? mutationError?.message}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={isPending}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-chocolate px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Mengunggah..." : "Simpan Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadBannerModal;
