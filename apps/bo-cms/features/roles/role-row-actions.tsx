"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteRoleAction } from "@/features/roles/actions";

export function RoleRowActions({
  roleId,
  canDelete,
}: {
  roleId: string;
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
        title="Xóa vai trò?"
        description="Vai trò sẽ bị xóa. Người dùng đang dùng vai trò này có thể mất quyền."
        tooltip="Xóa"
        aria-label="Xóa"
        onConfirm={async () => {
          const result = await deleteRoleAction(roleId);
          if (!result.ok) {
            notify.error("message" in result ? result.message : "Không thể xóa.");
            throw new Error("delete failed");
          }
          notify.success("Đã xóa vai trò.");
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </ConfirmButton>
    </div>
  );
}
