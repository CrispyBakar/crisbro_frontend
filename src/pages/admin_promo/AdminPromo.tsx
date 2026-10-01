import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import GeneralTable, { type SortOrder } from "@/components/GeneralTable";
import { usePageTitle } from "@/hooks/use-page-title";
import { usePromos } from "@/hooks/use-promos";
import type { GetPromosProps } from "@/services/promo";
import { useProducts } from "@/hooks/use-products";
import { useLocations } from "@/hooks/use-locations";
import LocationMultiSelect from "./LocationMultiSelect";
import type { LocationSelection } from "./LocationMultiSelect";
import OrderTypeSelect from "./OrderTypeSelect";
import PromoCodesModal from "./PromoCodesModal";
import type { OrderTypeOption } from "./OrderTypeSelect";

// Order type Runchise (belum ada endpoint-nya di backend)
// TODO: tambahkan "(R) External Order" & "Takeaway" setelah ID Runchise-nya diketahui
const ORDER_TYPES: OrderTypeOption[] = [{ id: 2699, name: "Dine In" }];

type PromoCodeUsageType = "single" | "multiple";

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

type ProductRow = { key: number; productId: string; maxQty: string };

let productRowKey = 0;
const createProductRow = (): ProductRow => ({
  key: productRowKey++,
  productId: "",
  maxQty: "",
});

// Modal create promo — di-mount kondisional agar form selalu reset saat dibuka
const CreatePromoModal = ({ onClose }: { onClose: () => void }) => {
  // TODO: ganti dengan isPending dari mutation create promo
  const isPending = false;
  const error: Error | null = null;

  const { data: productsData, isLoading: isProductsLoading } = useProducts({
    take: 1000,
    status: "activated",
    sort_by: "name",
    order_by: "asc",
  });
  const products = productsData?.products ?? [];

  // Baris produk spesifik → maximum_qty_applied_to_products
  const [productRows, setProductRows] = useState<ProductRow[]>([
    createProductRow(),
  ]);
  const [applyToOptionSet, setApplyToOptionSet] = useState(true);

  const selectedProductIds = new Set(
    productRows.map((row) => row.productId).filter(Boolean),
  );

  const addProductRow = () =>
    setProductRows((rows) => [...rows, createProductRow()]);

  const removeProductRow = (key: number) =>
    setProductRows((rows) =>
      rows.length === 1 ? rows : rows.filter((row) => row.key !== key),
    );

  const updateProductRow = (key: number, patch: Partial<ProductRow>) =>
    setProductRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const { data: locationsData, isLoading: isLocationsLoading } = useLocations({
    take: 1000,
  });
  const locationOptions = (locationsData?.locations ?? []).map((location) => ({
    id: location.runchise_id,
    name: location.name,
  }));

  // → is_select_all_location / location_ids / location_group_ids, exclude_location_ids
  const [validLocation, setValidLocation] = useState<LocationSelection>({
    mode: "locations",
    selectAll: false,
    ids: [],
  });
  const [excludeLocationIds, setExcludeLocationIds] = useState<number[]>([]);

  // → promo_rule_attributes.order_type_ids
  const [isOrderTypeEnabled, setIsOrderTypeEnabled] = useState(true);
  const [orderTypeIds, setOrderTypeIds] = useState<number[]>([]);

  // → use_promotion_code, promotion_code_usage_type, promotion_code_source,
  //   promotion_code_number_of_generated_code
  const [usePromoCode, setUsePromoCode] = useState(true);
  const [promoCodeUsageType, setPromoCodeUsageType] =
    useState<PromoCodeUsageType>("single");
  const [promoCodeSource, setPromoCodeSource] = useState("random");
  const [promoCodeCount, setPromoCodeCount] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: panggil mutation create promo, lalu onSuccess: onClose
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
            <h3 className="text-lg font-bold text-chocolate">Tambah Promo</h3>
            <span className="text-xs text-gray-500">
              Buat promo baru untuk customer crisbro.
            </span>
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
            <div className="col-span-1"></div>
            <div className="col-span-2">
              <label className="font-semibold text-sm">Promotion Name</label>
              <input
                type="text"
                placeholder="Nama promo"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange"
                required
              />
            </div>

            {/* Start Date & End Date */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">Start Date</label>
              <input
                type="date"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="font-semibold text-sm">End Date</label>
              <input
                type="date"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            {/* Promotion Goal */}
            <div className="col-span-1">
              <label className="font-semibold text-sm">Promotion Goal</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="goal"
                    value="increase_average_sale"
                    className="w-4 h-4 text-orange border-gray-300 focus:ring-orange"
                    required
                  />
                  <span className="text-sm">Increase Average Sale</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="goal"
                    value="increase_number_sale"
                    className="w-4 h-4 text-orange border-gray-300 focus:ring-orange"
                  />
                  <span className="text-sm">Increase Number of Sale</span>
                </label>
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
                    className="w-4 h-4 text-orange border-gray-300 focus:ring-orange"
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
                name="discountValue"
                placeholder="Masukkan nilai diskon"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange"
                required
              />
            </div>
            <div className="col-span-1" />

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
                    className="w-4 h-4 text-orange border-gray-300 focus:ring-orange"
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
                      <select
                        value={row.productId}
                        onChange={(event) =>
                          updateProductRow(row.key, {
                            productId: event.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange invalid:text-gray-400"
                        required
                      >
                        <option value="" disabled>
                          {isProductsLoading
                            ? "Memuat produk..."
                            : "Select product(s)"}
                        </option>
                        {products.map((product) => (
                          <option
                            key={product.runchise_id}
                            value={product.runchise_id}
                            className="text-black"
                            disabled={
                              selectedProductIds.has(
                                String(product.runchise_id),
                              ) && row.productId !== String(product.runchise_id)
                            }
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>
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
                        className="col-start-1 row-start-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange sm:col-start-auto sm:row-start-auto"
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
                      checked={applyToOptionSet}
                      onChange={(event) =>
                        setApplyToOptionSet(event.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <span className="relative h-6 w-10 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-orange peer-focus-visible:ring-2 peer-focus-visible:ring-orange/40 after:absolute after:top-1 after:left-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                    <span className="text-sm">
                      Promotion also apply to option set and modifier
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="font-semibold text-sm">
                Promotion belongs to location
              </label>
              <select className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange invalid:text-gray-400">
                <option value="" className="text-black">
                  Pilih lokasi
                </option>
              </select>
            </div>

            {/* Valid at Location & Exclude Location */}
            <div className="col-span-1">
              <LocationMultiSelect
                label="Valid at Location"
                value={validLocation}
                onChange={(value) => {
                  setValidLocation(value);
                  // Exclude hanya berlaku saat memilih semua outlet / grup
                  if (!value.selectAll) setExcludeLocationIds([]);
                }}
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
                  ids: excludeLocationIds,
                }}
                onChange={(value) => setExcludeLocationIds(value.ids)}
                locations={locationOptions}
                isLoading={isLocationsLoading}
                disabled={!validLocation.selectAll}
              />
            </div>

            {/* Terms and Conditions */}
            <div className="col-span-1 flex flex-col gap-4 sm:col-span-2">
              <h4 className="font-semibold text-sm">Terms and Conditions</h4>
              <div className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium uppercase text-gray-500">
                Purchase Requirement
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex w-fit cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isOrderTypeEnabled}
                    onChange={(event) => {
                      setIsOrderTypeEnabled(event.target.checked);
                      if (!event.target.checked) setOrderTypeIds([]);
                    }}
                    className="h-4 w-4 accent-orange"
                  />
                  <span className="text-sm font-medium">
                    Applicable for order type
                  </span>
                </label>
                {isOrderTypeEnabled && (
                  <div className="sm:pl-7">
                    <OrderTypeSelect
                      value={orderTypeIds}
                      onChange={setOrderTypeIds}
                      options={ORDER_TYPES}
                    />
                  </div>
                )}
              </div>

              {/* Use Promo Code */}
              <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
                <label className="flex w-fit cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={usePromoCode}
                    onChange={(event) => setUsePromoCode(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-10 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-orange peer-focus-visible:ring-2 peer-focus-visible:ring-orange/40 after:absolute after:top-1 after:left-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                  <span className="text-sm font-medium">Use Promo Code</span>
                </label>

                {usePromoCode && (
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
                              checked={promoCodeUsageType === usageType.value}
                              onChange={() =>
                                setPromoCodeUsageType(usageType.value)
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
                        value={promoCodeSource}
                        onChange={(event) =>
                          setPromoCodeSource(event.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
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
                        value={promoCodeCount}
                        onChange={(event) =>
                          setPromoCodeCount(event.target.value)
                        }
                        placeholder="Input number of codes"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 p-4 sm:p-6">
            {error && (
              <p className="mr-auto text-sm text-red-500">
                {(error as Error).message}
              </p>
            )}
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
              {isPending ? "Menyimpan..." : "Simpan promo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const formatPromoDate = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const AdminPromo = () => {
  usePageTitle("Promo");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [promoCodesTarget, setPromoCodesTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [orderBy, setOrderBy] = useState<SortOrder | "">("");

  const {
    data: promos,
    isPending: pendingPromos,
    isFetching: fetchingPromos,
    error: errorPromos,
  } = usePromos({
    page: currentPage,
    limit: itemsPerPage,
    search,
    sort_by: (sortBy || undefined) as GetPromosProps["sort_by"],
    sort_order: orderBy || undefined,
  });

  // location_ids promo berisi location_id lokal → tampilkan nama lokasinya
  const { data: locationsData } = useLocations({ take: 1000 });
  const locationNames = new Map(
    (locationsData?.locations ?? []).map((location) => [
      location.location_id,
      location.name,
    ]),
  );

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        handleAction={() => setIsCreateOpen(true)}
        isLoading={false}
        btnTitle={"Tambah Promo"}
        title={"Promo"}
        subtitle={"Data promo khusus customer crisbro"}
      />

      {/* Table */}
      {pendingPromos ? (
        <p className="text-gray-500">Memuat promo...</p>
      ) : errorPromos ? (
        <p className="text-red-500">
          Gagal memuat promo: {errorPromos.message}
        </p>
      ) : (
        <GeneralTable
          dataPending={fetchingPromos}
          canSelectDate={false}
          deleteBulk={false}
          tableTitle="Promo"
          dataHeads={[
            {
              key: "name",
              label: "Name",
              render: ({ name }) => <span>{name ? String(name) : "-"}</span>,
            },
            {
              key: "channel",
              label: "Channel",
              sortable: false,
              render: ({ channel }) => (
                <span className="uppercase">
                  {channel ? String(channel) : "-"}
                </span>
              ),
            },
            {
              key: "start_date",
              label: "Start Date",
              render: ({ start_date }) => (
                <span>{formatPromoDate(start_date)}</span>
              ),
            },
            {
              key: "end_date",
              label: "End Date",
              render: ({ end_date }) => (
                <span>{formatPromoDate(end_date)}</span>
              ),
            },
            {
              key: "location_ids",
              label: "Locations",
              sortable: false,
              render: ({ location_ids }) => {
                const names = (location_ids as string[]).map(
                  (id) => locationNames.get(id) ?? id,
                );
                if (names.length === 0) return <span>-</span>;
                return (
                  <span title={names.join(", ")}>
                    {names.slice(0, 2).join(", ")}
                    {names.length > 2 && (
                      <span className="text-gray-500">
                        {` +${names.length - 2}`}
                      </span>
                    )}
                  </span>
                );
              },
            },
            {
              key: "status",
              label: "Status",
              render: ({ status }) => (
                <span
                  className={`inline-block py-1 px-3 rounded-full bg-orange/10 ${String(status) === "active" ? "text-success" : "text-red-500"} font-semibold`}
                >
                  {String(status)}
                </span>
              ),
            },
          ]}
          data={
            promos?.data.map(({ promo }) => ({
              ...promo,
              id: promo.promo_id,
            })) ?? []
          }
          searchPlaceholder="Search promo name..."
          search={search}
          onSearchChange={setSearch}
          itemsPerPage={itemsPerPage}
          totalPages={promos?.meta.total_pages ?? 0}
          total={promos?.meta.total ?? 0}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sortBy={sortBy}
          orderBy={orderBy}
          setSortBy={setSortBy}
          setOrderBy={setOrderBy}
          detailHiddenKeys={["id", "location_ids"]}
          handleDelete={() => {}}
          canDelete={false}
          canUpdate={false}
          canShow={true}
          canDetail={true}
          detailButton="Promo Codes"
          handleDetail={(id) => {
            const promo = promos?.data.find(
              (item) => item.promo.promo_id === id,
            )?.promo;
            setPromoCodesTarget({ id, name: promo?.name ?? "-" });
          }}
        />
      )}

      {/* Promo Codes Modal */}
      {promoCodesTarget && (
        <PromoCodesModal
          promoId={promoCodesTarget.id}
          promoName={promoCodesTarget.name}
          onClose={() => setPromoCodesTarget(null)}
        />
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <CreatePromoModal onClose={() => setIsCreateOpen(false)} />
      )}
    </main>
  );
};

export default AdminPromo;
