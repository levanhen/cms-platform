"use client";

import {
  Archive,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  archiveServiceAction,
  deleteServiceAction,
  publishServiceAction,
  reorderServiceAction,
  unpublishServiceAction,
} from "@/features/services/actions";
import {
  canArchive,
  canPublish,
  canUnpublish,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import { notify } from "@/lib/notify";
import { useRowActionRunner } from "@/lib/use-row-action-runner";

export function ServiceRowActions({
  serviceId,
  status,
  canUpdate,
  canDelete,
  canPublishContent,
}: {
  serviceId: string;
  status: ContentStatusValue;
  canUpdate: boolean;
  canDelete: boolean;
  canPublishContent: boolean;
}) {
  const { pending, run, router } = useRowActionRunner();

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {canUpdate ? (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            disabled={pending}
            title="Tăng thứ tự"
            aria-label="Tăng thứ tự"
            onClick={() =>
              run(() => reorderServiceAction(serviceId, "up"), "Đã tăng thứ tự.")
            }
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            disabled={pending}
            title="Giảm thứ tự"
            aria-label="Giảm thứ tự"
            onClick={() =>
              run(
                () => reorderServiceAction(serviceId, "down"),
                "Đã giảm thứ tự.",
              )
            }
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </>
      ) : null}
      {canPublishContent && canPublish(status) ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          disabled={pending}
          title="Xuất bản"
          aria-label="Xuất bản"
          onClick={() =>
            run(() => publishServiceAction(serviceId), "Đã xuất bản dịch vụ.")
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
            run(() => unpublishServiceAction(serviceId), "Đã hủy xuất bản.")
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
            run(() => archiveServiceAction(serviceId), "Đã lưu trữ dịch vụ.")
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
          title="Xóa dịch vụ?"
          description="Dịch vụ sẽ được xóa mềm."
          tooltip="Xóa"
          aria-label="Xóa"
          onConfirm={async () => {
            const result = await deleteServiceAction(serviceId);
            if (
              !notify.result(result, {
                success: "Đã xóa dịch vụ.",
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
