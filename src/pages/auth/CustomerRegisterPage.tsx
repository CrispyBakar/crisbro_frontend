import { useState } from "react";
import type { SubmitEvent } from "react";
import { Navigate } from "react-router";
import { Check, Circle, CircleCheck } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { useCustomerRegister } from "@/hooks/use-register";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { usePageTitle } from "@/hooks/use-page-title";
import { normalizePhone } from "@/lib/phone";
import {
  AuthFooterLink,
  AuthHeader,
  AuthTitle,
  Field,
  FormAlert,
  PasswordField,
  PhoneField,
  SubmitButton,
  TextField,
} from "./AuthFormParts";
import OutletSelect from "./OutletSelect";
import type { SelectedOutlet } from "./OutletSelect";

// Nomor WhatsApp bot aktivasi Crisbro (format 62xxx); bila kosong, tombol kirim diganti tombol salin pesan
const ACTIVATION_WA_NUMBER: string | undefined = import.meta.env
  .VITE_ACTIVATION_WA_NUMBER;

// Aturan password backend: minimal 8 karakter, ada huruf besar dan angka
const passwordRules = [
  { label: "Minimal 8 karakter", test: (value: string) => value.length >= 8 },
  { label: "Huruf besar", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Angka", test: (value: string) => /[0-9]/.test(value) },
];

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
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
    if (!passwordRules.every((rule) => rule.test(password))) {
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

  const handleCopy = async () => {
    if (!activationText) return;
    await navigator.clipboard.writeText(activationText);
    setIsCopied(true);
  };

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

        <p className="mt-6 rounded-xl border border-chocolate/15 bg-white px-4 py-3.5 text-sm font-medium leading-relaxed whitespace-pre-line text-chocolate">
          {activationText}
        </p>

        <div className="mt-6">
          {ACTIVATION_WA_NUMBER ? (
            <a
              href={`https://wa.me/${ACTIVATION_WA_NUMBER}?text=${encodeURIComponent(activationText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-success text-base font-bold text-white transition-colors hover:bg-success/90"
            >
              <img src={whatsappIcon} alt="" className="h-5 w-5" />
              Kirim aktivasi ke WhatsApp
            </a>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-chocolate/20 bg-white text-base font-bold text-chocolate transition-colors hover:bg-chocolate/5"
            >
              {isCopied && <Check size={18} className="text-success" />}
              {isCopied ? "Pesan tersalin" : "Salin pesan"}
            </button>
          )}
        </div>

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
          hint={
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {passwordRules.map((rule) => {
                const isMet = rule.test(password);
                const Icon = isMet ? CircleCheck : Circle;
                return (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 ${isMet ? "text-success" : ""}`}
                  >
                    <Icon size={14} className="shrink-0" />
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          }
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
