import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminBrand, AdminLocation, CatalogMenuCategory, CatalogMenuItem } from "@/lib/admin";
import { currencyFormat, numberFormat, toNumber } from "./adminFormatters";
import { FormInput, Select } from "./adminUiPrimitives";
import type { CustomerFormValues, RedeemFormState, UserFormValues } from "./adminFormDefaults";

// L-7: field form dulu ditulis DUA KALI -- sekali untuk dialog mobile
// (mobileUserForm/mobileCustomerForm/mobileRedeemForm) dan sekali lagi untuk
// panel desktop di dalam tab. Keduanya harus diubah bersamaan setiap kali ada
// penyesuaian field, dan itu salah satu duplikasi yang disorot L-7. Sekarang
// keduanya memakai komponen yang sama di modul ini; markup dan urutan fieldnya
// dipindahkan apa adanya sehingga tampilan mobile maupun desktop tidak berubah.

export function UserFormFields({
  userForm,
  setUserForm,
}: {
  userForm: UserFormValues;
  setUserForm: (form: UserFormValues) => void;
}) {
  return (
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
    </>
  );
}

export function CustomerFormFields({
  customerForm,
  setCustomerForm,
  brands,
  locations,
}: {
  customerForm: CustomerFormValues;
  setCustomerForm: (form: CustomerFormValues) => void;
  brands: AdminBrand[];
  locations: AdminLocation[];
}) {
  // Grup "Loyalty" hanya muncul saat mengedit customer yang sudah ada, persis
  // seperti `customerLoyaltyFields` versi lama.
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

  return (
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
    </>
  );
}

export function RedeemFormFields({
  redeemForm,
  setRedeemForm,
  catalogSearch,
  setCatalogSearch,
  searchCatalog,
  resetCatalogSearch,
  appliedCatalogSearch,
  catalogCategories,
  catalogItems,
  selectedCatalogItem,
}: {
  redeemForm: RedeemFormState;
  setRedeemForm: (form: RedeemFormState) => void;
  catalogSearch: string;
  setCatalogSearch: (value: string) => void;
  searchCatalog: () => void;
  resetCatalogSearch: () => void;
  appliedCatalogSearch: string;
  catalogCategories: CatalogMenuCategory[];
  catalogItems: CatalogMenuItem[];
  selectedCatalogItem: CatalogMenuItem | null;
}) {
  return (
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
    </>
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
          <div className="grid min-h-55 md:grid-cols-[220px_1fr]">
            <div className="max-h-70 overflow-auto border-b border-border md:border-b-0 md:border-r">
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
            <div className="max-h-80 overflow-auto p-2">
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
