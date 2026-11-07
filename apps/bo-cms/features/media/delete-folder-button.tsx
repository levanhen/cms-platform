"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteMediaFolderAction } from "@/features/media/actions";

export function DeleteFolderButton({ folderId }: { folderId: string }) {
  const router = useRouter();

  return (
    <ConfirmButton
      size="sm"
      variant="outline"
      title="Xóa thư mục?"
      description="Ảnh bên trong sẽ chuyển về thư mục gốc."
      confirmLabel="Xóa thư mục"
      onConfirm={async () => {
        const result = await deleteMediaFolderAction(folderId);
        if (!result.ok) {
          notify.error(result.message ?? "Không thể xóa thư mục.");
          throw new Error("delete failed");
        }
        notify.success("Đã xóa thư mục.");
        router.push("/media");
        router.refresh();
      }}
    >
      Xóa thư mục
    </ConfirmButton>
  );
}
