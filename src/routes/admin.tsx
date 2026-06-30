import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getUser } from "@/lib/auth";
import {
  adminApi,
  type AdminBrand,
  type AdminCustomer,
  type AdminLocation,
  type AdminUser,
  type CatalogMenuItem,
  type LoyaltySummary,
  type RedeemCategory,
  type RedeemItem,
  type Redemption,
  type Reward,
} from "@/lib/admin";
import { BarChart3, Gift, ListChecks, RefreshCw, TicketCheck, Trash2, Users } from "lucide-react";
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
  component: AdminPage,
});

type Tab = "report" | "users" | "customers" | "rewards" | "redeem" | "redemptions";

const emptyReward = {
  id: 0,
  brand_id: 1,
  name: "",
  description: "",
  points_required: 0,
  image_url: "",
  is_active: true,
};

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
  total_point: 0,
  available_point: 0,
  next_reward_threshold: 2000,
};

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

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("report");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [customerTotal, setCustomerTotal] = useState(0);
  const customerLimit = 20;
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardForm, setRewardForm] = useState(emptyReward);
  const [categories, setCategories] = useState<RedeemCategory[]>([]);
  const [redeemItems, setRedeemItems] = useState<RedeemItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogMenuItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionStatus, setRedemptionStatus] = useState("");
  const [reportRedemptionFrom, setReportRedemptionFrom] = useState("");
  const [reportRedemptionTo, setReportRedemptionTo] = useState("");
  const [categoryForm, setCategoryForm] = useState({
    id: 0,
    name: "",
    sort_order: 0,
    is_active: true,
  });
  const [redeemForm, setRedeemForm] = useState({
    id: 0,
    menu_item_id: 0,
    category_id: 0,
    points_required: 0,
    estimated_cost: "",
    badge: "",
    sort_order: 0,
    is_active: true,
  });
  const [catalogSearch, setCatalogSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentUser = useMemo(() => getUser(), []);
  const canAccess = currentUser?.role === "admin" || currentUser?.role === "staff";
  const canManageUsers = currentUser?.role === "admin";

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [summaryData, rewardData, categoryData, redeemData, redemptionData] = await Promise.all(
        [
          adminApi.summary({
            redemption_from: reportRedemptionFrom,
            redemption_to: reportRedemptionTo,
          }),
          adminApi.rewards(),
          adminApi.redeemCategories(),
          adminApi.redeemItems(),
          adminApi.redemptions(redemptionStatus),
        ],
      );
      setSummary(summaryData);
      setRewards(rewardData);
      setCategories(categoryData);
      setRedeemItems(redeemData);
      setRedemptions(redemptionData);

      if (canManageUsers) {
        setUsers(await adminApi.users(userSearch));
      }

      const [customerData, brandData, locationData] = await Promise.all([
        adminApi.customers(customerSearch, customerPage, customerLimit),
        adminApi.brands(),
        adminApi.locations(),
      ]);
      setCustomers(customerData.items ?? []);
      setCustomerTotalPages(customerData.total_pages ?? 1);
      setCustomerTotal(customerData.total ?? 0);
      setBrands(brandData);
      setLocations(locationData);

      if (!customerForm.brand_id && brandData[0]) {
        setCustomerForm((form) => ({ ...form, brand_id: brandData[0].id }));
      }

      if (!redeemForm.category_id && categoryData[0]) {
        setRedeemForm((form) => ({ ...form, category_id: categoryData[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data admin");
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    setError("");
    try {
      setUsers(await adminApi.users(userSearch));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari user");
    }
  }

  async function searchCustomers() {
    setError("");
    try {
      setCustomerPage(1);
      const data = await adminApi.customers(customerSearch, 1, customerLimit);
      setCustomers(data.items ?? []);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari customer");
    }
  }

  async function loadCustomersPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), customerTotalPages);
    setError("");
    try {
      const data = await adminApi.customers(customerSearch, nextPage, customerLimit);
      setCustomers(data.items ?? []);
      setCustomerPage(data.page ?? nextPage);
      setCustomerTotalPages(data.total_pages ?? 1);
      setCustomerTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat customer");
    }
  }

  async function searchCatalog() {
    setError("");
    try {
      const items = await adminApi.menuItems(catalogSearch);
      setCatalogItems(items);
      if (items[0]) {
        setRedeemForm((form) => ({ ...form, menu_item_id: items[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari menu");
    }
  }

  useEffect(() => {
    if (!canAccess) {
      navigate({ to: "/login" });
      return;
    }
    loadAll();
  }, [canAccess, navigate, redemptionStatus]);

  useEffect(() => {
    if (tab === "redeem" && catalogItems.length === 0) searchCatalog();
  }, [tab]);

  async function saveReward() {
    setSaving(true);
    try {
      const payload = {
        brand_id: Number(rewardForm.brand_id || 1),
        name: rewardForm.name,
        description: rewardForm.description,
        points_required: Number(rewardForm.points_required),
        image_url: rewardForm.image_url,
        is_active: rewardForm.is_active,
      };
      if (rewardForm.id) {
        await adminApi.updateReward(rewardForm.id, payload);
      } else {
        await adminApi.createReward(payload);
      }
      setRewardForm(emptyReward);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan reward");
    } finally {
      setSaving(false);
    }
  }

  async function saveUser() {
    setSaving(true);
    setError("");
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
      setUsers(await adminApi.users(userSearch));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan user");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: number) {
    if (!window.confirm("Hapus user ini?")) return;

    setSaving(true);
    setError("");
    try {
      await adminApi.deleteUser(id);
      setUsers(await adminApi.users(userSearch));
      if (userForm.id === id) setUserForm(emptyUserForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus user");
    } finally {
      setSaving(false);
    }
  }

  async function saveCustomer() {
    setSaving(true);
    setError("");
    try {
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
        status: customerForm.status,
        balance: Number(customerForm.balance),
        brand_id: Number(customerForm.brand_id || brands[0]?.id || 1),
        owner_location_id: customerForm.owner_location_id
          ? Number(customerForm.owner_location_id)
          : null,
        total_point: Number(customerForm.total_point),
        available_point: Number(customerForm.available_point),
        next_reward_threshold: Number(customerForm.next_reward_threshold),
      };

      if (customerForm.id) {
        await adminApi.updateCustomer(customerForm.id, payload);
      } else {
        await adminApi.createCustomer(payload);
      }

      setCustomerForm({ ...emptyCustomerForm, brand_id: brands[0]?.id ?? 1 });
      await loadCustomersPage(customerForm.id ? customerPage : 1);
      setSummary(
        await adminApi.summary({
          redemption_from: reportRedemptionFrom,
          redemption_to: reportRedemptionTo,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan customer");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(id: number) {
    if (!window.confirm("Hapus customer ini beserta akun login dan riwayat terkait?")) return;

    setSaving(true);
    setError("");
    try {
      await adminApi.deleteCustomer(id);
      await loadCustomersPage(
        customers.length === 1 && customerPage > 1 ? customerPage - 1 : customerPage,
      );
      setSummary(
        await adminApi.summary({
          redemption_from: reportRedemptionFrom,
          redemption_to: reportRedemptionTo,
        }),
      );
      if (customerForm.id === id) setCustomerForm(emptyCustomerForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus customer");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory() {
    setSaving(true);
    try {
      const payload = {
        name: categoryForm.name,
        sort_order: Number(categoryForm.sort_order),
        is_active: categoryForm.is_active,
      };
      if (categoryForm.id) {
        await adminApi.updateRedeemCategory(categoryForm.id, payload);
      } else {
        await adminApi.createRedeemCategory(payload);
      }
      setCategoryForm({ id: 0, name: "", sort_order: 0, is_active: true });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kategori");
    } finally {
      setSaving(false);
    }
  }

  async function saveRedeemItem() {
    setSaving(true);
    try {
      const payload = {
        menu_item_id: Number(redeemForm.menu_item_id),
        category_id: Number(redeemForm.category_id),
        points_required: Number(redeemForm.points_required),
        estimated_cost:
          redeemForm.estimated_cost === "" ? null : Number(redeemForm.estimated_cost),
        badge: redeemForm.badge,
        sort_order: Number(redeemForm.sort_order),
        is_active: redeemForm.is_active,
      };
      if (redeemForm.id) {
        await adminApi.updateRedeemItem(redeemForm.id, payload);
      } else {
        await adminApi.createRedeemItem(payload);
      }
      setRedeemForm({
        id: 0,
        menu_item_id: 0,
        category_id: categories[0]?.id ?? 0,
        points_required: 0,
        estimated_cost: "",
        badge: "",
        sort_order: 0,
        is_active: true,
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan menu redeem");
    } finally {
      setSaving(false);
    }
  }

  async function updateRedemption(id: number, status: string) {
    setSaving(true);
    try {
      await adminApi.updateRedemptionStatus(id, status);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update redemption");
    } finally {
      setSaving(false);
    }
  }

  if (!canAccess) return null;

  return (
    <main className="px-4 mt-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-muted-foreground">Admin Console</p>
            <h1 className="text-3xl font-black tracking-tight">Program Loyalty</h1>
          </div>
          <Button onClick={loadAll} disabled={loading} className="rounded-full font-bold">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <TabButton
            active={tab === "report"}
            onClick={() => setTab("report")}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Laporan"
          />
          {canManageUsers && (
            <TabButton
              active={tab === "users"}
              onClick={() => setTab("users")}
              icon={<Users className="h-4 w-4" />}
              label="User Admin"
            />
          )}
          <TabButton
            active={tab === "customers"}
            onClick={() => setTab("customers")}
            icon={<Users className="h-4 w-4" />}
            label="Customers"
          />
          <TabButton
            active={tab === "rewards"}
            onClick={() => setTab("rewards")}
            icon={<Gift className="h-4 w-4" />}
            label="Rewards"
          />
          <TabButton
            active={tab === "redeem"}
            onClick={() => setTab("redeem")}
            icon={<ListChecks className="h-4 w-4" />}
            label="Menu Redeem"
          />
          <TabButton
            active={tab === "redemptions"}
            onClick={() => setTab("redemptions")}
            icon={<TicketCheck className="h-4 w-4" />}
            label="Redemptions"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {error}
          </div>
        )}
        {loading && <p className="text-muted-foreground font-semibold">Memuat data admin...</p>}

        {!loading && tab === "report" && summary && (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric title="Total Member" value={numberFormat(summary.total_members)} />
              <Metric title="Member Aktif" value={numberFormat(summary.active_members)} />
              <Metric title="Poin Diberikan" value={numberFormat(summary.total_points_given)} />
              <Metric title="Poin Ditukar" value={numberFormat(summary.points_redeemed)} />
              <Metric title="Poin Tersedia" value={numberFormat(summary.total_points_available)} />
              <Metric title="Total Redeem" value={numberFormat(summary.redemption_count)} />
              <Metric
                title="Estimasi Cost Redeem"
                value={currencyFormat(summary.total_estimated_redemption_cost ?? 0)}
              />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Reward paling sering ditukar">
                <TopRewardsChart rewards={summary.top_rewards ?? []} />
              </Panel>
              <Panel title="5 outlet paling sering redeem">
                <TopRedeemOutletsChart outlets={summary.top_redeem_outlets ?? []} />
              </Panel>
            </div>
            <Panel title="Riwayat semua reward yang ditukar">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
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
                <Button
                  onClick={loadAll}
                  disabled={loading}
                  className="mb-3 rounded-full font-bold"
                >
                  Terapkan Filter
                </Button>
              </div>
              <RedemptionHistoryChart data={summary.redemption_trend ?? []} />
              <div className="mt-5">
                <DataTable
                  headers={["Tanggal", "Reward/Menu", "Outlet", "Poin", "Harga Jual", "Estimasi Cost"]}
                  rows={(summary.redemption_history ?? []).map((item) => [
                    dateFormat(item.redeemed_at),
                    item.reward_name,
                    item.outlet_city
                      ? `${item.outlet_name} (${item.outlet_city})`
                      : item.outlet_name,
                    numberFormat(item.points_spent),
                    item.menu_price !== null ? currencyFormat(item.menu_price) : "-",
                    currencyFormat(item.estimated_cost),
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

        {!loading && tab === "users" && canManageUsers && (
          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
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
                value={userForm.password}
                onChange={(v) => setUserForm({ ...userForm, password: v })}
              />
              <Select
                label="Role"
                value={userForm.role}
                onChange={(v) => setUserForm({ ...userForm, role: v })}
                options={[
                  { value: "marketing", label: "Marketing" },
                  { value: "staff", label: "Staff" },
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
            <Panel title="Daftar User Admin">
              <div className="mb-4 flex gap-2">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari email, nomor, atau role..."
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                />
                <Button onClick={searchUsers} variant="outline">
                  Cari
                </Button>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Email</th>
                      <th className="p-2">Nomor</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-border">
                        <td className="p-2 font-bold">{user.email ?? "-"}</td>
                        <td className="p-2">{user.phone_number ?? "-"}</td>
                        <td className="p-2 capitalize">{user.role}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <button
                              className="font-bold text-primary"
                              onClick={() =>
                                setUserForm({
                                  id: user.id,
                                  email: user.email ?? "",
                                  phone_number: user.phone_number ?? "",
                                  password: "",
                                  role: user.role,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1 font-bold text-destructive disabled:opacity-50"
                              disabled={saving || user.id === currentUser?.id}
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "customers" && (
          <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
            <Panel title={customerForm.id ? "Edit Customer" : "Tambah Customer"}>
              <div className="grid gap-3 md:grid-cols-2">
                <FormInput
                  label="Nama"
                  value={customerForm.name}
                  onChange={(v) => setCustomerForm({ ...customerForm, name: v })}
                />
                <FormInput
                  label="Nomor Telepon"
                  value={customerForm.phone_number}
                  onChange={(v) => setCustomerForm({ ...customerForm, phone_number: v })}
                />
              </div>
              <FormInput
                label="Email"
                type="email"
                value={customerForm.email}
                onChange={(v) => setCustomerForm({ ...customerForm, email: v })}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  label="Brand"
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
                  label="Outlet"
                  value={String(customerForm.owner_location_id)}
                  onChange={(v) =>
                    setCustomerForm({ ...customerForm, owner_location_id: Number(v) })
                  }
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
                  label="Tanggal Lahir"
                  type="date"
                  value={customerForm.dob}
                  onChange={(v) => setCustomerForm({ ...customerForm, dob: v })}
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
                <Select
                  label="Status"
                  value={customerForm.status}
                  onChange={(v) => setCustomerForm({ ...customerForm, status: v })}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
                <FormInput
                  label="Saldo"
                  type="number"
                  value={String(customerForm.balance)}
                  onChange={(v) => setCustomerForm({ ...customerForm, balance: Number(v) })}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <FormInput
                  label="Total Poin"
                  type="number"
                  value={String(customerForm.total_point)}
                  onChange={(v) => setCustomerForm({ ...customerForm, total_point: Number(v) })}
                />
                <FormInput
                  label="Poin Tersedia"
                  type="number"
                  value={String(customerForm.available_point)}
                  onChange={(v) => setCustomerForm({ ...customerForm, available_point: Number(v) })}
                />
                <FormInput
                  label="Target Reward"
                  type="number"
                  value={String(customerForm.next_reward_threshold)}
                  onChange={(v) =>
                    setCustomerForm({ ...customerForm, next_reward_threshold: Number(v) })
                  }
                />
              </div>
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
            <Panel title="Daftar Customer">
              <div className="mb-4 flex gap-2">
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Cari nama, nomor, email, atau outlet..."
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                />
                <Button onClick={searchCustomers} variant="outline">
                  Cari
                </Button>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Nama</th>
                      <th className="p-2">Kontak</th>
                      <th className="p-2">Outlet</th>
                      <th className="p-2">Poin</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-t border-border">
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
                        </td>
                        <td className="p-2">
                          {numberFormat(customer.customer_point?.available_point ?? 0)}
                        </td>
                        <td className="p-2 capitalize">{customer.status ?? "-"}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <button
                              className="font-bold text-primary"
                              onClick={() =>
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
                                  total_point: customer.customer_point?.total_point ?? 0,
                                  available_point: customer.customer_point?.available_point ?? 0,
                                  next_reward_threshold:
                                    customer.customer_point?.next_reward_threshold ?? 2000,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1 font-bold text-destructive disabled:opacity-50"
                              disabled={saving}
                              onClick={() => deleteCustomer(customer.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-muted-foreground">
                  Total {numberFormat(customerTotal)} customer · Halaman {customerPage} dari{" "}
                  {customerTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || customerPage <= 1}
                    onClick={() => loadCustomersPage(customerPage - 1)}
                    className="rounded-full font-bold"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || customerPage >= customerTotalPages}
                    onClick={() => loadCustomersPage(customerPage + 1)}
                    className="rounded-full font-bold"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "rewards" && (
          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <Panel title={rewardForm.id ? "Edit Reward" : "Tambah Reward"}>
              <FormInput
                label="Nama"
                value={rewardForm.name}
                onChange={(v) => setRewardForm({ ...rewardForm, name: v })}
              />
              <FormInput
                label="Poin"
                type="number"
                value={String(rewardForm.points_required)}
                onChange={(v) => setRewardForm({ ...rewardForm, points_required: Number(v) })}
              />
              <FormInput
                label="Deskripsi"
                value={rewardForm.description ?? ""}
                onChange={(v) => setRewardForm({ ...rewardForm, description: v })}
              />
              <FormInput
                label="Image URL"
                value={rewardForm.image_url ?? ""}
                onChange={(v) => setRewardForm({ ...rewardForm, image_url: v })}
              />
              <Toggle
                label="Aktif"
                checked={rewardForm.is_active}
                onChange={(v) => setRewardForm({ ...rewardForm, is_active: v })}
              />
              <Button
                onClick={saveReward}
                disabled={saving}
                className="mt-3 w-full rounded-full font-bold"
              >
                Simpan Reward
              </Button>
            </Panel>
            <Panel title="Daftar Reward">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Nama</th>
                      <th className="p-2">Poin</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map((reward) => (
                      <tr key={reward.id} className="border-t border-border">
                        <td className="p-2 font-bold">{reward.name}</td>
                        <td className="p-2">{numberFormat(reward.points_required)}</td>
                        <td className="p-2">{reward.is_active ? "Aktif" : "Nonaktif"}</td>
                        <td className="p-2">
                          <button
                            className="font-bold text-primary"
                            onClick={() =>
                              setRewardForm({
                                ...reward,
                                description: reward.description ?? "",
                                image_url: reward.image_url ?? "",
                              })
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "redeem" && (
          <section className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title={categoryForm.id ? "Edit Kategori Redeem" : "Tambah Kategori Redeem"}>
                <FormInput
                  label="Nama Kategori"
                  value={categoryForm.name}
                  onChange={(v) => setCategoryForm({ ...categoryForm, name: v })}
                />
                <FormInput
                  label="Urutan"
                  type="number"
                  value={String(categoryForm.sort_order)}
                  onChange={(v) => setCategoryForm({ ...categoryForm, sort_order: Number(v) })}
                />
                <Toggle
                  label="Aktif"
                  checked={categoryForm.is_active}
                  onChange={(v) => setCategoryForm({ ...categoryForm, is_active: v })}
                />
                <Button
                  onClick={saveCategory}
                  disabled={saving}
                  className="mt-3 w-full rounded-full font-bold"
                >
                  Simpan Kategori
                </Button>
              </Panel>
              <Panel title={redeemForm.id ? "Edit Item Redeem" : "Tambah Item Redeem"}>
                <div className="mb-3 flex gap-2">
                  <input
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari menu..."
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  />
                  <Button onClick={searchCatalog} variant="outline">
                    Cari
                  </Button>
                </div>
                <Select
                  label="Menu"
                  value={String(redeemForm.menu_item_id)}
                  onChange={(v) => setRedeemForm({ ...redeemForm, menu_item_id: Number(v) })}
                  options={catalogItems.map((item) => ({
                    value: String(item.id),
                    label: `${item.name} — ${item.category?.name ?? "Tanpa kategori"}`,
                  }))}
                />
                <Select
                  label="Kategori Redeem"
                  value={String(redeemForm.category_id)}
                  onChange={(v) => setRedeemForm({ ...redeemForm, category_id: Number(v) })}
                  options={categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                  }))}
                />
                <FormInput
                  label="Poin Redeem"
                  type="number"
                  value={String(redeemForm.points_required)}
                  onChange={(v) => setRedeemForm({ ...redeemForm, points_required: Number(v) })}
                />
                <FormInput
                  label="Estimasi Cost/HPP"
                  type="number"
                  value={String(redeemForm.estimated_cost)}
                  onChange={(v) => setRedeemForm({ ...redeemForm, estimated_cost: v })}
                />
                <FormInput
                  label="Badge"
                  value={redeemForm.badge}
                  onChange={(v) => setRedeemForm({ ...redeemForm, badge: v })}
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
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Menu</th>
                      <th className="p-2">Kategori</th>
                      <th className="p-2">Harga Jual</th>
                      <th className="p-2">Poin</th>
                      <th className="p-2">Nilai/Poin</th>
                      <th className="p-2">Estimasi Cost</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redeemItems.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-2 font-bold">{item.menu_item.name}</td>
                        <td className="p-2">{item.category.name}</td>
                        <td className="p-2">{currencyFormat(toNumber(item.menu_item.price))}</td>
                        <td className="p-2">{numberFormat(item.points_required)}</td>
                        <td className="p-2">
                          {item.points_required > 0
                            ? currencyFormat(toNumber(item.menu_item.price) / item.points_required)
                            : "-"}
                        </td>
                        <td className="p-2">
                          {item.estimated_cost !== null
                            ? currencyFormat(toNumber(item.estimated_cost))
                            : "-"}
                        </td>
                        <td className="p-2">{item.is_active ? "Aktif" : "Nonaktif"}</td>
                        <td className="p-2">
                          <button
                            className="font-bold text-primary"
                            onClick={() =>
                              setRedeemForm({
                                id: item.id,
                                menu_item_id: item.menu_item_id,
                                category_id: item.category_id,
                                points_required: item.points_required,
                                estimated_cost: item.estimated_cost ?? "",
                                badge: item.badge ?? "",
                                sort_order: item.sort_order,
                                is_active: item.is_active,
                              })
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "redemptions" && (
          <Panel title="Operasional Redemption">
            <div className="mb-4 flex flex-wrap gap-2">
              <Select
                label="Status"
                value={redemptionStatus}
                onChange={setRedemptionStatus}
                options={[
                  { value: "", label: "Semua" },
                  { value: "pending", label: "Pending" },
                  { value: "claimed", label: "Claimed" },
                  { value: "expired", label: "Expired" },
                ]}
              />
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="p-2">Kode</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Reward</th>
                    <th className="p-2">Poin</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-2 font-mono font-bold">{item.redemption_code ?? "-"}</td>
                      <td className="p-2">
                        {item.customer.name}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {item.customer.phone_number ?? item.customer.user?.phone_number ?? "-"}
                        </span>
                      </td>
                      <td className="p-2">{item.reward.name}</td>
                      <td className="p-2">{numberFormat(item.points_spent)}</td>
                      <td className="p-2">{item.status}</td>
                      <td className="p-2 space-x-2">
                        <button
                          disabled={saving}
                          className="font-bold text-primary"
                          onClick={() => updateRedemption(item.id, "claimed")}
                        >
                          Claim
                        </button>
                        <button
                          disabled={saving}
                          className="font-bold text-destructive"
                          onClick={() => updateRedemption(item.id, "expired")}
                        >
                          Expire
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </section>
    </main>
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
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary"}`}
    >
      {icon} {label}
    </button>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
      <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function TopRewardsChart({ rewards }: { rewards: LoyaltySummary["top_rewards"] }) {
  const colors = ["#E11D48", "#F97316", "#EAB308", "#22C55E", "#0EA5E9"];
  const chartData = rewards.map((reward, index) => ({
    rank: index + 1,
    name: reward.reward_name,
    shortName:
      reward.reward_name.length > 24 ? `${reward.reward_name.slice(0, 24)}...` : reward.reward_name,
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
    <div className="space-y-3">
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
        className="min-h-[230px] w-full"
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 42, left: 0, bottom: 4 }}
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
            width={138}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={({ x, y, payload }) => {
              const item = chartData.find((reward) => reward.shortName === payload.value);
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    className="fill-foreground text-[11px] font-bold"
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
              offset={10}
              className="fill-foreground text-xs font-black"
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
  const colors = ["#0EA5E9", "#22C55E", "#F97316", "#E11D48", "#8B5CF6"];
  const chartData = outlets.map((outlet, index) => ({
    rank: index + 1,
    name: outlet.outlet_name,
    shortName:
      outlet.outlet_name.length > 22 ? `${outlet.outlet_name.slice(0, 22)}...` : outlet.outlet_name,
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
    <div className="space-y-3">
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
        className="min-h-[230px] w-full"
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 42, left: 0, bottom: 4 }}
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
            width={138}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={({ x, y, payload }) => {
              const item = chartData.find((outlet) => outlet.shortName === payload.value);
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    className="fill-foreground text-[11px] font-bold"
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
              offset={10}
              className="fill-foreground text-xs font-black"
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
        estimated_cost: {
          label: "Estimasi Cost",
          color: "#22C55E",
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
                    {name === "redemption_count"
                      ? "Jumlah Redeem"
                      : name === "points_spent"
                        ? "Poin Ditukar"
                        : "Estimasi Cost"}
                  </span>
                  <span className="font-mono font-bold">
                    {name === "estimated_cost"
                      ? currencyFormat(Number(value))
                      : numberFormat(Number(value))}
                  </span>
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
        <Line
          yAxisId="points"
          type="monotone"
          dataKey="estimated_cost"
          stroke="#22C55E"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="mb-3 block text-sm font-bold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-medium"
      />
    </label>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="mb-3 block text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-medium"
      >
        {(options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DataTable({
  headers,
  rows,
  emptyMessage = "Belum ada data.",
}: {
  headers: string[];
  rows?: string[][];
  emptyMessage?: string;
}) {
  const hasRows = (rows ?? []).length > 0;

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            {(headers ?? []).map((header) => (
              <th key={header} className="p-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            (rows ?? []).map((row, index) => (
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
    </div>
  );
}
