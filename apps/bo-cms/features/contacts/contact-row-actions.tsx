"use client";

import { Archive, Eye, Trash2 } from "lucide-react";
import type { ContactMessageStatus } from "@cms/db";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  deleteContactAction,
  updateContactStatusAction,
} from "@/features/contacts/actions";
import { notify } from "@/lib/notify";
import { useRowActionRunner } from "@/lib/use-row-action-runner";

export function ContactRowActions({
  id,
  status,
  canUpdate,
  canDelete,
}: {
  id: string;
  status: ContactMessageStatus;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const { pending, run, router } = useRowActionRunner();

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {canUpdate && status === "NEW" ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={pending}
          title="Đánh dấu đã đọc"
          aria-label="Đánh dấu đã đọc"
          onClick={() =>
            run(() => updateContactStatusAction(id, "READ"), "Đã đánh dấu đã đọc.")
          }
        >
          <Eye className="h-4 w-4" />
        </Button>
      ) : null}
      {canUpdate && status !== "ARCHIVED" ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          disabled={pending}
          title="Lưu trữ"
          aria-label="Lưu trữ"
          onClick={() =>
            run(
              () => updateContactStatusAction(id, "ARCHIVED"),
              "Đã lưu trữ tin nhắn.",
            )
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
          title="Xóa tin nhắn?"
          description="Tin nhắn sẽ bị xóa vĩnh viễn."
          tooltip="Xóa"
          aria-label="Xóa"
          onConfirm={async () => {
            const result = await deleteContactAction(id);
            if (
              !notify.result(result, {
                success: "Đã xóa tin nhắn.",
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
