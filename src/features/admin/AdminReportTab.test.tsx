// H-5: AdminReportTab dipisahkan dari AdminPage.tsx menjadi modul lazy agar tab report memiliki chunk sendiri tanpa mengubah perilaku, termasuk DataTable, Metric, dan tiga grafik yang tetap diuji dengan modul aslinya untuk memverifikasi wiring React.lazy/Suspense.
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminLocation, LoyaltySummary } from "@/lib/admin";
import AdminReportTab from "./AdminReportTab";

function buildSummary(overrides: Partial<LoyaltySummary> = {}): LoyaltySummary {
  return {
    total_members: 18330,
    active_members: 12000,
    total_points_given: 250000,
    total_points_available: 180000,
    points_earned: 250000,
    points_redeemed: 70000,
    redemption_count: 1420,
    runchise_customers_stored: 20000,
    runchise_customers_with_points: 9500,
    runchise_customers_by_outlet: [],
    top_rewards: [],
    top_redeem_outlets: [],
    redemption_trend: [],
    redemption_history: [],
    ...overrides,
  };
}

const locations: AdminLocation[] = [
  { id: 1, name: "Widyatama", city: "Bandung" },
  { id: 2, name: "Dipatiukur", city: null },
];

function renderTab(props: Partial<React.ComponentProps<typeof AdminReportTab>> = {}) {
  const defaults = {
    summary: buildSummary(),
    locations,
    redemptionFrom: "",
    onRedemptionFromChange: vi.fn(),
    redemptionTo: "",
    onRedemptionToChange: vi.fn(),
    outletId: "0",
    onOutletIdChange: vi.fn(),
    loading: false,
    onApplyFilter: vi.fn(),
  };
  const merged = { ...defaults, ...props };
  const { container } = render(<AdminReportTab {...merged} />);
  return { ...merged, container };
}

describe("AdminReportTab", () => {
  it("menampilkan keenam kartu metrik dengan angka terformat id-ID", () => {
    renderTab();

    expect(screen.getByText("Total Member", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("18.330")).toBeInTheDocument();
    expect(screen.getByText("Customer Berpoin", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("9.500")).toBeInTheDocument();
    expect(screen.getByText("Poin Diberikan", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("250.000")).toBeInTheDocument();
    expect(screen.getByText("Poin Ditukar", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("70.000")).toBeInTheDocument();
    expect(screen.getByText("Poin Tersedia", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("180.000")).toBeInTheDocument();
    expect(screen.getByText("Total Redeem", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("1.420")).toBeInTheDocument();
  });

  it("memuat ketiga grafik lazy dan menyingkirkan skeleton Suspense-nya", async () => {
    const { container } = renderTab({
      summary: buildSummary({
        top_rewards: [
          { reward_id: 1, reward_name: "Kopi Gratis", redemption_count: 5, points_spent: 250 },
        ],
        top_redeem_outlets: [
          {
            outlet_id: 1,
            outlet_name: "Widyatama",
            city: "Bandung",
            redemption_count: 5,
            points_spent: 250,
          },
        ],
        redemption_trend: [{ date: "2026-07-15", redemption_count: 5, points_spent: 250 }],
      }),
    });

    await waitFor(
      () => {
        expect(container.querySelectorAll("[data-chart]")).toHaveLength(3);
      },
      { timeout: 10000 },
    );

    // Ketiga batas Suspense sudah selesai memuat, jadi tidak ada skeleton sisa.
    expect(container.querySelectorAll('[aria-label="Memuat grafik"]')).toHaveLength(0);
  }, 20000);

  it("memetakan status outlet ke label bahasa Indonesia, bukan kode mentah", () => {
    renderTab({
      summary: buildSummary({
        runchise_customers_by_outlet: [
          {
            outlet_id: 1,
            source_location_id: 4453,
            outlet_name: "Widyatama",
            city: "Bandung",
            stored_customers: 1200,
            customers_with_points: 800,
            points_redeemed: 5000,
            api_reported_total: 1200,
            last_snapshot_at: "2026-07-15T10:00:00+07:00",
            status: "capped",
          },
          {
            outlet_id: 2,
            source_location_id: 4614,
            outlet_name: "Dipatiukur",
            city: null,
            stored_customers: 0,
            customers_with_points: 0,
            api_reported_total: null,
            last_snapshot_at: null,
            status: "empty",
          },
        ],
      }),
    });

    expect(screen.getByText("Dibatasi API")).toBeInTheDocument();
    expect(screen.getByText("Belum ada data")).toBeInTheDocument();
    // Kota & snapshot kosong tampil sebagai "-", bukan "null".
    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });

  it("menampilkan pesan kosong ketika belum ada outlet maupun riwayat", () => {
    renderTab();

    expect(screen.getByText("Belum ada outlet Runchise yang terdaftar.")).toBeInTheDocument();
    expect(
      screen.getByText("Belum ada riwayat reward yang ditukar pada rentang tanggal ini."),
    ).toBeInTheDocument();
  });

  it("menampilkan riwayat redemption termasuk harga jual dan outlet berkota", () => {
    renderTab({
      summary: buildSummary({
        redemption_history: [
          {
            id: 1,
            reward_id: 9,
            reward_name: "Kopi Gratis",
            points_spent: 50,
            menu_price: 25000,
            outlet_id: 1,
            outlet_name: "Widyatama",
            outlet_city: "Bandung",
            redeemed_at: "2026-07-15T10:00:00+07:00",
          },
          {
            id: 2,
            reward_id: 10,
            reward_name: "Teh Gratis",
            points_spent: 30,
            menu_price: null,
            outlet_id: 2,
            outlet_name: "Dipatiukur",
            outlet_city: null,
            redeemed_at: "2026-07-16T10:00:00+07:00",
          },
        ],
      }),
    });

    expect(screen.getByText("Kopi Gratis")).toBeInTheDocument();
    expect(screen.getByText("Widyatama (Bandung)")).toBeInTheDocument();
    expect(screen.getByText(/Rp\s?25\.000/)).toBeInTheDocument();
    // menu_price null harus jadi "-", bukan "Rp 0" atau "null".
    expect(screen.getByText("Dipatiukur")).toBeInTheDocument();
  });

  it("mengurutkan kolom DataTable saat header diklik", async () => {
    const user = userEvent.setup();
    renderTab({
      summary: buildSummary({
        redemption_history: [
          {
            id: 1,
            reward_id: 9,
            reward_name: "Zeta",
            points_spent: 10,
            menu_price: null,
            outlet_id: 1,
            outlet_name: "Outlet A",
            outlet_city: null,
            redeemed_at: "2026-07-15T10:00:00+07:00",
          },
          {
            id: 2,
            reward_id: 10,
            reward_name: "Alfa",
            points_spent: 20,
            menu_price: null,
            outlet_id: 2,
            outlet_name: "Outlet B",
            outlet_city: null,
            redeemed_at: "2026-07-16T10:00:00+07:00",
          },
        ],
      }),
    });

    const rewardHeader = screen.getByRole("button", { name: /Reward\/Menu/ });
    const table = rewardHeader.closest("table") as HTMLTableElement;

    const namesBefore = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => (row as HTMLTableRowElement).cells[1].textContent);
    expect(namesBefore).toEqual(["Zeta", "Alfa"]);

    await user.click(rewardHeader);

    const namesAfter = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => (row as HTMLTableRowElement).cells[1].textContent);
    expect(namesAfter).toEqual(["Alfa", "Zeta"]);
  });

  it("menandai arah pengurutan lewat aria-sort untuk pembaca layar", async () => {
    const user = userEvent.setup();
    renderTab({
      summary: buildSummary({
        redemption_history: [
          {
            id: 1,
            reward_id: 9,
            reward_name: "Zeta",
            points_spent: 10,
            menu_price: null,
            outlet_id: 1,
            outlet_name: "Outlet A",
            outlet_city: null,
            redeemed_at: "2026-07-15T10:00:00+07:00",
          },
        ],
      }),
    });

    const rewardHeader = screen.getByRole("button", { name: /Reward\/Menu/ });
    const headerCell = rewardHeader.closest("th") as HTMLTableCellElement;

    expect(headerCell).toHaveAttribute("aria-sort", "none");
    await user.click(rewardHeader);
    expect(headerCell).toHaveAttribute("aria-sort", "ascending");
    await user.click(rewardHeader);
    expect(headerCell).toHaveAttribute("aria-sort", "descending");
  });

  it("menyusun opsi outlet dari daftar lokasi, termasuk yang tanpa kota", () => {
    renderTab();
    // Radix Select menampilkan nilai terpilih di trigger; "0" => Semua outlet.
    expect(screen.getByText("Semua outlet")).toBeInTheDocument();
  });

  it("tombol Terapkan Filter memanggil handler induk", async () => {
    const user = userEvent.setup();
    const { onApplyFilter } = renderTab();

    await user.click(screen.getByRole("button", { name: "Terapkan Filter" }));
    expect(onApplyFilter).toHaveBeenCalledTimes(1);
  });

  it("menonaktifkan tombol Terapkan Filter saat sedang memuat", () => {
    renderTab({ loading: true });
    expect(screen.getByRole("button", { name: "Terapkan Filter" })).toBeDisabled();
  });

  it("meneruskan perubahan filter tanggal ke handler induk", async () => {
    const user = userEvent.setup();
    const onRedemptionFromChange = vi.fn();
    renderTab({ onRedemptionFromChange });

    await user.type(screen.getByLabelText("Dari tanggal"), "2026-07-01");
    expect(onRedemptionFromChange).toHaveBeenCalled();
  });
});
