import { describe, expect, it } from "vitest";
import { adminTabLoaders } from "./adminTabLoaders";

describe("H-5 admin code splitting", () => {
  it("setiap loader tab benar-benar memuat modul React yang dapat dirender", async () => {
    const modules = await Promise.all(Object.values(adminTabLoaders).map((load) => load()));
    expect(modules).toHaveLength(6);
    for (const loadedModule of modules) {
      expect(typeof loadedModule.default).toBe("function");
    }
  });

  it("loader stabil dan tidak mengeksekusi modul sebelum dipanggil", () => {
    for (const loader of Object.values(adminTabLoaders)) {
      expect(typeof loader).toBe("function");
      expect(loader).toHaveLength(0);
    }
  });
});
