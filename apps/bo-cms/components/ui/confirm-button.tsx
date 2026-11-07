"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { notify } from "@/lib/notify";

export function ConfirmButton({
  title,
  description,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  tooltip,
  onConfirm,
  disabled,
  children,
  ...buttonProps
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tooltip?: string;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
} & Omit<ButtonProps, "onClick" | "title">) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          disabled={disabled || busy}
          title={tooltip}
          {...buttonProps}
        >
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? "Thao tác này không thể hoàn tác dễ dàng."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void (async () => {
                try {
                  await onConfirm();
                  setOpen(false);
                } catch (error) {
                  // Business handlers toast + throw to keep dialog open.
                  // Unexpected errors still get a toast if not already shown.
                  if (
                    error instanceof Error &&
                    error.message === "delete failed"
                  ) {
                    return;
                  }
                  notify.unexpected(error);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {busy ? "Đang xử lý..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
