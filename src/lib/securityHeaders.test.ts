import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

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
