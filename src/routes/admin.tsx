import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUser } from "@/lib/auth";
import {
  adminApi,
  type SortOrder,
  type AdminActivityLog,
  type AdminBrand,
  type AdminCustomer,
  type CustomerImportSyncJob,
  type CustomerSalesTransactionReport,
  type AdminLocation,
  type AdminUser,
  type CatalogMenuCategory,
  type CatalogMenuItem,
  type LoyaltySummary,
  type RedeemItem,
} from "@/lib/admin";
import {
  BarChart3,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Coins,
  Gift,
  History,
  ListChecks,
  Mail,
  Pencil,
  RefreshCw,
  ReceiptText,
  TicketCheck,
  Trash2,
  UserCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Loyalty — Crisbar" },
      { name: "description", content: "Kelola program loyalty Crisbar." },
    ],
  }),
  component: () => <AdminPage mode="admin" />,
});

type Tab = "report" | "sales-transactions" | "users" | "customers" | "redeem" | "activity";
type ConsoleMode = "admin" | "marketing";
type SortState<T extends string> = { sort_by: T; sort_order: SortOrder };
type UserSortKey = "email" | "phone_number" | "role" | "created_at";
type CustomerSortKey =
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
type RedeemSortKey = "menu" | "price" | "points" | "status" | "sort_order" | "created_at";

const emptyUserForm = {
  id: 0,
  email: "",
  phone_number: "",
  password: "",
  role: "marketing",
};

const emptyCustomerForm = {
  id: 0,
  name: "",
  email: "",
  phone_number: "",
  phone_number_country_code: 62,
  address: "",
  province: "",
  city: "",
  country: "Indonesia",
  postal_code: "",
  dob: "",
  gender: "unknown",
  status: "active",
  balance: 0,
  brand_id: 1,
  owner_location_id: 0,
  location_ids: [] as number[],
  total_point: 0,
  available_point: 0,
  next_reward_threshold: 2000,
};

type RedeemFormState = {
  id: number;
  menu_item_id: number;
  points_required: number;
  sort_order: number;
  is_active: boolean;
};

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};

type MobileCrudForm = "user" | "customer" | "redeem";

function paginationItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

function numberFormat(value: number) {
  return value.toLocaleString("id-ID");
}

function currencyFormat(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

function dateFormat(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function dateTimeFormat(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function compactJson(value: unknown) {
  if (value === null || value === undefined) return "-";
  const text = JSON.stringify(value);
  if (!text) return "-";
  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeAuditValue(value: unknown) {
  return value === undefined || value === "" ? null : value;
}

function auditValuesEqual(before: unknown, after: unknown) {
  return JSON.stringify(normalizeAuditValue(before)) === JSON.stringify(normalizeAuditValue(after));
}

function sortedAuditLocationIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (isRecord(item) ? Number(item.location_id) : Number(item)))
    .filter((locationId) => Number.isInteger(locationId))
    .sort((a, b) => a - b);
}

function isNoisyLegacyCustomerChangedFields(value: unknown) {
  return Array.isArray(value) && value.map(String).includes("last_updated_by_id");
}

function actualCustomerChangedFields(log?: AdminActivityLog) {
  if (log?.action !== "update_customer" || log.entity_type !== "customer") return [];
  if (!isRecord(log.before) || !isRecord(log.after)) return [];

  const customerFields = [
    "name",
    "phone_number",
    "phone_number_country_code",
    "address",
    "province",
    "city",
    "country",
    "postal_code",
    "dob",
    "gender",
    "status",
    "balance",
    "brand_id",
    "owner_location_id",
  ];
  const changedFields = customerFields.filter(
    (field) => !auditValuesEqual(log.before[field], log.after[field]),
  );

  const beforeUser = isRecord(log.before.user) ? log.before.user : {};
  const afterUser = isRecord(log.after.user) ? log.after.user : {};
  for (const field of ["phone_number", "email"]) {
    if (!auditValuesEqual(beforeUser[field], afterUser[field])) {
      changedFields.push(`user.${field}`);
    }
  }

  const beforePoint = isRecord(log.before.customer_point) ? log.before.customer_point : {};
  const afterPoint = isRecord(log.after.customer_point) ? log.after.customer_point : {};
  for (const field of ["total_point", "available_point"]) {
    if (!auditValuesEqual(beforePoint[field], afterPoint[field])) {
      changedFields.push(`point.${field}`);
    }
  }

  if (
    !auditValuesEqual(
      sortedAuditLocationIds(log.before.customer_locations),
      sortedAuditLocationIds(log.after.customer_locations),
    )
  ) {
    changedFields.push("location_ids");
  }

  return changedFields;
}

function metadataLabels(value: unknown, log?: AdminActivityLog) {
  if (!isRecord(value)) return [];

  const labels: Array<{ label: string; value: string; tone?: "success" | "warning" | "danger" }> =
    [];
  const sync = value.runchise_sync;
  if (isRecord(sync)) {
    const status = typeof sync.status === "string" ? sync.status : "";
    labels.push({
      label: "Sync Runchise",
      value:
        status === "synced"
          ? "Berhasil"
          : status === "failed"
            ? "Gagal"
            : status === "skipped"
              ? "Dilewati"
              : status || "-",
      tone: status === "synced" ? "success" : status === "failed" ? "danger" : "warning",
    });

    if (typeof sync.runchise_customer_id === "number") {
      labels.push({ label: "ID Runchise", value: String(sync.runchise_customer_id) });
    }
    if (sync.updated_existing === true) {
      labels.push({ label: "Aksi Runchise", value: "Update data yang sudah ada" });
    } else if (sync.matched_existing === true) {
      labels.push({ label: "Aksi Runchise", value: "Cocokkan data yang sudah ada" });
    }
    if (typeof sync.error === "string") {
      labels.push({ label: "Error Sync", value: sync.error, tone: "danger" });
    }
  }

  const activationEmail = value.activation_email;
  if (isRecord(activationEmail)) {
    const sent = activationEmail.sent === true;
    const skipped = activationEmail.skipped === true;
    labels.push({
      label: "Email Aktivasi",
      value: sent ? "Terkirim" : skipped ? "Dilewati" : "Gagal/belum terkirim",
      tone: sent ? "success" : skipped ? "warning" : "danger",
    });
    if (typeof activationEmail.error === "string") {
      labels.push({ label: "Error Email", value: activationEmail.error, tone: "danger" });
    }
    if (typeof activationEmail.reason === "string") {
      labels.push({ label: "Alasan Email", value: activationEmail.reason });
    }
  }

  const actualChangedFields = actualCustomerChangedFields(log);
  const metadataChangedFields = value.changed_fields;
  if (isNoisyLegacyCustomerChangedFields(metadataChangedFields)) {
    labels.push({
      label: "Field Berubah",
      value: actualChangedFields.length
        ? actualChangedFields.join(", ")
        : "Log lama sebelum perbaikan metadata, daftar field belum akurat",
      tone: "warning",
    });
  } else if (Array.isArray(metadataChangedFields) && metadataChangedFields.length > 0) {
    labels.push({
      label: "Field Berubah",
      value: metadataChangedFields.map(String).join(", "),
    });
  }

  return labels;
}

function metadataToneClass(tone?: "success" | "warning" | "danger") {
  if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
  if (tone === "danger") return "border-red-500/20 bg-red-500/10 text-red-700";
  if (tone === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  return "border-border bg-muted text-muted-foreground";
}

function ActivityMetadata({ log }: { log: AdminActivityLog }) {
  const value = log.metadata;
  const labels = metadataLabels(value, log);

  if (labels.length === 0) {
    return (
      <code
        className="block max-h-24 overflow-auto rounded-md bg-muted px-2 py-1 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words"
        title={compactJson(value)}
      >
        {compactJson(value)}
      </code>
    );
  }

  return (
    <div className="flex max-h-28 flex-col gap-1 overflow-auto pr-1">
      {labels.map((item) => (
        <span
          key={`${item.label}:${item.value}`}
          className={`rounded-md border px-2 py-1 text-[11px] font-semibold leading-snug ${metadataToneClass(
            item.tone,
          )}`}
          title={`${item.label}: ${item.value}`}
        >
          <span className="font-black">{item.label}:</span> {item.value}
        </span>
      ))}
    </div>
  );
}

function accountStatusLabel(status?: string | null) {
  if (status === "not_linked") return "Belum Terhubung";
  return status === "pending_activation" ? "Pending Aktivasi" : "Aktif";
}

function nextSortState<T extends string>(
  current: SortState<T>,
  sortBy: T,
  defaultOrder: SortOrder = "asc",
): SortState<T> {
  if (current.sort_by !== sortBy) {
    return { sort_by: sortBy, sort_order: defaultOrder };
  }

  return { sort_by: sortBy, sort_order: current.sort_order === "asc" ? "desc" : "asc" };
}

function requiredFieldsMessage(fields: string[]) {
  return `Lengkapi field wajib: ${fields.join(", ")}.`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function runchiseSyncLabel(status?: string | null) {
  if (status === "not_linked") return "Belum Terhubung";
  if (status === "synced") return "Runchise OK";
  if (status === "failed") return "Sync Gagal";
  if (status === "skipped") return "Belum Sync";
  return "Pending Sync";
}

function runchiseSyncClassName(status?: string | null) {
  if (status === "synced") return "bg-emerald-500/10 text-emerald-700";
  if (status === "failed") return "bg-red-500/10 text-red-700";
  if (status === "skipped") return "bg-amber-500/10 text-amber-700";
  return "bg-slate-500/10 text-slate-700";
}

function getCustomerSyncStatus(customer: AdminCustomer) {
  return customer.runchise_sync?.status ?? customer.runchise_sync_status ?? "not_linked";
}

function getCustomerSyncMessage(customer: AdminCustomer) {
  return (
    customer.runchise_sync?.error ??
    customer.runchise_sync_error ??
    customer.runchise_sync?.reason ??
    null
  );
}

function getCustomerSyncNotice(customer: AdminCustomer) {
  const status = getCustomerSyncStatus(customer);

  if (status === "failed") {
    return "Perubahan lokal belum terkirim ke Runchise.";
  }
  if (status === "pending") {
    return "Data lokal menunggu sync Runchise.";
  }
  if (status === "skipped") {
    return "Sync Runchise dilewati.";
  }
  if (status === "not_linked") {
    return "Customer Runchise belum terhubung ke data lokal.";
  }

  return null;
}

export function AdminPage({ mode = "admin" }: { mode?: ConsoleMode }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("report");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [userSort, setUserSort] = useState<SortState<UserSortKey>>({
    sort_by: "role",
    sort_order: "asc",
  });
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [appliedCustomerSearch, setAppliedCustomerSearch] = useState("");
  const [customerSort, setCustomerSort] = useState<SortState<CustomerSortKey>>({
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerLimit, setCustomerLimit] = useState(50);
  const [customerFrom, setCustomerFrom] = useState("");
  const [customerTo, setCustomerTo] = useState("");
  const [appliedCustomerFrom, setAppliedCustomerFrom] = useState("");
  const [appliedCustomerTo, setAppliedCustomerTo] = useState("");
  const [customerPageInput, setCustomerPageInput] = useState("1");
  const [customerRegistrationRange, setCustomerRegistrationRange] = useState<{
    earliest: string | null;
    latest: string | null;
  }>({ earliest: null, latest: null });
  const [customerImportJob, setCustomerImportJob] = useState<CustomerImportSyncJob | null>(null);
  const [salesTransactions, setSalesTransactions] = useState<CustomerSalesTransactionReport[]>([]);
  const [salesTransactionSearch, setSalesTransactionSearch] = useState("");
  const [salesTransactionOutlet, setSalesTransactionOutlet] = useState("");
  const [salesTransactionFrom, setSalesTransactionFrom] = useState("");
  const [salesTransactionTo, setSalesTransactionTo] = useState("");
  const [salesTransactionOutlets, setSalesTransactionOutlets] = useState<string[]>([]);
  const [salesTransactionPage, setSalesTransactionPage] = useState(1);
  const [salesTransactionTotalPages, setSalesTransactionTotalPages] = useState(1);
  const [salesTransactionTotal, setSalesTransactionTotal] = useState(0);
  const [salesTransactionLimit, setSalesTransactionLimit] = useState(50);
  const [salesTransactionPageInput, setSalesTransactionPageInput] = useState("1");
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [redeemItems, setRedeemItems] = useState<RedeemItem[]>([]);
  const [redeemSort, setRedeemSort] = useState<SortState<RedeemSortKey>>({
    sort_by: "sort_order",
    sort_order: "asc",
  });
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityAction, setActivityAction] = useState("");
  const [activityEntityType, setActivityEntityType] = useState("");
  const [activityFrom, setActivityFrom] = useState("");
  const [activityTo, setActivityTo] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const activityLimit = 50;
  const [catalogCategories, setCatalogCategories] = useState<CatalogMenuCategory[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogMenuItem[]>([]);
  const [reportRedemptionFrom, setReportRedemptionFrom] = useState("");
  const [reportRedemptionTo, setReportRedemptionTo] = useState("");
  const [reportOutletId, setReportOutletId] = useState("0");
  const [redeemForm, setRedeemForm] = useState<RedeemFormState>({
    id: 0,
    menu_item_id: 0,
    points_required: 0,
    sort_order: 0,
    is_active: true,
  });
  const [catalogSearch, setCatalogSearch] = useState("");
  const [appliedCatalogSearch, setAppliedCatalogSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [activeMobileForm, setActiveMobileForm] = useState<MobileCrudForm | null>(null);
  const loadedTabs = useRef<Partial<Record<Tab, boolean>>>({});
  const customerImportWorkerRunning = useRef(false);
  const notifiedCustomerImportJob = useRef<number | null>(null);

  const currentUser = useMemo(() => getUser(), []);
  const canAccess =
    mode === "marketing"
      ? currentUser?.role === "admin" || currentUser?.role === "marketing"
      : currentUser?.role === "admin";
  const canManageUsers = currentUser?.role === "admin";
  const canSyncCustomers = currentUser?.role === "admin" || currentUser?.role === "staff";
  const canViewCustomers = mode === "admin" || mode === "marketing";
  const canViewActivityLogs = currentUser?.role === "admin" && mode === "admin";
  const isMarketingConsole = mode === "marketing";
  const selectedCatalogItem = useMemo(
    () => catalogItems.find((item) => item.id === redeemForm.menu_item_id) ?? null,
    [catalogItems, redeemForm.menu_item_id],
  );
  const reportFilters = useMemo(
    () => ({
      redemption_from: reportRedemptionFrom,
      redemption_to: reportRedemptionTo,
      outlet_id: reportOutletId !== "0" ? Number(reportOutletId) : undefined,
    }),
    [reportOutletId, reportRedemptionFrom, reportRedemptionTo],
  );

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, locationData] = await Promise.all([
        adminApi.summary(reportFilters),
        locations.length === 0 ? adminApi.locations() : Promise.resolve(locations),
      ]);
      setSummary(summaryData);
      setLocations(locationData);
      loadedTabs.current.report = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan admin");
    } finally {
      setLoading(false);
    }
  }, [locations, reportFilters]);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) return;
    setLoading(true);
    setError("");
    try {
      setUsers(await adminApi.users(appliedUserSearch || userSearch.trim(), userSort));
      loadedTabs.current.users = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat user admin");
    } finally {
      setLoading(false);
    }
  }, [appliedUserSearch, canManageUsers, userSearch, userSort]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [customerData, brandData, locationData] = await Promise.all([
        adminApi.customers(appliedCustomerSearch, customerPage, customerLimit, customerSort, {
          from: appliedCustomerFrom,
          to: appliedCustomerTo,
        }),
        adminApi.brands(),
        adminApi.locations(),
      ]);
      setCustomers(customerData.items ?? []);
      setCustomerTotalPages(customerData.total_pages ?? 1);
      setCustomerTotal(customerData.total ?? 0);
      setCustomerPage(customerData.page ?? customerPage);
      setCustomerPageInput(String(customerData.page ?? customerPage));
      setCustomerRegistrationRange(
        customerData.registration_range ?? { earliest: null, latest: null },
      );
      setBrands(brandData);
      setLocations(locationData);

      if (!customerForm.brand_id && brandData[0]) {
        setCustomerForm((form) => ({ ...form, brand_id: brandData[0].id }));
      }
      loadedTabs.current.customers = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat customer admin");
    } finally {
      setLoading(false);
    }
  }, [
    appliedCustomerFrom,
    appliedCustomerSearch,
    appliedCustomerTo,
    customerForm.brand_id,
    customerLimit,
    customerPage,
    customerSort,
  ]);

  const loadSalesTransactions = useCallback(
    async (page = salesTransactionPage, limit = salesTransactionLimit) => {
      setLoading(true);
      setError("");
      try {
        const data = await adminApi.customerSalesTransactionReports({
          search: salesTransactionSearch.trim(),
          outlet: salesTransactionOutlet,
          from: salesTransactionFrom,
          to: salesTransactionTo,
          page,
          limit,
        });
        setSalesTransactions(data.items ?? []);
        setSalesTransactionPage(data.page ?? page);
        setSalesTransactionPageInput(String(data.page ?? page));
        setSalesTransactionTotalPages(data.total_pages ?? 1);
        setSalesTransactionTotal(data.total ?? 0);
        setSalesTransactionOutlets(data.outlets ?? []);
        loadedTabs.current["sales-transactions"] = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat transaksi customer");
      } finally {
        setLoading(false);
      }
    },
    [
      salesTransactionFrom,
      salesTransactionOutlet,
      salesTransactionPage,
      salesTransactionLimit,
      salesTransactionSearch,
      salesTransactionTo,
    ],
  );

  function jumpToSalesTransactionPage() {
    const requestedPage = Number(salesTransactionPageInput);
    if (!Number.isInteger(requestedPage) || requestedPage < 1) {
      setSalesTransactionPageInput(String(salesTransactionPage));
      return;
    }
    void loadSalesTransactions(requestedPage);
  }

  function changeSalesTransactionLimit(limit: number) {
    setSalesTransactionLimit(limit);
    setSalesTransactionPage(1);
    setSalesTransactionPageInput("1");
    void loadSalesTransactions(1, limit);
  }

  const loadRedeem = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRedeemItems(await adminApi.redeemItems(redeemSort));
      loadedTabs.current.redeem = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat menu redeem");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivityLogs = useCallback(
    async (page = activityPage) => {
      if (!canViewActivityLogs) return;
      setLoading(true);
      setError("");
      try {
        const data = await adminApi.activityLogs({
          search: activitySearch.trim(),
          action: activityAction.trim(),
          entity_type: activityEntityType.trim(),
          from: activityFrom,
          to: activityTo,
          page,
          limit: activityLimit,
        });
        setActivityLogs(data.items ?? []);
        setActivityPage(data.page ?? page);
        setActivityTotalPages(data.total_pages ?? 1);
        setActivityTotal(data.total ?? 0);
        loadedTabs.current.activity = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat activity log");
      } finally {
        setLoading(false);
      }
    },
    [
      activityAction,
      activityEntityType,
      activityFrom,
      activityPage,
      activitySearch,
      activityTo,
      canViewActivityLogs,
    ],
  );

  const refreshCurrentTab = useCallback(async () => {
    if (tab === "report") {
      await loadReport();
      return;
    }
    if (tab === "users") {
      if (canManageUsers && !isMarketingConsole) await loadUsers();
      return;
    }
    if (tab === "customers") {
      if (canViewCustomers) await loadCustomers();
      return;
    }
    if (tab === "sales-transactions") {
      await loadSalesTransactions();
      return;
    }
    if (tab === "activity") {
      if (canViewActivityLogs) await loadActivityLogs();
      return;
    }
    await loadRedeem();
  }, [
    loadActivityLogs,
    canManageUsers,
    canViewActivityLogs,
    canViewCustomers,
    isMarketingConsole,
    loadCustomers,
    loadSalesTransactions,
    loadRedeem,
    loadReport,
    loadUsers,
    tab,
  ]);

  useEffect(() => {
    if (tab !== "customers" || !canViewCustomers) return;

    const timer = window.setTimeout(() => {
      void searchCustomers(customerSearch);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [canViewCustomers, customerSearch, tab]);

  useEffect(() => {
    if (tab !== "customers" || !canSyncCustomers) return;

    let cancelled = false;
    let timer: number | undefined;

    const refreshCustomerTableAfterSync = async () => {
      const data = await adminApi.customers(
        appliedCustomerSearch,
        customerPage,
        customerLimit,
        customerSort,
        { from: appliedCustomerFrom, to: appliedCustomerTo },
      );
      if (cancelled) return;
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    };

    const poll = async () => {
      try {
        const statusResult = await adminApi.customerImportSyncStatus();
        if (cancelled) return;
        let job = statusResult.job;
        setCustomerImportJob(job);

        if (
          job &&
          (job.status === "queued" || job.status === "running") &&
          !customerImportWorkerRunning.current
        ) {
          customerImportWorkerRunning.current = true;
          try {
            const workerResult = await adminApi.processCustomerImportSync();
            if (!cancelled && workerResult.job) {
              job = workerResult.job;
              setCustomerImportJob(job);
            }
          } finally {
            customerImportWorkerRunning.current = false;
          }
        }

        if (
          (job?.status === "completed" || job?.status === "completed_with_errors") &&
          notifiedCustomerImportJob.current !== job.id
        ) {
          notifiedCustomerImportJob.current = job.id;
          await refreshCustomerTableAfterSync();
          if (!cancelled) {
            toast.success(
              `Sinkronisasi customer selesai: ${numberFormat(job.created)} dibuat, ${numberFormat(job.updated)} diperbarui`,
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Gagal membaca progres sinkronisasi customer",
          );
        }
      } finally {
        if (!cancelled) timer = window.setTimeout(poll, 5_000);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [
    appliedCustomerFrom,
    appliedCustomerSearch,
    appliedCustomerTo,
    canSyncCustomers,
    customerLimit,
    customerPage,
    customerSort,
    tab,
  ]);

  async function searchUsers() {
    const normalizedSearch = userSearch.trim();
    setError("");
    try {
      setAppliedUserSearch(normalizedSearch);
      setUsers(await adminApi.users(normalizedSearch, userSort));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari user");
    }
  }

  async function sortUsers(sortBy: UserSortKey) {
    const nextSort = nextSortState(userSort, sortBy, sortBy === "created_at" ? "desc" : "asc");
    setUserSort(nextSort);
    setError("");
    try {
      setUsers(await adminApi.users(appliedUserSearch, nextSort));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengurutkan user");
    }
  }

  async function searchCustomers(searchTerm = customerSearch) {
    const normalizedSearch = searchTerm.trim();
    setError("");
    try {
      setCustomerPage(1);
      setAppliedCustomerSearch(normalizedSearch);
      const data = await adminApi.customers(normalizedSearch, 1, customerLimit, customerSort, {
        from: appliedCustomerFrom,
        to: appliedCustomerTo,
      });
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerPageInput("1");
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari customer");
    }
  }

  async function loadCustomersPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), customerTotalPages);
    setError("");
    try {
      const data = await adminApi.customers(
        appliedCustomerSearch,
        nextPage,
        customerLimit,
        customerSort,
        { from: appliedCustomerFrom, to: appliedCustomerTo },
      );
      setCustomers(data.items ?? []);
      setCustomerPage(data.page ?? nextPage);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerPageInput(String(data.page ?? nextPage));
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat customer");
    }
  }

  async function startCustomerImportFromRunchise() {
    setSaving(true);
    setError("");
    try {
      const result = await adminApi.syncCustomers();
      setCustomerImportJob(result.job);
      toast.success(
        result.created
          ? "Job sinkronisasi customer Runchise dimulai"
          : "Sinkronisasi customer Runchise sedang berjalan",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyinkronkan customer Runchise";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function applyCustomerDateFilter() {
    if (customerFrom && customerTo && customerFrom > customerTo) {
      setError("Tanggal mulai tidak boleh melebihi tanggal akhir");
      return;
    }
    setError("");
    setCustomerPage(1);
    setCustomerPageInput("1");
    setAppliedCustomerFrom(customerFrom);
    setAppliedCustomerTo(customerTo);
    try {
      const data = await adminApi.customers(appliedCustomerSearch, 1, customerLimit, customerSort, {
        from: customerFrom,
        to: customerTo,
      });
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memfilter tanggal customer");
    }
  }

  async function resetCustomerDateFilter() {
    setCustomerFrom("");
    setCustomerTo("");
    setCustomerPage(1);
    setCustomerPageInput("1");
    setAppliedCustomerFrom("");
    setAppliedCustomerTo("");
    setError("");
    try {
      const data = await adminApi.customers(appliedCustomerSearch, 1, customerLimit, customerSort);
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset filter customer");
    }
  }

  async function changeCustomerLimit(limit: number) {
    setCustomerLimit(limit);
    setCustomerPage(1);
    setCustomerPageInput("1");
    setError("");
    try {
      const data = await adminApi.customers(appliedCustomerSearch, 1, limit, customerSort, {
        from: appliedCustomerFrom,
        to: appliedCustomerTo,
      });
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah jumlah customer per halaman");
    }
  }

  function jumpToCustomerPage() {
    const requestedPage = Number(customerPageInput);
    if (!Number.isInteger(requestedPage) || requestedPage < 1) {
      setCustomerPageInput(String(customerPage));
      return;
    }
    void loadCustomersPage(requestedPage);
  }

  const searchCatalog = useCallback(async () => {
    setError("");
    try {
      const search = catalogSearch.trim();
      const catalog = await adminApi.menuItems(search);
      setCatalogCategories(catalog.categories ?? []);
      setCatalogItems(catalog.items ?? []);
      setAppliedCatalogSearch(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari menu");
    }
  }, [catalogSearch]);

  async function resetCatalogSearch() {
    setError("");
    setCatalogSearch("");
    try {
      const catalog = await adminApi.menuItems("");
      setCatalogCategories(catalog.categories ?? []);
      setCatalogItems(catalog.items ?? []);
      setAppliedCatalogSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat menu");
    }
  }

  useEffect(() => {
    if (!canAccess) {
      navigate({ to: "/login" });
      return;
    }
    if (
      isMarketingConsole &&
      tab !== "report" &&
      tab !== "sales-transactions" &&
      tab !== "customers" &&
      tab !== "redeem"
    ) {
      setTab("report");
      return;
    }
    if (tab === "activity" && !canViewActivityLogs) {
      setTab("report");
      return;
    }
    if (loadedTabs.current[tab]) {
      setLoading(false);
      return;
    }
    refreshCurrentTab();
    // Run only when access or the active tab changes. Filter/search inputs fetch via their buttons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, canViewActivityLogs, isMarketingConsole, navigate, tab]);

  useEffect(() => {
    if (tab === "redeem" && catalogCategories.length === 0) searchCatalog();
  }, [catalogCategories.length, searchCatalog, tab]);

  function resetRedeemForm() {
    setRedeemForm({
      id: 0,
      menu_item_id: 0,
      points_required: 0,
      sort_order: 0,
      is_active: true,
    });
  }

  function openCreateUserForm() {
    setUserForm(emptyUserForm);
    setActiveMobileForm("user");
  }

  function openCreateCustomerForm() {
    setCustomerForm({ ...emptyCustomerForm, brand_id: brands[0]?.id ?? 1 });
    setActiveMobileForm("customer");
  }

  function openCreateRedeemForm() {
    resetRedeemForm();
    setActiveMobileForm("redeem");
  }

  function editUser(user: AdminUser) {
    setUserForm({
      id: user.id,
      email: user.email ?? "",
      phone_number: user.phone_number ?? "",
      password: "",
      role: user.role,
    });
    if (isMobile) setActiveMobileForm("user");
  }

  function editCustomer(customer: AdminCustomer) {
    setCustomerForm({
      id: customer.id,
      name: customer.name,
      email: customer.user.email ?? "",
      phone_number: customer.phone_number ?? "",
      phone_number_country_code: customer.phone_number_country_code,
      address: customer.address ?? "",
      province: customer.province ?? "",
      city: customer.city ?? "",
      country: customer.country ?? "Indonesia",
      postal_code: customer.postal_code ?? "",
      dob: customer.dob ? customer.dob.slice(0, 10) : "",
      gender: customer.gender ?? "unknown",
      status: customer.status ?? "active",
      balance: Number(customer.balance ?? 0),
      brand_id: customer.brand_id,
      owner_location_id: customer.owner_location_id ?? 0,
      location_ids:
        customer.customer_locations?.map((location) => location.location_id) ??
        (customer.owner_location_id ? [customer.owner_location_id] : []),
      total_point: customer.customer_point?.total_point ?? 0,
      available_point: customer.customer_point?.available_point ?? 0,
      next_reward_threshold: customer.customer_point?.next_reward_threshold ?? 2000,
    });
    if (isMobile) setActiveMobileForm("customer");
  }

  function editRedeemItem(item: RedeemItem) {
    setRedeemForm({
      id: item.id,
      menu_item_id: item.menu_item_id,
      points_required: item.points_required,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    if (isMobile) setActiveMobileForm("redeem");
  }

  async function saveUser() {
    setError("");
    const isEditing = Boolean(userForm.id);
    const missingFields: string[] = [];
    if (!userForm.email.trim() && !userForm.phone_number.trim()) {
      missingFields.push("Email atau Nomor Telepon");
    }
    if (!isEditing && !userForm.password.trim()) {
      missingFields.push("Password");
    }
    if (!userForm.role) {
      missingFields.push("Role");
    }

    if (missingFields.length > 0) {
      const message = requiredFieldsMessage(missingFields);
      setError(message);
      toast.error(message);
      return;
    }
    if (userForm.email.trim() && !isValidEmail(userForm.email.trim())) {
      const message = "Format email tidak valid.";
      setError(message);
      toast.error(message);
      return;
    }
    if (userForm.password && userForm.password.length < 6) {
      const message = "Password minimal 6 karakter.";
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        email: userForm.email || null,
        phone_number: userForm.phone_number || null,
        role: userForm.role,
        ...(userForm.password ? { password: userForm.password } : {}),
      };

      if (userForm.id) {
        await adminApi.updateUser(userForm.id, payload);
      } else {
        await adminApi.createUser(payload);
      }

      setUserForm(emptyUserForm);
      setActiveMobileForm(null);
      setUsers(await adminApi.users(appliedUserSearch, userSort));
      toast.success(
        isEditing ? "User admin berhasil diperbarui" : "User admin berhasil ditambahkan",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan user";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: number) {
    setSaving(true);
    setError("");
    try {
      await adminApi.deleteUser(id);
      setUsers(await adminApi.users(appliedUserSearch, userSort));
      if (userForm.id === id) setUserForm(emptyUserForm);
      toast.success("User admin berhasil dihapus");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus user";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteUser(user: AdminUser) {
    const userLabel = user.phone_number ?? user.email ?? `User #${user.id}`;

    setConfirmDialog({
      title: "Hapus user admin?",
      description: `User admin "${userLabel}" akan dihapus dan tidak bisa login lagi. Lanjut hapus?`,
      confirmLabel: "Hapus user",
      onConfirm: () => deleteUser(user.id),
    });
  }

  async function saveCustomer() {
    setError("");
    const isEditing = Boolean(customerForm.id);
    const missingFields: string[] = [];
    if (!customerForm.name.trim()) missingFields.push("Nama");
    if (!customerForm.phone_number.trim()) missingFields.push("Nomor Telepon");
    if (!customerForm.email.trim()) missingFields.push("Email");
    if (!customerForm.brand_id) missingFields.push("Brand");
    if (!customerForm.owner_location_id) missingFields.push("Owner Outlet");

    if (missingFields.length > 0) {
      const message = requiredFieldsMessage(missingFields);
      setError(message);
      toast.error(message);
      return;
    }
    if (!isValidEmail(customerForm.email.trim())) {
      const message = "Format email customer tidak valid.";
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      if (!customerForm.owner_location_id) {
        throw new Error("Owner outlet wajib dipilih agar customer bisa tersinkron ke Runchise");
      }

      const payload = {
        name: customerForm.name,
        email: customerForm.email || null,
        phone_number: customerForm.phone_number || null,
        phone_number_country_code: Number(customerForm.phone_number_country_code),
        address: customerForm.address || null,
        province: customerForm.province || null,
        city: customerForm.city || null,
        country: customerForm.country || null,
        postal_code: customerForm.postal_code || null,
        dob: customerForm.dob || null,
        gender: customerForm.gender,
        status: isEditing ? customerForm.status : "active",
        balance: isEditing ? Number(customerForm.balance) : 0,
        brand_id: Number(customerForm.brand_id || brands[0]?.id || 1),
        owner_location_id: customerForm.owner_location_id
          ? Number(customerForm.owner_location_id)
          : null,
        location_ids: customerForm.owner_location_id
          ? Array.from(
              new Set([...customerForm.location_ids, Number(customerForm.owner_location_id)]),
            )
          : customerForm.location_ids,
        total_point: isEditing ? Number(customerForm.total_point) : 0,
        available_point: isEditing ? Number(customerForm.available_point) : 0,
      };

      const savedCustomer = customerForm.id
        ? await adminApi.updateCustomer(customerForm.id, payload)
        : await adminApi.createCustomer(payload);
      const syncStatus = getCustomerSyncStatus(savedCustomer);
      const syncMessage = getCustomerSyncMessage(savedCustomer);
      const activationEmail = savedCustomer.activation_email;

      setCustomerForm({ ...emptyCustomerForm, brand_id: brands[0]?.id ?? 1 });
      setActiveMobileForm(null);
      await loadCustomersPage(customerForm.id ? customerPage : 1);
      setSummary(await adminApi.summary(reportFilters));
      if (syncStatus === "synced") {
        toast.success(isEditing ? "Customer berhasil diperbarui" : "Customer berhasil ditambahkan");
      } else {
        toast.warning(
          syncMessage
            ? isEditing
              ? `Perubahan tersimpan lokal, tetapi belum terkirim ke Runchise: ${syncMessage}`
              : `Customer tersimpan lokal, tetapi sync Runchise gagal: ${syncMessage}`
            : isEditing
              ? "Perubahan tersimpan lokal, tetapi belum terkirim ke Runchise"
              : "Customer tersimpan lokal, tetapi belum tersinkron ke Runchise",
        );
      }

      if (activationEmail?.sent) {
        toast.success("Email aktivasi berhasil dikirim otomatis");
      } else if (activationEmail && !activationEmail.skipped) {
        toast.warning(
          activationEmail.error
            ? `Email aktivasi belum terkirim: ${activationEmail.error}`
            : "Email aktivasi belum terkirim",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan customer";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(id: number) {
    setSaving(true);
    setError("");
    try {
      await adminApi.deleteCustomer(id);
      await loadCustomersPage(
        customers.length === 1 && customerPage > 1 ? customerPage - 1 : customerPage,
      );
      setSummary(await adminApi.summary(reportFilters));
      if (customerForm.id === id) setCustomerForm(emptyCustomerForm);
      toast.success("Customer berhasil dihapus");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus customer";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteCustomer(customer: AdminCustomer) {
    setConfirmDialog({
      title: "Hapus customer?",
      description: `Customer "${customer.name}" beserta akun login dan riwayat terkait akan dihapus. Lanjut hapus?`,
      confirmLabel: "Hapus customer",
      onConfirm: () => deleteCustomer(customer.id),
    });
  }

  async function resendActivation(customer: AdminCustomer) {
    setSaving(true);
    setError("");
    try {
      const result = await adminApi.resendCustomerActivation(customer.id);
      toast.success(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengirim email aktivasi";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function sortCustomers(sortBy: CustomerSortKey) {
    const nextSort = nextSortState(
      customerSort,
      sortBy,
      sortBy === "created_at" || sortBy === "points" ? "desc" : "asc",
    );
    setCustomerSort(nextSort);
    setCustomerPage(1);
    setError("");
    try {
      const data = await adminApi.customers(appliedCustomerSearch, 1, customerLimit, nextSort, {
        from: appliedCustomerFrom,
        to: appliedCustomerTo,
      });
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerPageInput("1");
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengurutkan customer");
    }
  }

  async function sortRedeemItems(sortBy: RedeemSortKey) {
    const nextSort = nextSortState(
      redeemSort,
      sortBy,
      sortBy === "created_at" || sortBy === "points" || sortBy === "price" ? "desc" : "asc",
    );
    setRedeemSort(nextSort);
    setError("");
    try {
      setRedeemItems(await adminApi.redeemItems(nextSort));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengurutkan menu redeem");
    }
  }

  async function retryCustomerRunchiseSync(customer: AdminCustomer) {
    setSaving(true);
    setError("");
    try {
      const result = await adminApi.retryCustomerRunchiseSync(customer.id);
      await loadCustomersPage(customerPage);
      const syncStatus = getCustomerSyncStatus(result);
      const syncMessage = getCustomerSyncMessage(result);

      if (syncStatus === "synced") {
        toast.success("Customer berhasil tersinkron ke Runchise");
      } else {
        toast.warning(
          syncMessage
            ? `Customer belum tersinkron ke Runchise: ${syncMessage}`
            : "Customer belum tersinkron ke Runchise",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal retry sync Runchise";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function saveRedeemItem() {
    setError("");
    const isEditing = Boolean(redeemForm.id);
    const missingFields: string[] = [];
    if (!redeemForm.menu_item_id) missingFields.push("Menu");
    if (!redeemForm.points_required) missingFields.push("Poin Redeem");

    if (missingFields.length > 0) {
      const message = requiredFieldsMessage(missingFields);
      setError(message);
      toast.error(message);
      return;
    }
    if (Number(redeemForm.points_required) <= 0) {
      const message = "Poin Redeem harus lebih dari 0.";
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        menu_item_id: Number(redeemForm.menu_item_id),
        points_required: Number(redeemForm.points_required),
        sort_order: Number(redeemForm.sort_order),
        is_active: redeemForm.is_active,
      };
      if (redeemForm.id) {
        await adminApi.updateRedeemItem(redeemForm.id, payload);
      } else {
        await adminApi.createRedeemItem(payload);
      }
      resetRedeemForm();
      setActiveMobileForm(null);
      await loadRedeem();
      setSummary(await adminApi.summary(reportFilters));
      toast.success(
        isEditing ? "Menu redeem berhasil diperbarui" : "Menu redeem berhasil ditambahkan",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan menu redeem";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRedeemItem(item: RedeemItem) {
    setSaving(true);
    setError("");
    try {
      await adminApi.deleteRedeemItem(item.id);
      setRedeemItems(await adminApi.redeemItems(redeemSort));
      if (redeemForm.id === item.id) {
        resetRedeemForm();
      }
      toast.success("Menu redeem berhasil dihapus");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus item redeem";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteRedeemItem(item: RedeemItem) {
    setConfirmDialog({
      title: `Hapus item redeem "${item.menu_item.name}"?`,
      description:
        "Item ini akan hilang dari menu redeem customer. Data yang sudah tersimpan sebelumnya tidak bisa dikembalikan dari aksi ini.",
      confirmLabel: "Hapus item",
      onConfirm: () => deleteRedeemItem(item),
    });
  }

  async function confirmDeleteAction() {
    if (!confirmDialog) return;

    await confirmDialog.onConfirm();
    setConfirmDialog(null);
  }

  const mobileUserForm = (
    <>
      <FormInput
        label="Email"
        type="email"
        value={userForm.email}
        onChange={(v) => setUserForm({ ...userForm, email: v })}
      />
      <FormInput
        label="Nomor Telepon"
        value={userForm.phone_number}
        onChange={(v) => setUserForm({ ...userForm, phone_number: v })}
      />
      <FormInput
        label={userForm.id ? "Password Baru" : "Password"}
        type="password"
        required={!userForm.id}
        value={userForm.password}
        onChange={(v) => setUserForm({ ...userForm, password: v })}
      />
      <Select
        label="Role"
        required
        value={userForm.role}
        onChange={(v) => setUserForm({ ...userForm, role: v })}
        options={[
          { value: "marketing", label: "Marketing" },
          { value: "admin", label: "Admin" },
        ]}
      />
      <Button onClick={saveUser} disabled={saving} className="mt-3 w-full rounded-full font-bold">
        Simpan User
      </Button>
    </>
  );

  const customerLoyaltyFields =
    customerForm.id > 0 ? (
      <CustomerFormGroup title="Loyalty">
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Status"
            value={customerForm.status}
            onChange={(v) => setCustomerForm({ ...customerForm, status: v })}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <ReadOnlyField label="Saldo" value={currencyFormat(Number(customerForm.balance))} />
          <ReadOnlyField label="Total Poin" value={numberFormat(customerForm.total_point)} />
          <ReadOnlyField label="Poin Tersedia" value={numberFormat(customerForm.available_point)} />
        </div>
      </CustomerFormGroup>
    ) : null;

  const mobileCustomerForm = (
    <>
      <CustomerFormGroup title="Identitas">
        <div className="grid gap-3 md:grid-cols-2">
          <FormInput
            label="Nama"
            required
            value={customerForm.name}
            onChange={(v) => setCustomerForm({ ...customerForm, name: v })}
          />
          <FormInput
            label="Nomor Telepon"
            required
            value={customerForm.phone_number}
            onChange={(v) => setCustomerForm({ ...customerForm, phone_number: v })}
          />
          <FormInput
            label="Email"
            required
            type="email"
            value={customerForm.email}
            onChange={(v) => setCustomerForm({ ...customerForm, email: v })}
          />
          <Select
            label="Gender"
            value={customerForm.gender}
            onChange={(v) => setCustomerForm({ ...customerForm, gender: v })}
            options={[
              { value: "unknown", label: "Unknown" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <FormInput
            label="Tanggal Lahir"
            type="date"
            value={customerForm.dob}
            onChange={(v) => setCustomerForm({ ...customerForm, dob: v })}
          />
        </div>
      </CustomerFormGroup>

      <CustomerFormGroup title="Lokasi">
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Brand"
            required
            value={String(customerForm.brand_id)}
            onChange={(v) => setCustomerForm({ ...customerForm, brand_id: Number(v) })}
            options={((brands ?? []).length ? brands : [{ id: 1, name: "Brand 1" }]).map(
              (brand) => ({
                value: String(brand.id),
                label: brand.name,
              }),
            )}
          />
          <Select
            label="Owner Outlet"
            required
            value={String(customerForm.owner_location_id)}
            onChange={(v) => {
              const ownerId = Number(v);
              setCustomerForm({
                ...customerForm,
                owner_location_id: ownerId,
                location_ids:
                  ownerId > 0
                    ? Array.from(new Set([...customerForm.location_ids, ownerId]))
                    : customerForm.location_ids,
              });
            }}
            options={[
              { value: "0", label: "Tanpa outlet" },
              ...(locations ?? []).map((location) => ({
                value: String(location.id),
                label: `${location.name}${location.city ? ` - ${location.city}` : ""}`,
              })),
            ]}
          />
        </div>
        <FormInput
          label="Alamat"
          value={customerForm.address}
          onChange={(v) => setCustomerForm({ ...customerForm, address: v })}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <FormInput
            label="Kota"
            value={customerForm.city}
            onChange={(v) => setCustomerForm({ ...customerForm, city: v })}
          />
          <FormInput
            label="Provinsi"
            value={customerForm.province}
            onChange={(v) => setCustomerForm({ ...customerForm, province: v })}
          />
          <FormInput
            label="Negara"
            value={customerForm.country}
            onChange={(v) => setCustomerForm({ ...customerForm, country: v })}
          />
          <FormInput
            label="Kode Pos"
            value={customerForm.postal_code}
            onChange={(v) => setCustomerForm({ ...customerForm, postal_code: v })}
          />
        </div>
      </CustomerFormGroup>

      {customerLoyaltyFields}
      <Button
        onClick={saveCustomer}
        disabled={saving}
        className="mt-3 w-full rounded-full font-bold"
      >
        Simpan Customer
      </Button>
    </>
  );

  const mobileRedeemForm = (
    <>
      <div className="mb-3 flex gap-2">
        <input
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchCatalog();
          }}
          placeholder="Cari menu..."
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
        <Button onClick={searchCatalog} variant="outline">
          Cari
        </Button>
        {appliedCatalogSearch && (
          <Button onClick={resetCatalogSearch} variant="outline">
            Reset
          </Button>
        )}
      </div>
      <CategoryMenuPicker
        categories={catalogCategories}
        items={catalogItems}
        searchQuery={appliedCatalogSearch}
        selectedItem={selectedCatalogItem}
        selectedItemId={redeemForm.menu_item_id}
        onSelect={(item) => setRedeemForm({ ...redeemForm, menu_item_id: item.id })}
      />
      <FormInput
        label="Poin Redeem"
        type="number"
        required
        value={String(redeemForm.points_required)}
        onChange={(v) => setRedeemForm({ ...redeemForm, points_required: Number(v) })}
      />
      <FormInput
        label="Urutan"
        type="number"
        value={String(redeemForm.sort_order)}
        onChange={(v) => setRedeemForm({ ...redeemForm, sort_order: Number(v) })}
      />
      <Toggle
        label="Aktif"
        checked={redeemForm.is_active}
        onChange={(v) => setRedeemForm({ ...redeemForm, is_active: v })}
      />
      <Button
        onClick={saveRedeemItem}
        disabled={saving}
        className="mt-3 w-full rounded-full font-bold"
      >
        Simpan Item
      </Button>
    </>
  );

  const mobileCrudTitle =
    activeMobileForm === "user"
      ? userForm.id
        ? "Edit User Admin"
        : "Tambah User Admin"
      : activeMobileForm === "customer"
        ? customerForm.id
          ? "Edit Customer"
          : "Tambah Customer"
        : redeemForm.id
          ? "Edit Menu Redeem"
          : "Tambah Menu Redeem";

  const mobileCrudContent =
    activeMobileForm === "user"
      ? mobileUserForm
      : activeMobileForm === "customer"
        ? mobileCustomerForm
        : mobileRedeemForm;

  if (!canAccess) return null;

  return (
    <main className="px-4 mt-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-muted-foreground">
              {isMarketingConsole ? "Marketing Console" : "Admin Console"}
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              {isMarketingConsole ? "Laporan & Menu Redeem" : "Program Loyalty"}
            </h1>
          </div>
          <Button onClick={refreshCurrentTab} disabled={loading} className="rounded-full font-bold">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <TabButton
            active={tab === "report"}
            onClick={() => setTab("report")}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Laporan"
          />
          {canManageUsers && !isMarketingConsole && (
            <TabButton
              active={tab === "users"}
              onClick={() => setTab("users")}
              icon={<Users className="h-4 w-4" />}
              label="User Admin"
            />
          )}
          {canViewCustomers && (
            <TabButton
              active={tab === "customers"}
              onClick={() => setTab("customers")}
              icon={<Users className="h-4 w-4" />}
              label="Customers"
            />
          )}
          <TabButton
            active={tab === "redeem"}
            onClick={() => setTab("redeem")}
            icon={<ListChecks className="h-4 w-4" />}
            label="Menu Redeem"
          />
          <TabButton
            active={tab === "sales-transactions"}
            onClick={() => setTab("sales-transactions")}
            icon={<ReceiptText className="h-4 w-4" />}
            label="Transaksi Customer"
          />
          {canViewActivityLogs && (
            <TabButton
              active={tab === "activity"}
              onClick={() => setTab("activity")}
              icon={<History className="h-4 w-4" />}
              label="Activity Log"
            />
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {error}
          </div>
        )}
        {loading && <AdminPageSkeleton tab={tab} />}

        {!loading && tab === "report" && summary && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              <Metric
                title="Total Member"
                value={numberFormat(summary.total_members)}
                icon={<Users className="h-4 w-4" />}
                tone="primary"
              />
              <Metric
                title="Member Aktif"
                value={numberFormat(summary.active_members)}
                icon={<UserCheck className="h-4 w-4" />}
                tone="success"
              />
              <Metric
                title="Poin Diberikan"
                value={numberFormat(summary.total_points_given)}
                icon={<Coins className="h-4 w-4" />}
                tone="gold"
              />
              <Metric
                title="Poin Ditukar"
                value={numberFormat(summary.points_redeemed)}
                icon={<TicketCheck className="h-4 w-4" />}
                tone="info"
              />
              <Metric
                title="Poin Tersedia"
                value={numberFormat(summary.total_points_available)}
                icon={<WalletCards className="h-4 w-4" />}
                tone="muted"
              />
              <Metric
                title="Total Redeem"
                value={numberFormat(summary.redemption_count)}
                icon={<Gift className="h-4 w-4" />}
                tone="danger"
              />
            </div>
            {/* Kolom "Customer di Outlet" tidak menjumlah ke kartu "Customer
                Tersimpan": kartu menghitung customer unik, sedangkan satu
                customer dapat terdaftar di beberapa outlet sekaligus. */}
            <Panel title="Jumlah customer Runchise per outlet (satu customer dapat terdaftar di beberapa outlet)">
              <DataTable
                headers={[
                  "Outlet",
                  "Source ID",
                  "Kota",
                  "Customer di Outlet",
                  "Customer Berpoin",
                  "Snapshot Terakhir",
                  "Status",
                ]}
                rows={(summary.runchise_customers_by_outlet ?? []).map((outlet) => [
                  outlet.outlet_name,
                  String(outlet.source_location_id),
                  outlet.city ?? "-",
                  numberFormat(outlet.stored_customers),
                  numberFormat(outlet.customers_with_points),
                  outlet.last_snapshot_at ? dateFormat(outlet.last_snapshot_at) : "-",
                  outlet.status === "capped"
                    ? "Dibatasi API"
                    : outlet.status === "mismatch"
                      ? "Mismatch"
                      : outlet.status === "empty"
                        ? "Belum ada data"
                        : "Tersedia",
                ])}
                emptyMessage="Belum ada outlet Runchise yang terdaftar."
                maxHeight={440}
              />
            </Panel>
            <div className="grid min-w-0 gap-5 lg:grid-cols-2">
              <Panel title="Reward paling sering ditukar">
                <TopRewardsChart rewards={summary.top_rewards ?? []} />
              </Panel>
              <Panel title="5 outlet paling sering redeem">
                <TopRedeemOutletsChart outlets={summary.top_redeem_outlets ?? []} />
              </Panel>
            </div>
            <Panel title="Riwayat semua reward yang ditukar">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto] md:items-end">
                <FormInput
                  label="Dari tanggal"
                  type="date"
                  value={reportRedemptionFrom}
                  onChange={setReportRedemptionFrom}
                />
                <FormInput
                  label="Hingga tanggal"
                  type="date"
                  value={reportRedemptionTo}
                  onChange={setReportRedemptionTo}
                />
                <Select
                  label="Outlet"
                  value={reportOutletId}
                  onChange={setReportOutletId}
                  options={[
                    { value: "0", label: "Semua outlet" },
                    ...(locations ?? []).map((location) => ({
                      value: String(location.id),
                      label: `${location.name}${location.city ? ` - ${location.city}` : ""}`,
                    })),
                  ]}
                />
                <Button
                  onClick={loadReport}
                  disabled={loading}
                  className="mb-3 rounded-full font-bold"
                >
                  Terapkan Filter
                </Button>
              </div>
              <RedemptionHistoryChart data={summary.redemption_trend ?? []} />
              <div className="mt-5">
                <DataTable
                  headers={["Tanggal", "Reward/Menu", "Outlet", "Poin", "Harga Jual"]}
                  rows={(summary.redemption_history ?? []).map((item) => [
                    dateFormat(item.redeemed_at),
                    item.reward_name,
                    item.outlet_city
                      ? `${item.outlet_name} (${item.outlet_city})`
                      : item.outlet_name,
                    numberFormat(item.points_spent),
                    item.menu_price !== null ? currencyFormat(item.menu_price) : "-",
                  ])}
                  emptyMessage="Belum ada riwayat reward yang ditukar pada rentang tanggal ini."
                />
              </div>
            </Panel>
            <Panel title="Aktivasi akun per outlet">
              <DataTable
                headers={["Outlet", "Kota", "Jumlah Aktivasi"]}
                rows={(summary.activation_by_outlet ?? []).map((outlet) => [
                  outlet.outlet_name,
                  outlet.city ?? "-",
                  numberFormat(outlet.activated_count),
                ])}
                emptyMessage="Belum ada data aktivasi akun per outlet."
              />
            </Panel>
          </section>
        )}

        {!loading && tab === "sales-transactions" && (
          <section>
            <Panel title="Crisbro Transaction Report">
              <div className="mb-4 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end">
                <FormInput
                  label="Cari"
                  value={salesTransactionSearch}
                  onChange={setSalesTransactionSearch}
                  placeholder="Nama, telepon, outlet, atau tipe order"
                />
                <Select
                  label="Outlet"
                  value={salesTransactionOutlet}
                  onChange={setSalesTransactionOutlet}
                  options={[
                    { value: "", label: "Semua outlet" },
                    ...salesTransactionOutlets.map((outlet) => ({ value: outlet, label: outlet })),
                  ]}
                />
                <FormInput
                  label="Dari tanggal"
                  type="date"
                  value={salesTransactionFrom}
                  onChange={setSalesTransactionFrom}
                />
                <FormInput
                  label="Hingga tanggal"
                  type="date"
                  value={salesTransactionTo}
                  onChange={setSalesTransactionTo}
                />
                <Button
                  onClick={() => loadSalesTransactions(1)}
                  disabled={loading}
                  className="mb-3 rounded-full font-bold"
                >
                  Terapkan
                </Button>
              </div>
              <TableScrollArea>
                <table className="min-w-[1450px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">ID Transaksi</th>
                      <th className="p-2">Nama Pelanggan</th>
                      <th className="p-2">No Telepon</th>
                      <th className="p-2">Lokasi Dibuat</th>
                      <th className="p-2">Pelanggan Sejak</th>
                      <th className="p-2">Poin Pelanggan</th>
                      <th className="p-2">Tanggal Transaksi</th>
                      <th className="p-2">Nama Outlet</th>
                      <th className="p-2">Tipe Order</th>
                      <th className="p-2 text-right">Pembelian per Order</th>
                      <th className="p-2 text-right">Penambahan Poin</th>
                      <th className="p-2 text-right">Penggunaan Poin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesTransactions.length === 0 && (
                      <tr className="border-t border-border">
                        <td colSpan={12} className="p-8 text-center font-bold">
                          Belum ada data transaksi customer yang sesuai.
                        </td>
                      </tr>
                    )}
                    {salesTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-border align-top">
                        <td className="p-2 font-mono text-xs">
                          {transaction.runchise_sales_transaction_id}
                        </td>
                        <td className="p-2 font-bold">{transaction.nama_pelanggan ?? "-"}</td>
                        <td className="p-2">{transaction.no_telepon ?? "-"}</td>
                        <td className="p-2">{transaction.lokasi_dibuat ?? "-"}</td>
                        <td className="p-2">
                          {transaction.pelanggan_sejak
                            ? dateFormat(transaction.pelanggan_sejak)
                            : "-"}
                        </td>
                        <td className="p-2">{numberFormat(transaction.poin_pelanggan)}</td>
                        <td className="p-2">
                          {transaction.tanggal_transaksi
                            ? dateTimeFormat(transaction.tanggal_transaksi)
                            : "-"}
                        </td>
                        <td className="p-2">{transaction.nama_outlet ?? "-"}</td>
                        <td className="p-2">{transaction.tipe_order ?? "-"}</td>
                        <td className="p-2 text-right">
                          {currencyFormat(toNumber(transaction.pembelian_per_order))}
                        </td>
                        <td className="p-2 text-right">
                          {numberFormat(transaction.penambahan_poin)}
                        </td>
                        <td className="p-2 text-right">
                          {numberFormat(toNumber(transaction.penggunaan_poin))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScrollArea>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex flex-wrap items-center gap-3 font-semibold text-muted-foreground">
                  <span>
                    Menampilkan{" "}
                    {salesTransactionTotal === 0
                      ? 0
                      : (salesTransactionPage - 1) * salesTransactionLimit + 1}
                    –{Math.min(salesTransactionPage * salesTransactionLimit, salesTransactionTotal)}{" "}
                    dari {numberFormat(salesTransactionTotal)} transaksi
                  </span>
                  <label className="flex items-center gap-2">
                    Per halaman
                    <select
                      value={salesTransactionLimit}
                      onChange={(event) => changeSalesTransactionLimit(Number(event.target.value))}
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
                    disabled={salesTransactionPage <= 1}
                    onClick={() => loadSalesTransactions(salesTransactionPage - 1)}
                    className="rounded-full font-bold"
                  >
                    Sebelumnya
                  </Button>
                  {paginationItems(salesTransactionPage, salesTransactionTotalPages).map(
                    (item, index) =>
                      item === "ellipsis" ? (
                        <span
                          key={`sales-ellipsis-${index}`}
                          className="px-1 text-muted-foreground"
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={item}
                          type="button"
                          variant={item === salesTransactionPage ? "default" : "outline"}
                          disabled={loading}
                          onClick={() => loadSalesTransactions(item)}
                          className="h-9 min-w-9 rounded-full px-3 font-bold"
                          aria-label={`Halaman transaksi ${item}`}
                          aria-current={item === salesTransactionPage ? "page" : undefined}
                        >
                          {item}
                        </Button>
                      ),
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={salesTransactionPage >= salesTransactionTotalPages}
                    onClick={() => loadSalesTransactions(salesTransactionPage + 1)}
                    className="rounded-full font-bold"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "activity" && canViewActivityLogs && (
          <section>
            <Panel title="Activity Log Admin & Marketing">
              <div className="mb-4 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] md:items-end">
                <FormInput label="Search" value={activitySearch} onChange={setActivitySearch} />
                <FormInput
                  label="Action"
                  value={activityAction}
                  onChange={setActivityAction}
                  placeholder="update_customer"
                />
                <FormInput
                  label="Entity"
                  value={activityEntityType}
                  onChange={setActivityEntityType}
                  placeholder="customer"
                />
                <FormInput
                  label="Dari"
                  type="date"
                  value={activityFrom}
                  onChange={setActivityFrom}
                />
                <FormInput label="Hingga" type="date" value={activityTo} onChange={setActivityTo} />
                <Button
                  onClick={() => loadActivityLogs(1)}
                  disabled={loading}
                  className="mb-3 rounded-full font-bold"
                >
                  Filter
                </Button>
              </div>
              <TableScrollArea>
                <table className="min-w-[1180px] w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[150px]" />
                    <col className="w-[220px]" />
                    <col className="w-[190px]" />
                    <col className="w-[150px]" />
                    <col className="w-[360px]" />
                    <col className="w-[110px]" />
                  </colgroup>
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Waktu</th>
                      <th className="p-2">Actor</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Entity</th>
                      <th className="p-2">Metadata</th>
                      <th className="p-2">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.length === 0 && (
                      <tr className="border-t border-border">
                        <td colSpan={6} className="p-8 text-center font-bold">
                          Belum ada activity log
                        </td>
                      </tr>
                    )}
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="border-t border-border align-top">
                        <td className="p-2 whitespace-nowrap">{dateTimeFormat(log.created_at)}</td>
                        <td className="p-2">
                          <p
                            className="truncate font-bold"
                            title={log.actor?.email ?? log.actor?.phone_number ?? undefined}
                          >
                            {log.actor?.email ??
                              log.actor?.phone_number ??
                              `User #${log.actor_user_id ?? "-"}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.actor_role ?? log.actor?.role ?? "-"}
                          </p>
                        </td>
                        <td className="p-2 break-words font-bold">{log.action}</td>
                        <td className="p-2 whitespace-nowrap">
                          {log.entity_type}
                          {log.entity_id ? ` #${log.entity_id}` : ""}
                        </td>
                        <td className="p-2">
                          <ActivityMetadata log={log} />
                        </td>
                        <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                          {log.ip_address ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScrollArea>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-muted-foreground">
                  Total {numberFormat(activityTotal)} log · Halaman {activityPage} dari{" "}
                  {activityTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || activityPage <= 1}
                    onClick={() => loadActivityLogs(activityPage - 1)}
                    className="rounded-full font-bold"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || activityPage >= activityTotalPages}
                    onClick={() => loadActivityLogs(activityPage + 1)}
                    className="rounded-full font-bold"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "users" && canManageUsers && (
          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <div className="hidden md:block">
              <Panel title={userForm.id ? "Edit User" : "Tambah User"}>
                <FormInput
                  label="Email"
                  type="email"
                  value={userForm.email}
                  onChange={(v) => setUserForm({ ...userForm, email: v })}
                />
                <FormInput
                  label="Nomor Telepon"
                  value={userForm.phone_number}
                  onChange={(v) => setUserForm({ ...userForm, phone_number: v })}
                />
                <FormInput
                  label={userForm.id ? "Password Baru" : "Password"}
                  type="password"
                  required={!userForm.id}
                  value={userForm.password}
                  onChange={(v) => setUserForm({ ...userForm, password: v })}
                />
                <Select
                  label="Role"
                  required
                  value={userForm.role}
                  onChange={(v) => setUserForm({ ...userForm, role: v })}
                  options={[
                    { value: "marketing", label: "Marketing" },
                    { value: "admin", label: "Admin" },
                  ]}
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={saveUser}
                    disabled={saving}
                    className="flex-1 rounded-full font-bold"
                  >
                    Simpan User
                  </Button>
                  {userForm.id > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUserForm(emptyUserForm)}
                      className="rounded-full font-bold"
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </Panel>
            </div>
            <Panel title="Daftar User Admin">
              <Button
                type="button"
                onClick={openCreateUserForm}
                className="mb-4 w-full rounded-full font-bold md:hidden"
              >
                Tambah User Admin
              </Button>
              <div className="mb-4 flex gap-2">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void searchUsers();
                    }
                  }}
                  placeholder="Cari email, nomor, atau role..."
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                />
                <Button onClick={searchUsers} variant="outline">
                  Cari
                </Button>
              </div>
              <TableScrollArea>
                <table className="min-w-[840px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <SortableHeader
                        label="Email"
                        sortKey="email"
                        sort={userSort}
                        onSort={sortUsers}
                      />
                      <SortableHeader
                        label="Nomor"
                        sortKey="phone_number"
                        sort={userSort}
                        onSort={sortUsers}
                      />
                      <SortableHeader
                        label="Role"
                        sortKey="role"
                        sort={userSort}
                        onSort={sortUsers}
                      />
                      <SortableHeader
                        label="Dibuat"
                        sortKey="created_at"
                        sort={userSort}
                        onSort={sortUsers}
                      />
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr className="border-t border-border">
                        <td colSpan={5} className="p-8 text-center">
                          <p className="font-bold text-foreground">
                            {appliedUserSearch
                              ? "Kata kunci yang Anda cari tidak ditemukan"
                              : "Belum ada data user admin"}
                          </p>
                          {appliedUserSearch && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Tidak ada hasil untuk "{appliedUserSearch}".
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-border">
                        <td className="p-2 font-bold">{user.email ?? "-"}</td>
                        <td className="p-2">{user.phone_number ?? "-"}</td>
                        <td className="p-2 capitalize">{user.role}</td>
                        <td className="p-2">{dateFormat(user.created_at)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <button
                              className="inline-flex items-center gap-1 font-bold text-primary"
                              onClick={() => editUser(user)}
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1 font-bold text-destructive disabled:opacity-50"
                              disabled={saving || user.id === currentUser?.id}
                              onClick={() => requestDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScrollArea>
            </Panel>
          </section>
        )}

        {!loading && tab === "customers" && (
          <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
            <div className="hidden md:block">
              <Panel title={customerForm.id ? "Edit Customer" : "Tambah Customer"}>
                <CustomerFormGroup title="Identitas">
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormInput
                      label="Nama"
                      required
                      value={customerForm.name}
                      onChange={(v) => setCustomerForm({ ...customerForm, name: v })}
                    />
                    <FormInput
                      label="Nomor Telepon"
                      required
                      value={customerForm.phone_number}
                      onChange={(v) => setCustomerForm({ ...customerForm, phone_number: v })}
                    />
                    <FormInput
                      label="Email"
                      required
                      type="email"
                      value={customerForm.email}
                      onChange={(v) => setCustomerForm({ ...customerForm, email: v })}
                    />
                    <Select
                      label="Gender"
                      value={customerForm.gender}
                      onChange={(v) => setCustomerForm({ ...customerForm, gender: v })}
                      options={[
                        { value: "unknown", label: "Unknown" },
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                      ]}
                    />
                    <FormInput
                      label="Tanggal Lahir"
                      type="date"
                      value={customerForm.dob}
                      onChange={(v) => setCustomerForm({ ...customerForm, dob: v })}
                    />
                  </div>
                </CustomerFormGroup>

                <CustomerFormGroup title="Lokasi">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select
                      label="Brand"
                      required
                      value={String(customerForm.brand_id)}
                      onChange={(v) => setCustomerForm({ ...customerForm, brand_id: Number(v) })}
                      options={((brands ?? []).length ? brands : [{ id: 1, name: "Brand 1" }]).map(
                        (brand) => ({
                          value: String(brand.id),
                          label: brand.name,
                        }),
                      )}
                    />
                    <Select
                      label="Owner Outlet"
                      required
                      value={String(customerForm.owner_location_id)}
                      onChange={(v) => {
                        const ownerId = Number(v);
                        setCustomerForm({
                          ...customerForm,
                          owner_location_id: ownerId,
                          location_ids:
                            ownerId > 0
                              ? Array.from(new Set([...customerForm.location_ids, ownerId]))
                              : customerForm.location_ids,
                        });
                      }}
                      options={[
                        { value: "0", label: "Tanpa outlet" },
                        ...(locations ?? []).map((location) => ({
                          value: String(location.id),
                          label: `${location.name}${location.city ? ` - ${location.city}` : ""}`,
                        })),
                      ]}
                    />
                  </div>
                  <FormInput
                    label="Alamat"
                    value={customerForm.address}
                    onChange={(v) => setCustomerForm({ ...customerForm, address: v })}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormInput
                      label="Kota"
                      value={customerForm.city}
                      onChange={(v) => setCustomerForm({ ...customerForm, city: v })}
                    />
                    <FormInput
                      label="Provinsi"
                      value={customerForm.province}
                      onChange={(v) => setCustomerForm({ ...customerForm, province: v })}
                    />
                    <FormInput
                      label="Negara"
                      value={customerForm.country}
                      onChange={(v) => setCustomerForm({ ...customerForm, country: v })}
                    />
                    <FormInput
                      label="Kode Pos"
                      value={customerForm.postal_code}
                      onChange={(v) => setCustomerForm({ ...customerForm, postal_code: v })}
                    />
                  </div>
                </CustomerFormGroup>

                {customerLoyaltyFields}
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={saveCustomer}
                    disabled={saving}
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
                      saving ||
                      customerImportJob?.status === "queued" ||
                      customerImportJob?.status === "running"
                    }
                    onClick={() => void startCustomerImportFromRunchise()}
                    className="ml-auto rounded-full font-bold"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${
                        saving ||
                        customerImportJob?.status === "queued" ||
                        customerImportJob?.status === "running"
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
                        : customerImportJob.status === "running"
                          ? "Sinkronisasi customer sedang berjalan"
                          : "Sinkronisasi customer menunggu worker"}
                    </p>
                    <span className="font-semibold text-muted-foreground">
                      Job #{customerImportJob.id}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          customerImportJob.locations_total > 0
                            ? (customerImportJob.locations_completed /
                                customerImportJob.locations_total) *
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
                      Percobaan terakhir gagal dan akan dilanjutkan dari cursor tersimpan:{" "}
                      {customerImportJob.error}
                    </p>
                  )}
                </div>
              )}
              <div className="mb-4 flex gap-2">
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void searchCustomers();
                    }
                  }}
                  placeholder="Cari nama, nomor, email, atau outlet..."
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                />
                <Button onClick={searchCustomers} variant="outline">
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
                <FormInput
                  label="Daftar hingga"
                  type="date"
                  value={customerTo}
                  onChange={setCustomerTo}
                />
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
                  <p className="text-xs font-bold text-muted-foreground">
                    Pendaftaran paling akhir
                  </p>
                  <p className="text-lg font-black">
                    {customerRegistrationRange.latest
                      ? dateFormat(customerRegistrationRange.latest)
                      : "-"}
                  </p>
                </div>
              </div>
              <TableScrollArea>
                <table className="min-w-[1540px] w-full text-sm">
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
                      <tr
                        key={customer.runchise_id ?? customer.id}
                        className="border-t border-border"
                      >
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
                                ?.map(
                                  (item) => item.location?.name ?? `Outlet ID ${item.location_id}`,
                                )
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
                            className={`inline-flex min-w-[104px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-black leading-tight ${
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
                              <p className="max-w-[220px] text-xs font-semibold text-amber-700">
                                {getCustomerSyncNotice(customer)}
                              </p>
                            )}
                            {getCustomerSyncMessage(customer) && (
                              <p className="max-w-[220px] text-xs text-muted-foreground">
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
                          {customer.runchise_updated_at
                            ? dateFormat(customer.runchise_updated_at)
                            : "-"}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            {customer.id > 0 &&
                              customer.user.activation_status === "pending_activation" && (
                                <span
                                  className="inline-flex min-w-[130px] flex-col items-start gap-1"
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
                                      className="inline-flex max-w-[150px] items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-left text-[11px] font-black leading-tight text-amber-700 transition-colors hover:border-amber-500/50 hover:bg-amber-500/15"
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
                    disabled={saving || customerPage <= 1}
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
                        disabled={saving}
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
                    disabled={saving || customerPage >= customerTotalPages}
                    onClick={() => loadCustomersPage(customerPage + 1)}
                    className="rounded-full font-bold"
                  >
                    Berikutnya
                  </Button>
                  <form
                    className="ml-1 flex items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      jumpToSalesTransactionPage();
                    }}
                  >
                    <input
                      type="number"
                      min={1}
                      max={salesTransactionTotalPages}
                      value={salesTransactionPageInput}
                      onChange={(event) => setSalesTransactionPageInput(event.target.value)}
                      className="w-20 rounded-lg border border-border bg-card px-2 py-2"
                      aria-label="Nomor halaman transaksi tujuan"
                    />
                    <Button type="submit" variant="outline" className="rounded-full font-bold">
                      Pergi
                    </Button>
                  </form>
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
                      className="w-20 rounded-lg border border-border bg-card px-2 py-2"
                      aria-label="Nomor halaman tujuan"
                    />
                    <Button type="submit" variant="outline" className="rounded-full font-bold">
                      Pergi
                    </Button>
                  </form>
                </div>
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "redeem" && (
          <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="hidden md:block">
              <Panel title={redeemForm.id ? "Edit Item Redeem" : "Tambah Item Redeem"}>
                <div className="mb-3 flex gap-2">
                  <input
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchCatalog();
                    }}
                    placeholder="Cari menu..."
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  />
                  <Button onClick={searchCatalog} variant="outline">
                    Cari
                  </Button>
                  {appliedCatalogSearch && (
                    <Button onClick={resetCatalogSearch} variant="outline">
                      Reset
                    </Button>
                  )}
                </div>
                <CategoryMenuPicker
                  categories={catalogCategories}
                  items={catalogItems}
                  searchQuery={appliedCatalogSearch}
                  selectedItem={selectedCatalogItem}
                  selectedItemId={redeemForm.menu_item_id}
                  onSelect={(item) => setRedeemForm({ ...redeemForm, menu_item_id: item.id })}
                />
                <FormInput
                  label="Poin Redeem"
                  type="number"
                  required
                  value={String(redeemForm.points_required)}
                  onChange={(v) => setRedeemForm({ ...redeemForm, points_required: Number(v) })}
                />
                <FormInput
                  label="Urutan"
                  type="number"
                  value={String(redeemForm.sort_order)}
                  onChange={(v) => setRedeemForm({ ...redeemForm, sort_order: Number(v) })}
                />
                <Toggle
                  label="Aktif"
                  checked={redeemForm.is_active}
                  onChange={(v) => setRedeemForm({ ...redeemForm, is_active: v })}
                />
                <Button
                  onClick={saveRedeemItem}
                  disabled={saving}
                  className="mt-3 w-full rounded-full font-bold"
                >
                  Simpan Item
                </Button>
              </Panel>
            </div>
            <Panel title="Menu Redeem Aktif dan Draft">
              <Button
                type="button"
                onClick={openCreateRedeemForm}
                className="mb-4 w-full rounded-full font-bold md:hidden"
              >
                Tambah Menu Redeem
              </Button>
              <TableScrollArea>
                <table className="min-w-[1040px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <SortableHeader
                        label="Menu"
                        sortKey="menu"
                        sort={redeemSort}
                        onSort={sortRedeemItems}
                      />
                      <SortableHeader
                        label="Nilai Jual & PB1"
                        sortKey="price"
                        sort={redeemSort}
                        onSort={sortRedeemItems}
                      />
                      <SortableHeader
                        label="Poin"
                        sortKey="points"
                        sort={redeemSort}
                        onSort={sortRedeemItems}
                      />
                      <SortableHeader
                        label="Status"
                        sortKey="status"
                        sort={redeemSort}
                        onSort={sortRedeemItems}
                      />
                      <SortableHeader
                        label="Urutan"
                        sortKey="sort_order"
                        sort={redeemSort}
                        onSort={sortRedeemItems}
                      />
                      <SortableHeader
                        label="Dibuat"
                        sortKey="created_at"
                        sort={redeemSort}
                        onSort={sortRedeemItems}
                      />
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redeemItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="border-t border-border p-6 text-center font-semibold text-muted-foreground"
                        >
                          Belum ada data menu redeem.
                        </td>
                      </tr>
                    ) : (
                      redeemItems.map((item) => (
                        <tr key={item.id} className="border-t border-border">
                        <td className="p-2 font-bold">
                          {item.menu_item.name}
                          {!item.menu_item.is_active && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
                              Menu Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="space-y-0.5">
                            <p className="font-semibold">
                              {currencyFormat(toNumber(item.menu_item.price))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PB1 {numberFormat(item.pb1_rate * 100)}%:{" "}
                              {currencyFormat(item.pb1_amount)}
                            </p>
                            <p className="text-xs font-bold text-primary">
                              Total {currencyFormat(item.price_with_pb1)}
                            </p>
                          </div>
                        </td>
                        <td className="p-2">{numberFormat(item.points_required)}</td>
                        <td className="p-2">{item.is_active ? "Aktif" : "Nonaktif"}</td>
                        <td className="p-2">{numberFormat(item.sort_order)}</td>
                        <td className="p-2">
                          {item.created_at ? dateFormat(item.created_at) : "-"}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="inline-flex items-center gap-1 font-bold text-primary"
                              onClick={() => editRedeemItem(item)}
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1 font-bold text-destructive"
                              disabled={saving}
                              onClick={() => requestDeleteRedeemItem(item)}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </button>
                          </div>
                        </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TableScrollArea>
            </Panel>
          </section>
        )}
      </section>
      <ConfirmDeleteDialog
        dialog={confirmDialog}
        saving={saving}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={confirmDeleteAction}
      />
      <MobileCrudDialog
        open={Boolean(activeMobileForm)}
        title={mobileCrudTitle}
        saving={saving}
        onClose={() => setActiveMobileForm(null)}
      >
        {mobileCrudContent}
      </MobileCrudDialog>
    </main>
  );
}

function MobileCrudDialog({
  open,
  title,
  saving,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  saving: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  const closeDialog = () => {
    if (!saving) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-foreground/35 p-3 backdrop-blur-sm md:hidden"
      onClick={closeDialog}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-crud-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg cursor-default flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-pop)"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
          <h2 id="mobile-crud-title" className="text-lg font-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={closeDialog}
            disabled={saving}
            aria-label="Tutup form"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">{children}</div>
      </section>
    </div>
  );
}

function ConfirmDeleteDialog({
  dialog,
  saving,
  onCancel,
  onConfirm,
}: {
  dialog: ConfirmDialogState | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!dialog) return null;

  const closeDialog = () => {
    if (!saving) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid cursor-pointer place-items-center bg-foreground/35 px-4 backdrop-blur-sm"
      onClick={closeDialog}
      role="presentation"
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md cursor-default rounded-xl border border-border bg-card p-6 shadow-(--shadow-pop)"
      >
        <button
          type="button"
          onClick={closeDialog}
          disabled={saving}
          aria-label="Tutup dialog konfirmasi"
          className="absolute right-4 top-4 grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <Trash2 className="h-6 w-6" />
        </div>
        <h2 id="confirm-delete-title" className="text-xl font-black tracking-tight">
          {dialog.title}
        </h2>
        <p id="confirm-delete-description" className="mt-2 text-sm leading-6 text-muted-foreground">
          {dialog.description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="font-bold"
          >
            Tidak, batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            {saving ? "Menghapus..." : dialog.confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-center text-sm font-bold ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

const metricToneClasses = {
  primary: {
    border: "border-primary/20",
    icon: "bg-primary/10 text-primary",
    accent: "bg-primary",
  },
  success: {
    border: "border-emerald-500/20",
    icon: "bg-emerald-500/10 text-emerald-700",
    accent: "bg-emerald-500",
  },
  gold: {
    border: "border-amber-500/20",
    icon: "bg-amber-500/10 text-amber-700",
    accent: "bg-amber-500",
  },
  info: {
    border: "border-sky-500/20",
    icon: "bg-sky-500/10 text-sky-700",
    accent: "bg-sky-500",
  },
  muted: {
    border: "border-muted-foreground/20",
    icon: "bg-muted text-muted-foreground",
    accent: "bg-muted-foreground",
  },
  danger: {
    border: "border-rose-500/20",
    icon: "bg-rose-500/10 text-rose-700",
    accent: "bg-rose-500",
  },
} as const;

function Metric({
  title,
  value,
  icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone?: keyof typeof metricToneClasses;
}) {
  const classes = metricToneClasses[tone];

  return (
    <div
      className={`relative flex min-h-[104px] min-w-0 flex-col overflow-hidden rounded-xl border bg-card px-3 pb-2.5 pt-3.5 shadow-(--shadow-soft) sm:min-h-[118px] sm:rounded-2xl sm:px-4 sm:pb-3 sm:pt-4 lg:min-h-[112px] ${classes.border}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${classes.accent}`} />
      <div className="flex min-h-[32px] items-center gap-2 sm:min-h-[36px] sm:gap-2.5">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full [&>svg]:h-3.5 [&>svg]:w-3.5 sm:h-8 sm:w-8 sm:[&>svg]:h-4 sm:[&>svg]:w-4 ${classes.icon}`}
        >
          {icon}
        </span>
        <p className="min-w-0 text-[11px] font-black uppercase leading-tight text-muted-foreground sm:text-xs">
          {title}
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-1 pt-1.5">
        <p className="max-w-full truncate text-[1.45rem] font-black leading-none tracking-normal tabular-nums sm:text-[1.65rem] lg:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function AdminPageSkeleton({ tab }: { tab: Tab }) {
  if (tab === "report") {
    return (
      <section className="space-y-6">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-[104px] flex-col rounded-xl border border-border bg-card px-3 pb-2.5 pt-3.5 shadow-(--shadow-soft) sm:min-h-[118px] sm:rounded-2xl sm:px-4 sm:pb-3 sm:pt-4 lg:min-h-[112px]"
            >
              <div className="flex min-h-[32px] items-center gap-2 sm:min-h-[36px] sm:gap-2.5">
                <Skeleton className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
                <Skeleton className="h-3 w-20 sm:w-24" />
              </div>
              <div className="flex flex-1 items-center justify-center pt-1.5">
                <Skeleton className="h-7 w-24 sm:h-8 sm:w-28" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)"
            >
              <Skeleton className="mb-5 h-6 w-56" />
              <Skeleton className="mb-4 h-4 w-64 max-w-full" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 flex-1 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
          <Skeleton className="mb-5 h-6 w-64" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="mt-5 h-48 w-full" />
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
        <Skeleton className="mb-5 h-6 w-44" />
        <div className="space-y-4">
          {Array.from({ length: tab === "redeem" ? 5 : 6 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
        <Skeleton className="mb-5 h-6 w-52" />
        <Skeleton className="mb-4 h-10 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1.2fr_1fr_0.8fr_0.7fr]">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopRewardsChart({ rewards }: { rewards: LoyaltySummary["top_rewards"] }) {
  const isCompact = useMediaQuery("(max-width: 640px)");
  const colors = ["#E11D48", "#F97316", "#EAB308", "#22C55E", "#0EA5E9"];
  const labelLimit = isCompact ? 14 : 24;
  const chartData = rewards.map((reward, index) => ({
    rank: index + 1,
    name: reward.reward_name,
    shortName:
      reward.reward_name.length > labelLimit
        ? `${reward.reward_name.slice(0, labelLimit)}...`
        : reward.reward_name,
    redemptions: reward.redemption_count,
    points: reward.points_spent,
    fill: colors[index % colors.length],
  }));
  const totalRedemptions = chartData.reduce((sum, reward) => sum + reward.redemptions, 0);

  if (chartData.length === 0) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">Belum ada data redemption.</p>
    );
  }

  return (
    <div className="min-w-0 space-y-3 overflow-hidden">
      <p className="text-sm font-semibold text-muted-foreground">
        Total {numberFormat(totalRedemptions)} redeem dari 5 reward teratas
      </p>
      <ChartContainer
        config={{
          redemptions: {
            label: "Jumlah Redeem",
            color: colors[0],
          },
        }}
        className="h-[260px] min-h-[230px] w-full min-w-0 max-w-full overflow-hidden"
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: isCompact ? 18 : 42, left: 0, bottom: 4 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => numberFormat(Number(value))}
          />
          <YAxis
            dataKey="shortName"
            type="category"
            width={isCompact ? 88 : 138}
            tickLine={false}
            axisLine={false}
            tickMargin={isCompact ? 6 : 10}
            tick={({ x, y, payload }) => {
              const item = chartData.find((reward) => reward.shortName === payload.value);
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    className="fill-foreground text-[10px] font-bold sm:text-[11px]"
                  >
                    {item ? `#${item.rank} ${payload.value}` : payload.value}
                  </text>
                </g>
              );
            }}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={
              <ChartTooltipContent
                hideLabel={false}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                formatter={(value, name, item) => (
                  <div className="grid min-w-[190px] gap-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {name === "redemptions" ? "Jumlah Redeem" : name}
                      </span>
                      <span className="font-mono font-bold">{numberFormat(Number(value))}</span>
                    </div>
                    {item.payload?.points !== undefined && (
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Poin Terpakai</span>
                        <span className="font-mono font-semibold">
                          {numberFormat(Number(item.payload.points))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="redemptions" radius={[0, 7, 7, 0]} barSize={22}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="redemptions"
              position="right"
              offset={isCompact ? 4 : 10}
              className="fill-foreground text-[10px] font-black sm:text-xs"
              formatter={(value: number) => numberFormat(value)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function TopRedeemOutletsChart({
  outlets,
}: {
  outlets: NonNullable<LoyaltySummary["top_redeem_outlets"]>;
}) {
  const isCompact = useMediaQuery("(max-width: 640px)");
  const colors = ["#0EA5E9", "#22C55E", "#F97316", "#E11D48", "#8B5CF6"];
  const labelLimit = isCompact ? 14 : 22;
  const chartData = outlets.map((outlet, index) => ({
    rank: index + 1,
    name: outlet.outlet_name,
    shortName:
      outlet.outlet_name.length > labelLimit
        ? `${outlet.outlet_name.slice(0, labelLimit)}...`
        : outlet.outlet_name,
    redemptions: outlet.redemption_count,
    points: outlet.points_spent,
    city: outlet.city,
    fill: colors[index % colors.length],
  }));
  const totalRedemptions = chartData.reduce((sum, outlet) => sum + outlet.redemptions, 0);

  if (chartData.length === 0) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">Belum ada data redeem outlet.</p>
    );
  }

  return (
    <div className="min-w-0 space-y-3 overflow-hidden">
      <p className="text-sm font-semibold text-muted-foreground">
        Total {numberFormat(totalRedemptions)} redeem dari 5 outlet teratas
      </p>
      <ChartContainer
        config={{
          redemptions: {
            label: "Jumlah Redeem",
            color: colors[0],
          },
        }}
        className="h-[260px] min-h-[230px] w-full min-w-0 max-w-full overflow-hidden"
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: isCompact ? 18 : 42, left: 0, bottom: 4 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => numberFormat(Number(value))}
          />
          <YAxis
            dataKey="shortName"
            type="category"
            width={isCompact ? 88 : 138}
            tickLine={false}
            axisLine={false}
            tickMargin={isCompact ? 6 : 10}
            tick={({ x, y, payload }) => {
              const item = chartData.find((outlet) => outlet.shortName === payload.value);
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    className="fill-foreground text-[10px] font-bold sm:text-[11px]"
                  >
                    {item ? `#${item.rank} ${payload.value}` : payload.value}
                  </text>
                </g>
              );
            }}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={
              <ChartTooltipContent
                hideLabel={false}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                formatter={(value, name, item) => (
                  <div className="grid min-w-[190px] gap-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {name === "redemptions" ? "Jumlah Redeem" : name}
                      </span>
                      <span className="font-mono font-bold">{numberFormat(Number(value))}</span>
                    </div>
                    {item.payload?.city && (
                      <div className="text-xs font-semibold text-muted-foreground">
                        {item.payload.city}
                      </div>
                    )}
                    {item.payload?.points !== undefined && (
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Poin Terpakai</span>
                        <span className="font-mono font-semibold">
                          {numberFormat(Number(item.payload.points))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="redemptions" radius={[0, 7, 7, 0]} barSize={22}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="redemptions"
              position="right"
              offset={isCompact ? 4 : 10}
              className="fill-foreground text-[10px] font-black sm:text-xs"
              formatter={(value: number) => numberFormat(value)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function RedemptionHistoryChart({
  data,
}: {
  data: NonNullable<LoyaltySummary["redemption_trend"]>;
}) {
  const chartData = data.map((item) => ({
    ...item,
    label: dateFormat(item.date),
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm font-semibold text-muted-foreground">
        Belum ada data reward yang ditukar pada rentang tanggal ini.
      </p>
    );
  }

  return (
    <ChartContainer
      config={{
        redemption_count: {
          label: "Jumlah Redeem",
          color: "#E11D48",
        },
        points_spent: {
          label: "Poin Ditukar",
          color: "#0EA5E9",
        },
      }}
      className="min-h-[260px] w-full"
    >
      <LineChart data={chartData} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={18} />
        <YAxis
          yAxisId="count"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => numberFormat(Number(value))}
        />
        <YAxis
          yAxisId="points"
          orientation="right"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => numberFormat(Number(value))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel={false}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
              formatter={(value, name) => (
                <div className="flex min-w-[170px] items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {name === "redemption_count" ? "Jumlah Redeem" : "Poin Ditukar"}
                  </span>
                  <span className="font-mono font-bold">{numberFormat(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey="redemption_count"
          stroke="#E11D48"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="points"
          type="monotone"
          dataKey="points_spent"
          stroke="#0EA5E9"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, [query]);

  return matches;
}

function CategoryMenuPicker({
  categories,
  items,
  searchQuery,
  selectedItem,
  selectedItemId,
  onSelect,
}: {
  categories: CatalogMenuCategory[];
  items: CatalogMenuItem[];
  searchQuery: string;
  selectedItem: CatalogMenuItem | null;
  selectedItemId: number;
  onSelect: (item: CatalogMenuItem) => void;
}) {
  const isSearching = searchQuery.trim().length > 0;
  const groups = useMemo(() => {
    const groupMap = new Map<
      string,
      { id: string; name: string; isActive: boolean; items: CatalogMenuItem[] }
    >();

    if (!isSearching) {
      for (const category of categories) {
        groupMap.set(String(category.id), {
          id: String(category.id),
          name: category.name,
          isActive: category.is_active,
          items: [],
        });
      }
    }

    for (const item of items) {
      const categoryId = item.category?.id ?? 0;
      const categoryName = item.category?.name ?? "Tanpa kategori";
      const categoryIsActive = item.category?.is_active ?? true;
      const id = String(categoryId);

      if (!groupMap.has(id)) {
        groupMap.set(id, {
          id,
          name: categoryName,
          isActive: categoryIsActive,
          items: [],
        });
      }

      groupMap.get(id)?.items.push(item);
    }

    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [categories, isSearching, items]);

  const [activeGroupId, setActiveGroupId] = useState("");

  useEffect(() => {
    if (groups.length === 0) {
      setActiveGroupId("");
      return;
    }

    const selectedGroup = groups.find((group) =>
      group.items.some((item) => item.id === selectedItemId),
    );
    const nextGroupId = selectedGroup?.id ?? groups[0].id;

    setActiveGroupId((current) =>
      current && groups.some((group) => group.id === current) ? current : nextGroupId,
    );
  }, [groups, selectedItemId]);

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];

  return (
    <div className="mb-3">
      <p className="mb-1 text-sm font-bold">Menu</p>
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border px-3 py-2 text-sm font-semibold text-muted-foreground">
          {selectedItem
            ? `${selectedItem.name} - ${selectedItem.category?.name ?? "Tanpa kategori"}`
            : "Pilih menu dari kategori"}
        </div>
        {isSearching && (
          <div className="border-b border-border bg-secondary/40 px-3 py-2 text-xs font-bold text-muted-foreground">
            Hasil pencarian "{searchQuery}" - {numberFormat(items.length)} menu di{" "}
            {numberFormat(groups.length)} kategori
          </div>
        )}
        {groups.length === 0 ? (
          <p className="p-3 text-sm font-semibold text-muted-foreground">
            {isSearching
              ? `Tidak ada menu ditemukan untuk "${searchQuery}".`
              : "Tidak ada menu ditemukan."}
          </p>
        ) : (
          <div className="grid min-h-[220px] md:grid-cols-[220px_1fr]">
            <div className="max-h-[280px] overflow-auto border-b border-border md:border-b-0 md:border-r">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onMouseEnter={() => setActiveGroupId(group.id)}
                  onFocus={() => setActiveGroupId(group.id)}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-bold ${
                    activeGroup?.id === group.id
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-secondary/70"
                  }`}
                >
                  <span>
                    {group.name}
                    {!group.isActive && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
                        Nonaktif
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{group.items.length}</span>
                </button>
              ))}
            </div>
            <div className="max-h-[320px] overflow-auto p-2">
              {(activeGroup?.items ?? []).length === 0 ? (
                <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                  Belum ada menu di kategori ini.
                </p>
              ) : (
                (activeGroup?.items ?? []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm ${
                      selectedItemId === item.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <span className="block font-bold">
                      {item.name}
                      {!item.is_active && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                            selectedItemId === item.id
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          Menu Nonaktif
                        </span>
                      )}
                    </span>
                    <span className="text-xs opacity-80">
                      {currencyFormat(toNumber(item.price))}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function CustomerFormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mb-5 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-sm font-black uppercase text-muted-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

function RequiredLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <>
      {label}
      {required && (
        <span className="ml-1 text-destructive" aria-label="wajib diisi">
          *
        </span>
      )}
    </>
  );
}

function SortableHeader<T extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className = "p-2",
}: {
  label: string;
  sortKey: T;
  sort: SortState<T>;
  onSort: (sortKey: T) => void;
  className?: string;
}) {
  const active = sort.sort_by === sortKey;
  const Icon = active ? (sort.sort_order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className={className}
      aria-sort={active ? (sort.sort_order === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 rounded-md text-left font-black transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 ${
          active ? "text-primary" : ""
        }`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </th>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="mb-3 block text-sm font-bold">
      <RequiredLabel label={label} required={required} />
      <input
        type={type}
        value={value}
        required={required}
        aria-required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-medium"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 block text-sm font-bold">
      <span className="block">{label}</span>
      <div className="mt-1 w-full rounded-xl border border-border bg-muted/40 px-3 py-2 font-medium text-muted-foreground">
        {value}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLLabelElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  const updateDropdownStyle = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 6;
    const edgePadding = 12;
    const preferredMaxHeight = 208;
    const width = Math.min(rect.width, viewportWidth - edgePadding * 2);
    const left = Math.min(Math.max(rect.left, edgePadding), viewportWidth - width - edgePadding);
    const top = rect.bottom + gap;
    const spaceBelow = viewportHeight - top - edgePadding;
    const maxHeight = Math.max(72, Math.min(preferredMaxHeight, Math.max(72, spaceBelow)));

    setDropdownStyle({ left, top, width, maxHeight });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        selectRef.current &&
        !selectRef.current.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    updateDropdownStyle();
    window.addEventListener("resize", updateDropdownStyle);
    window.addEventListener("scroll", updateDropdownStyle, true);

    return () => {
      window.removeEventListener("resize", updateDropdownStyle);
      window.removeEventListener("scroll", updateDropdownStyle, true);
    };
  }, [open, updateDropdownStyle]);

  return (
    <label ref={selectRef} className="relative mb-3 block text-sm font-bold text-foreground">
      <span className="mb-1.5 block text-xs font-black uppercase text-muted-foreground">
        <RequiredLabel label={label} required={required} />
      </span>
      <span className="relative block">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            updateDropdownStyle();
            setOpen((current) => !current);
          }}
          className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-sm font-bold text-foreground shadow-sm outline-none transition-colors hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
        >
          <span className="min-w-0 truncate">{selectedOption?.label ?? "Pilih opsi"}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open &&
          dropdownStyle &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[220] overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-soft)"
              style={{
                left: dropdownStyle.left,
                top: dropdownStyle.top,
                width: dropdownStyle.width,
              }}
            >
              <div
                role="listbox"
                className="overflow-y-auto p-1"
                style={{ maxHeight: dropdownStyle.maxHeight }}
              >
                {(options ?? []).map((option) => {
                  const selected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="block truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )}
      </span>
    </label>
  );
}

function TableScrollArea({
  children,
  maxHeight,
}: {
  children: ReactNode;
  maxHeight?: number;
}) {
  return (
    <div
      className={`table-scroll-area -mx-1 min-w-0 max-w-full overscroll-contain px-1 pb-3 ${
        maxHeight ? "overflow-auto" : "overflow-x-scroll overflow-y-hidden"
      }`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
}

function DataTable({
  headers,
  rows,
  emptyMessage = "Belum ada data.",
  minWidth,
  maxHeight,
}: {
  headers: string[];
  rows?: string[][];
  emptyMessage?: string;
  minWidth?: number;
  maxHeight?: number;
}) {
  const [sort, setSort] = useState<SortState<string>>({ sort_by: "", sort_order: "asc" });
  const hasRows = (rows ?? []).length > 0;
  const tableMinWidth = minWidth ?? Math.max(640, headers.length * 160);
  const sortedRows = useMemo(() => {
    if (!sort.sort_by) return rows ?? [];
    const columnIndex = Number(sort.sort_by);
    if (!Number.isInteger(columnIndex)) return rows ?? [];

    return [...(rows ?? [])].sort((a, b) => {
      const direction = sort.sort_order === "asc" ? 1 : -1;
      return compareTableCell(a[columnIndex], b[columnIndex]) * direction;
    });
  }, [rows, sort]);

  return (
    <TableScrollArea maxHeight={maxHeight}>
      <table className="w-full text-sm" style={{ minWidth: tableMinWidth }}>
        <thead>
          <tr className="text-left text-muted-foreground">
            {(headers ?? []).map((header, index) => (
              <SortableHeader
                key={header}
                label={header}
                sortKey={String(index)}
                sort={sort}
                onSort={(sortKey) => setSort((current) => nextSortState(current, sortKey))}
                className={maxHeight ? "sticky top-0 z-10 bg-background p-2 shadow-sm" : "p-2"}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            sortedRows.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {(row ?? []).map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-2 font-medium">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="border-t border-border">
              <td className="p-2 font-medium text-muted-foreground" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableScrollArea>
  );
}

function compareTableCell(a = "", b = "") {
  const firstDate = Date.parse(a);
  const secondDate = Date.parse(b);
  if (!Number.isNaN(firstDate) && !Number.isNaN(secondDate)) {
    return firstDate - secondDate;
  }

  const firstNumber = parseTableNumber(a);
  const secondNumber = parseTableNumber(b);
  if (firstNumber !== null && secondNumber !== null) {
    return firstNumber - secondNumber;
  }

  return a.localeCompare(b, "id-ID", { numeric: true, sensitivity: "base" });
}

function parseTableNumber(value: string) {
  const normalized = value
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (!normalized || normalized === "-") return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}
