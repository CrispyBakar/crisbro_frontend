const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Banner {
  banner_id: string;
  title: string;
  mime_type: string;
  status: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  redirect_type: string;
  url: string | null;
  created_at: string;
  image_url: string;
}

export interface BannerPayload {
  title: string;
  image: File;
  status: string;
  type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  redirect_type: string;
  url: string | null;
}

export type UpdateBannerPayload = Omit<BannerPayload, "image"> & {
  image?: File;
};

export const getBanners = async (): Promise<Banner[]> => {
  const res = await fetch(`${API_BASE_URL}/banners`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat banners");
  }

  const data = await res.json();

  return data.data;
};

export const getImageBanner = async (banner_id: string) => {
  const res = await fetch(`${API_BASE_URL}/banners/${banner_id}/image`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal memuat image banner");
  }

  return res;
};

export const uploadBanner = async (payload: BannerPayload): Promise<Banner> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("image", payload.image);
  formData.append("status", payload.status);
  formData.append("type", payload.type);
  formData.append("start_date", payload.start_date);
  formData.append("end_date", payload.end_date);
  formData.append("start_time", payload.start_time);
  formData.append("end_time", payload.end_time);
  formData.append("redirect_type", payload.redirect_type);
  formData.append("url", payload.url ?? "null");

  const res = await fetch(`${API_BASE_URL}/banners/upload`, {
    method: "POST",
    headers: {
      "x-csrf-protection": "1",
    },
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal upload banner");
  }

  const data = await res.json();

  return data.data;
};

export const updateBanner = async (
  banner_id: string,
  payload: UpdateBannerPayload,
): Promise<Banner> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.image) formData.append("image", payload.image);
  formData.append("status", payload.status);
  formData.append("type", payload.type);
  formData.append("start_date", payload.start_date);
  formData.append("end_date", payload.end_date);
  formData.append("start_time", payload.start_time);
  formData.append("end_time", payload.end_time);
  formData.append("redirect_type", payload.redirect_type);
  formData.append("url", payload.url ?? "null");

  const res = await fetch(
    `${API_BASE_URL}/banners/${encodeURIComponent(banner_id)}`,
    {
      method: "PUT",
      headers: { "x-csrf-protection": "1" },
      credentials: "include",
      body: formData,
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal mengubah banner");
  }

  const data = await res.json();
  return data.data;
};

export const deleteBanner = async (banner_id: string): Promise<void> => {
  const res = await fetch(
    `${API_BASE_URL}/banners/${encodeURIComponent(banner_id)}`,
    {
      method: "DELETE",
      headers: {
        "x-csrf-protection": "1",
      },
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal menghapus banner");
  }
};

export const clickBanner = async (banner_id: string) => {
  const res = await fetch(`${API_BASE_URL}/banners/click`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-protection": "1",
    },
    credentials: "include",
    body: JSON.stringify({ banner_id }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "Gagal insert banner click");
  }
};
