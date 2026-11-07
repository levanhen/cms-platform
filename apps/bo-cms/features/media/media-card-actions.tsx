"use client";

import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteMediaAction } from "@/features/media/actions";
import { formatDateTime, formatNumber } from "@/lib/utils";

export function MediaCardActions({
  mediaId,
  fileUrl,
}: {
  mediaId: string;
  fileUrl: string;
}) {
  const router = useRouter();

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        type="button"
        title="Sao chép URL"
        aria-label="Sao chép URL"
        onClick={async () => {
          await navigator.clipboard.writeText(fileUrl);
          notify.success("Đã sao chép đường dẫn.");
        }}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <ConfirmButton
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive hover:bg-red-50 hover:text-destructive"
        title="Xóa media?"
        description="File sẽ bị xóa khỏi thư viện và storage."
        tooltip="Xóa"
        aria-label="Xóa"
        onConfirm={async () => {
          const result = await deleteMediaAction(mediaId);
          if (!result.ok) {
            notify.error(result.message ?? "Không thể xóa.");
            throw new Error("delete failed");
          }
          notify.success("Đã xóa media.");
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </ConfirmButton>
    </div>
  );
}

export function MediaMeta({
  fileSize,
  createdAt,
}: {
  fileSize: number;
  createdAt: Date;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      {formatNumber(fileSize)} bytes · {formatDateTime(createdAt)}
    </p>
  );
}
