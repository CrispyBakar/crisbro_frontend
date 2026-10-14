import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disablePush,
  enablePush,
  getPushStatus,
  syncPushSubscription,
} from "@/lib/push";
import { createPushBroadcast } from "@/services/push";

const PUSH_STATUS_KEY = ["push", "status"];

export const usePushStatus = () =>
  useQuery({
    queryKey: PUSH_STATUS_KEY,
    queryFn: getPushStatus,
    staleTime: Infinity,
    retry: false,
  });

export const useEnablePush = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enablePush,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: PUSH_STATUS_KEY }),
  });
};

export const useDisablePush = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disablePush,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: PUSH_STATUS_KEY }),
  });
};

export const useCreatePushBroadcast = () =>
  useMutation({ mutationFn: createPushBroadcast });

// Dipasang sekali di CustomerRootLayout dan AdminRootLayout
export const usePushSync = (isLoggedIn: boolean) => {
  useEffect(() => {
    if (!isLoggedIn) return;
    syncPushSubscription().catch((error) =>
      console.warn("Sinkron notifikasi gagal:", error),
    );
  }, [isLoggedIn]);
};
