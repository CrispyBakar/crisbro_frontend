const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const readError = async (res: Response, fallback: string) => {
  const error = await res.json().catch(() => null);
  return typeof error?.message === "string" ? error.message : fallback;
};

export const getVapidPublicKey = async (): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/push/vapid-public-key`, {
    credentials: "include",
  });

  if (!res.ok)
    throw new Error(await readError(res, "Notifikasi belum tersedia"));

  const data = await res.json();
  return data.data.public_key;
};

export const savePushSubscription = async (subscription: PushSubscription) => {
  const res = await fetch(`${API_BASE_URL}/push/subscribe`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-protection": "1",
    },
    body: JSON.stringify(subscription),
  });

  if (!res.ok)
    throw new Error(await readError(res, "Gagal mengaktifkan notifikasi"));
};

export const deletePushSubscription = async (endpoint: string) => {
  const res = await fetch(`${API_BASE_URL}/push/unsubscribe`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-protection": "1",
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!res.ok)
    throw new Error(await readError(res, "Gagal mematikan notifikasi"));
};

export interface PushBroadcastPayload {
  title: string;
  body: string;
  url?: string;
}

export interface PushBroadcast extends Required<PushBroadcastPayload> {
  push_broadcast_id: string;
  status: "pending" | "sending" | "done" | "failed";
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export const createPushBroadcast = async (
  payload: PushBroadcastPayload,
): Promise<PushBroadcast> => {
  const res = await fetch(`${API_BASE_URL}/push/broadcasts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "x-csrf-protection": "1" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "Gagal membuat broadcast"));

  const data = await res.json();
  return data.data;
};
