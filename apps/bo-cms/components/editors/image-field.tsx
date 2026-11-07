"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/features/media/media-picker";

export function ImageField({
  label = "Ảnh đại diện",
  value,
  onChange,
  canUpload = true,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  canUpload?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="aspect-video w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          Chưa chọn ảnh
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {canUpload ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
            Chọn / tải lên
          </Button>
        ) : null}
        {value ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onChange("")}>
            Xóa ảnh
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Chọn ảnh từ thư viện media hoặc tải lên (không dán URL ngoài).
      </p>
      {open ? (
        <MediaPicker
          open={open}
          onOpenChange={setOpen}
          canUpload={canUpload}
          onSelect={(items) => {
            if (items[0]) onChange(items[0].fileUrl);
          }}
        />
      ) : null}
    </div>
  );
}
