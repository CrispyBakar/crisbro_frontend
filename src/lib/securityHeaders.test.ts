import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";
import { API_ORIGIN, buildContentSecurityPolicy } from "./csp";

const repoRoot = path.resolve(__dirname, "..", "..");

function getDirective(csp: string, name: string) {
  return csp
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive === name || directive.startsWith(`${name} `));
}

describe("Content-Security-Policy", () => {
  const policy = buildContentSecurityPolicy("TESTNONCE");

  it("mengizinkan panggilan ke origin API produksi", () => {
    // Frontend dan backend berada di origin berbeda. Tanpa baris ini browser
    // memblokir setiap fetch ke API dan seluruh aplikasi mati.
    const connectSrc = getDirective(policy, "connect-src");
    expect(connectSrc).toBeTruthy();
    expect(connectSrc).toContain(API_ORIGIN);
    expect(connectSrc).toContain("'self'");
  });

  it("memakai nonce dan tidak lagi mengizinkan skrip inline sembarangan", () => {
    const scriptSrc = getDirective(policy, "script-src");
    expect(scriptSrc).toBe("script-src 'self' 'nonce-TESTNONCE'");
    // 'unsafe-inline' pada script-src akan diabaikan browser begitu ada nonce,
    // jadi kehadirannya hanya menyesatkan pembaca policy.
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("menghasilkan nonce berbeda untuk tiap request", () => {
    expect(buildContentSecurityPolicy("A")).not.toBe(
      buildContentSecurityPolicy("B"),
    );
  });

  it("tidak melemahkan pembatasan lain", () => {
    expect(getDirective(policy, "object-src")).toBe("object-src 'none'");
    expect(getDirective(policy, "frame-ancestors")).toBe(
      "frame-ancestors 'none'",
    );
    expect(getDirective(policy, "base-uri")).toBe("base-uri 'none'");
    expect(policy).not.toContain("connect-src *");
  });

  // Dua file konfigurasi hosting ini tidak boleh memuat CSP sendiri: header
  // statis tidak bisa membawa nonce, dan policy kedua akan beririsan dengan
  // policy dinamis sehingga skrip inline ber-nonce ikut terblokir.
  it.each(["vercel.json", path.join("public", "_headers")])(
    "%s tidak memasang CSP statis yang beririsan",
    (relativePath) => {
      const raw = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      const declarations = raw
        .split("\n")
        .filter((line) => !line.trim().startsWith("#"))
        .join("\n");

      expect(declarations).not.toContain("Content-Security-Policy");
    },
  );
});

// Keempat header ini dipasang lewat `headers` di vercel.json. Sudah
// diverifikasi runtime (curl -I ke deployment produksi) bahwa Vercel tetap
// menerapkannya walaupun build menghasilkan .vercel/output (Build Output API):
// keempatnya muncul di response produksi, begitu pula rewrite /api/*.
// .vercel/ sendiri ada di .gitignore, jadi isinya artefak build lokal dan
// bukan gambaran konfigurasi yang dipakai deployment.
//
// Tidak ada gate otomatis yang menjaga keempatnya sebelum ini, sehingga
// terhapusnya satu baris hanya ketahuan lewat pemeriksaan manual.
const REQUIRED_STATIC_HEADERS: Record<string, string> = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

describe("header keamanan statis", () => {
  it("vercel.json memasang keempatnya untuk seluruh path", () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "vercel.json"), "utf8"),
    ) as {
      headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    const catchAll = config.headers?.find((entry) => entry.source === "/(.*)");
    expect(catchAll, "vercel.json harus punya aturan header untuk /(.*)").toBeTruthy();

    const declared = new Map(
      (catchAll?.headers ?? []).map((header) => [header.key, header.value]),
    );
    for (const [key, value] of Object.entries(REQUIRED_STATIC_HEADERS)) {
      expect(declared.get(key), `${key} hilang atau berubah di vercel.json`).toBe(value);
    }
  });

  it("public/_headers tetap sinkron dengan vercel.json", () => {
    // File ini format Cloudflare Pages, jadi TIDAK aktif di deployment Vercel
    // saat ini. Dibiarkan ada sebagai konfigurasi untuk host alternatif --
    // karena itu isinya harus tetap sama, supaya pindah host tidak diam-diam
    // menurunkan proteksi.
    const raw = fs.readFileSync(path.join(repoRoot, "public", "_headers"), "utf8");
    const declared = new Map(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes(":"))
        .map((line) => {
          const separator = line.indexOf(":");
          return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
        }),
    );

    for (const [key, value] of Object.entries(REQUIRED_STATIC_HEADERS)) {
      expect(declared.get(key), `${key} hilang atau berbeda di public/_headers`).toBe(value);
    }
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
