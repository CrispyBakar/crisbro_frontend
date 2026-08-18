import { describe, expect, it } from "vitest";
import { normalizeRedeemItemPage } from "./admin";
import type { RedeemItem, RedeemItemPage } from "./admin/types";

const item = { id: 7 } as RedeemItem;

describe("normalizeRedeemItemPage", () => {
  it("wraps the legacy array response used by older deployed backends", () => {
    expect(normalizeRedeemItemPage([item], 50)).toEqual({
      items: [item],
      page: 1,
      limit: 50,
      total: 1,
      total_pages: 1,
    });
  });

  it("preserves the paginated response from the current backend", () => {
    const response: RedeemItemPage = {
      items: [item],
      page: 2,
      limit: 50,
      total: 51,
      total_pages: 2,
    };

    expect(normalizeRedeemItemPage(response, 50)).toBe(response);
  });
});
