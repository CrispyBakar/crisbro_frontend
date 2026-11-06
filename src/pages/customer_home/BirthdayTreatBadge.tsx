import { Cake } from "lucide-react";
import { useNavigate } from "react-router";
import Draggable from "@/components/Draggable";
import { useBirthdayTreatCheck } from "@/hooks/use-birthday";
import { useBirthdayTreatCountdown } from "@/hooks/use-countdown";
import { formatCountdown } from "@/lib/countdown";

// Badge melayang ulang tahun; countdown dihitung dari data treat
// (useBirthdayTreatCheck). Bisa digeser, tetap di area mobile; tap membuka
// halaman klaim birthday treat.
const BirthdayTreatBadge = () => {
  const navigate = useNavigate();
  const { data: birthdayTreat } = useBirthdayTreatCheck();
  const remaining = useBirthdayTreatCountdown(birthdayTreat?.treat ?? null);

  return (
    <Draggable
      bounds="main"
      placement="middle-left"
      className="z-50"
      onTap={() => navigate("/birthday-treat/claim")}
    >
      <div className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full bg-red-600 text-white shadow-lg">
        <Cake size={14} className="shrink-0" />
        <span className="text-[10px] font-extrabold leading-none tabular-nums">
          {formatCountdown(remaining)}
        </span>
      </div>
    </Draggable>
  );
};

export default BirthdayTreatBadge;
