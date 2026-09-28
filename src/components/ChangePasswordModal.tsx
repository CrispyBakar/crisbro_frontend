import { useEffect, useState } from "react";
import { CircleCheck, Eye, EyeOff, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useChangePassword } from "@/hooks/use-change-password";

type ChangePasswordModalProps = {
  onClose: () => void;
};

const FORM_FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white p-2.5 pr-10 text-sm font-normal text-chocolate outline-none focus:border-gray-400";

const MIN_PASSWORD_LENGTH = 8;

const PasswordField = ({
  label,
  value,
  onChange,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  autoComplete: string;
}) => {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-chocolate">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          className={FORM_FIELD_CLASS}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-black cursor-pointer"
        >
          <Icon size={16} />
        </button>
      </div>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
};

const ChangePasswordModal = ({ onClose }: ChangePasswordModalProps) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, error } = useChangePassword();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [validationError, setValidationError] = useState("");

  const setField = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Sesi sudah dicabut backend — kosongkan cache /me agar ProtectedRoute redirect ke login
  const handleRelogin = () => {
    queryClient.setQueryData(["auth", "me"], null);
  };

  const handleClose = isSuccess ? handleRelogin : onClose;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleClose, isPending]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.new_password.trim().length < MIN_PASSWORD_LENGTH) {
      setValidationError(
        `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`,
      );
      return;
    }
    if (form.new_password === form.current_password) {
      setValidationError("Password baru harus berbeda dari password lama");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setValidationError("Konfirmasi password tidak sama");
      return;
    }

    setValidationError("");
    mutate({
      current_password: form.current_password,
      new_password: form.new_password,
    });
  };

  const errorMessage = validationError || error?.message;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ganti Password"
      className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/45"
      onClick={() => !isPending && handleClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-black text-xl">Ganti Password</h3>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-black cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <CircleCheck size={48} className="text-success" />
            <p className="font-semibold text-chocolate">
              Password berhasil diganti
            </p>
            <p className="text-sm text-gray-500">
              Demi keamanan, semua sesi telah diakhiri. Silakan login ulang
              dengan password baru.
            </p>
            <button
              onClick={handleRelogin}
              className="mt-2 cursor-pointer rounded-3xl bg-orange py-2 px-6 text-sm font-semibold text-white shadow-sm shadow-amber-600 active:bg-orange-500"
            >
              Login ulang
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 px-6 py-5">
              <PasswordField
                label="Password lama"
                value={form.current_password}
                onChange={setField("current_password")}
                autoComplete="current-password"
              />
              <PasswordField
                label="Password baru"
                value={form.new_password}
                onChange={setField("new_password")}
                autoComplete="new-password"
                hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter.`}
              />
              <PasswordField
                label="Konfirmasi password baru"
                value={form.confirm_password}
                onChange={setField("confirm_password")}
                autoComplete="new-password"
              />
              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
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
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
