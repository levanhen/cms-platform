"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteUserAction } from "@/features/users/actions";

export function UserRowActions({
  userId,
  canDelete,
}: {
  userId: string;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  if (!canDelete) return null;

  return (
    <div className="flex justify-end gap-1">
      <ConfirmButton
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive hover:bg-red-50 hover:text-destructive"
        title="Xóa người dùng?"
        description="Người dùng sẽ được xóa mềm và không đăng nhập được nữa."
        tooltip="Xóa"
        aria-label="Xóa"
        onConfirm={async () => {
          const result = await deleteUserAction(userId);
          if (!result.ok) {
            notify.error("message" in result ? result.message : "Không thể xóa.");
            throw new Error("delete failed");
          }
          notify.success("Đã xóa người dùng.");
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </ConfirmButton>
    </div>
  );
}
