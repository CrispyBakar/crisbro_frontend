import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConsoleTab, ConfirmDialogState } from "./adminConsoleTypes";

// L-7: Memisahkan komponen presentasional konsol admin dari AdminPage.tsx tanpa mengubah perilaku atau fungsionalitasnya.

// M-11: Menambahkan mekanisme restorasi fokus eksplisit agar fokus kembali ke tombol pemicu yang benar setelah dialog ditutup.
function useDialogCloseFocusRestore(open: boolean) {
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) lastFocusedRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  return useCallback((event: Event) => {
    event.preventDefault();
    lastFocusedRef.current?.focus();
  }, []);
}

// M-11: Mengganti dialog manual dengan Radix Dialog untuk menyediakan focus trap, fokus saat dibuka, dan dukungan Escape, serta mempertahankan restorasi fokus saat ditutup.
export function MobileCrudDialog({
  open,
  title,
  saving,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  saving: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  const restoreFocusOnClose = useDialogCloseFocusRestore(open);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="md:hidden" />
        <DialogContent
          onEscapeKeyDown={(event) => {
            if (saving) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (saving) event.preventDefault();
          }}
          onCloseAutoFocus={restoreFocusOnClose}
          aria-describedby={undefined}
          className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-(--shadow-pop) md:hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
            <DialogTitle asChild>
              <h2 className="text-lg font-black">{title}</h2>
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                disabled={saving}
                aria-label="Tutup form"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">{children}</div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

// M-11: Mengganti alertdialog manual dengan Radix Dialog untuk menyediakan focus trap, focus-on-open, restorasi fokus, dan dukungan Escape tanpa mengubah kontrak ARIA yang ada.
export function ConfirmDeleteDialog({
  dialog,
  saving,
  onCancel,
  onConfirm,
}: {
  dialog: ConfirmDialogState | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const restoreFocusOnClose = useDialogCloseFocusRestore(Boolean(dialog));

  return (
    <Dialog
      open={Boolean(dialog)}
      onOpenChange={(next) => {
        if (!next && !saving) onCancel();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="z-50" />
        <DialogContent
          role="alertdialog"
          aria-describedby="confirm-delete-description"
          onEscapeKeyDown={(event) => {
            if (saving) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (saving) event.preventDefault();
          }}
          onCloseAutoFocus={restoreFocusOnClose}
          className="z-50 max-w-md rounded-xl border border-border bg-card p-6 shadow-(--shadow-pop)"
        >
          <DialogClose asChild>
            <button
              type="button"
              disabled={saving}
              aria-label="Tutup dialog konfirmasi"
              className="absolute right-4 top-4 grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogTitle asChild>
            <h2 className="text-xl font-black tracking-tight">{dialog?.title}</h2>
          </DialogTitle>
          <DialogDescription
            id="confirm-delete-description"
            className="mt-2 text-sm leading-6 text-muted-foreground"
          >
            {dialog?.description}
          </DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="font-bold"
            >
              Tidak, batal
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              className="bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "Menghapus..." : (dialog?.confirmLabel ?? "Hapus")}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

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
      className={`relative inline-flex min-h-11 shrink-0 snap-start items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-center text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset lg:min-w-0 lg:flex-1 ${
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
              className="flex min-h-[104px] flex-col rounded-xl border border-border bg-card px-3 pb-2.5 pt-3.5 shadow-(--shadow-soft) sm:min-h-[118px] sm:rounded-2xl sm:px-4 sm:pb-3 sm:pt-4 lg:min-h-[112px]"
            >
              <div className="flex min-h-[48px] flex-col items-center justify-center gap-1.5 sm:min-h-[52px] sm:gap-2 lg:min-h-[36px] lg:flex-row lg:justify-start">
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
