"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteDocumentCategoryAction } from "@/features/documents/actions";

export function DocumentCategoryRowActions({
  categoryId,
  canDelete,
}: {
  categoryId: string;
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
        title="Xóa danh mục?"
        description="Chỉ xóa được khi không còn tài liệu thuộc danh mục này."
        tooltip="Xóa"
        aria-label="Xóa"
        onConfirm={async () => {
          const result = await deleteDocumentCategoryAction(categoryId);
          if (!result.ok) {
            notify.error(result.message ?? "Không thể xóa.");
            throw new Error("delete failed");
          }
          notify.success("Đã xóa danh mục.");
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </ConfirmButton>
    </div>
  );
}
