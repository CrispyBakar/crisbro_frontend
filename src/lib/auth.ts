/* eslint-disable prettier/prettier */
const API_BASE = "/api";
const TOKEN_KEY = "crisbar_token";
const USER_KEY = "crisbar_user";

export type AuthUser = {
  id: number;
  email?: string;
  phone_number?: string;
  role: string;
  customer?: {
    id: number;
    name: string;
    balance: number;
    customer_point?: {
      total_point: number;
      available_point: number;
      next_reward_threshold: number;
    };
  };
};

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth-change"));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

export async function apiProfile() {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan");

  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil profil");

  localStorage.setItem(USER_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("auth-change"));

  return data as AuthUser;
}

export async function apiLogin(phone_number: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login gagal");
  return data as { token: string; user: AuthUser };
}

export async function apiRegister(name: string, phone_number: string, password: string) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone_number, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registrasi gagal");
  return data;
}
