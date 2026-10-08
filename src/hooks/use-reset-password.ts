import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestPasswordReset, resetPassword } from "@/services/auth";
import type {
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@/services/auth";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      requestPasswordReset(payload),
  });
};

export const useResetPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
    // Backend menghapus cookie sesi browser ini, jadi cache sesi customer
    // maupun admin ikut dikosongkan
    onSuccess: () => {
      queryClient.setQueryData(["auth", "profile"], null);
      queryClient.setQueryData(["auth", "me"], null);
    },
  });
};
