import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomerProfile, requestActivationText } from "@/services/auth";

export const useActivationText = () => {
  return useMutation({
    mutationFn: requestActivationText,
  });
};

// Cek ulang ke /profile, yang baru bisa diakses setelah nomor terverifikasi
export const useConfirmActivation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const user = await getCustomerProfile();
      if (!user) {
        throw new Error(
          "Nomor kamu belum terverifikasi. Kirim pesan aktivasinya dulu, lalu coba lagi.",
        );
      }
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "profile"], user);
    },
  });
};
