import { usePageTitle } from "@/hooks/use-page-title";
import { RESET_PASSWORD_WA_TEXT } from "@/lib/whatsapp";
import ActivationMessage from "./ActivationMessage";
import { AuthFooterLink, AuthHeader, AuthTitle } from "./AuthFormParts";

// Reset password customer berjalan lewat WhatsApp: nomor pengirim pesan
// menjadi identitasnya, jadi tidak ada form yang perlu diisi di sini
const CustomerForgotPasswordPage = () => {
  usePageTitle("Lupa Password");

  return (
    <div className="w-full flex-1 px-6 pt-6 pb-8">
      <AuthHeader backTo="/login" backLabel="Kembali ke halaman login" />
      <AuthTitle
        title="Lupa password?"
        description="Kirim pesan di bawah ini lewat WhatsApp dari nomor yang terdaftar di akun kamu, tanpa mengubah isinya. Kami akan membalas dengan tautan untuk membuat password baru."
      />

      <ActivationMessage
        text={RESET_PASSWORD_WA_TEXT}
        sendLabel="Kirim via WhatsApp"
        className="mt-8 gap-6"
      />

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        Tautan dibalas di chat WhatsApp yang sama. Tautannya hanya bisa dipakai
        sekali dan berlaku untuk waktu terbatas.
      </p>

      <div className="mt-6">
        <AuthFooterLink
          text="Sudah ingat password?"
          linkLabel="Masuk"
          to="/login"
        />
      </div>
    </div>
  );
};

export default CustomerForgotPasswordPage;
