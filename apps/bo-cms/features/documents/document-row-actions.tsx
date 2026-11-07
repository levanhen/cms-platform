"use client";

import { Archive, Download, Send, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  archiveDocumentAction,
  deleteDocumentAction,
  publishDocumentAction,
  unpublishDocumentAction,
} from "@/features/documents/actions";
import {
  canArchive,
  canPublish,
  canUnpublish,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import { notify } from "@/lib/notify";
import { useRowActionRunner } from "@/lib/use-row-action-runner";

export function DocumentRowActions({
  documentId,
  status,
  canDelete,
  canPublishContent,
}: {
  documentId: string;
  status: ContentStatusValue;
  canUpdate: boolean;
  canDelete: boolean;
  canPublishContent: boolean;
}) {
  const { pending, run, router } = useRowActionRunner();

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Tải xuống">
        <a href={`/api/documents/${documentId}/download`} aria-label="Tải xuống">
          <Download className="h-4 w-4" />
        </a>
      </Button>
      {canPublishContent && canPublish(status) ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          disabled={pending}
          title="Xuất bản"
          aria-label="Xuất bản"
          onClick={() =>
            run(() => publishDocumentAction(documentId), "Đã xuất bản tài liệu.")
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
            run(() => unpublishDocumentAction(documentId), "Đã hủy xuất bản.")
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
            run(() => archiveDocumentAction(documentId), "Đã lưu trữ tài liệu.")
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
          title="Xóa tài liệu?"
          description="Tài liệu sẽ được xóa mềm."
          tooltip="Xóa"
          aria-label="Xóa"
          onConfirm={async () => {
            const result = await deleteDocumentAction(documentId);
            if (
              !notify.result(result, {
                success: "Đã xóa tài liệu.",
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
