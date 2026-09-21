import {
  Check,
  Copy,
  CreditCardCheck,
  Gift,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Power,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  useCustomer,
  useCustomerPointHistory,
  useUpdateCustomer,
} from "@/hooks/use-customers";
import { useLocations } from "@/hooks/use-locations";
import { usePageTitle } from "@/hooks/use-page-title";
import { useSaleTransaction } from "@/hooks/use-sale-transactions";
import type { Customer } from "@/services/customers";

// Bulan singkat Indonesia + zona WIB, mis. "10 Sep 2026, 10:45 WIB"
const formatDateWIB = (iso: string) => {
  const date = new Date(iso);

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    })
      .format(date)
      .replace(",", ",") + " WIB"
  );
};

const formatRupiah = (value: number) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;

// Tanda mutasi poin: earned menambah, redeemed mengurangi, sisanya apa adanya
const formatPoint = (pointType: string | null, point: number) => {
  if (pointType === "earned") return `+ ${point} point`;
  if (pointType === "redeemed") return `- ${Math.abs(point)} point`;

  return `${point} point`;
};

// Warna mutasi poin: positif hijau, negatif (redeemed / nilai minus) merah
const getPointColor = (pointType: string | null, point: number) =>
  pointType === "redeemed" || point < 0 ? "text-red-500" : "text-success";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "-";

type Activity = {
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: string;
};

// Riwayat aktivitas dirangkum dari data customer yang tersedia
const buildActivities = (customer: Customer): Activity[] => {
  const activities: Activity[] = [];

  if (customer.runchise_synced_at) {
    activities.push({
      icon: RefreshCw,
      title: "Customer disinkronkan",
      description: "Data diperbarui dari Runchise",
      timestamp: customer.runchise_synced_at,
    });
  }

  if (customer.available_point > 0) {
    activities.push({
      icon: Gift,
      title: `${customer.available_point} poin diterima`,
      description: `Poin tersedia saat ini: ${customer.available_point}`,
      timestamp: customer.member_since ?? customer.created_at,
    });
  }

  activities.push({
    icon: UserPlus,
    title: "Customer dibuat",
    description: `Profil ${customer.name} ditambahkan`,
    timestamp: customer.created_at,
  });

  return activities;
};

const TABS = ["Overview", "Points", "Transactions", "Activity Log"] as const;
type Tab = (typeof TABS)[number];

const TAB_HEADERS: Record<Tab, { title: string; subtitle: string }> = {
  Overview: {
    title: "Customer Information",
    subtitle: "Data diri customer saat ini.",
  },
  Points: {
    title: "Points",
    subtitle: "Riwayat penggunaan points customer",
  },
  Transactions: {
    title: "Transactions",
    subtitle: "Riwayat transaksi customer",
  },
  "Activity Log": {
    title: "Activity Log",
    subtitle: "Aktivitas terbaru customer",
  },
};

const StatItem = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-gray-500">{label}</span>
    <span
      className={`text-2xl font-bold ${accent ? "text-orange" : "text-chocolate"}`}
    >
      {value}
    </span>
  </div>
);

const InfoRow = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) => (
  <li className="flex items-center gap-3">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cream text-muted">
      <Icon size={16} />
    </span>
    {children}
  </li>
);

// Baris detail dengan kolom label berlebar tetap agar value sejajar antar baris
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-center gap-4 border-b border-gray-200 py-3">
    <span className="font-semibold text-chocolate">{label}</span>
    <span className="font-bold text-black">{value ?? "-"}</span>
  </div>
);

// Tombol opsi (kegiatan/transaksi) — aksi menu belum diimplementasi
const OptionsButton = () => (
  <button
    onClick={() => {}}
    className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
    aria-label="Opsi aktivitas"
  >
    <MoreVertical size={16} />
  </button>
);

// Kotak kosong bergaris untuk tab tanpa data
const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
    <Search size={20} className="text-gray-400" />
    <span className="text-sm font-semibold text-chocolate">{title}</span>
    {description && (
      <span className="text-xs text-gray-500">{description}</span>
    )}
  </div>
);

// Status tab bermuatan data: memuat, gagal, atau kosong
const TabState = ({
  isPending,
  error,
  emptyTitle,
  emptyDescription,
}: {
  isPending: boolean;
  error: Error | null;
  emptyTitle: string;
  emptyDescription?: string;
}) => {
  if (isPending) {
    return <p className="mt-6 text-sm text-gray-500">Memuat data...</p>;
  }

  if (error) {
    return (
      <p className="mt-6 text-sm text-red-500">
        Gagal memuat data: {error.message}
      </p>
    );
  }

  return <EmptyState title={emptyTitle} description={emptyDescription} />;
};

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="py-1.5 px-2 text-gray-500 font-normal">{children}</th>
);

const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="py-2 px-2">{children}</td>
);

const OverviewTab = ({ customer }: { customer: Customer }) => {
  // member_since bertipe date-only sehingga ditampilkan tanpa format waktu
  const rows = [
    { label: "Customer ID", value: customer.customer_id },
    { label: "Runchise ID", value: String(customer.runchise_id) },
    {
      label: "Sync at",
      value: customer.runchise_synced_at
        ? formatDateWIB(customer.runchise_synced_at)
        : null,
    },
    { label: "Province", value: customer.province },
    { label: "Date of birth", value: customer.dob },
    { label: "Member since", value: customer.member_since },
    {
      label: "Created at",
      value: customer.created_at ? formatDateWIB(customer.created_at) : null,
    },
    { label: "Location ID", value: customer.runchise_location_id },
    { label: "User ID", value: customer.user_id },
    { label: "Normalized Phone", value: customer.normalized_phone_number },
    { label: "Address", value: customer.address },
    { label: "City", value: customer.city },
    { label: "Postal code", value: customer.postal_code },
    { label: "Gender", value: customer.gender },
    { label: "Owner location ID", value: customer.owner_location_id },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-6">
      {[rows.slice(0, 10), rows.slice(10)].map((column, columnIndex) => (
        <div key={columnIndex} className="col-span-1 mb-2 text-xs">
          {column.map((row) => (
            <DetailRow key={row.label} {...row} />
          ))}
        </div>
      ))}
    </div>
  );
};

const POINT_COLUMNS = [
  "Date",
  "Sales Number",
  "Outlet",
  "Description",
  "Channel",
  "Point",
] as const;

const PointsTab = ({ customerId }: { customerId: string }) => {
  const {
    data: histories,
    isPending,
    error,
  } = useCustomerPointHistory(customerId);

  if (isPending || error || !histories || histories.length === 0) {
    return (
      <TabState
        isPending={isPending}
        error={error}
        emptyTitle="Belum ada riwayat poin"
        emptyDescription="Riwayat poin customer akan muncul di sini."
      />
    );
  }

  return (
    <div className="w-full mt-6 max-h-112.5 overflow-scroll">
      <table className="w-full">
        <thead className="bg-gray-50 text-xs text-left">
          <tr>
            {POINT_COLUMNS.map((column) => (
              <Th key={column}>{column}</Th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white text-sm">
          {histories.map((history) => {
            const timestamp =
              history.formatted_created_at ?? history.issued_at_time;

            return (
              <tr key={history.customer_point_history}>
                <Td>{timestamp ? formatDateWIB(timestamp) : "-"}</Td>
                <Td>{history.sales_no ?? "-"}</Td>
                <Td>{history.location_id ?? "-"}</Td>
                <Td>
                  {history.point_type_description || history.notes || "-"}
                </Td>
                <Td>{history.channel || "-"}</Td>
                <Td>
                  {history.point != null ? (
                    <span
                      className={getPointColor(
                        history.point_type,
                        history.point,
                      )}
                    >
                      {formatPoint(history.point_type, history.point)}
                    </span>
                  ) : (
                    "-"
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const TransactionsTab = ({ customerId }: { customerId: string }) => {
  const {
    data: transactions,
    isPending,
    error,
  } = useSaleTransaction(customerId);

  if (isPending || error || !transactions || transactions.length === 0) {
    return (
      <TabState
        isPending={isPending}
        error={error}
        emptyTitle="Belum ada transaksi"
        emptyDescription="Transaksi customer akan muncul di sini."
      />
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {transactions.map((transaction) => {
        const productNames = (transaction.products ?? [])
          .map((product) => product.name)
          .join(", ");

        return (
          <li
            key={transaction.transaction_id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-muted">
                <CreditCardCheck size={18} />
              </span>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-chocolate">
                  {transaction.order_type_name || "Transaksi"}
                </span>
                <span className="text-sm text-gray-500">
                  Sales no: {transaction.runchise_sales_no ?? "-"}
                </span>
                {productNames && (
                  <span className="text-sm text-gray-500">{productNames}</span>
                )}
                <span className="mt-1 text-xs text-gray-400">
                  Waktu pesanan:{" "}
                  {transaction.sales_time
                    ? formatDateWIB(transaction.sales_time)
                    : "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-chocolate">
                {transaction.net_sales != null
                  ? formatRupiah(transaction.net_sales)
                  : "-"}
              </span>
              <OptionsButton />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const ActivityLogTab = ({
  customer,
  search,
}: {
  customer: Customer;
  search: string;
}) => {
  const activities = useMemo(() => buildActivities(customer), [customer]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return activities;

    return activities.filter(
      (activity) =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query),
    );
  }, [activities, search]);

  if (filteredActivities.length === 0) {
    return (
      <EmptyState
        title="Tidak ada aktivitas ditemukan"
        description="Coba kata kunci lain."
      />
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {filteredActivities.map((activity) => {
        const Icon = activity.icon;

        return (
          <li
            key={`${activity.title}-${activity.timestamp}`}
            className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream text-muted">
                <Icon size={18} />
              </span>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-chocolate">
                  {activity.title}
                </span>
                <span className="text-sm text-gray-500">
                  {activity.description}
                </span>
                <span className="mt-1 text-xs text-gray-400">
                  {formatDateWIB(activity.timestamp)}
                </span>
              </div>
            </div>

            <OptionsButton />
          </li>
        );
      })}
    </ul>
  );
};

type CustomerForm = {
  name: string;
  email: string;
  address: string;
  province: string;
  city: string;
  country: string;
  postal_code: string;
  gender: "male" | "female" | "unknown";
  status: "active" | "inactive";
  owner_location_id: string;
  dob: string; // "YYYY-MM-DD"
};

const GENDERS = ["male", "female", "unknown"] as const;

const buildCustomerForm = (customer: Customer): CustomerForm => ({
  name: customer.name ?? "",
  email: customer.user?.email ?? "",
  address: customer.address ?? "",
  province: customer.province ?? "",
  city: customer.city ?? "",
  country: customer.country ?? "",
  postal_code: customer.postal_code ?? "",
  gender: GENDERS.includes(customer.gender as CustomerForm["gender"])
    ? (customer.gender as CustomerForm["gender"])
    : "unknown",
  status: customer.status === "inactive" ? "inactive" : "active",
  // Dropdown memakai runchise_id lokasi; ambil dari relasi owner_location
  owner_location_id:
    customer.owner_location?.runchise_id != null
      ? String(customer.owner_location.runchise_id)
      : "",
  dob: customer.dob?.slice(0, 10) ?? "",
});

const FORM_FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm font-normal text-chocolate outline-none focus:border-gray-400";

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm font-semibold text-chocolate">{label}</span>
    {children}
  </label>
);

// Modal edit customer — di-mount kondisional agar form selalu terisi data terbaru
const EditCustomerModal = ({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(() => buildCustomerForm(customer));
  const { data: locationsData } = useLocations({ take: 100 });
  const { mutate, isPending, error } = useUpdateCustomer();

  const setField =
    (field: keyof CustomerForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    mutate(
      {
        customer_id: customer.customer_id,
        // String kosong dikirim sebagai undefined agar tidak menimpa nilai lama
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        province: form.province.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        postal_code: form.postal_code.trim() || undefined,
        gender: form.gender,
        status: form.status,
        owner_location_id: form.owner_location_id || undefined,
        // dob dikosongkan = hapus tanggal (null) bila sebelumnya terisi
        dob: form.dob || (customer.dob ? null : undefined),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h3 className="text-lg font-bold text-chocolate">Edit Customer</h3>
            <span className="text-xs text-gray-500">
              Perbarui informasi customer {customer.name}.
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
          <div className="grid max-h-[65vh] grid-cols-2 gap-4 overflow-y-auto p-6">
            <FormField label="Name">
              <input
                type="text"
                value={form.name}
                onChange={setField("name")}
                required
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={setField("email")}
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="Address">
              <input
                type="text"
                value={form.address}
                onChange={setField("address")}
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="Date of birth">
              <input
                type="date"
                value={form.dob}
                onChange={setField("dob")}
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="Province">
              <input
                type="text"
                value={form.province}
                onChange={setField("province")}
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="City">
              <input
                type="text"
                value={form.city}
                onChange={setField("city")}
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="Country">
              <input
                type="text"
                value={form.country}
                onChange={setField("country")}
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="Postal code">
              <input
                type="text"
                value={form.postal_code}
                onChange={setField("postal_code")}
                className={FORM_FIELD_CLASS}
              />
            </FormField>

            <FormField label="Gender">
              <select
                value={form.gender}
                onChange={setField("gender")}
                className={FORM_FIELD_CLASS}
              >
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </FormField>

            {/* <FormField label="Status">
              <select
                value={form.status}
                onChange={setField("status")}
                className={FORM_FIELD_CLASS}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField> */}

            <FormField label="Owner location">
              <select
                value={form.owner_location_id}
                onChange={setField("owner_location_id")}
                className={FORM_FIELD_CLASS}
              >
                <option value="">Pilih lokasi...</option>
                {locationsData?.locations
                  .filter((location) => location.runchise_id != null)
                  .map((location) => (
                    <option
                      key={location.location_id}
                      value={String(location.runchise_id)}
                    >
                      {location.name}
                    </option>
                  ))}
              </select>
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-6">
            {error && (
              <p className="mr-auto text-sm text-red-500">{error.message}</p>
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
              {isPending ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerDetails = () => {
  const { customer_id: customerId = "" } = useParams();
  const { data: customer, isPending, error } = useCustomer(customerId);

  usePageTitle(customer?.name ?? "Detail Customer");

  const [activeTab, setActiveTab] = useState<Tab>("Activity Log");
  const [showChangeStatus, setShowChangeStatus] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(
    customer?.status,
  );
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleCopyId = async () => {
    if (!customer) return;

    try {
      await navigator.clipboard.writeText(customer.customer_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard tidak tersedia (mis. konteks non-secure) — diabaikan
    }
  };

  if (isPending) {
    return (
      <main className="w-full space-y-6">
        <p className="text-gray-500">Memuat customer...</p>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="w-full space-y-6">
        <p className="text-red-500">
          Gagal memuat customer: {error?.message ?? "Customer tidak ditemukan"}
        </p>
      </main>
    );
  }

  const isActive = customer.status === "active";
  const { title, subtitle } = TAB_HEADERS[activeTab];

  return (
    <main className="w-full space-y-6">
      {/* Header halaman */}
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-chocolate">
            Customer Detail
          </h2>
          <span className="text-xs text-gray-500">
            Lihat informasi dan riwayat aktivitas customer.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-2 rounded-3xl border border-gray-100 bg-white py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream active:bg-gray-100 cursor-pointer"
          >
            {copied ? (
              <Check size={16} className="text-success" />
            ) : (
              <Copy size={16} className="text-muted" />
            )}
            {copied ? "ID Tersalin" : "Copy ID"}
          </button>

          <div
            onClick={() => setShowChangeStatus(!showChangeStatus)}
            className="relative"
          >
            <button className="flex items-center gap-2 rounded-3xl border border-gray-100 bg-white py-2 px-5 text-sm font-semibold text-chocolate transtiton-colors hover:bg-cream activate:bg-gray-100 cursor-pointer">
              <Power size={16} />
              Ubah Status
            </button>

            <div
              className={`${!showChangeStatus ? "hidden" : ""} absolute mt-1 w-full p-0.5 bg-white border border-gray-100 shadow-sm rounded-2xl`}
            >
              <ul className="px-2 py-1.5 hover:bg-gray-200 rounded-2xl text-sm">
                Activate
              </ul>
              <ul className="px-2 py-1.5 hover:bg-gray-200 rounded-2xl text-sm">
                Deactivate
              </ul>
            </div>
          </div>

          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500 cursor-pointer"
          >
            <Pencil size={16} />
            Edit customer
          </button>
        </div>
      </div>

      {/* Kartu utama: profil (kiri) + tab aktivitas (kanan) */}
      <div className="grid grid-cols-[21rem_1fr] rounded-3xl border border-gray-100 bg-white shadow-md">
        {/* Panel profil customer */}
        <aside className="flex flex-col gap-6 border-r border-gray-100 p-8">
          <div className="flex flex-col items-start w-full gap-4">
            <div className="relative">
              <div className="flex size-20 items-center justify-center rounded-full bg-sunshine-yellow text-2xl font-bold text-chocolate">
                {getInitials(customer.name)}
              </div>
            </div>

            <div className="flex flex-col w-full justify-start items-start gap-1.5">
              <h3 className="text-xl font-bold text-chocolate">
                {customer.name}
              </h3>
              <span className="text-sm text-gray-500">
                Runchise ID - {customer.runchise_id}
              </span>
              <span
                className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  isActive
                    ? "bg-green-100 text-success"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {customer.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-chocolate">
              Contact Information
            </h4>
            <ul className="flex flex-col gap-3">
              <InfoRow icon={Phone}>
                <span className="text-sm text-chocolate">
                  +{customer.phone_number_country_code} {customer.phone_number}
                </span>
              </InfoRow>
              <InfoRow icon={MapPin}>
                {customer.address ? (
                  <span className="text-sm text-chocolate">
                    {customer.address}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">
                    Alamat belum tersedia
                  </span>
                )}
              </InfoRow>
            </ul>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-chocolate">
              Loyalty Summary
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <StatItem
                label="Total point"
                value={String(customer.total_point)}
                accent
              />
              <StatItem
                label="Available"
                value={String(customer.available_point)}
                accent
              />
              <StatItem
                label="Balance"
                value={String(Number(customer.balance ?? 0))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-chocolate">Account</h4>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Location ID</dt>
                <dd className="font-semibold text-chocolate">
                  {customer.owner_location_id ?? customer.runchise_location_id}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Member since</dt>
                <dd
                  className={
                    customer.member_since
                      ? "font-semibold text-chocolate"
                      : "text-gray-400"
                  }
                >
                  {customer.member_since ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Panel tab & activity log */}
        <section className="flex min-w-0 flex-col p-8">
          <nav className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-cream text-chocolate border border-gray-200"
                    : "text-gray-500 hover:bg-cream hover:text-chocolate"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-lg font-bold text-chocolate">{title}</h3>
              <span className="text-xs text-gray-500">{subtitle}</span>
            </div>
            {activeTab === "Activity Log" && (
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search activity..."
                  className="w-64 rounded-full bg-white py-2 pr-4 pl-10 text-sm text-chocolate placeholder:text-gray-400 outline-none focus:ring-2 border border-gray-200 focus:ring-border/40"
                />
              </div>
            )}
          </div>

          {activeTab === "Overview" ? (
            <OverviewTab customer={customer} />
          ) : activeTab === "Points" ? (
            <PointsTab customerId={customerId} />
          ) : activeTab === "Transactions" ? (
            <TransactionsTab customerId={customerId} />
          ) : (
            <ActivityLogTab customer={customer} search={search} />
          )}
        </section>
      </div>

      {isEditOpen && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </main>
  );
};

export default CustomerDetails;
