import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/lib/admin";
import { dateFormat, numberFormat, type SortState } from "./adminFormatters";
import { Panel, SortableHeader, TableScrollArea } from "./adminUiPrimitives";
import { DebouncedSearchInput, type DebouncedSearchInputHandle } from "./DebouncedSearchInput";
import { UserFormFields } from "./AdminFormFields";
import { emptyUserForm, type UserFormValues } from "./adminFormDefaults";

export type UserSortKey = "email" | "phone_number" | "role" | "created_at";

type UsersListProps = {
  users: AdminUser[];
  userSort: SortState<UserSortKey>;
  sortUsers: (sortBy: UserSortKey) => void;
  appliedUserSearch: string;
  userSearchRef: React.RefObject<DebouncedSearchInputHandle | null>;
  searchUsers: (value: string) => void;
  userTotal: number;
  userPage: number;
  userTotalPages: number;
  loadUsers: (page: number) => void;
  editUser: (user: AdminUser) => void;
  requestDeleteUser: (user: AdminUser) => void;
  openCreateUserForm: () => void;
  saving: boolean;
  currentUser: { id: number } | null;
};

// L-7: daftar user dipisah dan di-memo supaya mengetik di panel form (state
// `userForm` milik AdminPage) tidak lagi ikut merender ulang seluruh tabel.
// Props tabel sengaja tidak memuat `userForm` sama sekali.
const UsersListPanel = memo(function UsersListPanel({
  users,
  userSort,
  sortUsers,
  appliedUserSearch,
  userSearchRef,
  searchUsers,
  userTotal,
  userPage,
  userTotalPages,
  loadUsers,
  editUser,
  requestDeleteUser,
  openCreateUserForm,
  saving,
  currentUser,
}: UsersListProps) {
  return (
    <Panel title="Daftar User Admin">
      <Button
        type="button"
        onClick={openCreateUserForm}
        className="mb-4 w-full rounded-full font-bold md:hidden"
      >
        Tambah User Admin
      </Button>
      <div className="mb-4 flex gap-2">
        <DebouncedSearchInput
          handleRef={userSearchRef}
          ariaLabel="Cari user admin"
          placeholder="Cari email, nomor, atau role..."
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
          onSearch={(value) => void searchUsers(value)}
        />
        <Button onClick={() => userSearchRef.current?.submit()} variant="outline">
          Cari
        </Button>
      </div>
      <TableScrollArea>
        <table className="min-w-[840px] w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <SortableHeader label="Email" sortKey="email" sort={userSort} onSort={sortUsers} />
              <SortableHeader
                label="Nomor"
                sortKey="phone_number"
                sort={userSort}
                onSort={sortUsers}
              />
              <SortableHeader label="Role" sortKey="role" sort={userSort} onSort={sortUsers} />
              <SortableHeader
                label="Dibuat"
                sortKey="created_at"
                sort={userSort}
                onSort={sortUsers}
              />
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={5} className="p-8 text-center">
                  <p className="font-bold text-foreground">
                    {appliedUserSearch
                      ? "Kata kunci yang Anda cari tidak ditemukan"
                      : "Belum ada data user admin"}
                  </p>
                  {appliedUserSearch && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tidak ada hasil untuk "{appliedUserSearch}".
                    </p>
                  )}
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-2 font-bold">{user.email ?? "-"}</td>
                <td className="p-2">{user.phone_number ?? "-"}</td>
                <td className="p-2 capitalize">{user.role}</td>
                <td className="p-2">{dateFormat(user.created_at)}</td>
                <td className="p-2">
                  <div className="flex items-center gap-3">
                    <button
                      className="inline-flex items-center gap-1 font-bold text-primary"
                      onClick={() => editUser(user)}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-1 font-bold text-destructive disabled:opacity-50"
                      disabled={saving || user.id === currentUser?.id}
                      onClick={() => requestDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScrollArea>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          {numberFormat(userTotal)} user · Halaman {userPage} dari {userTotalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={userPage <= 1}
            onClick={() => void loadUsers(userPage - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            disabled={userPage >= userTotalPages}
            onClick={() => void loadUsers(userPage + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </Panel>
  );
});

export default function AdminUsersTab({
  userForm,
  setUserForm,
  saveUser,
  ...listProps
}: UsersListProps & {
  userForm: UserFormValues;
  setUserForm: (form: UserFormValues) => void;
  saveUser: () => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="hidden md:block">
        <Panel title={userForm.id ? "Edit User" : "Tambah User"}>
          <UserFormFields userForm={userForm} setUserForm={setUserForm} />
          <div className="mt-3 flex gap-2">
            <Button
              onClick={saveUser}
              disabled={listProps.saving}
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
      </div>
      <UsersListPanel {...listProps} />
    </section>
  );
}
