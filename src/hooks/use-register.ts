import { useMutation } from "@tanstack/react-query";
import { registerCustomer } from "@/services/auth";
import type { CustomerRegisterPayload } from "@/services/auth";

export const useCustomerRegister = () => {
  return useMutation({
    mutationFn: (payload: CustomerRegisterPayload) => registerCustomer(payload),
  });
};
