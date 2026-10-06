import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import CustomerPageHeader from "@/components/CustomerPageHeader";
import { useChangePassword } from "@/hooks/use-change-password";
import { usePageTitle } from "@/hooks/use-page-title";
import { isPasswordValid } from "@/lib/password";
import {
  FormAlert,
  PasswordField,
  PasswordRuleList,
  SubmitButton,
} from "@/pages/auth/AuthFormParts";

type FormField = "current_password" | "new_password" | "confirm_password";
type FormError = { field: FormField; message: string };

const CustomerChangePasswordPage = () => {
  usePageTitle("Change Password");

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [formError, setFormError] = useState<FormError | null>(null);

  const queryClient = useQueryClient();
  const changePassword = useChangePassword();
  const isChanged = changePassword.isSuccess;

  // Backend mencabut semua sesi begitu password diganti. Cache sesi
  // dikosongkan saat halaman ditinggalkan supaya halaman lain tidak
  // menampilkan user sebagai masih login.
  useEffect(() => {
    if (!isChanged) return;
    return () => {
      queryClient.setQueryData(["auth", "profile"], null);
    };
  }, [isChanged, queryClient]);

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

    if (!currentPassword) {
      failField("current_password", "Password lama wajib diisi");
      return;
    }
    if (!isPasswordValid(newPassword)) {
      failField("new_password", "Password baru belum memenuhi syarat di bawah");
      return;
    }
    if (newPassword === currentPassword) {
      failField(
        "new_password",
        "Password baru harus berbeda dari password lama",
      );
      return;
    }
    if (confirmPassword !== newPassword) {
      failField("confirm_password", "Konfirmasi password tidak sama");
      return;
    }

    setFormError(null);
    changePassword.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const serverError =
    !formError && changePassword.isError ? changePassword.error.message : "";

  if (isChanged) {
    return (
      <div className="flex w-full flex-col px-4 pt-3">
        <span className="mt-10 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={24} strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-[1.75rem] font-extrabold leading-tight tracking-tight text-chocolate">
          Password berhasil diganti
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Demi keamanan, akun kamu keluar dari semua perangkat. Masuk lagi
          dengan password baru.
        </p>

        {/* Sesi dikosongkan, lalu CustomerRoute mengarahkan ke halaman login */}
        <button
          type="button"
          onClick={() => queryClient.setQueryData(["auth", "profile"], null)}
          className="mt-8 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-berry-red text-base font-bold text-white transition-colors hover:bg-berry-red/90"
        >
          Masuk ulang
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col px-4 pt-3">
      <CustomerPageHeader
        title="Change Password"
        backTo="/settings"
        backLabel="Kembali ke Settings"
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 flex flex-col gap-5"
      >
        <PasswordField
          id="current_password"
          label="Password lama"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            clearError("current_password");
          }}
          autoComplete="current-password"
          error={errorFor("current_password")}
        />

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

        <div className="mt-1 flex flex-col gap-3">
          <SubmitButton pending={changePassword.isPending}>
            Ganti password
          </SubmitButton>
          <p className="text-center text-xs text-muted">
            Setelah diganti, kamu perlu masuk lagi di semua perangkat.
          </p>
        </div>
      </form>
    </div>
  );
};

export default CustomerChangePasswordPage;
