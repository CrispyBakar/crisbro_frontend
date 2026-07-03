const rawApiBase = import.meta.env.VITE_API_BASE_URL || "/api";

export const API_BASE = rawApiBase.replace(/\/$/, "");

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
