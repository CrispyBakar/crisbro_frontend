import { z } from "zod";

export const createBannerSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required"),
  status: z.enum(["active", "inactive"]).default("inactive"),
  type: z.enum(["default", "campaign"]).default("campaign"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

export type CreateBannerValues = z.infer<typeof createBannerSchema>;
