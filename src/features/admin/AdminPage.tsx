import { useNavigate } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUser } from "@/lib/auth";
import {
  adminApi,
  type AdminActivityLog,
  type AdminBrand,
  type AdminCustomer,
  type CustomerEmailStatus,
  type CustomerImportSyncJob,
  type CustomerSalesTransactionReport,
  type AdminLocation,
  type AdminUser,
  type CatalogMenuCategory,
  type CatalogMenuItem,
  type LoyaltySummary,
  type RedeemItem,
} from "@/lib/admin";
import { BarChart3, History, ListChecks, RefreshCw, ReceiptText, Users } from "lucide-react";
import { toast } from "sonner";
import {
  getCustomerSyncMessage,
  getCustomerSyncStatus,
  nextSortState,
  numberFormat,
  type SortState,
} from "./adminFormatters";
import { DebouncedSearchInput, type DebouncedSearchInputHandle } from "./DebouncedSearchInput";
import { emptyCustomerForm, emptyUserForm, type RedeemFormState } from "./adminFormDefaults";
import { useStableCallback } from "./useStableCallback";
import { AdminPageSkeleton, TabButton } from "./AdminConsoleChrome";
import type { ConfirmDialogState, ConsoleTab } from "./adminConsoleTypes";
import { adminTabLoaders } from "./adminTabLoaders";

// H-5: tab read-only dipecah jadi modul lazy tersendiri, jadi kode &
// helper-nya hanya diunduh browser saat tab itu benar-benar dibuka.
// L-7: tiga tab sisanya (user, customer, redeem) menyusul dengan pola yang sama,
// sehingga AdminPage.tsx tinggal memegang state + orkestrasi, bukan lagi markup
// setiap tab. State tetap di sini supaya isian form dan posisi halaman tidak
// hilang saat berpindah tab -- perilaku itu sengaja tidak diubah.
const AdminActivityTab = lazy(adminTabLoaders.activity);
const AdminReportTab = lazy(adminTabLoaders.report);
const AdminSalesTransactionsTab = lazy(adminTabLoaders.sales);
const AdminUsersTab = lazy(adminTabLoaders.users);
const AdminCustomersTab = lazy(adminTabLoaders.customers);
const AdminRedeemTab = lazy(adminTabLoaders.redeem);
const ConfirmDeleteDialog = lazy(() =>
  import("./AdminDialogs").then((module) => ({ default: module.ConfirmDeleteDialog })),
);
const MobileCrudDialog = lazy(() =>
  import("./AdminDialogs").then((module) => ({ default: module.MobileCrudDialog })),
);
const UserFormFields = lazy(() =>
  import("./AdminFormFields").then((module) => ({ default: module.UserFormFields })),
);
const CustomerFormFields = lazy(() =>
  import("./AdminFormFields").then((module) => ({ default: module.CustomerFormFields })),
);
const RedeemFormFields = lazy(() =>
  import("./AdminFormFields").then((module) => ({ default: module.RedeemFormFields })),
);

type Tab = ConsoleTab;
type ConsoleMode = "admin" | "marketing";
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

type MobileCrudForm = "user" | "customer" | "redeem";

function requiredFieldsMessage(fields: string[]) {
  return `Lengkapi field wajib: ${fields.join(", ")}.`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AdminPage({ mode = "admin" }: { mode?: ConsoleMode }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("report");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const userLimit = 50;
  // H-5: sama seperti pencarian customer -- nilai ketikan ditahan komponen
  // input, bukan state di sini.
  const userSearchRef = useRef<DebouncedSearchInputHandle>(null);
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [userSort, setUserSort] = useState<SortState<UserSortKey>>({
    sort_by: "role",
    sort_order: "asc",
  });
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  // H-5: nilai ketikan pencarian TIDAK lagi disimpan di sini. Dulu setiap
  // huruf memicu setState di komponen ini, sehingga badan AdminPage
  // dieksekusi ulang dan seluruh JSX tab aktif (termasuk tabel puluhan baris)
  // dibuat ulang. Sekarang nilainya ditahan DebouncedSearchInput, dan
  // komponen ini hanya diberi tahu saat pencarian benar-benar dijalankan.
  const customerSearchRef = useRef<DebouncedSearchInputHandle>(null);
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
  // Berlaku langsung saat dipilih, tanpa tombol terapkan, karena hanya satu
  // pilihan dan petugas outlet memakainya berulang kali.
  const [customerEmailStatus, setCustomerEmailStatus] = useState<CustomerEmailStatus>("all");
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
  const [redeemPage, setRedeemPage] = useState(1);
  const [redeemTotalPages, setRedeemTotalPages] = useState(1);
  const [redeemTotal, setRedeemTotal] = useState(0);
  const redeemLimit = 50;
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
  // M-8: daftar outlet untuk dropdown filter dulu ikut terhitung ulang di
  // setiap loadSalesTransactions (distinct scan atas tabel terbesar di
  // database). Sekarang dimuat sekali lewat endpoint terpisah, dijaga flag
  // ini supaya tidak diulang di setiap page/filter change.
  const salesTransactionOutletsLoaded = useRef(false);
  const customerImportWorkerRunning = useRef(false);
  // Saklar server (RUNCHISE_CUSTOMER_SYNC_ENABLED). Default true supaya UI
  // tidak berkedip "dijeda" sebelum status pertama diterima.
  const [customerSyncEnabled, setCustomerSyncEnabled] = useState(true);
  const notifiedCustomerImportJob = useRef<number | null>(null);

  const currentUser = useMemo(() => getUser(), []);
  const canAccess =
    mode === "marketing"
      ? currentUser?.role === "admin" || currentUser?.role === "marketing"
      : currentUser?.role === "admin";
  const canManageUsers = currentUser?.role === "admin";
  // Marketing ikut diizinkan, selaras dengan hak kelola customer penuh yang
  // sudah mereka miliki. Backend membatasi hal yang sama pada rute
  // /admin/sync/customers dan /admin/sync/customer-timestamps.
  const canSyncCustomers = currentUser?.role === "admin" || currentUser?.role === "marketing";
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

  const loadUsers = useCallback(
    async (page = userPage) => {
      if (!canManageUsers) return;
      setLoading(true);
      setError("");
      try {
        const data = await adminApi.users(appliedUserSearch, userSort, page, userLimit);
        setUsers(data.items ?? []);
        setUserPage(data.page ?? page);
        setUserTotalPages(data.total_pages ?? 1);
        setUserTotal(data.total ?? 0);
        loadedTabs.current.users = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat user admin");
      } finally {
        setLoading(false);
      }
    },
    [appliedUserSearch, canManageUsers, userPage, userSort],
  );

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [customerData, brandData, locationData] = await Promise.all([
        adminApi.customers(appliedCustomerSearch, customerPage, customerLimit, customerSort, {
          from: appliedCustomerFrom,
          to: appliedCustomerTo,
          email_status: customerEmailStatus,
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
    customerEmailStatus,
  ]);

  // M-8: dipanggil sekali (dijaga salesTransactionOutletsLoaded), bukan di
  // setiap page/filter change seperti sebelumnya.
  const loadSalesTransactionOutlets = useCallback(async () => {
    if (salesTransactionOutletsLoaded.current) return;
    try {
      const outlets = await adminApi.customerSalesTransactionReportOutlets();
      setSalesTransactionOutlets(outlets ?? []);
      salesTransactionOutletsLoaded.current = true;
    } catch (err) {
      // Kegagalan memuat daftar outlet tidak boleh menghalangi tabel
      // transaksi tampil -- dropdown filter outlet cukup kosong.
      console.error("Gagal memuat daftar outlet:", err);
    }
  }, []);

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

  const loadRedeem = useCallback(
    async (page = redeemPage) => {
      setLoading(true);
      setError("");
      try {
        const data = await adminApi.redeemItems(redeemSort, page, redeemLimit);
        setRedeemItems(data.items ?? []);
        setRedeemPage(data.page ?? page);
        setRedeemTotalPages(data.total_pages ?? 1);
        setRedeemTotal(data.total ?? 0);
        loadedTabs.current.redeem = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat menu redeem");
      } finally {
        setLoading(false);
      }
    },
    [redeemPage, redeemSort],
  );

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
      await Promise.all([loadSalesTransactions(), loadSalesTransactionOutlets()]);
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
    loadSalesTransactionOutlets,
    loadRedeem,
    loadReport,
    loadUsers,
    tab,
  ]);

  // Effect Event selalu melihat loader/filter terbaru tanpa menjadikan setiap
  // perubahan input filter sebagai pemicu auto-fetch. Filter tetap diterapkan
  // lewat tombolnya, sedangkan effect di bawah hanya bereaksi pada akses/tab.
  const loadActiveTab = useEffectEvent(() => {
    void refreshCurrentTab();
  });

  useEffect(() => {
    if (tab !== "customers" || !canSyncCustomers) return;

    let cancelled = false;
    let timer: number | undefined;
    // Dibedakan dari `cancelled`: ini berarti "server menjeda sinkronisasi",
    // bukan "komponen unmount". Keduanya sama-sama menghentikan penjadwalan
    // ulang di blok finally.
    let stopped = false;

    const refreshCustomerTableAfterSync = async () => {
      const data = await adminApi.customers(
        appliedCustomerSearch,
        customerPage,
        customerLimit,
        customerSort,
        { from: appliedCustomerFrom, to: appliedCustomerTo, email_status: customerEmailStatus },
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
        setCustomerSyncEnabled(statusResult.sync_enabled !== false);

        // Sinkronisasi customer dijeda di server: dashboard TIDAK boleh
        // menggerakkan worker. Sebelumnya tab Customers yang terbuka-lah yang
        // memajukan impor halaman demi halaman setiap 5 detik, jadi tanpa
        // penjagaan ini impor tetap berjalan walau cron sudah dimatikan.
        // Polling dihentikan sekalian supaya tidak ada request berulang
        // yang percuma.
        if (statusResult.sync_enabled === false) {
          stopped = true;
          return;
        }

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
        if (!cancelled && !stopped) timer = window.setTimeout(poll, 5_000);
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
    customerEmailStatus,
    tab,
  ]);

  async function searchUsers(searchTerm: string) {
    const normalizedSearch = searchTerm.trim();
    setError("");
    try {
      setAppliedUserSearch(normalizedSearch);
      const data = await adminApi.users(normalizedSearch, userSort, 1, userLimit);
      setUsers(data.items ?? []);
      setUserPage(data.page ?? 1);
      setUserTotalPages(data.total_pages ?? 1);
      setUserTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari user");
    }
  }

  async function sortUsers(sortBy: UserSortKey) {
    const nextSort = nextSortState(userSort, sortBy, sortBy === "created_at" ? "desc" : "asc");
    setUserSort(nextSort);
    setError("");
    try {
      const data = await adminApi.users(appliedUserSearch, nextSort, 1, userLimit);
      setUsers(data.items ?? []);
      setUserPage(data.page ?? 1);
      setUserTotalPages(data.total_pages ?? 1);
      setUserTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengurutkan user");
    }
  }

  const searchCustomers = useCallback(
    async (searchTerm: string) => {
      const normalizedSearch = searchTerm.trim();
      setError("");
      try {
        setCustomerPage(1);
        setAppliedCustomerSearch(normalizedSearch);
        const data = await adminApi.customers(normalizedSearch, 1, customerLimit, customerSort, {
          from: appliedCustomerFrom,
          to: appliedCustomerTo,
          email_status: customerEmailStatus,
        });
        setCustomers(data.items ?? []);
        setCustomerTotalPages(data.total_pages ?? 1);
        setCustomerTotal(data.total ?? 0);
        setCustomerPageInput("1");
        setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mencari customer");
      }
    },
    [appliedCustomerFrom, appliedCustomerTo, customerEmailStatus, customerLimit, customerSort],
  );

  async function loadCustomersPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), customerTotalPages);
    setError("");
    try {
      const data = await adminApi.customers(
        appliedCustomerSearch,
        nextPage,
        customerLimit,
        customerSort,
        { from: appliedCustomerFrom, to: appliedCustomerTo, email_status: customerEmailStatus },
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
        email_status: customerEmailStatus,
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
      const data = await adminApi.customers(appliedCustomerSearch, 1, customerLimit, customerSort, {
        email_status: customerEmailStatus,
      });
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset filter customer");
    }
  }

  // Filter email diterapkan seketika saat dropdown berubah. Halaman dikembalikan
  // ke 1 karena jumlah hasilnya berubah drastis.
  async function applyCustomerEmailStatus(status: CustomerEmailStatus) {
    setCustomerEmailStatus(status);
    setCustomerPage(1);
    setCustomerPageInput("1");
    setError("");
    try {
      const data = await adminApi.customers(appliedCustomerSearch, 1, customerLimit, customerSort, {
        from: appliedCustomerFrom,
        to: appliedCustomerTo,
        email_status: status,
      });
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
      setCustomerRegistrationRange(data.registration_range ?? { earliest: null, latest: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memfilter status email customer");
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
        email_status: customerEmailStatus,
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
    loadActiveTab();
    // Run only when access or the active tab changes. Filter/search inputs fetch via their buttons.
  }, [canAccess, canViewActivityLogs, isMarketingConsole, loadActiveTab, navigate, tab]);

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
      await loadUsers(userPage);
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
      await loadUsers(userPage);
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
        brand_id: Number(customerForm.brand_id || brands[0]?.id || 1),
        owner_location_id: customerForm.owner_location_id
          ? Number(customerForm.owner_location_id)
          : null,
        location_ids: customerForm.owner_location_id
          ? Array.from(
              new Set([...customerForm.location_ids, Number(customerForm.owner_location_id)]),
            )
          : customerForm.location_ids,
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
        email_status: customerEmailStatus,
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
      const data = await adminApi.redeemItems(nextSort, 1, redeemLimit);
      setRedeemItems(data.items ?? []);
      setRedeemPage(data.page ?? 1);
      setRedeemTotalPages(data.total_pages ?? 1);
      setRedeemTotal(data.total ?? 0);
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
      const data = await adminApi.redeemItems(redeemSort, redeemPage, redeemLimit);
      setRedeemItems(data.items ?? []);
      setRedeemPage(data.page ?? redeemPage);
      setRedeemTotalPages(data.total_pages ?? 1);
      setRedeemTotal(data.total ?? 0);
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

  // L-7: handler yang dikirim ke panel tabel ber-`memo` dibungkus agar
  // identitasnya stabil antar render. Tanpa ini, panel tabel tetap dirender
  // ulang setiap kali ada state lain di AdminPage yang berubah (mis. satu
  // ketikan di form) karena setiap render menghasilkan fungsi baru.
  const stableSortUsers = useStableCallback(sortUsers);
  const stableSearchUsers = useStableCallback(searchUsers);
  const stableEditUser = useStableCallback(editUser);
  const stableRequestDeleteUser = useStableCallback(requestDeleteUser);
  const stableOpenCreateUserForm = useStableCallback(openCreateUserForm);

  const stableSortCustomers = useStableCallback(sortCustomers);
  const stableSearchCustomers = useStableCallback(searchCustomers);
  const stableChangeCustomerLimit = useStableCallback(changeCustomerLimit);
  const stableJumpToCustomerPage = useStableCallback(jumpToCustomerPage);
  const stableLoadCustomersPage = useStableCallback(loadCustomersPage);
  const stableApplyCustomerDateFilter = useStableCallback(applyCustomerDateFilter);
  const stableResetCustomerDateFilter = useStableCallback(resetCustomerDateFilter);
  const stableApplyCustomerEmailStatus = useStableCallback(applyCustomerEmailStatus);
  const stableStartCustomerImport = useStableCallback(startCustomerImportFromRunchise);
  const stableOpenCreateCustomerForm = useStableCallback(openCreateCustomerForm);
  const stableEditCustomer = useStableCallback(editCustomer);
  const stableRequestDeleteCustomer = useStableCallback(requestDeleteCustomer);
  const stableResendActivation = useStableCallback(resendActivation);
  const stableRetryCustomerRunchiseSync = useStableCallback(retryCustomerRunchiseSync);

  const stableSortRedeemItems = useStableCallback(sortRedeemItems);
  const stableEditRedeemItem = useStableCallback(editRedeemItem);
  const stableRequestDeleteRedeemItem = useStableCallback(requestDeleteRedeemItem);
  const stableOpenCreateRedeemForm = useStableCallback(openCreateRedeemForm);
  const stableResetCatalogSearch = useStableCallback(resetCatalogSearch);

  async function confirmDeleteAction() {
    if (!confirmDialog) return;

    await confirmDialog.onConfirm();
    setConfirmDialog(null);
  }

  // L-7: dialog mobile kini memakai komponen field yang sama dengan panel
  // desktop di dalam modul tab, jadi markup formnya tidak lagi ditulis dua kali.
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
    activeMobileForm === "user" ? (
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
        <UserFormFields userForm={userForm} setUserForm={setUserForm} />
        <Button onClick={saveUser} disabled={saving} className="mt-3 w-full rounded-full font-bold">
          Simpan User
        </Button>
      </Suspense>
    ) : activeMobileForm === "customer" ? (
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
        <CustomerFormFields
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          brands={brands}
          locations={locations}
        />
        <Button
          onClick={saveCustomer}
          disabled={saving}
          className="mt-3 w-full rounded-full font-bold"
        >
          Simpan Customer
        </Button>
      </Suspense>
    ) : (
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
        <RedeemFormFields
          redeemForm={redeemForm}
          setRedeemForm={setRedeemForm}
          catalogSearch={catalogSearch}
          setCatalogSearch={setCatalogSearch}
          searchCatalog={searchCatalog}
          resetCatalogSearch={resetCatalogSearch}
          appliedCatalogSearch={appliedCatalogSearch}
          catalogCategories={catalogCategories}
          catalogItems={catalogItems}
          selectedCatalogItem={selectedCatalogItem}
        />
        <Button
          onClick={saveRedeemItem}
          disabled={saving}
          className="mt-3 w-full rounded-full font-bold"
        >
          Simpan Item
        </Button>
      </Suspense>
    );

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

        <nav
          aria-label="Menu dashboard admin"
          className="scrollbar-none mb-5 flex snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain border-b border-border"
          role="tablist"
        >
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
        </nav>

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {error}
          </div>
        )}
        {loading && <AdminPageSkeleton tab={tab} />}

        {!loading && tab === "report" && summary && (
          <Suspense
            fallback={<Skeleton className="h-105 w-full rounded-2xl" aria-label="Memuat laporan" />}
          >
            <AdminReportTab
              summary={summary}
              locations={locations}
              redemptionFrom={reportRedemptionFrom}
              onRedemptionFromChange={setReportRedemptionFrom}
              redemptionTo={reportRedemptionTo}
              onRedemptionToChange={setReportRedemptionTo}
              outletId={reportOutletId}
              onOutletIdChange={setReportOutletId}
              loading={loading}
              onApplyFilter={() => void loadReport()}
            />
          </Suspense>
        )}

        {!loading && tab === "sales-transactions" && (
          <Suspense
            fallback={
              <Skeleton
                className="h-105 w-full rounded-2xl"
                aria-label="Memuat laporan transaksi"
              />
            }
          >
            <AdminSalesTransactionsTab
              transactions={salesTransactions}
              search={salesTransactionSearch}
              onSearchChange={setSalesTransactionSearch}
              outlet={salesTransactionOutlet}
              onOutletChange={setSalesTransactionOutlet}
              outletOptions={salesTransactionOutlets}
              from={salesTransactionFrom}
              onFromChange={setSalesTransactionFrom}
              to={salesTransactionTo}
              onToChange={setSalesTransactionTo}
              page={salesTransactionPage}
              totalPages={salesTransactionTotalPages}
              total={salesTransactionTotal}
              limit={salesTransactionLimit}
              onLimitChange={changeSalesTransactionLimit}
              pageInput={salesTransactionPageInput}
              onPageInputChange={setSalesTransactionPageInput}
              onJumpToPage={jumpToSalesTransactionPage}
              loading={loading}
              onLoadPage={(page) => void loadSalesTransactions(page)}
            />
          </Suspense>
        )}

        {!loading && tab === "activity" && canViewActivityLogs && (
          <Suspense
            fallback={
              <Skeleton className="h-105 w-full rounded-2xl" aria-label="Memuat activity log" />
            }
          >
            <AdminActivityTab
              logs={activityLogs}
              search={activitySearch}
              onSearchChange={setActivitySearch}
              action={activityAction}
              onActionChange={setActivityAction}
              entityType={activityEntityType}
              onEntityTypeChange={setActivityEntityType}
              from={activityFrom}
              onFromChange={setActivityFrom}
              to={activityTo}
              onToChange={setActivityTo}
              page={activityPage}
              totalPages={activityTotalPages}
              total={activityTotal}
              loading={loading}
              onLoadPage={(page) => void loadActivityLogs(page)}
            />
          </Suspense>
        )}

        {!loading && tab === "users" && canManageUsers && (
          <Suspense
            fallback={
              <Skeleton className="h-105 w-full rounded-2xl" aria-label="Memuat user admin" />
            }
          >
            <AdminUsersTab
              userForm={userForm}
              setUserForm={setUserForm}
              saveUser={saveUser}
              users={users}
              userSort={userSort}
              sortUsers={stableSortUsers}
              appliedUserSearch={appliedUserSearch}
              userSearchRef={userSearchRef}
              searchUsers={stableSearchUsers}
              userTotal={userTotal}
              userPage={userPage}
              userTotalPages={userTotalPages}
              loadUsers={loadUsers}
              editUser={stableEditUser}
              requestDeleteUser={stableRequestDeleteUser}
              openCreateUserForm={stableOpenCreateUserForm}
              saving={saving}
              currentUser={currentUser}
            />
          </Suspense>
        )}

        {!loading && tab === "customers" && (
          <Suspense
            fallback={
              <Skeleton className="h-105 w-full rounded-2xl" aria-label="Memuat customer" />
            }
          >
            <AdminCustomersTab
              customerForm={customerForm}
              setCustomerForm={setCustomerForm}
              saveCustomer={saveCustomer}
              brands={brands}
              locations={locations}
              customers={customers}
              customerSort={customerSort}
              sortCustomers={stableSortCustomers}
              appliedCustomerSearch={appliedCustomerSearch}
              customerSearchRef={customerSearchRef}
              searchCustomers={stableSearchCustomers}
              customerTotal={customerTotal}
              customerPage={customerPage}
              customerTotalPages={customerTotalPages}
              customerLimit={customerLimit}
              changeCustomerLimit={stableChangeCustomerLimit}
              customerPageInput={customerPageInput}
              setCustomerPageInput={setCustomerPageInput}
              jumpToCustomerPage={stableJumpToCustomerPage}
              loadCustomersPage={stableLoadCustomersPage}
              customerFrom={customerFrom}
              setCustomerFrom={setCustomerFrom}
              customerTo={customerTo}
              setCustomerTo={setCustomerTo}
              applyCustomerDateFilter={stableApplyCustomerDateFilter}
              resetCustomerDateFilter={stableResetCustomerDateFilter}
              customerEmailStatus={customerEmailStatus}
              applyCustomerEmailStatus={stableApplyCustomerEmailStatus}
              customerRegistrationRange={customerRegistrationRange}
              customerImportJob={customerImportJob}
              customerSyncEnabled={customerSyncEnabled}
              canSyncCustomers={canSyncCustomers}
              startCustomerImportFromRunchise={stableStartCustomerImport}
              openCreateCustomerForm={stableOpenCreateCustomerForm}
              editCustomer={stableEditCustomer}
              requestDeleteCustomer={stableRequestDeleteCustomer}
              resendActivation={stableResendActivation}
              retryCustomerRunchiseSync={stableRetryCustomerRunchiseSync}
              saving={saving}
            />
          </Suspense>
        )}

        {!loading && tab === "redeem" && (
          <Suspense
            fallback={
              <Skeleton className="h-105 w-full rounded-2xl" aria-label="Memuat menu redeem" />
            }
          >
            <AdminRedeemTab
              redeemForm={redeemForm}
              setRedeemForm={setRedeemForm}
              saveRedeemItem={saveRedeemItem}
              catalogSearch={catalogSearch}
              setCatalogSearch={setCatalogSearch}
              searchCatalog={searchCatalog}
              resetCatalogSearch={stableResetCatalogSearch}
              appliedCatalogSearch={appliedCatalogSearch}
              catalogCategories={catalogCategories}
              catalogItems={catalogItems}
              selectedCatalogItem={selectedCatalogItem}
              redeemItems={redeemItems}
              redeemSort={redeemSort}
              sortRedeemItems={stableSortRedeemItems}
              redeemTotal={redeemTotal}
              redeemPage={redeemPage}
              redeemTotalPages={redeemTotalPages}
              loadRedeem={loadRedeem}
              editRedeemItem={stableEditRedeemItem}
              requestDeleteRedeemItem={stableRequestDeleteRedeemItem}
              openCreateRedeemForm={stableOpenCreateRedeemForm}
              saving={saving}
            />
          </Suspense>
        )}
      </section>
      {(confirmDialog || activeMobileForm) && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </main>
  );
}
