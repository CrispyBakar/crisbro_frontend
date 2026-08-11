// L-7: AdminCustomersTab dipecah dari AdminPage.tsx. Tab ini yang paling berat
// (form terpanjang + tabel terlebar), jadi test menjaga isinya tetap sama dan
// membuktikan panel daftar tidak ikut dirender ulang saat form diketik.
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminCustomer } from "@/lib/admin";
import AdminCustomersTab from "./AdminCustomersTab";
import { emptyCustomerForm, type CustomerFormValues } from "./adminFormDefaults";

const numberFormatSpy = vi.fn();
vi.mock("./adminFormatters", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./adminFormatters")>();
  return {
    ...actual,
    numberFormat: (value: number) => {
      numberFormatSpy();
      return actual.numberFormat(value);
    },
  };
});

function buildCustomer(overrides: Partial<AdminCustomer> = {}): AdminCustomer {
  return {
    id: 1,
    runchise_id: 5001,
    name: "Budi",
    phone_number: "81234567890",
    phone_number_country_code: 62,
    address: null,
    province: null,
    city: null,
    country: "Indonesia",
    postal_code: null,
    dob: null,
    gender: "unknown",
    status: "active",
    balance: 0,
    brand_id: 1,
    owner_location_id: 7,
    runchise_sync_status: "synced",
    runchise_sync_error: null,
    created_at: "2026-07-15T10:00:00+07:00",
    updated_at: "2026-07-15T10:00:00+07:00",
    user: {
      id: 11,
      email: "budi@crisbar.test",
      phone_number: "81234567890",
      role: "customer",
      activation_status: "pending_activation",
      activated_at: null,
    },
    customer_point: { total_point: 100, available_point: 50, next_reward_threshold: 2000 },
    customer_locations: [
      { location_id: 7, location: { id: 7, name: "Outlet A", city: "Bandung" } },
    ],
    ...overrides,
  } as AdminCustomer;
}

function baseProps(customers: AdminCustomer[]) {
  return {
    customers,
    customerSort: { sort_by: "created_at", sort_order: "desc" } as const,
    sortCustomers: vi.fn(),
    appliedCustomerSearch: "",
    customerSearchRef: { current: null },
    searchCustomers: vi.fn(),
    customerTotal: customers.length,
    customerPage: 1,
    customerTotalPages: 1,
    customerLimit: 50,
    changeCustomerLimit: vi.fn(),
    customerPageInput: "1",
    setCustomerPageInput: vi.fn(),
    jumpToCustomerPage: vi.fn(),
    loadCustomersPage: vi.fn(),
    customerFrom: "",
    setCustomerFrom: vi.fn(),
    customerTo: "",
    setCustomerTo: vi.fn(),
    applyCustomerDateFilter: vi.fn(),
    resetCustomerDateFilter: vi.fn(),
    customerEmailStatus: "all" as const,
    applyCustomerEmailStatus: vi.fn(),
    customerRegistrationRange: { earliest: null, latest: null },
    customerImportJob: null,
    customerSyncEnabled: true,
    canSyncCustomers: true,
    startCustomerImportFromRunchise: vi.fn(),
    openCreateCustomerForm: vi.fn(),
    editCustomer: vi.fn(),
    requestDeleteCustomer: vi.fn(),
    resendActivation: vi.fn(),
    retryCustomerRunchiseSync: vi.fn(),
    saving: false,
    saveCustomer: vi.fn(),
    brands: [{ id: 1, name: "Crisbar" }],
    locations: [{ id: 7, name: "Outlet A", city: "Bandung" }],
  };
}

function Harness({ customers }: { customers: AdminCustomer[] }) {
  const [customerForm, setCustomerForm] = useState<CustomerFormValues>(emptyCustomerForm);
  const [listProps] = useState(() => baseProps(customers));
  return (
    <AdminCustomersTab
      {...listProps}
      customerForm={customerForm}
      setCustomerForm={setCustomerForm}
    />
  );
}

describe("AdminCustomersTab", () => {
  it("menampilkan baris customer beserta panel formnya", () => {
    render(<Harness customers={[buildCustomer()]} />);

    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("budi@crisbar.test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Simpan Customer/ })).toBeInTheDocument();
  });

  it("grup Loyalty hanya muncul saat mengedit customer yang sudah ada", () => {
    const { rerender } = render(<Harness customers={[]} />);
    expect(screen.queryByText("Loyalty")).not.toBeInTheDocument();

    function EditHarness() {
      const [listProps] = useState(() => baseProps([]));
      return (
        <AdminCustomersTab
          {...listProps}
          customerForm={{ ...emptyCustomerForm, id: 1, total_point: 100 }}
          setCustomerForm={vi.fn()}
        />
      );
    }
    rerender(<EditHarness />);
    expect(screen.getByText("Loyalty")).toBeInTheDocument();
  });

  it("mengetik di form customer tidak merender ulang panel daftar", async () => {
    const user = userEvent.setup();
    render(<Harness customers={[buildCustomer()]} />);

    numberFormatSpy.mockClear();
    // Label field wajib dirender sebagai "Nama *" (RequiredLabel).
    await user.type(screen.getByLabelText(/^Nama/), "budi");

    expect(numberFormatSpy).not.toHaveBeenCalled();
  });
});
