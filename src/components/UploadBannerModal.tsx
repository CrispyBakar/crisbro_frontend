import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUpdateBanner, useUploadBanners } from "@/hooks/use-banner";
import { createBannerSchema, type CreateBannerValues } from "@/schemas/banner";
import { getImageBanner, type Banner } from "@/services/banner";

const MAX_SIZE_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface UploadBannerModalProps {
  onClose: (value: boolean) => void;
  banner?: Banner;
}

const toDateTimeInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const toTimeInput = (value: string | null) => {
  if (!value) return "";
  return value.split("T").at(-1)?.slice(0, 5) ?? "";
};

const UploadBannerModal = ({ onClose, banner }: UploadBannerModalProps) => {
  const upload = useUploadBanners();
  const update = useUpdateBanner();
  const isPending = upload.isPending || update.isPending;
  const mutationError = banner ? update.error : upload.error;
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [values, setValues] = useState<CreateBannerValues>({
    title: banner?.title ?? "",
    status: banner?.status === "active" ? "active" : "inactive",
    type: banner?.type === "default" ? "default" : "campaign",
    start_date: toDateTimeInput(banner?.start_date ?? null),
    end_date: toDateTimeInput(banner?.end_date ?? null),
    start_time: toTimeInput(banner?.start_time ?? null),
    end_time: toTimeInput(banner?.end_time ?? null),
    redirect_type:
      banner?.redirect_type === "disable" ||
      banner?.redirect_type === "external" ||
      banner?.redirect_type === "orderulang"
        ? banner.redirect_type
        : "internal",
    url: banner?.url ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!banner) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    getImageBanner(banner.banner_id)
      .then((response) => response.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        previewUrlRef.current = objectUrl;
        setPreview(objectUrl);
      })
      .catch(() => setError("Gagal memuat gambar banner saat ini"));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (previewUrlRef.current === objectUrl) previewUrlRef.current = null;
    };
  }, [banner]);

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
    if (!file && !banner) {
      setError("Image wajib diisi");
      return;
    }

    const payload = {
      ...result.data,
      ...(file ? { image: file } : {}),
      start_date: result.data.start_date ?? "",
      end_date: result.data.end_date ?? "",
      start_time: result.data.start_time ?? "",
      end_time: result.data.end_time ?? "",
      redirect_type: result.data.redirect_type ?? "disable",
      url:
        result.data.redirect_type === "disable" ||
        result.data.redirect_type === "orderulang"
          ? null
          : (result.data.url ?? ""),
    };

    if (banner) {
      update.mutate(
        { banner_id: banner.banner_id, payload },
        { onSuccess: () => onClose(false) },
      );
      return;
    }

    if (!file) return;
    upload.mutate(
      { ...payload, image: file },
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
            <h3 className="text-lg font-bold text-chocolate">
              {banner ? "Edit Banner" : "Upload Banner"}
            </h3>
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
                    const type = event.target
                      .value as CreateBannerValues["type"];
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
                <option value="campaign">Campaign</option>
              </select>
            </div>

            {values.type === "campaign" && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="start_date" className="text-sm font-medium">
                    Start Date
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
                    End Date
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

            <div className="flex items-center justify-between gap-4 sm:col-span-2">
              <div>
                <p className="text-sm font-medium text-chocolate">Redirect</p>
                <p className="text-xs text-gray-500">
                  Aktifkan jika banner perlu membuka halaman atau tautan.
                </p>
              </div>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2">
                <span className="text-sm font-medium text-chocolate">
                  {values.redirect_type === "disable" ? "Tidak ada" : "Aktif"}
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Aktifkan redirect banner"
                  checked={values.redirect_type !== "disable"}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      redirect_type: event.target.checked
                        ? "internal"
                        : "disable",
                      url: event.target.checked ? "/" : "",
                    }))
                  }
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-berry-red peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-berry-red" />
              </label>
            </div>

            {values.redirect_type !== "disable" && (
              <>
                <fieldset className="flex gap-4 sm:col-span-2">
                  <legend className="mb-2 text-sm font-medium">
                    Jenis redirect
                  </legend>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="redirect_type"
                      value="internal"
                      checked={values.redirect_type === "internal"}
                      onChange={() =>
                        setValues((current) => ({
                          ...current,
                          redirect_type: "internal",
                          url: "/",
                        }))
                      }
                    />
                    Internal
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="redirect_type"
                      value="external"
                      checked={values.redirect_type === "external"}
                      onChange={() =>
                        setValues((current) => ({
                          ...current,
                          redirect_type: "external",
                          url: "",
                        }))
                      }
                    />
                    External
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="redirect_type"
                      value="orderulang"
                      checked={values.redirect_type === "orderulang"}
                      onChange={() =>
                        setValues((current) => ({
                          ...current,
                          redirect_type: "orderulang",
                          url: "",
                        }))
                      }
                    />
                    Orderulang
                  </label>
                </fieldset>

                {values.redirect_type === "internal" && (
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      Redirect to
                    </label>
                    <select
                      name="url"
                      id="url"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      value={values.url}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          url: event.target.value as CreateBannerValues["url"],
                        }))
                      }
                    >
                      <option value="/">Home</option>
                      <option value="/vouchers">Vouchers</option>
                      <option value="/redeem">Redeem</option>
                      <option value="/locations">Outlets</option>
                    </select>
                  </div>
                )}

                {values.redirect_type === "external" && (
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      Redirect to
                    </label>
                    <input
                      type="text"
                      name="url"
                      id="url"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      value={values.url}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          url: event.target.value,
                        }))
                      }
                    />
                  </div>
                )}
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
                  {file && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="absolute right-2 top-2 rounded bg-black px-3 py-2 text-xs text-white hover:bg-white hover:text-black hover:border"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="image"
                  className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-gray-500 hover:bg-gray-50"
                >
                  <span>Klik untuk {banner ? "ganti" : "pilih"} gambar</span>
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
              {isPending
                ? banner
                  ? "Menyimpan..."
                  : "Mengunggah..."
                : banner
                  ? "Simpan Perubahan"
                  : "Simpan Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadBannerModal;
