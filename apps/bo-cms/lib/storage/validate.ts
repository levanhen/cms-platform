import { prisma } from "@cms/db";

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DOCUMENT_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
]);

const DOCUMENT_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/octet-stream",
]);

function mbToBytes(mb: number) {
  return (Number.isFinite(mb) && mb > 0 ? mb : 20) * 1024 * 1024;
}

/** Sync fallback from env (used when settings DB unavailable). */
export function getMaxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "20");
  return mbToBytes(mb);
}

/** Prefer Settings.max_upload_size_mb, then env. */
export async function resolveMaxUploadBytes() {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: "max_upload_size_mb" },
    });
    if (row && typeof row.value === "number") {
      return mbToBytes(row.value);
    }
    if (row && typeof row.value === "string") {
      return mbToBytes(Number(row.value));
    }
  } catch {
    // fall through to env
  }
  return getMaxUploadBytes();
}

export function isAllowedImageMime(mime: string) {
  return IMAGE_MIME.has(mime);
}

export function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1)! : "";
}

export function isAllowedDocumentFile(fileName: string, mimeType: string) {
  const ext = getFileExtension(fileName);
  if (!DOCUMENT_EXT.has(ext)) return false;
  if (!DOCUMENT_MIME.has(mimeType)) return false;
  if (mimeType === "application/octet-stream") return true;
  if (ext === "pdf" && mimeType !== "application/pdf") return false;
  if (ext === "txt" && mimeType !== "text/plain") return false;
  return true;
}

export function keyFromPublicUrl(url: string) {
  if (!url.startsWith("/uploads/")) return null;
  return url.replace(/^\/uploads\//, "");
}

/** Only allow media stored via BO upload (local /uploads/…). */
export function isStoredMediaUrl(url: string | null | undefined) {
  if (!url) return true;
  return url.startsWith("/uploads/");
}
