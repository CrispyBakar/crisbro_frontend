import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "./admin";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing Dashboard - Crisbar" },
      {
        name: "description",
        content: "Dashboard marketing untuk laporan loyalty dan menu redeem Crisbar.",
      },
    ],
  }),
  component: () => <AdminPage mode="marketing" />,
});
