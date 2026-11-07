"use client";

import { Archive, Send, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  archivePageAction,
  deletePageAction,
  publishPageAction,
  unpublishPageAction,
} from "@/features/pages/actions";
import {
  canArchive,
  canPublish,
  canUnpublish,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import { notify } from "@/lib/notify";
import { useRowActionRunner } from "@/lib/use-row-action-runner";

export function PageRowActions({
  pageId,
  status,
  canDelete,
  canPublishContent,
}: {
  pageId: string;
  status: ContentStatusValue;
  canUpdate: boolean;
  canDelete: boolean;
  canPublishContent: boolean;
}) {
  const { pending, run, router } = useRowActionRunner();

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {canPublishContent && canPublish(status) ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          disabled={pending}
          title="Xuất bản"
          aria-label="Xuất bản"
          onClick={() =>
            run(() => publishPageAction(pageId), "Đã xuất bản trang.")
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      ) : null}
      {canPublishContent && canUnpublish(status) ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={pending}
          title="Hủy xuất bản"
          aria-label="Hủy xuất bản"
          onClick={() =>
            run(() => unpublishPageAction(pageId), "Đã hủy xuất bản.")
          }
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      ) : null}
      {canPublishContent && canArchive(status) ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          disabled={pending}
          title="Lưu trữ"
          aria-label="Lưu trữ"
          onClick={() =>
            run(() => archivePageAction(pageId), "Đã lưu trữ trang.")
          }
        >
          <Archive className="h-4 w-4" />
        </Button>
      ) : null}
      {canDelete ? (
        <ConfirmButton
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:bg-red-50 hover:text-destructive"
          disabled={pending}
          title="Xóa trang?"
          description="Trang sẽ được xóa mềm."
          tooltip="Xóa"
          aria-label="Xóa"
          onConfirm={async () => {
            const result = await deletePageAction(pageId);
            if (
              !notify.result(result, {
                success: "Đã xóa trang.",
                fallbackError: "Không thể xóa.",
              })
            ) {
              throw new Error("delete failed");
            }
            router.refresh();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </ConfirmButton>
      ) : null}
    </div>
  );
}
