import { apiUrl } from "./api";

const TOKEN_KEY = "crisbar_token";
const USER_KEY = "crisbar_user";

type RegisterError = Error & {
  whatsappUrl?: string;
};

type ApiErrorBody = {
  message?: unknown;
  error?: unknown;
  whatsappUrl?: unknown;
};

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
    // Hanya dikirim oleh GET /profile, tidak oleh login/register.
    next_reward?: {
      id: number;
      name: string;
      image_url: string | null;
      points_required: number;
      points_remaining: number;
    } | null;
    redeemable_reward_count?: number;
  } | null;
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

async function readJsonResponse(res: Response, fallbackMessage: string): Promise<unknown> {
  let data: unknown;

  try {
    data = await res.json();
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!res.ok) {
    const body = isRecord(data) ? (data as ApiErrorBody) : {};
    const message =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : fallbackMessage;
    const error = new Error(message) as RegisterError;

    if (typeof body.whatsappUrl === "string") {
      error.whatsappUrl = body.whatsappUrl;
    }

    throw error;
  }

  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false;

  const customer = value.customer;
  return (
    Number.isFinite(value.id) &&
    (value.email === undefined || typeof value.email === "string") &&
    (value.phone_number === undefined || typeof value.phone_number === "string") &&
    typeof value.role === "string" &&
    (customer === undefined || customer === null || isAuthCustomer(customer))
  );
}

function isAuthCustomer(value: unknown): value is AuthUser["customer"] {
  if (!isRecord(value)) return false;

  const customerPoint = value.customer_point;
  return (
    Number.isFinite(value.id) &&
    typeof value.name === "string" &&
    Number.isFinite(value.balance) &&
    (customerPoint === undefined || isCustomerPoint(customerPoint))
  );
}

function isCustomerPoint(value: unknown): value is NonNullable<AuthUser["customer"]>["customer_point"] {
  if (!isRecord(value)) return false;

  return (
    Number.isFinite(value.total_point) &&
    Number.isFinite(value.available_point) &&
    Number.isFinite(value.next_reward_threshold)
  );
}

function isLoginResponse(
  value: unknown,
): value is { token: string; expiresIn: string; user: AuthUser } {
  if (!isRecord(value)) return false;

  return (
    typeof value.token === "string" &&
    value.token.length > 0 &&
    typeof value.expiresIn === "string" &&
    isAuthUser(value.user)
  );
}

export async function apiProfile() {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan");

  const res = await fetch(apiUrl("/profile"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJsonResponse(res, "Gagal mengambil profil");

  if (!isAuthUser(data)) {
    throw new Error("Format data profil tidak valid");
  }

  localStorage.setItem(USER_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("auth-change"));

  return data;
}

export async function apiLogin(phone_number: string, password: string) {
  const res = await fetch(apiUrl("/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number, password }),
  });
  const data = await readJsonResponse(res, "Login gagal");

  if (!isLoginResponse(data)) {
    throw new Error("Format data login tidak valid");
  }

  return data;
}

export async function apiValidateActivation(token: string) {
  const res = await fetch(apiUrl(`/activate?token=${encodeURIComponent(token)}`));
  const data = await readJsonResponse(res, "Link aktivasi tidak valid");

  if (!isRecord(data) || data.valid !== true) {
    throw new Error("Format data aktivasi tidak valid");
  }

  return data as {
    valid: true;
    customer_name: string | null;
    expires_at: string;
  };
}

export async function apiActivateAccount(token: string, password: string) {
  const res = await fetch(apiUrl("/activate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await readJsonResponse(res, "Aktivasi akun gagal");

  if (!isRecord(data) || typeof data.message !== "string") {
    throw new Error("Format data aktivasi tidak valid");
  }

  return data as { message: string };
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan");

  const res = await fetch(apiUrl("/change-password"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  const data = await readJsonResponse(res, "Gagal mengganti password");

  if (!isRecord(data) || typeof data.message !== "string") {
    throw new Error("Format data ganti password tidak valid");
  }

  return data as { message: string };
}

export async function apiRegister(name: string, phone_number: string, password: string) {
  const res = await fetch(apiUrl("/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone_number, password }),
  });
  const data = await readJsonResponse(res, "Registrasi gagal");

  if (!isAuthUser(data)) {
    throw new Error("Format data registrasi tidak valid");
  }

  return data;
}
