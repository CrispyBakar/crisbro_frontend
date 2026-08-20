import { describe, expect, it } from "vitest";
import { normalizeAdminUserPage } from "./admin";
import type { AdminUser, AdminUserPage } from "./admin/types";

const user = { id: 7, role: "admin" } as AdminUser;

describe("normalizeAdminUserPage", () => {
  it("wraps the legacy array response used by older deployed backends", () => {
    expect(normalizeAdminUserPage([user], 50)).toEqual({
      items: [user],
      page: 1,
      limit: 50,
      total: 1,
      total_pages: 1,
    });
  });

  it("preserves the paginated response from the current backend", () => {
    const response: AdminUserPage = {
      items: [user],
      page: 2,
      limit: 50,
      total: 51,
      total_pages: 2,
    };

    expect(normalizeAdminUserPage(response, 50)).toBe(response);
  });
});
