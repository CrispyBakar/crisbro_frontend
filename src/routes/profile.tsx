import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type HTMLAttributes, type ReactNode } from "react";
import { CalendarDays, MapPin, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile Customer — Crisbar" },
      { name: "description", content: "Kelola identitas dan lokasi profile customer Crisbar." },
    ],
  }),
  component: CustomerProfilePage,
});

type ProfileForm = {
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  birthDate: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
};

const emptyProfile: ProfileForm = {
  name: "",
  email: "",
  phoneNumber: "",
  gender: "",
  birthDate: "",
  address: "",
  city: "",
  province: "",
  country: "Indonesia",
  postalCode: "",
};

function displayPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return `+62${digits}`;
}

function CustomerProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProfile);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (user.role !== "customer") {
      void navigate({ to: user.role === "admin" ? "/admin" : "/marketing" });
      return;
    }

    setForm((current) => ({
      ...current,
      name: user.customer?.name ?? "",
      email: user.email ?? "",
      phoneNumber: user.phone_number ?? "",
    }));
  }, [navigate]);

  function updateField(field: keyof ProfileForm, value: string) {
    setNotice("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice("Form profile sudah siap. Penyimpanan data menunggu integrasi backend.");
  }

  return (
    <main className="mt-10 px-4">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
            <UserRound className="h-4 w-4" /> Profile Customer
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Kelola <span className="text-primary">Profile</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Perbarui informasi identitas dan lokasi akun customer.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-(--shadow-soft) md:p-8"
        >
          <ProfileSection icon={<UserRound className="h-5 w-5" />} title="Identitas">
            <ProfileInput
              label="Nama"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              autoComplete="name"
            />
            <ProfileInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              autoComplete="email"
            />
            <ProfileInput
              label="Nomor HP"
              type="tel"
              value={displayPhoneNumber(form.phoneNumber)}
              onChange={() => undefined}
              autoComplete="tel"
              readOnly
            />
            <label className="block">
              <span className="text-sm font-bold text-foreground/80">Gender</span>
              <Select value={form.gender} onValueChange={(value) => updateField("gender", value)}>
                <SelectTrigger className="mt-2 h-12 rounded-2xl border-2 border-input bg-background px-3 text-base font-medium shadow-none">
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                  <SelectItem value="prefer_not_to_say">Tidak ingin menyebutkan</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <ProfileInput
              label="Tanggal Lahir"
              type="date"
              value={form.birthDate}
              onChange={(value) => updateField("birthDate", value)}
              autoComplete="bday"
              icon={<CalendarDays className="h-4 w-4" />}
            />
          </ProfileSection>

          <ProfileSection icon={<MapPin className="h-5 w-5" />} title="Lokasi">
            <div className="md:col-span-2">
              <ProfileInput
                label="Alamat"
                value={form.address}
                onChange={(value) => updateField("address", value)}
                autoComplete="street-address"
              />
            </div>
            <ProfileInput
              label="Kota"
              value={form.city}
              onChange={(value) => updateField("city", value)}
              autoComplete="address-level2"
            />
            <ProfileInput
              label="Provinsi"
              value={form.province}
              onChange={(value) => updateField("province", value)}
              autoComplete="address-level1"
            />
            <ProfileInput
              label="Negara"
              value={form.country}
              onChange={(value) => updateField("country", value)}
              autoComplete="country-name"
            />
            <ProfileInput
              label="Kode Pos"
              value={form.postalCode}
              onChange={(value) => updateField("postalCode", value)}
              autoComplete="postal-code"
              inputMode="numeric"
            />
          </ProfileSection>

          {notice && (
            <div className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm font-bold text-secondary-foreground">
              {notice}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="h-12 rounded-full px-6 font-bold">
              <Link to="/dashboard">Kembali ke Dashboard</Link>
            </Button>
            <Button type="submit" className="h-12 rounded-full px-6 font-bold">
              <Save className="h-5 w-5" /> Simpan Perubahan
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

function ProfileSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-4 flex items-center gap-2 text-lg font-black">
        <span className="text-primary">{icon}</span> {title}
      </legend>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  icon,
  readOnly = false,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: ReactNode;
  readOnly?: boolean;
  helperText?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-bold text-foreground/80">
        {icon} {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        readOnly={readOnly}
        aria-readonly={readOnly}
        className={`mt-2 h-12 rounded-2xl border-2 text-base ${
          readOnly ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-background"
        }`}
      />
      {helperText && (
        <span className="mt-1.5 block text-xs font-medium text-muted-foreground">{helperText}</span>
      )}
    </label>
  );
}
