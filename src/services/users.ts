import type { CurrentUser } from "@/services/auth";

// Field yang diterima endpoint PATCH /users/:user_id (hanya role admin)
export interface ParamsUpdateUser {
  user_id: string;
  email?: string;
  username?: string;
}

// Error validasi (422) dari backend berbentuk { field: string[] } — gabungkan jadi satu kalimat
const toErrorMessage = (message: unknown, fallback: string) => {
  if (typeof message === "string") return message;

  if (message && typeof message === "object") {
    const messages = Object.values(message).flat().filter(Boolean);
    if (messages.length > 0) return messages.join(", ");
  }

  return fallback;
};

export const updateUser = async ({
  user_id,
  ...payload
}: ParamsUpdateUser): Promise<CurrentUser> => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/users/${user_id}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-protection": "1",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(toErrorMessage(error?.message, "Gagal memperbarui profil"));
  }

  const data = await res.json();

  return data.data;
};
