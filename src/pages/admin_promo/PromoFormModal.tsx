import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useLocations } from "@/hooks/use-locations";
import ProductSelect from "./ProductSelect";
import LocationSelect from "./LocationSelect";
import LocationMultiSelect from "./LocationMultiSelect";
import OrderTypeSelect from "./OrderTypeSelect";
import { createProductRow } from "./promo-form-utils";
import { PROMO_TYPE_LABELS } from "./promo-detail-utils";
import type {
  ProductRow,
  PromoCodeUsageType,
  PromoFormValues,
} from "./promo-form-utils";
import type { OrderTypeOption } from "./OrderTypeSelect";
import type { PromoType } from "@/services/promo";

const PROMO_TYPES: PromoType[] = ["general_promo", "loyalty_promo"];

// Order type Runchise (belum ada endpoint-nya di backend)
// TODO: tambahkan "(R) External Order" & "Takeaway" setelah ID Runchise-nya diketahui
const ORDER_TYPES: OrderTypeOption[] = [{ id: 2699, name: "Dine In" }];


const PROMO_CODE_USAGE_TYPES: {
  value: PromoCodeUsageType;
  label: string;
  description: string;
}[] = [
  {
    value: "single",
    label: "Single Use",
    description: "Each code can only be redeemed once",
  },
];

// TODO: tambahkan source lain (mis. upload/custom) setelah value-nya diketahui
const PROMO_CODE_SOURCES = [
  { value: "random", label: "Random Generated (e.g H1OBPQRC1)" },
];

const inputClassName =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange";

const toggleClassName =
  "relative h-6 w-10 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-orange peer-focus-visible:ring-2 peer-focus-visible:ring-orange/40 after:absolute after:top-1 after:left-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4";

type PromoFormModalProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialValues: PromoFormValues;
  // Order type tersimpan di promo yang tidak ada di ORDER_TYPES
  extraOrderTypes?: OrderTypeOption[];
  // Edit: bagian promo code disembunyikan (kode dibuat lewat generate)
  showPromoCode?: boolean;
  // Wajib memilih minimal satu produk
  requireProducts?: boolean;
  isPending: boolean;
  error?: string;
  onSubmit: (values: PromoFormValues) => void;
  onClose: () => void;
};

// Form promo bersama untuk create & edit — di-mount kondisional agar selalu
// mulai dari `initialValues`
const PromoFormModal = ({
  title,
  subtitle,
  submitLabel,
  initialValues,
  extraOrderTypes = [],
  showPromoCode = true,
  requireProducts = true,
  isPending,
  error: submitError,
  onSubmit,
  onClose,
}: PromoFormModalProps) => {
  const [values, setValues] = useState(initialValues);
  // Validasi sisi klien untuk field custom yang tidak bisa memakai `required`
  const [formError, setFormError] = useState<string | null>(null);
  const error = formError ?? submitError;

  const setField = <K extends keyof PromoFormValues>(
    key: K,
    value: PromoFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const { productRows } = values;
  const selectedProductIds = new Set(
    productRows.flatMap((row) => (row.product ? [row.product.id] : [])),
  );

  const addProductRow = () =>
    setField("productRows", [...productRows, createProductRow()]);

  const removeProductRow = (key: number) =>
    setField(
      "productRows",
      productRows.length === 1
        ? productRows
        : productRows.filter((row) => row.key !== key),
    );

  const updateProductRow = (key: number, patch: Partial<ProductRow>) =>
    setField(
      "productRows",
      productRows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const { data: locationsData, isLoading: isLocationsLoading } = useLocations({
    take: 100, // batas maksimal take di backend
  });
  // Payload diteruskan apa adanya ke Runchise → hanya lokasi yang punya runchise_id
  const locationOptions = (locationsData?.locations ?? [])
    .filter((location) => location.runchise_id != null)
    .map((location) => ({
      id: location.runchise_id,
      name: location.name,
    }));

  const orderTypeOptions = [
    ...ORDER_TYPES,
    ...extraOrderTypes.filter(
      (extra) => !ORDER_TYPES.some((orderType) => orderType.id === extra.id),
    ),
  ];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasEmptyRow = productRows.some((row) => !row.product);
    const hasProduct = productRows.some((row) => row.product);
    if (requireProducts ? hasEmptyRow : hasEmptyRow && hasProduct) {
      setFormError("Pilih produk di setiap baris Specific Products.");
      return;
    }
    if (!values.ownerLocation) {
      setFormError("Pilih lokasi pada Promotion belongs to location.");
      return;
    }
    setFormError(null);
    onSubmit(values);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-chocolate">{title}</h3>
            <span className="text-xs text-gray-500">{subtitle}</span>
          </div>
          <button
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
            {/* Field form promo */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">Channel Selection</label>
              <div className="p-3 border cursor-pointer border-gray-200 rounded-2xl *:focus-within:ring-1 focus-within:ring-orange flex flex-col items-center justify-center">
                <img
                  src="https://cdn.prod.website-files.com/6274d08d44c38945faa5f827/64206dca927bd50d4c231531_Runchise%20Logo.png"
                  className="w-12 h-12 object-contain"
                />
                <span className="text-sm font-bold">POS</span>
              </div>
            </div>
            {/* promo_type di backend; diberi label "Promo Category" supaya tidak
                tertukar dengan "Promotion Type" (jenis diskon). Hanya disimpan di
                database lokal, tidak dikirim ke Runchise. */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">Promo Category</label>
              <div className="flex flex-col gap-2">
                {PROMO_TYPES.map((promoType) => (
                  <label
                    key={promoType}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="promoType"
                      checked={values.promoType === promoType}
                      onChange={() => setField("promoType", promoType)}
                      className="w-4 h-4 accent-orange"
                      required
                    />
                    <span className="text-sm">
                      {PROMO_TYPE_LABELS[promoType]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="font-semibold text-sm">Promotion Name</label>
              <input
                type="text"
                value={values.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Nama promo"
                className={inputClassName}
                required
              />
            </div>

            {/* Start Date & End Date */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">Start Date</label>
              <input
                type="date"
                value={values.startDate}
                onChange={(event) => setField("startDate", event.target.value)}
                className={inputClassName}
                required
              />
            </div>
            <div className="col-span-1">
              <label className="font-semibold text-sm">End Date</label>
              <input
                type="date"
                value={values.endDate}
                min={values.startDate || undefined}
                onChange={(event) => setField("endDate", event.target.value)}
                className={inputClassName}
              />
            </div>

            {/* Promotion Goal */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">Promotion Goal</label>
              <div className="flex flex-col gap-2">
                {(
                  [
                    ["increase_average_sale", "Increase Average Sale"],
                    ["increase_number_sale", "Increase Number of Sale"],
                  ] as const
                ).map(([goal, label]) => (
                  <label
                    key={goal}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="goal"
                      checked={values.goal === goal}
                      onChange={() => setField("goal", goal)}
                      className="w-4 h-4 accent-orange"
                      required
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Promotion Type */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">Promotion Type</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="discount"
                    defaultChecked
                    className="w-4 h-4 accent-orange"
                    required
                  />
                  <span className="text-sm">Discount (%)</span>
                </label>
              </div>
            </div>

            {/* Discount Value */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">
                Discount Value (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                step="any"
                value={values.discountValue}
                onChange={(event) =>
                  setField("discountValue", event.target.value)
                }
                placeholder="Masukkan nilai diskon"
                className={inputClassName}
                required
              />
            </div>
            <div className="hidden sm:col-span-1 sm:block" />

            {/* Promotion Apply to */}
            <div className="col-span-1 sm:col-span-2">
              <label className="font-semibold text-sm">
                Promotion Apply to
              </label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="applyTo"
                    value="specific_products"
                    defaultChecked
                    className="w-4 h-4 accent-orange"
                    required
                  />
                  <span className="text-sm">Specific Products</span>
                </label>

                <div className="flex flex-col gap-3 sm:pl-6">
                  <div className="hidden grid-cols-[1fr_200px_32px] gap-3 sm:grid">
                    <span className="text-xs font-semibold uppercase text-gray-500">
                      Product
                    </span>
                    <span className="text-xs font-semibold uppercase text-gray-500">
                      Max Qty per Order
                    </span>
                  </div>

                  {productRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-[1fr_32px] gap-3 sm:grid-cols-[1fr_200px_32px] sm:items-center"
                    >
                      <ProductSelect
                        value={row.product}
                        onChange={(product) => {
                          updateProductRow(row.key, { product });
                          setFormError(null);
                        }}
                        excludedIds={selectedProductIds}
                      />
                      <input
                        type="number"
                        min={1}
                        value={row.maxQty}
                        onChange={(event) =>
                          updateProductRow(row.key, {
                            maxQty: event.target.value,
                          })
                        }
                        placeholder="Input Qty"
                        // Wajib untuk setiap baris yang sudah memilih produk
                        required={row.product !== null}
                        className={`col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto ${inputClassName}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeProductRow(row.key)}
                        disabled={productRows.length === 1}
                        className="col-start-2 row-start-1 cursor-pointer justify-self-center rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:col-start-auto sm:row-start-auto"
                        aria-label="Hapus produk"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addProductRow}
                    className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-orange"
                  >
                    <Plus size={18} />
                    Add More Items
                  </button>

                  <label className="flex w-fit cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={values.applyToOptionSet}
                      onChange={(event) =>
                        setField("applyToOptionSet", event.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <span className={toggleClassName} />
                    <span className="text-sm">
                      Promotion also apply to option set and modifier
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <LocationSelect
                label="Promotion belongs to location"
                value={values.ownerLocation}
                onChange={(location) => {
                  setField("ownerLocation", location);
                  setFormError(null);
                }}
              />
            </div>

            {/* Valid at Location & Exclude Location */}
            <div className="col-span-1">
              <LocationMultiSelect
                label="Valid at Location"
                value={values.validLocation}
                onChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    validLocation: value,
                    // Exclude hanya berlaku saat memilih semua outlet / grup
                    excludeLocationIds: value.selectAll
                      ? current.excludeLocationIds
                      : [],
                  }))
                }
                locations={locationOptions}
                isLoading={isLocationsLoading}
                withModeAndSelectAll
              />
            </div>
            <div className="col-span-1">
              <LocationMultiSelect
                label="Exclude Location"
                value={{
                  mode: "locations",
                  selectAll: false,
                  ids: values.excludeLocationIds,
                }}
                onChange={(value) => setField("excludeLocationIds", value.ids)}
                locations={locationOptions}
                isLoading={isLocationsLoading}
                disabled={!values.validLocation.selectAll}
              />
            </div>

            {/* Terms and Conditions */}
            <div className="col-span-1 flex flex-col gap-4 sm:col-span-2">
              <h4 className="font-semibold text-sm">Terms and Conditions</h4>
              <div>
                <textarea
                  value={values.termsConditions}
                  onChange={(event) =>
                    setField("termsConditions", event.target.value)
                  }
                  rows={4}
                  placeholder="Tulis syarat dan ketentuan promo"
                  aria-label="Terms and Conditions"
                  className={`${inputClassName} resize-y`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Opsional. Hanya disimpan di sistem ini, tidak dikirim ke
                  Runchise.
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium uppercase text-gray-500">
                Purchase Requirement
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex w-fit cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={values.isOrderTypeEnabled}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        isOrderTypeEnabled: event.target.checked,
                        orderTypeIds: event.target.checked
                          ? current.orderTypeIds
                          : [],
                      }))
                    }
                    className="h-4 w-4 accent-orange"
                  />
                  <span className="text-sm font-medium">
                    Applicable for order type
                  </span>
                </label>
                {values.isOrderTypeEnabled && (
                  <div className="sm:pl-7">
                    <OrderTypeSelect
                      value={values.orderTypeIds}
                      onChange={(ids) => setField("orderTypeIds", ids)}
                      options={orderTypeOptions}
                    />
                  </div>
                )}
              </div>

              {/* Use Promo Code */}
              {showPromoCode && (
                <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
                  <label className="flex w-fit cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={values.usePromoCode}
                      onChange={(event) =>
                        setField("usePromoCode", event.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <span className={toggleClassName} />
                    <span className="text-sm font-medium">Use Promo Code</span>
                  </label>

                  {values.usePromoCode && (
                    <div className="flex flex-col gap-4 sm:pl-13">
                      <div className="flex flex-col gap-3">
                        <span className="text-sm font-medium">
                          Redemption Rules
                        </span>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {PROMO_CODE_USAGE_TYPES.map((usageType) => (
                            <label
                              key={usageType.value}
                              className="flex cursor-pointer items-start gap-2"
                            >
                              <input
                                type="radio"
                                name="promotionCodeUsageType"
                                checked={
                                  values.promoCodeUsageType === usageType.value
                                }
                                onChange={() =>
                                  setField(
                                    "promoCodeUsageType",
                                    usageType.value,
                                  )
                                }
                                className="mt-0.5 h-4 w-4 shrink-0 accent-orange"
                              />
                              <span className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {usageType.label}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {usageType.description}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Source</label>
                        <select
                          value={values.promoCodeSource}
                          onChange={(event) =>
                            setField("promoCodeSource", event.target.value)
                          }
                          className={inputClassName}
                        >
                          {PROMO_CODE_SOURCES.map((source) => (
                            <option key={source.value} value={source.value}>
                              {source.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Number of Codes
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={values.promoCodeCount}
                          onChange={(event) =>
                            setField("promoCodeCount", event.target.value)
                          }
                          placeholder="Input number of codes"
                          className={inputClassName}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 p-4 sm:p-6">
            {error && <p className="mr-auto text-sm text-red-500">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer rounded-3xl border border-gray-100 py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500"
            >
              {isPending ? "Menyimpan..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoFormModal;
