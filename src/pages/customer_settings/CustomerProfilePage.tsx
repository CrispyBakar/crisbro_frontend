import { useState } from "react";
import type { SubmitEvent } from "react";
import { UserRound } from "lucide-react";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import StateMessage from "@/components/StateMessage";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { useUpdateMyCustomer } from "@/hooks/use-customers";
import { usePageTitle } from "@/hooks/use-page-title";
import { normalizePhone } from "@/lib/phone";
import {
  FormAlert,
  PhoneField,
  SubmitButton,
  TextField,
} from "@/pages/auth/AuthFormParts";
import type { CustomerUser } from "@/services/auth";
import type { ParamsUpdateMyCustomer } from "@/services/customers";

type CustomerData = NonNullable<CustomerUser["customer"]>;

const GENDER_OPTIONS = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
] as const;

type Gender = (typeof GENDER_OPTIONS)[number]["value"];

type ProfileValues = {
  name: string;
  email: string;
  // Kosong selama belum dipilih (gender "unknown" di backend)
  gender: Gender | "";
  dob: string; // "YYYY-MM-DD"
  address: string;
  city: string;
  province: string;
  postal_code: string;
};

const TEXT_FIELDS = ["address", "city", "province", "postal_code"] as const;

type FormField = "name" | "email" | "dob" | "postal_code";
type FormError = { field: FormField; message: string };

const sectionTitleClass = "text-xs font-extrabold tracking-wider text-muted";

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const toProfileValues = (
  customer: CustomerData,
  email: string | undefined,
): ProfileValues => ({
  name: customer.name,
  email: email ?? "",
  gender: GENDER_OPTIONS.some((option) => option.value === customer.gender)
    ? (customer.gender as Gender)
    : "",
  dob: customer.dob?.slice(0, 10) ?? "",
  address: customer.address ?? "",
  city: customer.city ?? "",
  province: customer.province ?? "",
  postal_code: customer.postal_code ?? "",
});

// Hanya field yang berubah yang dikirim: nama, alamat, dan jenis kelamin ikut
// disimpan ke Runchise, dan email baru memicu verifikasi email ulang
const buildPayload = (
  values: ProfileValues,
  customer: CustomerData,
  currentEmail: string | undefined,
): ParamsUpdateMyCustomer => {
  const payload: ParamsUpdateMyCustomer = {};

  const name = values.name.trim();
  if (name !== customer.name.trim()) payload.name = name;

  // Email tidak bisa dikosongkan, jadi nilai kosong tidak pernah dikirim
  const email = values.email.trim();
  if (email && email !== currentEmail) payload.email = email;

  if (values.gender && values.gender !== customer.gender) {
    payload.gender = values.gender;
  }

  // dob dikosongkan = hapus tanggal lahir (null)
  if (values.dob !== (customer.dob?.slice(0, 10) ?? "")) {
    payload.dob = values.dob || null;
  }

  for (const field of TEXT_FIELDS) {
    const value = values[field].trim();
    if (value !== (customer[field] ?? "").trim()) payload[field] = value;
  }

  return payload;
};

const ProfileForm = ({
  user,
  customer,
}: {
  user: CustomerUser;
  customer: CustomerData;
}) => {
  const [values, setValues] = useState<ProfileValues>(() =>
    toProfileValues(customer, user.email),
  );
  const [formError, setFormError] = useState<FormError | null>(null);
  const [today] = useState<string>(() => toDateInputValue(new Date()));

  const update = useUpdateMyCustomer();

  const payload = buildPayload(values, customer, user.email);
  // Email yang dikosongkan tidak masuk payload, tapi tombol simpan tetap aktif
  // supaya pesan "wajib diisi" muncul saat ditekan
  const isEmailCleared = !values.email.trim() && Boolean(user.email);
  const hasChanges = Object.keys(payload).length > 0 || isEmailCleared;

  const errorFor = (field: FormField) =>
    formError?.field === field ? formError.message : undefined;

  const failField = (field: FormField, message: string) => {
    setFormError({ field, message });
    document.getElementById(field)?.focus();
  };

  const setValue = <Key extends keyof ProfileValues>(
    field: Key,
    value: ProfileValues[Key],
  ) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    // Pesan error hilang begitu field yang bermasalah diubah
    if (formError?.field === field) setFormError(null);
    // Hasil simpan sebelumnya tidak berlaku lagi untuk isi form yang baru
    if (update.isSuccess || update.isError) update.reset();
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (payload.name === "") {
      failField("name", "Nama lengkap wajib diisi");
      return;
    }
    if (isEmailCleared) {
      failField("email", "Email wajib diisi");
      return;
    }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      failField("email", "Format email tidak valid");
      return;
    }
    if (payload.dob && payload.dob > today) {
      failField("dob", "Tanggal lahir tidak boleh melewati hari ini");
      return;
    }
    if (payload.postal_code && !/^\d{5}$/.test(payload.postal_code)) {
      failField("postal_code", "Kode pos terdiri dari 5 angka");
      return;
    }

    setFormError(null);
    update.mutate(payload);
  };

  const serverError = !formError && update.isError ? update.error.message : "";
  const successMessage = update.variables?.email
    ? "Profil berhasil diperbarui. Cek email baru kamu untuk verifikasi."
    : "Profil berhasil diperbarui.";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <h2 className={sectionTitleClass}>DATA DIRI</h2>

        <TextField
          id="name"
          label="Nama lengkap"
          value={values.name}
          onChange={(e) => setValue("name", e.target.value)}
          type="text"
          autoComplete="name"
          error={errorFor("name")}
        />

        <PhoneField
          id="phone"
          label="Nomor telepon"
          value={normalizePhone(user.phone ?? "")}
          disabled
          hint="Nomor telepon tidak bisa diubah di halaman ini."
        />

        <TextField
          id="email"
          label="Email"
          value={values.email}
          onChange={(e) => setValue("email", e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errorFor("email")}
        />

        <fieldset>
          <legend className="block text-sm font-semibold text-chocolate">
            Jenis kelamin
          </legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((option) => {
              const isSelected = values.gender === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex h-12 cursor-pointer items-center justify-center rounded-xl border bg-white text-base text-chocolate transition-colors has-focus-visible:ring-3 has-focus-visible:ring-border/50 ${
                    isSelected
                      ? "border-chocolate font-bold inset-ring inset-ring-chocolate"
                      : "border-chocolate/15 font-medium"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setValue("gender", option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <TextField
          id="dob"
          label="Tanggal lahir"
          value={values.dob}
          onChange={(e) => setValue("dob", e.target.value)}
          type="date"
          max={today}
          autoComplete="bday"
          error={errorFor("dob")}
        />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className={sectionTitleClass}>
          ALAMAT <span className="font-semibold">· OPSIONAL</span>
        </h2>

        <TextField
          id="address"
          label="Alamat"
          value={values.address}
          onChange={(e) => setValue("address", e.target.value)}
          type="text"
          autoComplete="street-address"
        />

        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          <TextField
            id="city"
            label="Kota"
            value={values.city}
            onChange={(e) => setValue("city", e.target.value)}
            type="text"
            autoComplete="address-level2"
          />

          <TextField
            id="province"
            label="Provinsi"
            value={values.province}
            onChange={(e) => setValue("province", e.target.value)}
            type="text"
            autoComplete="address-level1"
          />

          <TextField
            id="postal_code"
            label="Kode pos"
            value={values.postal_code}
            onChange={(e) => setValue("postal_code", e.target.value)}
            type="text"
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
            error={errorFor("postal_code")}
          />
        </div>
      </section>

      <div className="flex flex-col gap-5">
        {serverError && <FormAlert message={serverError} />}
        {update.isSuccess && (
          <FormAlert tone="success" message={successMessage} />
        )}

        <SubmitButton pending={update.isPending} disabled={!hasChanges}>
          Simpan perubahan
        </SubmitButton>
      </div>
    </form>
  );
};

const CustomerProfilePage = () => {
  usePageTitle("My Profile");

  const { data: user } = useCustomerProfile();

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader
        title="My Profile"
        backTo="/settings"
        backLabel="Kembali ke Settings"
      />
      <div className="mt-5">
        {user?.customer ? (
          <ProfileForm user={user} customer={user.customer} />
        ) : (
          <StateMessage
            icon={UserRound}
            title="Data member belum tersedia"
            description="Akun kamu belum terhubung dengan data member. Hubungi admin Crisbar untuk bantuan."
          />
        )}
      </div>
    </div>
  );
};

export default CustomerProfilePage;
