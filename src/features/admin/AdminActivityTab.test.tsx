// H-5: AdminActivityTab dipecah dari AdminPage.tsx jadi modul lazy tersendiri.
// Test ini menjaga agar pemecahan itu tidak diam-diam mengubah perilaku tab
// activity: kolom tabel, format metadata log (termasuk cabang khusus yang
// dulu tinggal di AdminPage), dan kontrol paginasi/filter harus tetap sama.
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminActivityLog } from "@/lib/admin";
import AdminActivityTab from "./AdminActivityTab";

function buildLog(overrides: Partial<AdminActivityLog> = {}): AdminActivityLog {
  return {
    id: 1,
    actor_user_id: 7,
    actor_role: "admin",
    actor: { id: 7, email: "admin@crisbar.test", phone_number: "8123", role: "admin" },
    action: "update_customer",
    entity_type: "customer",
    entity_id: 42,
    metadata: null,
    before: null,
    after: null,
    ip_address: "10.0.0.1",
    created_at: "2026-07-15T10:00:00+07:00",
    ...overrides,
  } as AdminActivityLog;
}

function renderTab(props: Partial<React.ComponentProps<typeof AdminActivityTab>> = {}) {
  const onLoadPage = vi.fn();
  const defaults = {
    logs: [] as AdminActivityLog[],
    search: "",
    onSearchChange: vi.fn(),
    action: "",
    onActionChange: vi.fn(),
    entityType: "",
    onEntityTypeChange: vi.fn(),
    from: "",
    onFromChange: vi.fn(),
    to: "",
    onToChange: vi.fn(),
    page: 1,
    totalPages: 1,
    total: 0,
    loading: false,
    onLoadPage,
  };
  const merged = { ...defaults, ...props };
  render(<AdminActivityTab {...merged} />);
  return merged;
}

describe("AdminActivityTab", () => {
  it("menampilkan keadaan kosong tanpa error", () => {
    renderTab();
    expect(screen.getByText("Belum ada activity log")).toBeInTheDocument();
  });

  it("menampilkan baris log dengan actor, action, entity, dan IP", () => {
    renderTab({ logs: [buildLog()], total: 1 });

    expect(screen.getByText("admin@crisbar.test")).toBeInTheDocument();
    expect(screen.getByText("update_customer")).toBeInTheDocument();
    expect(screen.getByText("customer #42")).toBeInTheDocument();
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument();
  });

  it("jatuh ke nomor telepon lalu ID user ketika email actor tidak ada", () => {
    renderTab({
      logs: [
        buildLog({ id: 1, actor: { id: 7, email: null, phone_number: "81234", role: "admin" } }),
        buildLog({ id: 2, actor: undefined, actor_user_id: 99 }),
      ],
    });

    expect(screen.getByText("81234")).toBeInTheDocument();
    expect(screen.getByText("User #99")).toBeInTheDocument();
  });

  it("meringkas metadata sync Runchise dan email aktivasi jadi label, bukan JSON mentah", () => {
    renderTab({
      logs: [
        buildLog({
          metadata: {
            runchise_sync: { status: "synced", runchise_customer_id: 555, updated_existing: true },
            activation_email: { sent: true },
          },
        }),
      ],
    });

    expect(screen.getByText(/Berhasil/)).toBeInTheDocument();
    expect(screen.getByText(/555/)).toBeInTheDocument();
    expect(screen.getByText(/Update data yang sudah ada/)).toBeInTheDocument();
    expect(screen.getByText(/Terkirim/)).toBeInTheDocument();
  });

  it("menghitung ulang field berubah untuk log lama yang metadatanya tidak akurat", () => {
    // Cabang khusus: metadata lama menandai last_updated_by_id sebagai field
    // berubah (noise), jadi daftar sebenarnya dihitung ulang dari before/after.
    renderTab({
      logs: [
        buildLog({
          metadata: { changed_fields: ["last_updated_by_id"] },
          before: { name: "Budi", customer_point: { available_point: 10 } },
          after: { name: "Budi Santoso", customer_point: { available_point: 25 } },
        }),
      ],
    });

    expect(screen.getByText(/name, point\.available_point/)).toBeInTheDocument();
  });

  it("menampilkan JSON ringkas ketika metadata tidak dikenali polanya", () => {
    renderTab({ logs: [buildLog({ metadata: { catatan_bebas: "nilai" } })] });
    expect(screen.getByText(/catatan_bebas/)).toBeInTheDocument();
  });

  it("tombol Filter memuat ulang dari halaman 1", async () => {
    const user = userEvent.setup();
    const { onLoadPage } = renderTab({ page: 3, totalPages: 5, total: 250 });

    await user.click(screen.getByRole("button", { name: "Filter" }));
    expect(onLoadPage).toHaveBeenCalledWith(1);
  });

  it("navigasi halaman memanggil halaman sebelumnya/berikutnya yang benar", async () => {
    const user = userEvent.setup();
    const { onLoadPage } = renderTab({ page: 3, totalPages: 5, total: 250 });

    await user.click(screen.getByRole("button", { name: "Sebelumnya" }));
    expect(onLoadPage).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "Berikutnya" }));
    expect(onLoadPage).toHaveBeenCalledWith(4);
  });

  it("menonaktifkan tombol paginasi di batas dan saat loading", () => {
    const { unmount } = render(
      <AdminActivityTab
        logs={[]}
        search=""
        onSearchChange={vi.fn()}
        action=""
        onActionChange={vi.fn()}
        entityType=""
        onEntityTypeChange={vi.fn()}
        from=""
        onFromChange={vi.fn()}
        to=""
        onToChange={vi.fn()}
        page={1}
        totalPages={1}
        total={0}
        loading={false}
        onLoadPage={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
    unmount();

    renderTab({ page: 2, totalPages: 5, loading: true });
    expect(screen.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
  });

  it("meneruskan perubahan input filter ke handler induk (state tetap dikelola AdminPage)", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    renderTab({ onSearchChange });

    await user.type(screen.getByLabelText("Search"), "a");
    expect(onSearchChange).toHaveBeenCalledWith("a");
  });

  it("menampilkan ringkasan total dan halaman", () => {
    renderTab({ page: 2, totalPages: 7, total: 1234 });
    const summary = screen.getByText(/Total/);
    expect(within(summary).getByText(/1\.234/)).toBeTruthy();
    expect(summary.textContent).toContain("Halaman 2 dari 7");
  });
});
