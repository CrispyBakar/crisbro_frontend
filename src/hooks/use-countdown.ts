import { useEffect, useState } from "react";
import { endOfToday, endOfTreatDay } from "@/lib/countdown";
import type { BirthdayTreat } from "@/services/birthday";

// Sisa waktu klaim birthday treat (ms), diperbarui setiap detik.
// Target dihitung dari data treat (birthday_date + treat_year) hasil
// useBirthdayTreatCheck; tanpa treat (mis. masih dimuat) fallback akhir hari ini.
export const useBirthdayTreatCountdown = (treat: BirthdayTreat["treat"]) => {
  const target = treat
    ? endOfTreatDay(treat.birthday_date, treat.treat_year)
    : endOfToday();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return target - now;
};
