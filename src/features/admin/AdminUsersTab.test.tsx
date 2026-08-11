// L-7: Memastikan pemisahan AdminUsersTab dan penggunaan memo tidak mengubah isi tab serta mencegah tabel ikut re-render saat form diketik.
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminUser } from "@/lib/admin";
import AdminUsersTab from "./AdminUsersTab";
import { emptyUserForm, type UserFormValues } from "./adminFormDefaults";

// numberFormat dipanggil saat panel tabel dirender (ringkasan "N user"),
// sehingga jumlah pemanggilannya bisa dipakai sebagai penghitung render panel.
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

function buildUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    email: "admin@crisbar.test",
    phone_number: "81234567890",
    role: "admin",
    created_at: "2026-07-15T10:00:00+07:00",
    updated_at: "2026-07-15T10:00:00+07:00",
    ...overrides,
  } as AdminUser;
}

function baseProps(users: AdminUser[]) {
  return {
    users,
    userSort: { sort_by: "role", sort_order: "asc" } as const,
    sortUsers: vi.fn(),
    appliedUserSearch: "",
    userSearchRef: { current: null },
    searchUsers: vi.fn(),
    userTotal: users.length,
    userPage: 1,
    userTotalPages: 1,
    loadUsers: vi.fn(),
    editUser: vi.fn(),
    requestDeleteUser: vi.fn(),
    openCreateUserForm: vi.fn(),
    saving: false,
    currentUser: { id: 99 },
    saveUser: vi.fn(),
  };
}

// L-7: Meniru kestabilan props pada AdminPage untuk memastikan panel tabel menerima data dan handler dengan identitas yang konsisten antar render.
function Harness({ users }: { users: AdminUser[] }) {
  const [userForm, setUserForm] = useState<UserFormValues>(emptyUserForm);
  const [listProps] = useState(() => baseProps(users));
  return <AdminUsersTab {...listProps} userForm={userForm} setUserForm={setUserForm} />;
}

describe("AdminUsersTab", () => {
  it("menampilkan baris user beserta aksinya", () => {
    render(<Harness users={[buildUser({ email: "budi@crisbar.test" })]} />);

    expect(screen.getByText("budi@crisbar.test")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Simpan User/ })).toBeInTheDocument();
    expect(screen.getByText(/1 user/)).toBeInTheDocument();
  });

  it("menampilkan pesan kosong saat tidak ada user", () => {
    render(<Harness users={[]} />);

    expect(screen.getByText("Belum ada data user admin")).toBeInTheDocument();
  });

  it("mengetik di form tidak merender ulang panel tabel", async () => {
    const user = userEvent.setup();
    render(<Harness users={[buildUser()]} />);

    numberFormatSpy.mockClear();
    await user.type(screen.getByLabelText("Email"), "halo");

    // Empat ketikan; tanpa memo panel tabel ikut dirender ulang empat kali.
    expect(numberFormatSpy).not.toHaveBeenCalled();
  });
});
