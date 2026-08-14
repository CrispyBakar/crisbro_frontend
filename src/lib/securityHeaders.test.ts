import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

// Origin backend produksi. Frontend dan backend berada di site Vercel yang
// berbeda (karena itu cookie sesi memakai SameSite=None), sehingga origin ini
// WAJIB tercantum di connect-src. Tanpa itu browser memblokir setiap panggilan
// API sebelum request dikirim dan seluruh aplikasi mati di produksi.
const API_ORIGIN = "https://crisbro-backend.vercel.app";

const repoRoot = path.resolve(__dirname, "..", "..");

function readVercelCsp() {
  const config = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "vercel.json"), "utf8"),
  );
  const header = config.headers
    ?.flatMap((rule: { headers?: { key: string; value: string }[] }) => rule.headers ?? [])
    .find((entry: { key: string }) => entry.key === "Content-Security-Policy");

  return header?.value as string | undefined;
}

function readEdgeHeadersCsp() {
  const raw = fs.readFileSync(path.join(repoRoot, "public", "_headers"), "utf8");
  const line = raw
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("Content-Security-Policy:"));

  return line?.slice("Content-Security-Policy:".length).trim();
}

function getDirective(csp: string, name: string) {
  return csp
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive === name || directive.startsWith(`${name} `));
}

describe("Content-Security-Policy", () => {
  it("mengizinkan panggilan ke origin API produksi", () => {
    const csp = readVercelCsp();
    expect(csp, "vercel.json harus memuat header Content-Security-Policy").toBeTruthy();

    const connectSrc = getDirective(csp as string, "connect-src");
    expect(connectSrc, "CSP harus punya direktif connect-src eksplisit").toBeTruthy();
    expect(connectSrc).toContain(API_ORIGIN);
  });

  it("tidak melemahkan pembatasan default", () => {
    const csp = readVercelCsp() as string;
    expect(getDirective(csp, "connect-src")).toContain("'self'");
    expect(getDirective(csp, "object-src")).toBe("object-src 'none'");
    expect(getDirective(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(csp).not.toContain("connect-src *");
  });

  // vercel.json adalah satu-satunya file yang benar-benar dibaca host saat ini,
  // tetapi public/_headers ikut ter-copy ke output build dan dibaca kalau
  // hosting dipindah ke Cloudflare Pages/Netlify. Keduanya harus sama persis
  // supaya tidak ada satu pun yang diam-diam basi.
  it("konsisten antara vercel.json dan public/_headers", () => {
    expect(readEdgeHeadersCsp()).toBe(readVercelCsp());
  });
});

describe("apiFetch CSRF protection", () => {
  it("adds the required header to mutations", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    await apiFetch("/api/logout", { method: "POST" });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("X-CSRF-Protection")).toBe("1");
    fetchMock.mockRestore();
  });

  it("does not add the header to safe requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    await apiFetch("/api/profile");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toBeUndefined();
    fetchMock.mockRestore();
  });
});
