import { useState } from "react";
import {
  AtSign,
  BadgeAlert,
  BadgeCheck,
  Camera,
  CalendarDays,
  Mail,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import HeaderMain from "@/components/HeaderMain";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePageTitle } from "@/hooks/use-page-title";
import { useUpdateUser } from "@/hooks/use-users";
import type { CurrentUser } from "@/services/auth";

const FORM_FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm font-normal text-chocolate outline-none focus:border-gray-400";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  marketing: "Marketing",
  customer: "Customer",
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));

const getInitials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "-";

const InfoRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 py-4">
    <div className="rounded-xl bg-cream p-2.5 text-muted">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="truncate text-sm font-semibold text-chocolate">
        {children}
      </div>
    </div>
  </div>
);

const EmailVerifiedBadge = ({ verified }: { verified: boolean }) => {
  const Icon = verified ? BadgeCheck : BadgeAlert;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 px-2 text-xs font-semibold ${
        verified
          ? "bg-success/10 text-success"
          : "bg-berry-red/10 text-berry-red"
      }`}
    >
      <Icon size={13} />
      {verified ? "Verified" : "Belum verified"}
    </span>
  );
};

const FormField = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm font-semibold text-chocolate">{label}</span>
    {children}
    {hint && <span className="text-xs text-gray-500">{hint}</span>}
  </label>
);

// Form edit — di-mount kondisional agar selalu terisi data profil terbaru
const EditProfileForm = ({
  user,
  onDone,
}: {
  user: CurrentUser;
  onDone: () => void;
}) => {
  const { mutate, isPending, error } = useUpdateUser();
  const [form, setForm] = useState({
    email: user.email,
    username: user.username,
  });

  const setField =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = form.email.trim();
    const username = form.username.trim();

    // Kirim hanya field yang berubah — backend menolak email/username duplikat
    const payload = {
      ...(email !== user.email ? { email } : {}),
      ...(username !== user.username ? { username } : {}),
    };

    if (Object.keys(payload).length === 0) {
      onDone();
      return;
    }

    mutate({ user_id: user.user_id, ...payload }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Email">
          <input
            type="email"
            value={form.email}
            onChange={setField("email")}
            required
            className={FORM_FIELD_CLASS}
          />
        </FormField>

        <FormField label="Username" hint="Minimal 6 karakter.">
          <input
            type="text"
            value={form.username}
            onChange={setField("username")}
            required
            minLength={6}
            className={FORM_FIELD_CLASS}
          />
        </FormField>

        <FormField
          label="Role"
          hint="Role tidak dapat diubah dari profil sendiri."
        >
          <input
            type="text"
            value={ROLE_LABELS[user.role] ?? user.role}
            disabled
            className={`${FORM_FIELD_CLASS} cursor-not-allowed bg-gray-50 text-gray-500`}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-5">
        {error && (
          <p className="mr-auto text-sm text-red-500">{error.message}</p>
        )}
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="cursor-pointer rounded-3xl border border-gray-100 py-2 px-5 text-sm font-semibold text-chocolate transition-colors hover:bg-cream"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500"
        >
          {isPending ? "Menyimpan..." : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
};

const AdminProfile = () => {
  usePageTitle("Profil");
  const { data: user, isPending, error } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);

  // Endpoint PATCH /users/:user_id khusus role admin
  const canEdit = user?.role === "admin";

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        title="Informasi Profil"
        subtitle="Lihat dan perbarui data akun yang sedang login."
      />

      {isPending ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Memuat profil...
        </div>
      ) : error || !user ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-red-500 shadow-sm">
          Gagal memuat profil{error ? `: ${error.message}` : "."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Kartu ringkasan: foto profil, nama, role */}
          <section className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-r from-sunshine-yellow via-orange to-berry-red text-3xl font-bold text-white">
                {getInitials(user.username)}
              </div>
              <button
                type="button"
                disabled
                title="Upload foto profil belum tersedia"
                className="absolute right-0 bottom-0 cursor-not-allowed rounded-full border-2 border-white bg-gray-200 p-2 text-gray-500"
              >
                <Camera size={16} />
              </button>
            </div>

            <h3 className="mt-4 text-xl font-bold text-chocolate">
              {user.username}
            </h3>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <p className="text-sm text-gray-500">{user.email}</p>
              <EmailVerifiedBadge verified={user.email_verified} />
            </div>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-peach/60 py-1 px-3 text-xs font-semibold text-chocolate">
              <ShieldCheck size={14} />
              {ROLE_LABELS[user.role] ?? user.role}
            </span>

            <p className="mt-6 text-xs text-gray-400">
              Upload foto profil belum didukung server.
            </p>
          </section>

          {/* Detail akun + form edit */}
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-chocolate">
                  {isEditing ? "Edit Profil" : "Detail Akun"}
                </h3>
                <p className="text-xs text-gray-500">
                  {isEditing
                    ? "Perbarui email dan username akun kamu."
                    : "Informasi akun yang sedang login."}
                </p>
              </div>

              {!isEditing && canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-3xl border border-gray-200 py-2 px-4 text-sm font-semibold text-chocolate transition-colors hover:bg-cream"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="pt-4">
                <EditProfileForm
                  user={user}
                  onDone={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <InfoRow icon={Mail} label="Email">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{user.email}</span>
                      <EmailVerifiedBadge verified={user.email_verified} />
                    </div>
                  </InfoRow>
                  <InfoRow icon={AtSign} label="Username">
                    {user.username}
                  </InfoRow>
                  <InfoRow icon={ShieldCheck} label="Role">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </InfoRow>
                  <InfoRow icon={CalendarDays} label="Bergabung sejak">
                    {formatDate(user.created_at)}
                  </InfoRow>
                </div>

                {!canEdit && (
                  <p className="mt-4 rounded-xl bg-cream p-3 text-xs text-muted">
                    Hanya admin yang dapat mengubah data akun. Hubungi admin
                    untuk memperbarui profil kamu.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default AdminProfile;
