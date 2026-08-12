import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/features/admin/AdminPage.tsx"), "utf8");

describe("H-5 admin code splitting", () => {
  it("menjaga seluruh tab sebagai dynamic import", () => {
    for (const moduleName of [
      "AdminReportTab",
      "AdminUsersTab",
      "AdminCustomersTab",
      "AdminRedeemTab",
      "AdminSalesTransactionsTab",
      "AdminActivityTab",
    ]) {
      expect(source).toContain(`lazy(() => import("./${moduleName}"))`);
    }
  });

  it("tidak menarik form berat dan Radix Dialog secara statis ke chunk AdminPage", () => {
    expect(source).not.toMatch(/from "\.\/AdminFormFields"/);
    expect(source).not.toMatch(/from "@\/components\/ui\/dialog"/);
    expect(source).toContain('import("./AdminFormFields")');
    expect(source).toContain('import("./AdminDialogs")');
  });
});
