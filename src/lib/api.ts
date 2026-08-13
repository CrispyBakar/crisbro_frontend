const rawApiBase = import.meta.env.VITE_API_BASE_URL || "/api";

export const API_BASE = rawApiBase.replace(/\/$/, "");

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = String(init.method || "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) return fetch(input, init);

  const headers = new Headers(init.headers);
  headers.set("X-CSRF-Protection", "1");
  return fetch(input, { ...init, headers });
}
