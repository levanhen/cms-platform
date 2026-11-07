"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";

export function MediaUploadButton({
  folderId = null,
}: {
  folderId?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Đang tải..." : "Tải lên"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          startTransition(async () => {
            try {
              const body = new FormData();
              body.append("file", file);
              if (folderId) body.append("folderId", folderId);
              const res = await fetch("/api/media/upload", { method: "POST", body });
              const data = await res.json();
              if (!res.ok || !data.ok) {
                notify.error(data.message ?? "Tải lên thất bại.");
                return;
              }
              notify.success("Đã tải lên media.");
              router.refresh();

            } catch (error) {
              notify.unexpected(error);
            }
          });
        }}
      />
    </>
  );
}
