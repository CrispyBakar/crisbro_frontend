// L-7: AdminRedeemTab dipecah dari AdminPage.tsx dengan panel tabel ber-`memo`.
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RedeemItem } from "@/lib/admin";
import AdminRedeemTab from "./AdminRedeemTab";
import type { RedeemFormState } from "./adminFormDefaults";

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

function buildItem(overrides: Partial<RedeemItem> = {}): RedeemItem {
  return {
    id: 1,
    menu_item_id: 10,
    category_id: 2,
    points_required: 2000,
    is_active: true,
    badge: null,
    sort_order: 1,
    start_at: null,
    end_at: null,
    stock_limit: null,
    daily_limit: null,
    created_at: "2026-07-15T10:00:00+07:00",
    pb1_rate: 0.1,
    pb1_amount: 2000,
    price_with_pb1: 22000,
    menu_item: { id: 10, name: "Ayam Geprek", price: 20000, is_active: true },
    ...overrides,
  } as RedeemItem;
}

function baseProps(redeemItems: RedeemItem[]) {
  return {
    redeemItems,
    redeemSort: { sort_by: "sort_order", sort_order: "asc" } as const,
    sortRedeemItems: vi.fn(),
    redeemTotal: redeemItems.length,
    redeemPage: 1,
    redeemTotalPages: 1,
    loadRedeem: vi.fn(),
    editRedeemItem: vi.fn(),
    requestDeleteRedeemItem: vi.fn(),
    openCreateRedeemForm: vi.fn(),
    saving: false,
    saveRedeemItem: vi.fn(),
    catalogSearch: "",
    setCatalogSearch: vi.fn(),
    searchCatalog: vi.fn(),
    resetCatalogSearch: vi.fn(),
    appliedCatalogSearch: "",
    catalogCategories: [],
    catalogItems: [],
    selectedCatalogItem: null,
  };
}

function Harness({ redeemItems }: { redeemItems: RedeemItem[] }) {
  const [redeemForm, setRedeemForm] = useState<RedeemFormState>({
    id: 0,
    menu_item_id: 0,
    points_required: 0,
    sort_order: 0,
    is_active: true,
  });
  const [listProps] = useState(() => baseProps(redeemItems));
  return <AdminRedeemTab {...listProps} redeemForm={redeemForm} setRedeemForm={setRedeemForm} />;
}

describe("AdminRedeemTab", () => {
  it("menampilkan item redeem beserta rincian PB1", () => {
    render(<Harness redeemItems={[buildItem()]} />);

    expect(screen.getByText("Ayam Geprek")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Simpan Item/ })).toBeInTheDocument();
  });

  it("menampilkan keadaan kosong tanpa error", () => {
    render(<Harness redeemItems={[]} />);

    expect(screen.getByText("Belum ada data menu redeem.")).toBeInTheDocument();
  });

  it("mengetik di form redeem tidak merender ulang panel tabel", async () => {
    const user = userEvent.setup();
    render(<Harness redeemItems={[buildItem()]} />);

    numberFormatSpy.mockClear();
    await user.type(screen.getByLabelText(/^Urutan/), "5");

    expect(numberFormatSpy).not.toHaveBeenCalled();
  });
});
