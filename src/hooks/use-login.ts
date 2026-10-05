import { useMutation } from "@tanstack/react-query";
import { loginAdmin, loginCustomer } from "@/services/auth";
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
    mutationFn: (payload: CustomerLoginPayload) => loginCustomer(payload),
  });
};
