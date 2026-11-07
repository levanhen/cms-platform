"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ContactMessageStatus } from "@cms/db";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  deleteContactAction,
  updateContactStatusAction,
} from "@/features/contacts/actions";
import { notify } from "@/lib/notify";

export function ContactDetailActions({
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: ContactMessageStatus, success: string) {
    startTransition(async () => {
      const result = await updateContactStatusAction(id, next);
      if (
        !notify.result(result, {
          success,
          fallbackError: "Không cập nhật được trạng thái.",
        })
      ) {
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {canUpdate && status === "NEW" ? (
        <Button
          disabled={pending}
          variant="outline"
          onClick={() => setStatus("READ", "Đã đánh dấu đã đọc.")}
        >
          Đánh dấu đã đọc
        </Button>
      ) : null}
      {canUpdate && status !== "ARCHIVED" ? (
        <Button
          disabled={pending}
          variant="outline"
          onClick={() => setStatus("ARCHIVED", "Đã lưu trữ.")}
        >
          Lưu trữ
        </Button>
      ) : null}
      {canUpdate && status === "ARCHIVED" ? (
        <Button
          disabled={pending}
          variant="outline"
          onClick={() => setStatus("READ", "Đã bỏ lưu trữ.")}
        >
          Mở lại (Đã đọc)
        </Button>
      ) : null}
      {canDelete ? (
        <ConfirmButton
          variant="destructive"
          disabled={pending}
          title="Xóa tin nhắn?"
          description="Tin nhắn sẽ bị xóa vĩnh viễn."
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
            router.push("/contacts");
            router.refresh();
          }}
        >
          Xóa
        </ConfirmButton>
      ) : null}
    </div>
  );
}
