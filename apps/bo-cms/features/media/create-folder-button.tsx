"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMediaFolderAction } from "@/features/media/actions";

export function CreateFolderButton({
  parentId = null,
}: {
  parentId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Tạo thư mục
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên thư mục"
        className="h-10 w-44"
        autoFocus
      />
      <Button
        type="button"
        disabled={pending || !name.trim()}
        onClick={() => {
          startTransition(async () => {
            try {
              const result = await createMediaFolderAction({
                name: name.trim(),
                parentId,
              });
              if (!result.ok) {
                notify.error(result.message ?? "Không thể tạo thư mục.");
                return;
              }
              notify.success("Đã tạo thư mục.");
              setName("");
              setOpen(false);
              router.refresh();

            } catch (error) {
              notify.unexpected(error);
            }
          });
        }}
      >
        {pending ? "Đang tạo..." : "Lưu"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setOpen(false);
          setName("");
        }}
      >
        Hủy
      </Button>
    </div>
  );
}
