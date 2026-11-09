import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimBirthdayTreat,
  getPromoInformation,
  isHasBirthdayTreat,
} from "@/services/birthday";
import type { ClaimBirthdayTreatPayload } from "@/services/birthday";

export const useBirthdayTreatCheck = () => {
  return useQuery({
    queryFn: isHasBirthdayTreat,
    queryKey: ["birthday-treat-check"],
  });
};

// Klaim birthday treat; setelah berhasil status treat berubah jadi claimed
// dan voucher barunya muncul di Voucherku
export const useClaimBirthdayTreat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClaimBirthdayTreatPayload) =>
      claimBirthdayTreat(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["birthday-treat-check"] });
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
    onError: () => {
      // Klaim ditolak berarti status treat di layar sudah usang (mis. keduluan
      // kadaluarsa); muat ulang supaya alasannya tampil
      queryClient.invalidateQueries({ queryKey: ["birthday-treat-check"] });
    },
  });
};

// Mengambil promo information (terms and conditions)
export const useBirthdayPromoInformation = (promoCodeId: string) => {
  return useQuery({
    queryFn: () => getPromoInformation(promoCodeId),
    queryKey: ["birthday-promo-information", promoCodeId],
  });
};
