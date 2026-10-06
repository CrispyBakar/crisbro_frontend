import { useEffect, useRef } from "react";
import { LoaderCircle, Smartphone, X } from "lucide-react";
import { useConfirmActivation } from "@/hooks/use-phone-activation";
import ActivationMessage from "./ActivationMessage";
import { FormAlert } from "./AuthFormParts";

type PhoneActivationDialogProps = {
  // Teks aktivasi dari backend; kosong selama masih disiapkan
  text?: string;
  isPreparing: boolean;
  prepareError?: string;
  onRetry: () => void;
  onClose: () => void;
};

const secondaryButtonClass =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-chocolate/20 bg-white text-base font-bold text-chocolate transition-colors hover:bg-chocolate/5 disabled:cursor-not-allowed disabled:opacity-60";

// Muncul setelah login berhasil tapi nomor belum diverifikasi lewat WhatsApp
const PhoneActivationDialog = ({
  text,
  isPreparing,
  prepareError,
  onRetry,
  onClose,
}: PhoneActivationDialogProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const confirm = useConfirmActivation();

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-activation-title"
        tabIndex={-1}
        className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-xl bg-white px-6 pt-8 pb-6 text-center outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-chocolate/5"
        >
          <X size={20} />
        </button>

        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sunshine-yellow text-chocolate">
          <Smartphone size={26} />
        </span>
        <h2
          id="phone-activation-title"
          className="mt-4 text-xl font-extrabold leading-tight text-chocolate"
        >
          Aktivasi nomor kamu dulu
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Nomor kamu belum diverifikasi. Kirim pesan di bawah ini lewat WhatsApp
          dari nomor yang kamu daftarkan, tanpa mengubah isinya.
        </p>

        {isPreparing && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
            <LoaderCircle size={18} className="animate-spin" />
            Menyiapkan pesan aktivasi...
          </p>
        )}

        {prepareError && (
          <div className="mt-5 flex flex-col gap-4 text-left">
            <FormAlert message={prepareError} />
            <button
              type="button"
              onClick={onRetry}
              className={secondaryButtonClass}
            >
              Coba lagi
            </button>
          </div>
        )}

        {text && !isPreparing && !prepareError && (
          <>
            <ActivationMessage
              text={text}
              sendLabel="Verifikasi via WhatsApp"
              className="mt-5 gap-4"
            />
            <button
              type="button"
              onClick={() => confirm.mutate()}
              disabled={confirm.isPending}
              className={`mt-3 ${secondaryButtonClass}`}
            >
              {confirm.isPending && (
                <LoaderCircle size={18} className="animate-spin" />
              )}
              {confirm.isPending ? "Memeriksa..." : "Saya sudah verifikasi"}
            </button>
            {confirm.isError && (
              <p role="alert" className="mt-3 text-xs text-berry-red">
                {confirm.error.message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneActivationDialog;
