import { memo } from "react";
import { LoaderCircle, Mail, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AdminBrand,
  AdminCustomer,
  AdminLocation,
  CustomerEmailStatus,
  CustomerImportSyncJob,
} from "@/lib/admin";
import {
  accountStatusLabel,
  dateFormat,
  dateTimeFormat,
  getCustomerSyncMessage,
  getCustomerSyncNotice,
  getCustomerSyncStatus,
  numberFormat,
  paginationItems,
  runchiseSyncClassName,
  runchiseSyncLabel,
  type SortState,
} from "./adminFormatters";
import { FormInput, Panel, Select, SortableHeader, TableScrollArea } from "./adminUiPrimitives";
import { DebouncedSearchInput, type DebouncedSearchInputHandle } from "./DebouncedSearchInput";
import { CustomerFormFields } from "./AdminFormFields";
import { emptyCustomerForm, type CustomerFormValues } from "./adminFormDefaults";

export type CustomerSortKey =
  | "name"
  | "email"
  | "phone_number"
  | "outlet"
  | "points"
  | "status"
  | "activation_status"
  | "runchise_sync_status"
  | "created_at"
  | "updated_at";

type CustomersListProps = {
  customers: AdminCustomer[];
  customerSort: SortState<CustomerSortKey>;
  sortCustomers: (sortBy: CustomerSortKey) => void;
  appliedCustomerSearch: string;
  customerSearchRef: React.RefObject<DebouncedSearchInputHandle | null>;
  searchCustomers: (value: string) => void;
  customerTotal: number;
  customerPage: number;
  customerPageLoading: boolean;
  customerTotalPages: number;
  customerLimit: number;
  changeCustomerLimit: (limit: number) => void;
  customerPageInput: string;
  setCustomerPageInput: (value: string) => void;
  jumpToCustomerPage: () => void;
  loadCustomersPage: (page: number) => void;
  customerFrom: string;
  setCustomerFrom: (value: string) => void;
  customerTo: string;
  setCustomerTo: (value: string) => void;
  applyCustomerDateFilter: () => void;
  resetCustomerDateFilter: () => void;
  customerEmailStatus: CustomerEmailStatus;
  applyCustomerEmailStatus: (status: CustomerEmailStatus) => void;
  customerRegistrationRange: { earliest: string | null; latest: string | null };
  customerImportJob: CustomerImportSyncJob | null;
  customerSyncEnabled: boolean;
  canSyncCustomers: boolean;
  startCustomerImportFromRunchise: () => void;
  openCreateCustomerForm: () => void;
  editCustomer: (customer: AdminCustomer) => void;
  requestDeleteCustomer: (customer: AdminCustomer) => void;
  resendActivation: (customer: AdminCustomer) => void;
  retryCustomerRunchiseSync: (customer: AdminCustomer) => void;
  saving: boolean;
};

// L-7: panel daftar customer (filter, kartu progres sync, tabel, paginasi)
// di-memo dan TIDAK menerima `customerForm`. Sebelumnya setiap ketikan di form
// customer -- form terpanjang di konsol ini -- ikut merender ulang tabel berisi
// puluhan baris beserta seluruh filternya.
const CustomersListPanel = memo(function CustomersListPanel({
  customers,
  customerSort,
  sortCustomers,
  appliedCustomerSearch,
  customerSearchRef,
  searchCustomers,
  customerTotal,
  customerPage,
  customerPageLoading,
  customerTotalPages,
  customerLimit,
  changeCustomerLimit,
  customerPageInput,
  setCustomerPageInput,
  jumpToCustomerPage,
  loadCustomersPage,
  customerFrom,
  setCustomerFrom,
  customerTo,
  setCustomerTo,
  applyCustomerDateFilter,
  resetCustomerDateFilter,
  customerEmailStatus,
  applyCustomerEmailStatus,
  customerRegistrationRange,
  customerImportJob,
  customerSyncEnabled,
  canSyncCustomers,
  startCustomerImportFromRunchise,
  openCreateCustomerForm,
  editCustomer,
  requestDeleteCustomer,
  resendActivation,
  retryCustomerRunchiseSync,
  saving,
}: CustomersListProps) {
  return (
    <Panel title="Daftar Customer">
      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          onClick={openCreateCustomerForm}
          className="w-full rounded-full font-bold md:hidden"
        >
          Tambah Customer
        </Button>
        {canSyncCustomers && (
          <Button
            type="button"
            variant="outline"
            disabled={
              !customerSyncEnabled ||
              saving ||
              customerImportJob?.status === "queued" ||
              customerImportJob?.status === "running"
            }
            title={
              customerSyncEnabled
                ? undefined
                : "Sinkronisasi customer Runchise sedang dijeda sementara"
            }
            onClick={() => void startCustomerImportFromRunchise()}
            className="ml-auto rounded-full font-bold"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                customerSyncEnabled &&
                (saving ||
                  customerImportJob?.status === "queued" ||
                  customerImportJob?.status === "running")
                  ? "animate-spin"
                  : ""
              }`}
            />
            Sinkronkan Customer Runchise
          </Button>
        )}
      </div>
      {customerImportJob && (
        <div className="mb-4 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-black">
              {customerImportJob.status === "completed" ||
              customerImportJob.status === "completed_with_errors"
                ? "Sinkronisasi customer selesai"
                : // M-2: job yang dihentikan permanen (mis. paginasi upstream
                  // melewati batas aman) tidak boleh tampil sebagai "menunggu
                  // worker" -- tidak ada worker yang akan mengambilnya lagi.
                  customerImportJob.status === "failed"
                  ? "Sinkronisasi customer dihentikan"
                  : !customerSyncEnabled
                    ? "Sinkronisasi customer dijeda sementara"
                    : customerImportJob.status === "running"
                      ? "Sinkronisasi customer sedang berjalan"
                      : "Sinkronisasi customer menunggu worker"}
            </p>
            <span className="font-semibold text-muted-foreground">Job #{customerImportJob.id}</span>
          </div>
          {!customerSyncEnabled &&
            customerImportJob.status !== "completed" &&
            customerImportJob.status !== "completed_with_errors" && (
              <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">
                Impor customer baru dihentikan sementara untuk menghemat kapasitas database;
                dashboard memakai data customer yang sudah tersimpan. Progres job ini tersimpan dan
                akan dilanjutkan dari halaman terakhir begitu sinkronisasi diaktifkan kembali.
              </p>
            )}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min(
                  100,
                  customerImportJob.locations_total > 0
                    ? (customerImportJob.locations_completed / customerImportJob.locations_total) *
                        100
                    : 0,
                )}%`,
              }}
            />
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
            <span>Diproses: {numberFormat(customerImportJob.processed)} record API</span>
            <span>Dibuat: {numberFormat(customerImportJob.created)} customer</span>
            <span>Diperbarui: {numberFormat(customerImportJob.updated)} customer</span>
            <span>
              Outlet: {numberFormat(customerImportJob.locations_completed)}/
              {numberFormat(customerImportJob.locations_total)}
            </span>
            <span>Fase: {customerImportJob.phase}</span>
            <span>Halaman: {numberFormat(customerImportJob.current_page)}</span>
            <span>Gagal: {numberFormat(customerImportJob.failed)}</span>
            <span>Konflik: {numberFormat(customerImportJob.skipped_conflicts)}</span>
            <span>
              Terbaru Runchise:{" "}
              {customerImportJob.latest_runchise_created_at
                ? dateTimeFormat(customerImportJob.latest_runchise_created_at)
                : "-"}
            </span>
            <span>
              Terbaru lokal:{" "}
              {customerImportJob.latest_local_created_at
                ? dateTimeFormat(customerImportJob.latest_local_created_at)
                : "-"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Aktivitas terakhir: {dateTimeFormat(customerImportJob.heartbeat_at)}
          </p>
          {customerImportJob.error && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {customerImportJob.status === "failed"
                ? "Job dihentikan dan tidak akan dilanjutkan otomatis. Jalankan sinkronisasi ulang setelah penyebabnya diperiksa: "
                : "Percobaan terakhir gagal dan akan dilanjutkan dari cursor tersimpan: "}
              {customerImportJob.error}
            </p>
          )}
        </div>
      )}
      <div className="mb-4 flex gap-2">
        <DebouncedSearchInput
          handleRef={customerSearchRef}
          ariaLabel="Cari customer"
          placeholder="Cari nama, nomor, email, atau outlet..."
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
          debounceMs={400}
          onSearch={(value) => void searchCustomers(value)}
        />
        <Button onClick={() => customerSearchRef.current?.submit()} variant="outline">
          Cari
        </Button>
      </div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <FormInput
          label="Daftar dari"
          type="date"
          value={customerFrom}
          onChange={setCustomerFrom}
        />
        <FormInput label="Daftar hingga" type="date" value={customerTo} onChange={setCustomerTo} />
        <Button
          type="button"
          onClick={applyCustomerDateFilter}
          className="mb-3 rounded-full font-bold"
        >
          Terapkan
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resetCustomerDateFilter}
          className="mb-3 rounded-full font-bold"
        >
          Reset
        </Button>
      </div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-[minmax(0,20rem)_1fr] md:items-center">
        <Select
          label="Status Email"
          value={customerEmailStatus}
          onChange={(value) => void applyCustomerEmailStatus(value as CustomerEmailStatus)}
          options={[
            { value: "all", label: "Semua customer" },
            { value: "missing", label: "Belum punya email" },
            { value: "present", label: "Sudah punya email" },
          ]}
        />
        <p className="mb-3 text-xs font-semibold text-muted-foreground">
          Tautan aktivasi hanya bisa dikirim lewat email. Pilih{" "}
          <span className="font-bold text-foreground">Belum punya email</span> untuk melihat
          customer mana saja yang emailnya masih perlu ditanyakan saat mereka datang ke outlet.
        </p>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-3">
          <p className="text-xs font-bold text-muted-foreground">Customer ditemukan</p>
          <p className="text-lg font-black">{numberFormat(customerTotal)}</p>
        </div>
        <div className="rounded-2xl border border-border p-3">
          <p className="text-xs font-bold text-muted-foreground">Pendaftaran paling awal</p>
          <p className="text-lg font-black">
            {customerRegistrationRange.earliest
              ? dateFormat(customerRegistrationRange.earliest)
              : "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-border p-3">
          <p className="text-xs font-bold text-muted-foreground">Pendaftaran paling akhir</p>
          <p className="text-lg font-black">
            {customerRegistrationRange.latest ? dateFormat(customerRegistrationRange.latest) : "-"}
          </p>
        </div>
      </div>
      <div className="relative min-h-64" aria-busy={customerPageLoading}>
        {customerPageLoading && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/75 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5 shadow-lg">
              <LoaderCircle className="h-9 w-9 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm font-bold">Memuat halaman customer...</span>
            </div>
          </div>
        )}
        <TableScrollArea>
          <table
            className={`min-w-385 w-full text-sm transition-opacity ${customerPageLoading ? "opacity-40" : "opacity-100"}`}
          >
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2 whitespace-nowrap">ID Runchise</th>
                <SortableHeader
                  label="Nama"
                  sortKey="name"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Kontak"
                  sortKey="phone_number"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Outlet"
                  sortKey="outlet"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Poin"
                  sortKey="points"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Status Akun"
                  sortKey="activation_status"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Sync Runchise"
                  sortKey="runchise_sync_status"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Tanggal Daftar"
                  sortKey="created_at"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <SortableHeader
                  label="Diperbarui di Runchise"
                  sortKey="updated_at"
                  sort={customerSort}
                  onSort={sortCustomers}
                />
                <th className="p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={11} className="p-8 text-center">
                    <p className="font-bold text-foreground">
                      {appliedCustomerSearch
                        ? "Kata kunci yang Anda cari tidak ditemukan"
                        : "Belum ada data customer"}
                    </p>
                    {appliedCustomerSearch && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tidak ada hasil untuk "{appliedCustomerSearch}".
                      </p>
                    )}
                  </td>
                </tr>
              )}
              {customers.map((customer) => (
                <tr key={customer.runchise_id ?? customer.id} className="border-t border-border">
                  <td className="p-2 font-mono">{customer.runchise_id ?? "-"}</td>
                  <td className="p-2 font-bold">{customer.name}</td>
                  <td className="p-2">
                    {customer.phone_number ?? "-"}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {customer.user.email ?? "-"}
                    </span>
                  </td>
                  <td className="p-2">
                    {customer.owner_location?.name ?? "-"}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {customer.owner_location?.city ?? customer.city ?? "-"}
                    </span>
                    {(customer.location_ids?.length ?? 0) > 1 && (
                      <div
                        className="mt-1 text-xs text-muted-foreground"
                        title={customer.customer_locations
                          ?.map((item) => item.location?.name ?? `Outlet ID ${item.location_id}`)
                          .join(", ")}
                      >
                        +{(customer.location_ids?.length ?? 1) - 1} outlet lainnya
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {numberFormat(customer.customer_point?.available_point ?? 0)}
                  </td>
                  <td className="p-2 capitalize">{customer.status ?? "-"}</td>
                  <td className="p-2">
                    <span
                      className={`inline-flex min-w-26 items-center justify-center rounded-full px-3 py-1 text-center text-xs font-black leading-tight ${
                        customer.user.activation_status === "pending_activation"
                          ? "bg-amber-500/10 text-amber-700"
                          : customer.user.activation_status === "not_linked"
                            ? "bg-slate-500/10 text-slate-700"
                            : "bg-emerald-500/10 text-emerald-700"
                      }`}
                    >
                      {accountStatusLabel(customer.user.activation_status)}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${runchiseSyncClassName(
                          getCustomerSyncStatus(customer),
                        )}`}
                      >
                        {runchiseSyncLabel(getCustomerSyncStatus(customer))}
                      </span>
                      {getCustomerSyncNotice(customer) && (
                        <p className="max-w-55 text-xs font-semibold text-amber-700">
                          {getCustomerSyncNotice(customer)}
                        </p>
                      )}
                      {getCustomerSyncMessage(customer) && (
                        <p className="max-w-55 text-xs text-muted-foreground">
                          {getCustomerSyncMessage(customer)}
                        </p>
                      )}
                      {customer.id > 0 && getCustomerSyncStatus(customer) !== "synced" && (
                        <button
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary disabled:opacity-50"
                          disabled={saving || customer.id <= 0}
                          onClick={() => retryCustomerRunchiseSync(customer)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Retry
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    {customer.created_at ? dateFormat(customer.created_at) : "-"}
                  </td>
                  <td className="p-2">
                    {customer.runchise_updated_at ? dateFormat(customer.runchise_updated_at) : "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      {customer.id > 0 &&
                        customer.user.activation_status === "pending_activation" && (
                          <span
                            className="inline-flex min-w-32.5 flex-col items-start gap-1"
                            title={
                              customer.user.email
                                ? "Kirim ulang email aktivasi"
                                : "Customer belum punya email. Tambahkan email dulu untuk mengirim link aktivasi."
                            }
                          >
                            <button
                              className="inline-flex items-center gap-1 font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={saving || !customer.user.email}
                              onClick={() => resendActivation(customer)}
                            >
                              <Mail className="h-4 w-4" /> Aktivasi
                            </button>
                            {!customer.user.email && (
                              <button
                                type="button"
                                className="inline-flex max-w-37.5 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-left text-[11px] font-black leading-tight text-amber-700 transition-colors hover:border-amber-500/50 hover:bg-amber-500/15"
                                onClick={() => editCustomer(customer)}
                              >
                                Tambah email dulu
                              </button>
                            )}
                          </span>
                        )}
                      {customer.id > 0 && (
                        <>
                          <button
                            className="inline-flex items-center gap-1 font-bold text-primary disabled:opacity-50"
                            onClick={() => editCustomer(customer)}
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </button>
                          <button
                            className="inline-flex items-center gap-1 font-bold text-destructive disabled:opacity-50"
                            disabled={saving}
                            onClick={() => requestDeleteCustomer(customer)}
                          >
                            <Trash2 className="h-4 w-4" /> Hapus
                          </button>
                        </>
                      )}
                      {customer.id <= 0 && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Belum terhubung lokal
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScrollArea>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-3 font-semibold text-muted-foreground">
          <span>
            Menampilkan {customerTotal === 0 ? 0 : (customerPage - 1) * customerLimit + 1}–
            {Math.min(customerPage * customerLimit, customerTotal)} dari{" "}
            {numberFormat(customerTotal)}
          </span>
          <label className="flex items-center gap-2">
            Per halaman
            <select
              value={customerLimit}
              onChange={(event) => void changeCustomerLimit(Number(event.target.value))}
              className="rounded-lg border border-border bg-card px-2 py-1"
            >
              {[25, 50, 100].map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving || customerPageLoading || customerPage <= 1}
            onClick={() => loadCustomersPage(customerPage - 1)}
            className="rounded-full font-bold"
          >
            Sebelumnya
          </Button>
          {paginationItems(customerPage, customerTotalPages).map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === customerPage ? "default" : "outline"}
                disabled={saving || customerPageLoading || item === customerPage}
                onClick={() => loadCustomersPage(item)}
                className="h-9 min-w-9 rounded-full px-3 font-bold"
                aria-label={`Halaman ${item}`}
                aria-current={item === customerPage ? "page" : undefined}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            disabled={saving || customerPageLoading || customerPage >= customerTotalPages}
            onClick={() => loadCustomersPage(customerPage + 1)}
            className="rounded-full font-bold"
          >
            Berikutnya
          </Button>
          <form
            className="ml-1 flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              jumpToCustomerPage();
            }}
          >
            <input
              type="number"
              min={1}
              max={customerTotalPages}
              value={customerPageInput}
              onChange={(event) => setCustomerPageInput(event.target.value)}
              disabled={customerPageLoading}
              className="w-20 rounded-lg border border-border bg-card px-2 py-2"
              aria-label="Nomor halaman tujuan"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={customerPageLoading}
              className="rounded-full font-bold"
            >
              Pergi
            </Button>
          </form>
        </div>
      </div>
    </Panel>
  );
});

export default function AdminCustomersTab({
  customerForm,
  setCustomerForm,
  saveCustomer,
  brands,
  locations,
  ...listProps
}: CustomersListProps & {
  customerForm: CustomerFormValues;
  setCustomerForm: (form: CustomerFormValues) => void;
  saveCustomer: () => void;
  brands: AdminBrand[];
  locations: AdminLocation[];
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <div className="hidden md:block">
        <Panel title={customerForm.id ? "Edit Customer" : "Tambah Customer"}>
          <CustomerFormFields
            customerForm={customerForm}
            setCustomerForm={setCustomerForm}
            brands={brands}
            locations={locations}
          />
          <div className="mt-3 flex gap-2">
            <Button
              onClick={saveCustomer}
              disabled={listProps.saving}
              className="flex-1 rounded-full font-bold"
            >
              Simpan Customer
            </Button>
            {customerForm.id > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCustomerForm({ ...emptyCustomerForm, brand_id: brands[0]?.id ?? 1 })
                }
                className="rounded-full font-bold"
              >
                Batal
              </Button>
            )}
          </div>
        </Panel>
      </div>
      <CustomersListPanel {...listProps} />
    </section>
  );
}
