import { useState } from "react";
import type { SubmitEvent } from "react";
import { useSearchParams } from "react-router";
import { Check, Link2Off } from "lucide-react";
import { useResetPassword } from "@/hooks/use-reset-password";
import { usePageTitle } from "@/hooks/use-page-title";
import { isPasswordValid } from "@/lib/password";
import {
  AuthFooterLink,
  AuthHeader,
  AuthStatus,
  AuthTitle,
  ButtonLink,
  FormAlert,
  PasswordField,
  PasswordRuleList,
  SubmitButton,
} from "./AuthFormParts";

type FormField = "new_password" | "confirm_password";
type FormError = { field: FormField; message: string };

const CustomerResetPasswordPage = () => {
  usePageTitle("Reset Password");

  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [formError, setFormError] = useState<FormError | null>(null);

  // Tautan dari balasan bot WhatsApp: /reset-password?token=...
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const reset = useResetPassword();

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

    if (!isPasswordValid(newPassword)) {
      failField("new_password", "Password baru belum memenuhi syarat di bawah");
      return;
    }
    if (confirmPassword !== newPassword) {
      failField("confirm_password", "Konfirmasi password tidak sama");
      return;
    }

    setFormError(null);
    reset.mutate({ token, new_password: newPassword });
  };

  const serverError = !formError && reset.isError ? reset.error.message : "";

  if (reset.isSuccess) {
    return (
      <div className="w-full flex-1 px-6 pt-6 pb-8">
        <AuthHeader backTo="/login" backLabel="Kembali ke halaman login" />
        <AuthStatus
          icon={Check}
          title="Password berhasil direset"
          description="Demi keamanan, akun kamu keluar dari semua perangkat. Masuk lagi dengan password baru."
        />

        <div className="mt-8">
          <ButtonLink to="/login">Masuk</ButtonLink>
        </div>
      </div>
    );
  }

  if (!token) {
    // Halaman dibuka tanpa lewat tautan reset, atau tautannya terpotong
    return (
      <div className="w-full flex-1 px-6 pt-6 pb-8">
        <AuthHeader backTo="/login" backLabel="Kembali ke halaman login" />
        <AuthStatus
          icon={Link2Off}
          tone="error"
          title="Tautan tidak valid"
          description="Buka halaman ini lewat tautan reset password yang kami kirim lewat WhatsApp. Kalau tautannya tidak bisa dipakai, minta tautan yang baru."
        />

        <div className="mt-8">
          <ButtonLink to="/forgot-password">Minta tautan baru</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 pt-6 pb-8">
      <AuthHeader backTo="/login" backLabel="Kembali ke halaman login" />
      <AuthTitle
        title="Buat password baru"
        description="Password baru ini dipakai untuk masuk ke akun kamu."
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 flex flex-col gap-5"
      >
        <PasswordField
          id="new_password"
          label="Password baru"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            clearError("new_password");
          }}
          autoComplete="new-password"
          error={errorFor("new_password")}
          hint={<PasswordRuleList password={newPassword} />}
        />

        <PasswordField
          id="confirm_password"
          label="Konfirmasi password baru"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearError("confirm_password");
          }}
          autoComplete="new-password"
          error={errorFor("confirm_password")}
        />

        {serverError && <FormAlert message={serverError} />}

        <div className="mt-1 flex flex-col gap-5">
          <SubmitButton pending={reset.isPending}>Simpan password</SubmitButton>
          <AuthFooterLink
            text="Tautan sudah kedaluwarsa?"
            linkLabel="Minta tautan baru"
            to="/forgot-password"
          />
        </div>
      </form>
    </div>
  );
};

export default CustomerResetPasswordPage;
