import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

type CustomerPageHeaderProps = {
  title: string;
  // Tujuan tombol kembali; default ke beranda
  backTo?: string;
  backLabel?: string;
};

// Judul halaman customer dengan tombol kembali di kiri atas
const CustomerPageHeader = ({
  title,
  backTo = "/",
  backLabel = "Kembali ke beranda",
}: CustomerPageHeaderProps) => {
  return (
    <header className="flex items-center gap-1">
      {/* -ml-2: ikon sejajar tepi konten walau area sentuhnya 40px */}
      <Link
        to={backTo}
        aria-label={backLabel}
        className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-chocolate transition-colors hover:bg-chocolate/5"
      >
        <ArrowLeft size={22} />
      </Link>
      <h1 className="text-lg font-extrabold text-chocolate">{title}</h1>
    </header>
  );
};

export default CustomerPageHeader;
