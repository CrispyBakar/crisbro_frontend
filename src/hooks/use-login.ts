import { useMutation } from "@tanstack/react-query";
import { loginAdmin } from "@/services/auth";
import type { AdminLoginPayload } from "@/services/auth";

interface UseLoginProps {
  setSuccess?: (value: string) => void;
  setError?: (value: string) => void;
}

export const useLogin = ({ setSuccess, setError }: UseLoginProps) => {
  return useMutation({
    mutationFn: (payload: AdminLoginPayload) => loginAdmin(payload),
    onError: (error) => {
      setError?.(error.message as string);
      console.error(error.message);
    },
  });
};
