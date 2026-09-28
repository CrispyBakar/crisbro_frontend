import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/services/auth";
import type { ChangePasswordPayload } from "@/services/auth";

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onError: (error) => {
      console.error(error.message);
    },
  });
};
