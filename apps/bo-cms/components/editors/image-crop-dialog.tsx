"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NEWS_COVER_ASPECT } from "@/lib/images/news-cover-constants";
import {
  getCroppedImageBlob,
  type CropAreaPixels,
} from "@/lib/images/crop-client";

export function ImageCropDialog({
  open,
  imageSrc,
  onOpenChange,
  onCropped,
  title = "Cắt ảnh tin tức",
  description = "Khung 16:9 — phù hợp thumbnail danh sách tin.",
}: {
  open: boolean;
  imageSrc: string | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (blob: Blob) => void | Promise<void>;
  title?: string;
  description?: string;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropAreaPixels | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels({
      x: pixels.x,
      y: pixels.y,
      width: pixels.width,
      height: pixels.height,
    });
  }, []);

  async function confirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setPending(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      await onCropped(blob);
      onOpenChange(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative h-[360px] overflow-hidden rounded-lg bg-zinc-900">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={NEWS_COVER_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="crop-zoom">Phóng to</Label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Hủy
          </Button>
          <Button type="button" onClick={() => void confirm()} disabled={pending}>
            {pending ? "Đang xử lý..." : "Dùng ảnh này"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
