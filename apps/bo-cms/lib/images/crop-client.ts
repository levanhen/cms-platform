export type CropAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Không tải được ảnh.")));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

/** Crop image in browser to a JPEG blob (before server WebP finalize). */
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: CropAreaPixels,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas không khả dụng.");

  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không tạo được ảnh crop."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}
