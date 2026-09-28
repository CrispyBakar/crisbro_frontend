import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/services/users";
import type { ParamsUpdateUser } from "@/services/users";

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ParamsUpdateUser) => updateUser(params),
    onSuccess: () => {
      // Profil admin yang login dibaca dari /me — refresh agar navbar & halaman profil ikut update
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
};
