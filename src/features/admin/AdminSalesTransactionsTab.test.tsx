// H-5: AdminSalesTransactionsTab dipecah dari AdminPage.tsx jadi modul lazy.
// Test ini mengunci perilaku tab agar pemecahan modul tidak mengubahnya, dan
// secara khusus menjaga agar form "Pergi" (lompat ke halaman) tetap berada di
// tab ini -- sebelumnya form itu keliru berada di blok paginasi tab Customers
// (commit 7bc6edd), sehingga tab Customers punya dua tombol "Pergi" dan tab
// transaksi ini tidak punya sama sekali.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CustomerSalesTransactionReport } from "@/lib/admin";
import AdminSalesTransactionsTab from "./AdminSalesTransactionsTab";

function buildTransaction(
  overrides: Partial<CustomerSalesTransactionReport> = {},
): CustomerSalesTransactionReport {
  return {
    id: 1,
    runchise_sales_transaction_id: 162656087,
    runchise_customer_id: 555,
    customer_id: 42,
    runchise_location_id: 4453,
    nama_pelanggan: "Budi",
    no_telepon: "6281234567890",
    lokasi_dibuat: "Outlet Widyatama",
    pelanggan_sejak: "2026-01-15T00:00:00+07:00",
    poin_pelanggan: 1500,
    tanggal_transaksi: "2026-07-15T10:00:00+07:00",
    nama_outlet: "Outlet Widyatama",
    tipe_order: "Dine In",
    pembelian_per_order: "25000",
    penambahan_poin: 25,
    penggunaan_poin: "50",
    redeemed_rewards: [],
    created_at: "2026-07-15T10:00:00+07:00",
    updated_at: "2026-07-15T10:00:00+07:00",
    ...overrides,
  };
}

function renderTab(props: Partial<React.ComponentProps<typeof AdminSalesTransactionsTab>> = {}) {
  const defaults = {
    transactions: [] as CustomerSalesTransactionReport[],
    search: "",
    onSearchChange: vi.fn(),
    outlet: "",
    onOutletChange: vi.fn(),
    outletOptions: [] as string[],
    from: "",
    onFromChange: vi.fn(),
    to: "",
    onToChange: vi.fn(),
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 50,
    onLimitChange: vi.fn(),
    pageInput: "1",
    onPageInputChange: vi.fn(),
    onJumpToPage: vi.fn(),
    loading: false,
    onLoadPage: vi.fn(),
  };
  const merged = { ...defaults, ...props };
  render(<AdminSalesTransactionsTab {...merged} />);
  return merged;
}

describe("AdminSalesTransactionsTab", () => {
  it("menampilkan keadaan kosong tanpa error", () => {
    renderTab();
    expect(screen.getByText("Belum ada data transaksi customer yang sesuai.")).toBeInTheDocument();
  });

  it("menampilkan kolom transaksi termasuk nominal dan poin", () => {
    renderTab({ transactions: [buildTransaction()], total: 1 });

    expect(screen.getByText("162656087")).toBeInTheDocument();
    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("6281234567890")).toBeInTheDocument();
    expect(screen.getByText("Dine In")).toBeInTheDocument();
    // pembelian_per_order dikirim API sebagai string; harus tetap diformat rupiah.
    expect(screen.getByText(/Rp\s?25\.000/)).toBeInTheDocument();
  });

  it("menampilkan tanda hubung untuk field kosong, bukan 'null'", () => {
    renderTab({
      transactions: [
        buildTransaction({
          nama_pelanggan: null,
          no_telepon: null,
          lokasi_dibuat: null,
          pelanggan_sejak: null,
          tanggal_transaksi: null,
          nama_outlet: null,
          tipe_order: null,
        }),
      ],
    });

    expect(screen.queryByText("null")).not.toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("merinci reward yang ditukar beserta poinnya", () => {
    renderTab({
      transactions: [
        buildTransaction({
          redeemed_rewards: [
            {
              id: "r1",
              runchise_product_id: 111,
              redeem_menu_item_id: 9,
              product_name: "Kopi Gratis",
              quantity: 2,
              point_per_item: 25,
              points_spent: 50,
              is_managed_reward: true,
            },
          ],
        }),
      ],
    });

    expect(screen.getByText(/2× Kopi Gratis/)).toBeInTheDocument();
    expect(screen.getByText(/50 poin/)).toBeInTheDocument();
  });

  it("tombol Terapkan memuat ulang dari halaman 1", async () => {
    const user = userEvent.setup();
    const { onLoadPage } = renderTab({ page: 4, totalPages: 9, total: 450 });

    await user.click(screen.getByRole("button", { name: "Terapkan" }));
    expect(onLoadPage).toHaveBeenCalledWith(1);
  });

  it("navigasi halaman memanggil halaman sebelumnya/berikutnya yang benar", async () => {
    const user = userEvent.setup();
    const { onLoadPage } = renderTab({ page: 4, totalPages: 9, total: 450 });

    await user.click(screen.getByRole("button", { name: "Sebelumnya" }));
    expect(onLoadPage).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole("button", { name: "Berikutnya" }));
    expect(onLoadPage).toHaveBeenCalledWith(5);
  });

  it("menonaktifkan tombol paginasi di batas halaman", () => {
    renderTab({ page: 1, totalPages: 1, total: 3 });
    expect(screen.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
  });

  it("form lompat-ke-halaman ada DI TAB INI dan memicu onJumpToPage", async () => {
    // Regresi yang dijaga: kontrol ini sempat berada di tab Customers.
    const user = userEvent.setup();
    const { onJumpToPage } = renderTab({ page: 2, totalPages: 9, total: 450 });

    expect(screen.getByLabelText("Nomor halaman transaksi tujuan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pergi" }));
    expect(onJumpToPage).toHaveBeenCalledTimes(1);
  });

  it("hanya ada satu tombol Pergi di tab ini", () => {
    renderTab({ page: 2, totalPages: 9, total: 450 });
    expect(screen.getAllByRole("button", { name: "Pergi" })).toHaveLength(1);
  });

  it("mengubah jumlah baris per halaman meneruskan angka, bukan string", async () => {
    const user = userEvent.setup();
    const { onLimitChange } = renderTab({ total: 450, totalPages: 9 });

    await user.selectOptions(screen.getByRole("combobox", { name: /Per halaman/i }), "100");
    expect(onLimitChange).toHaveBeenCalledWith(100);
  });

  it("menampilkan rentang baris dan total yang benar", () => {
    renderTab({ page: 3, limit: 50, total: 450, totalPages: 9 });
    // Halaman 3 dengan 50 baris => 101-150 dari 450.
    const summary = screen.getByText(/Menampilkan/);
    expect(summary.textContent?.replace(/\s+/g, " ")).toContain("101–150 dari 450 transaksi");
  });

  it("menampilkan 0 sebagai batas bawah ketika tidak ada data", () => {
    renderTab({ page: 1, limit: 50, total: 0, totalPages: 1 });
    const summary = screen.getByText(/Menampilkan/);
    expect(summary.textContent?.replace(/\s+/g, " ")).toContain("0–0 dari 0 transaksi");
  });

  it("meneruskan perubahan filter pencarian ke handler induk", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    renderTab({ onSearchChange });

    await user.type(screen.getByLabelText("Cari"), "b");
    expect(onSearchChange).toHaveBeenCalledWith("b");
  });
});
