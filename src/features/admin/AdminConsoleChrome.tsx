import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConsoleTab } from "./adminConsoleTypes";

// L-7: Memisahkan komponen presentasional konsol admin dari AdminPage.tsx tanpa mengubah perilaku atau fungsionalitasnya.

export function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative inline-flex min-h-11 min-w-36 flex-1 shrink-0 snap-center items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-center text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function AdminPageSkeleton({ tab }: { tab: ConsoleTab }) {
  if (tab === "report") {
    return (
      <section className="space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6 lg:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-26 flex-col rounded-xl border border-border bg-card px-3 pb-2.5 pt-3.5 shadow-(--shadow-soft) sm:min-h-29.5 sm:rounded-2xl sm:px-4 sm:pb-3 sm:pt-4 lg:min-h-28"
            >
              <div className="flex min-h-12 flex-col items-center justify-center gap-1.5 sm:min-h-13 sm:gap-2 lg:min-h-9 lg:flex-row lg:justify-start">
                <Skeleton className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
                <Skeleton className="h-3 w-12 sm:w-16 lg:w-24" />
              </div>
              <div className="flex flex-1 items-center justify-center pt-1.5">
                <Skeleton className="h-6 w-14 sm:h-7 sm:w-20 lg:h-8 lg:w-28" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)"
            >
              <Skeleton className="mb-5 h-6 w-56" />
              <Skeleton className="mb-4 h-4 w-64 max-w-full" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 flex-1 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
          <Skeleton className="mb-5 h-6 w-64" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="mt-5 h-48 w-full" />
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
        <Skeleton className="mb-5 h-6 w-44" />
        <div className="space-y-4">
          {Array.from({ length: tab === "redeem" ? 5 : 6 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-soft)">
        <Skeleton className="mb-5 h-6 w-52" />
        <Skeleton className="mb-4 h-10 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1.2fr_1fr_0.8fr_0.7fr]">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
