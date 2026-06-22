// Simple demo-only auth using localStorage. No real backend.
const KEY = "crisbar_demo_user";

export type DemoUser = {
  name: string;
  tel: string;
  points: number;
  memberSince: string;
};

export function loginDemo(tel: string): DemoUser {
  const namePart = tel.split("@")[0] || "Sahabat Crisbar";
  const name = namePart.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const user: DemoUser = {
    name,
    tel,
    points: 1250,
    memberSince: "Maret 2024",
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function logoutDemo() {
  localStorage.removeItem(KEY);
}

export const REWARD_THRESHOLD = 2000;

export const POINT_HISTORY = [
  { date: "12 Apr 2026", desc: "Paket Bento Komplit", points: +90, type: "earn" as const },
  { date: "08 Apr 2026", desc: "Tukar — Choco Donut", points: -150, type: "redeem" as const },
  { date: "02 Apr 2026", desc: "Spicy Manis Katsu", points: +56, type: "earn" as const },
  { date: "27 Mar 2026", desc: "Strawberry Shake", points: +36, type: "earn" as const },
  { date: "20 Mar 2026", desc: "Paket Sharing Crispy", points: +130, type: "earn" as const },
  { date: "11 Mar 2026", desc: "Bonus member baru 🎉", points: +200, type: "earn" as const },
];
