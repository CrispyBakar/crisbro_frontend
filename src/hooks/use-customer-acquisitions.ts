import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMyCustomerAcquisition } from "@/services/customer-acquisitions";
import type { CustomerUser } from "@/services/auth";
import type { CreateMyCustomerAcquisitionPayload } from "@/services/customer-acquisitions";

export const useCreateMyCustomerAcquisition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMyCustomerAcquisitionPayload) =>
      createMyCustomerAcquisition(payload),
    // Berlaku juga saat datanya ternyata sudah pernah tercatat (hasil null):
    // penanda di sesi diubah supaya customer tidak ditanya lagi
    onSuccess: () => {
      queryClient.setQueryData<CustomerUser | null>(
        ["auth", "profile"],
        (user) =>
          user?.customer
            ? { ...user, customer: { ...user.customer, has_acquisition: true } }
            : user,
      );
    },
  });
};
