// Treat birthday hanya bisa diklaim pada hari ulang tahun,
// jadi countdown-nya selalu sisa waktu hari ini sampai 23:59:59
export const endOfToday = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
};

// Sisa waktu berformat "HH:MM:SS"; nilai negatif di-nol-kan
export const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

// Akhir hari (23:59:59) ulang tahun pada tahun treat berjalan. birthday_date
// bisa memuat tahun lahir, jadi tahunnya diganti treat_year. Untuk aplikasi
// zona WIB pembacaan tanggal UTC-nya tidak menggeser hari.
export const endOfTreatDay = (birthdayDate: string, treatYear: number) => {
  const date = new Date(birthdayDate);
  // Data tidak terbaca: fallback ke akhir hari ini
  if (Number.isNaN(date.getTime())) return endOfToday();
  date.setFullYear(treatYear);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};
