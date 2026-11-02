const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const readError = async (res: Response, fallback: string) => {
  const error = await res.json().catch(() => null);
  return typeof error?.message === "string" ? error.message : fallback;
};

export interface BannerClickedAnalyticsPoint {
  date: string;
  clicks: number;
}

export interface BannerClickedAnalytics {
  total_clicks: number;
  series: BannerClickedAnalyticsPoint[];
}

export interface BannerClickedAnalyticsParams {
  startDate: string;
  endDate: string;
  bannerId?: string;
  userId?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getBannerClickedAnalytics = async ({
  startDate,
  endDate,
  bannerId,
  userId,
}: BannerClickedAnalyticsParams): Promise<BannerClickedAnalytics> => {
  if (bannerId && !UUID_PATTERN.test(bannerId)) {
    throw new Error("ID banner tidak valid");
  }
  if (userId && !UUID_PATTERN.test(userId)) {
    throw new Error("ID customer tidak valid");
  }

  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  if (bannerId) params.append("banner_id", bannerId);
  if (userId) params.append("user_id", userId);

  const res = await fetch(
    `${API_BASE_URL}/banner-clicked/analytics?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error(
      await readError(res, "Gagal mengambil analytics klik banner"),
    );
  }

  const response: { data: BannerClickedAnalytics } = await res.json();
  return response.data;
};
