"use client";

import { useRef, useState } from "react";
import { notify } from "@/lib/notify";
import { ImageCropDialog } from "@/components/editors/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/features/media/media-picker";

export function NewsCoverField({
  label = "Ảnh đại diện (thumbnail)",
  value,
  onChange,
  canUpload = true,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  canUpload?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function revokeObjectUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
  }

  function startCrop(src: string, isObjectUrl = false) {
    revokeObjectUrl();
    if (isObjectUrl) setObjectUrl(src);
    setCropSrc(src);
    setCropOpen(true);
  }

  function onPickFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify.error("Vui lòng chọn file ảnh.");
      return;
    }
    const url = URL.createObjectURL(file);
    startCrop(url, true);
  }

  async function uploadCover(blob: Blob) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", blob, "news-cover.jpg");
      body.append("altText", "News cover");
      const res = await fetch("/api/media/upload-cover", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify.error(data.message ?? "Không tải được ảnh cover.");
        return;
      }
      onChange(data.media.fileUrl);
      notify.success("Đã cắt và lưu ảnh thumbnail.");
    } catch (error) {
      notify.unexpected(error);
    } finally {
      setUploading(false);
      revokeObjectUrl();
      setCropSrc(null);
    }
  }

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
          Chưa có ảnh 16:9
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {canUpload ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading}
              onClick={() => setPickerOpen(true)}
            >
              Chọn từ thư viện
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Tải lên & cắt
            </Button>
          </>
        ) : null}
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => onChange("")}
          >
            Xóa ảnh
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Ảnh sẽ được cắt 16:9 và nén WebP 800×450 để làm thumbnail danh sách tin.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          onPickFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {pickerOpen ? (
        <MediaPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          canUpload={false}
          onSelect={(items) => {
            if (items[0]) {
              setPickerOpen(false);
              startCrop(items[0].fileUrl);
            }
          }}
        />
      ) : null}
      {cropOpen && cropSrc ? (
        <ImageCropDialog
          open={cropOpen}
          imageSrc={cropSrc}
          onOpenChange={(open) => {
            setCropOpen(open);
            if (!open) {
              revokeObjectUrl();
              setCropSrc(null);
            }
          }}
          onCropped={uploadCover}
        />
      ) : null}
    </div>
  );
}
