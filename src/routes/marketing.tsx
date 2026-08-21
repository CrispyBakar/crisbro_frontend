import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminPage = lazy(() =>
  import("@/features/admin/AdminPage").then((module) => ({
    default: module.AdminPage,
  })),
);

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
  component: MarketingRoute,
});

function MarketingRoute() {
  return (
    <Suspense fallback={<ConsoleLoadingFallback />}>
      <AdminPage mode="marketing" />
    </Suspense>
  );
}

function ConsoleLoadingFallback() {
  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-8" aria-busy="true">
      <div className="mx-auto max-w-7xl animate-pulse space-y-4">
        <div className="h-12 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </div>
    </main>
  );
}
