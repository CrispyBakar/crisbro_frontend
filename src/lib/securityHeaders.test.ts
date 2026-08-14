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
