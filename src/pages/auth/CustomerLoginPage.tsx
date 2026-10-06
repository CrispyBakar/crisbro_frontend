import { useState } from "react";
import type { SubmitEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerLogin } from "@/hooks/use-login";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { usePageTitle } from "@/hooks/use-page-title";
import { useActivationText } from "@/hooks/use-phone-activation";
import { normalizePhone } from "@/lib/phone";
import {
  AuthFooterLink,
  AuthHeader,
  AuthTitle,
  FormAlert,
  PasswordField,
  PhoneField,
  SubmitButton,
} from "./AuthFormParts";
import PhoneActivationDialog from "./PhoneActivationDialog";

type FormField = "phone" | "password";
type FormError = { field: FormField; message: string };

const CustomerLoginPage = () => {
  usePageTitle("Login");

  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [formError, setFormError] = useState<FormError | null>(null);
  const [isActivationOpen, setIsActivationOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useCustomerLogin();
  const activation = useActivationText();
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
    // Backend hanya menerima nomor yang diawali 8 setelah dinormalisasi
    if (!/^8\d{7,12}$/.test(normalizedPhone)) {
      failField(
        "phone",
        "Masukkan nomor telepon yang valid, contoh 8123456789",
      );
      return;
    }
    if (!password) {
      failField("password", "Password wajib diisi");
      return;
    }

    setFormError(null);
    login.mutate(
      { phone: normalizedPhone, password },
      {
        onSuccess: (data) => {
          // Nomor belum diverifikasi: tahan di halaman ini sampai aktivasi
          // lewat WhatsApp selesai
          if (!data.user.phone_verified) {
            setIsActivationOpen(true);
            activation.mutate();
            return;
          }

          queryClient.setQueryData(["auth", "profile"], data.user);
          navigate("/", { replace: true });
        },
      },
    );
  };

  const serverError = !formError && login.isError ? login.error.message : "";

  return (
    <div className="w-full flex-1 px-6 pt-6 pb-8">
      <AuthHeader backTo="/" backLabel="Kembali ke beranda" />
      <AuthTitle
        title="Selamat datang kembali"
        description="Masuk untuk cek poin dan tukar reward kamu."
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 flex flex-col gap-5"
      >
        <PhoneField
          id="phone"
          label="Nomor telepon"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError("phone");
          }}
          placeholder="8123456789"
          hint="Tanpa angka 0 di depan"
          error={errorFor("phone")}
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
          autoComplete="current-password"
          error={errorFor("password")}
        />

        {serverError && <FormAlert message={serverError} />}

        <div className="mt-1 flex flex-col gap-5">
          <SubmitButton pending={login.isPending}>Masuk</SubmitButton>
          <AuthFooterLink
            text="Belum punya akun?"
            linkLabel="Daftar"
            to="/register"
          />
        </div>
      </form>

      {isActivationOpen && (
        <PhoneActivationDialog
          text={activation.data}
          isPreparing={activation.isPending}
          prepareError={
            activation.isError ? activation.error.message : undefined
          }
          onRetry={() => activation.mutate()}
          onClose={() => setIsActivationOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerLoginPage;
