import { describe, expect, it } from "vitest";
import { buildRewardHistoryYAxis } from "./AdminReportCharts";
import type { LoyaltySummary } from "@/lib/admin";

describe("buildRewardHistoryYAxis", () => {
  it("memakai satu skala yang memuat nilai tepat kedua garis", () => {
    const data = [{ date: "2026-07-02", redemption_count: 10, points_spent: 45 }] as NonNullable<
      LoyaltySummary["redemption_trend"]
    >;

    const axis = buildRewardHistoryYAxis(data);

    expect(axis.domainMax).toBe(50);
    expect(axis.ticks).toContain(10);
    expect(axis.ticks).toContain(45);
    expect(axis.ticks[0]).toBe(0);
  });
});
