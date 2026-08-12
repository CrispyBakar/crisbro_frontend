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
import type { ConfirmDialogState } from "./adminConsoleTypes";

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
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogPortal>
        <DialogOverlay className="md:hidden" />
        <DialogContent
          onEscapeKeyDown={(event) => saving && event.preventDefault()}
          onInteractOutside={(event) => saving && event.preventDefault()}
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
    <Dialog open={Boolean(dialog)} onOpenChange={(next) => !next && !saving && onCancel()}>
      <DialogPortal>
        <DialogOverlay className="z-50" />
        <DialogContent
          role="alertdialog"
          aria-describedby="confirm-delete-description"
          onEscapeKeyDown={(event) => saving && event.preventDefault()}
          onInteractOutside={(event) => saving && event.preventDefault()}
          onCloseAutoFocus={restoreFocusOnClose}
          className="z-50 max-w-md rounded-xl border border-border bg-card p-6 shadow-(--shadow-pop)"
        >
          <DialogClose asChild>
            <button
              type="button"
              disabled={saving}
              aria-label="Tutup dialog konfirmasi"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
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
