import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { useCreateMyCustomerAcquisition } from "@/hooks/use-customer-acquisitions";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import {
  ACQUISITION_CAPTURED_VIA,
  ACQUISITION_OTHER,
  ACQUISITION_OTHER_MAX_LENGTH,
  ACQUISITION_SOURCES,
  isAcquisitionPromptDue,
  markAcquisitionPromptShown,
  toAcquisitionSource,
} from "@/lib/acquisition-prompt";
import { fieldBoxClass, fieldInputClass } from "@/pages/auth/fieldStyles";
import type { CreateMyCustomerAcquisitionPayload } from "@/services/customer-acquisitions";

// Ucapan terima kasih setelah jawaban tersimpan
const AcquisitionThanks = ({ onClose }: { onClose: () => void }) => {
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="acquisition-thanks-title"
        className="w-full max-w-sm rounded-xl bg-white px-6 pt-8 pb-6 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={26} strokeWidth={2.5} />
        </span>
        <h2
          id="acquisition-thanks-title"
          className="mt-4 text-xl font-extrabold leading-tight text-chocolate"
        >
          Terima kasih!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Jawaban kamu sudah kami terima dan sangat berarti buat Crisbar.
        </p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-berry-red text-base font-bold text-white transition-colors hover:bg-berry-red/90"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

type AcquisitionDialogProps = {
  userId: string;
  isPending: boolean;
  error?: string;
  onSubmit: (payload: CreateMyCustomerAcquisitionPayload) => void;
};

const AcquisitionDialog = ({
  userId,
  isPending,
  error,
  onSubmit,
}: AcquisitionDialogProps) => {
  // Dihitung sekali saat aplikasi dibuka: pencatatan waktu tampil di bawah
  // tidak boleh ikut menutup modal yang sedang terbuka
  const [isOpen, setIsOpen] = useState<boolean>(() =>
    isAcquisitionPromptDue(userId),
  );
  const [choice, setChoice] = useState<string>("");
  const [otherText, setOtherText] = useState<string>("");

  // Dicatat saat tampil, bukan saat ditutup: customer yang langsung menutup
  // browser tanpa menjawab tetap baru ditanya lagi 3 hari kemudian
  useEffect(() => {
    if (isOpen) markAcquisitionPromptShown(userId);
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isPending]);

  if (!isOpen) return null;

  const isOther = choice === ACQUISITION_OTHER;
  const canSubmit = Boolean(choice) && (!isOther || otherText.trim() !== "");
  const close = () => {
    if (!isPending) setIsOpen(false);
  };

  // Setelah tersimpan, AcquisitionPrompt mengganti dialog ini dengan ucapan
  // terima kasih
  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      source: toAcquisitionSource(choice, otherText),
      captured_via: ACQUISITION_CAPTURED_VIA,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={close}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="acquisition-prompt-title"
        onSubmit={handleSubmit}
        noValidate
        className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-xl bg-white px-6 pt-8 pb-6 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Tutup"
          className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-chocolate/5"
        >
          <X size={20} />
        </button>

        <h2
          id="acquisition-prompt-title"
          className="mt-4 text-xl font-extrabold leading-tight text-chocolate"
        >
          Kamu tahu Crisbar dari mana?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Satu jawaban singkat dari kamu membantu kami jadi lebih baik.
        </p>

        <fieldset className="mt-5 grid grid-cols-2 gap-2">
          <legend className="sr-only">Pilih satu jawaban</legend>
          {[...ACQUISITION_SOURCES, ACQUISITION_OTHER].map((option) => (
            <label
              key={option}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors has-focus-visible:ring-3 has-focus-visible:ring-berry-red/15 ${
                option === ACQUISITION_OTHER ? "col-span-2" : ""
              } ${
                choice === option
                  ? "border-berry-red bg-berry-red/5 text-berry-red"
                  : "border-chocolate/15 bg-white text-chocolate hover:bg-chocolate/5"
              }`}
            >
              <input
                type="radio"
                name="acquisition-source"
                value={option}
                checked={choice === option}
                onChange={() => setChoice(option)}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </fieldset>

        {isOther && (
          <div className={`mt-2 ${fieldBoxClass()}`}>
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              maxLength={ACQUISITION_OTHER_MAX_LENGTH}
              placeholder="Tulis jawaban kamu"
              aria-label="Jawaban lainnya"
              autoFocus
              className={fieldInputClass}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-berry-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-berry-red text-base font-bold text-white transition-colors hover:bg-berry-red/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <LoaderCircle size={18} className="animate-spin" />}
          {isPending ? "Menyimpan..." : "Kirim jawaban"}
        </button>
        <button
          type="button"
          onClick={close}
          disabled={isPending}
          className="mt-2 flex h-11 w-full cursor-pointer items-center justify-center rounded-full text-sm font-bold text-muted transition-colors hover:bg-chocolate/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Nanti saja
        </button>
      </form>
    </div>
  );
};

// Pertanyaan "tahu Crisbar dari mana" untuk customer yang belum pernah
// menjawab. Muncul saat aplikasi dibuka; bila dilewati, baru muncul lagi
// setelah 3 hari.
const AcquisitionPrompt = () => {
  const { data: user } = useCustomerProfile();
  const submit = useCreateMyCustomerAcquisition();
  const [isThanksClosed, setIsThanksClosed] = useState<boolean>(false);

  // Dicek paling awal: begitu jawaban tersimpan, has_acquisition di sesi
  // langsung berubah, tapi ucapan terima kasih harus tetap sempat tampil
  if (submit.isSuccess) {
    return isThanksClosed ? null : (
      <AcquisitionThanks onClose={() => setIsThanksClosed(true)} />
    );
  }

  // has_acquisition kosong berarti backend tidak mengirim penandanya, jadi
  // jangan menebak bahwa customer belum menjawab
  if (!user || user.customer?.has_acquisition !== false) return null;

  return (
    <AcquisitionDialog
      // key: akun lain yang login di perangkat yang sama dihitung ulang dari awal
      key={user.user_id}
      userId={user.user_id}
      isPending={submit.isPending}
      error={submit.error?.message}
      onSubmit={submit.mutate}
    />
  );
};

export default AcquisitionPrompt;
