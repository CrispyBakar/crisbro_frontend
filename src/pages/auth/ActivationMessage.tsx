import { useState } from "react";
import { Check } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { activationWaUrl } from "@/lib/whatsapp";

type ActivationMessageProps = {
  text: string;
  sendLabel: string;
  // Jarak atas dan jarak antar elemen, contoh "mt-6 gap-6"
  className?: string;
};

// Kotak pesan untuk bot WhatsApp (aktivasi atau reset password) + tombol kirim.
// Bila nomor bot belum dikonfigurasi, tombol kirim diganti tombol salin pesan.
const ActivationMessage = ({
  text,
  sendLabel,
  className = "",
}: ActivationMessageProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const waUrl = activationWaUrl(text);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <p className="rounded-xl border border-chocolate/15 bg-white px-4 py-3.5 text-left text-sm font-medium leading-relaxed whitespace-pre-line text-chocolate">
        {text}
      </p>

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-success text-base font-bold text-white transition-colors hover:bg-success/90"
        >
          <img src={whatsappIcon} alt="" className="h-5 w-5" />
          {sendLabel}
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
  );
};

export default ActivationMessage;
