import { useState } from "react";
import type { SubmitEvent } from "react";
import { Navigate } from "react-router";
import { Check } from "lucide-react";
import { useCustomerRegister } from "@/hooks/use-register";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { usePageTitle } from "@/hooks/use-page-title";
import { isPasswordValid } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";
import {
  AuthFooterLink,
  AuthHeader,
  AuthTitle,
  Field,
  FormAlert,
  PasswordField,
  PasswordRuleList,
  PhoneField,
  SubmitButton,
  TextField,
} from "./AuthFormParts";
import ActivationMessage from "./ActivationMessage";
import OutletSelect from "./OutletSelect";
import type { SelectedOutlet } from "./OutletSelect";

type FormField = "name" | "phone" | "email" | "password" | "outlet";
type FormError = { field: FormField; message: string };

const CustomerRegisterPage = () => {
  usePageTitle("Daftar");

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [outlet, setOutlet] = useState<SelectedOutlet | null>(null);
  const [formError, setFormError] = useState<FormError | null>(null);

  const register = useCustomerRegister();
  const { data: user } = useCustomerProfile();

  // Sudah login — tidak perlu melihat halaman ini lagi
  if (user) return <Navigate to="/" replace />;

  const errorFor = (field: FormField) =>
    formError?.field === field ? formError.message : undefined;

  // Pesan error hilang begitu field yang bermasalah diubah
  const clearError = (field: FormField) => {
    if (formError?.field === field) setFormError(null);
  };

  const failField = (field: FormField, message: string) => {
    setFormError({ field, message });
    document.getElementById(field)?.focus();
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedPhone = normalizePhone(phone);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      failField("name", "Nama lengkap wajib diisi");
      return;
    }
    // Backend: 11–15 digit, diawali 8, tanpa 0 / 62 di depan
    if (!/^8\d{10,14}$/.test(normalizedPhone)) {
      failField(
        "phone",
        "Masukkan nomor telepon yang valid (minimal 11 digit), contoh 81234567890",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      failField("email", "Format email tidak valid");
      return;
    }
    if (!isPasswordValid(password)) {
      failField("password", "Password belum memenuhi syarat di bawah");
      return;
    }
    if (!outlet) {
      failField("outlet", "Pilih outlet terdekat dari daftar");
      return;
    }

    setFormError(null);
    register.mutate({
      name: trimmedName,
      phone: normalizedPhone,
      // Backend mewajibkan username unik; form tidak memintanya, jadi dipakai nomor telepon
      username: normalizedPhone,
      email: trimmedEmail,
      password,
      location_id: outlet.id,
      ...(referralCode.trim() ? { referral_code: referralCode.trim() } : {}),
    });
  };

  const serverError =
    !formError && register.isError ? register.error.message : "";
  const activationText = register.data?.data.text;

  if (activationText) {
    // Akun dibuat, tapi nomor baru aktif setelah pesan ini dikirim lewat WhatsApp
    return (
      <div className="w-full flex-1 px-6 pt-6 pb-8">
        <AuthHeader backTo="/login" backLabel="Kembali ke halaman login" />

        <span className="mt-10 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={24} strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-[1.75rem] font-extrabold leading-tight tracking-tight text-chocolate">
          Akun berhasil dibuat
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Satu langkah lagi: kirim pesan aktivasi di bawah ini lewat WhatsApp
          dari nomor yang kamu daftarkan, tanpa mengubah isinya.
        </p>

        <ActivationMessage
          text={activationText}
          sendLabel="Kirim aktivasi ke WhatsApp"
          className="mt-6 gap-6"
        />

        <div className="mt-6">
          <AuthFooterLink
            text="Sudah kirim pesan aktivasi?"
            linkLabel="Masuk"
            to="/login"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 pt-6 pb-8">
      <AuthHeader backTo="/login" backLabel="Kembali ke halaman login" />
      <AuthTitle
        title="Gabung Crisbro Member"
        description="Kumpulkan poin dari setiap pembelian dan tukar dengan reward Crisbar."
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 flex flex-col gap-5"
      >
        <TextField
          id="name"
          label="Nama lengkap"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          type="text"
          autoComplete="name"
          error={errorFor("name")}
        />

        <PhoneField
          id="phone"
          label="Nomor telepon"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError("phone");
          }}
          placeholder="81234567890"
          hint="Tanpa angka 0 di depan. Nomor ini dipakai untuk aktivasi lewat WhatsApp."
          error={errorFor("phone")}
        />

        <TextField
          id="email"
          label="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errorFor("email")}
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
          autoComplete="new-password"
          error={errorFor("password")}
          hint={<PasswordRuleList password={password} />}
        />

        <Field id="outlet" label="Outlet terdekat" error={errorFor("outlet")}>
          <OutletSelect
            id="outlet"
            value={outlet}
            onChange={(selected) => {
              setOutlet(selected);
              clearError("outlet");
            }}
            invalid={Boolean(errorFor("outlet"))}
          />
        </Field>

        <TextField
          id="referral"
          label="Kode referral"
          optional
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          hint="Isi kalau kamu punya kode dari teman."
        />

        {serverError && <FormAlert message={serverError} />}

        <div className="mt-1 flex flex-col gap-5">
          <SubmitButton pending={register.isPending}>Daftar</SubmitButton>
          <AuthFooterLink
            text="Sudah punya akun?"
            linkLabel="Masuk"
            to="/login"
          />
        </div>
      </form>
    </div>
  );
};

export default CustomerRegisterPage;
