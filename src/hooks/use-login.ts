import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginAdmin, loginCustomer, logout } from "@/services/auth";
import type {
  AdminLoginPayload,
  CustomerLoginPayload,
} from "@/services/auth";

interface UseLoginProps {
  setError?: (value: string) => void;
}

export const useLogin = ({ setError }: UseLoginProps) => {
  return useMutation({
    mutationFn: (payload: AdminLoginPayload) => loginAdmin(payload),
    onError: (error) => {
      setError?.(error.message as string);
      console.error(error.message);
    },
  });
};

export const useCustomerLogin = () => {
  return useMutation({
    mutationFn: async (payload: CustomerLoginPayload) => {
      const data = await loginCustomer(payload);

      // Akun yang nomornya belum diverifikasi juga berstatus inactive, tapi itu
      // ditangani lewat popup aktivasi. Yang ditolak di sini hanya akun yang
      // sudah terverifikasi lalu dinonaktifkan.
      if (data.user.phone_verified && data.user.status === "inactive") {
        // Backend tetap membuat sesi untuk akun nonaktif, jadi dicabut lagi
        await logout().catch(() => undefined);
        throw new Error(
          "Akun kamu sedang tidak aktif. Hubungi admin Crisbar untuk mengaktifkannya kembali.",
        );
      }

      return data;
    },
  });
};

export const useCustomerLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    // Sesi dikosongkan, lalu CustomerRoute mengarahkan ke halaman login
    onSuccess: () => {
      queryClient.setQueryData(["auth", "profile"], null);
    },
  });
};
