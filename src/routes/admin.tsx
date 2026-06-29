import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import {
  adminApi,
  type CatalogMenuItem,
  type LoyaltySummary,
  type RedeemCategory,
  type RedeemItem,
  type Redemption,
  type Reward,
} from "@/lib/admin";
import { BarChart3, Gift, ListChecks, RefreshCw, TicketCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Loyalty — Crisbar" },
      { name: "description", content: "Kelola program loyalty Crisbar." },
    ],
  }),
  component: AdminPage,
});

type Tab = "report" | "rewards" | "redeem" | "redemptions";

const emptyReward = {
  id: 0,
  brand_id: 1,
  name: "",
  description: "",
  points_required: 0,
  image_url: "",
  is_active: true,
};

function numberFormat(value: number) {
  return value.toLocaleString("id-ID");
}

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("report");
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardForm, setRewardForm] = useState(emptyReward);
  const [categories, setCategories] = useState<RedeemCategory[]>([]);
  const [redeemItems, setRedeemItems] = useState<RedeemItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogMenuItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionStatus, setRedemptionStatus] = useState("");
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
    badge: "",
    sort_order: 0,
    is_active: true,
  });
  const [catalogSearch, setCatalogSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canAccess = useMemo(() => {
    const user = getUser();
    return user?.role === "admin" || user?.role === "staff";
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [summaryData, rewardData, categoryData, redeemData, redemptionData] = await Promise.all(
        [
          adminApi.summary(),
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

      if (!redeemForm.category_id && categoryData[0]) {
        setRedeemForm((form) => ({ ...form, category_id: categoryData[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data admin");
    } finally {
      setLoading(false);
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
            </div>
            <Panel title="Reward paling sering ditukar">
              <DataTable
                headers={["Reward", "Jumlah", "Poin"]}
                rows={summary.top_rewards.map((reward) => [
                  reward.reward_name,
                  numberFormat(reward.redemption_count),
                  numberFormat(reward.points_spent),
                ])}
              />
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
                      <th className="p-2">Poin</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redeemItems.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-2 font-bold">{item.menu_item.name}</td>
                        <td className="p-2">{item.category.name}</td>
                        <td className="p-2">{numberFormat(item.points_required)}</td>
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
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            {headers.map((header) => (
              <th key={header} className="p-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-2 font-medium">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
