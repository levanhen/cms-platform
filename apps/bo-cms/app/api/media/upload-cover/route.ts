import { prisma } from "@cms/db";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  NEWS_COVER_HEIGHT,
  NEWS_COVER_WIDTH,
} from "@/lib/images/news-cover-constants";
import { isPathInsideRoot } from "@/lib/path-safe";
import { hasPermission } from "@/lib/permissions/constants";
import { getLocalStorageRoot, getStorage } from "@/lib/storage";
import {
  isAllowedImageMime,
  keyFromPublicUrl,
  resolveMaxUploadBytes,
} from "@/lib/storage/validate";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function canUploadCover(permissions: string[] | undefined) {
  return (
    hasPermission(permissions, "media:create") ||
    hasPermission(permissions, "news:create") ||
    hasPermission(permissions, "news:update")
  );
}

async function bufferFromSourceUrl(url: string) {
  const key = keyFromPublicUrl(url);
  if (!key) {
    throw new Error("Chỉ hỗ trợ ảnh đã lưu trong thư viện (/uploads/…).");
  }
  const root = getLocalStorageRoot();
  const fullPath = path.resolve(root, key);
  if (!isPathInsideRoot(root, fullPath)) {
    throw new Error("Forbidden");
  }
  return readFile(fullPath);
}

/**
 * Accept a cropped image (or original + we re-encode) and store a
 * fixed 800×450 WebP cover suitable for news list thumbnails.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  if (!canUploadCover(session.user.permissions)) {
    return NextResponse.json({ message: "Không có quyền tải ảnh cover." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const sourceUrlRaw = formData.get("sourceUrl");
  const altTextRaw = formData.get("altText");
  const altText =
    typeof altTextRaw === "string" && altTextRaw.trim()
      ? altTextRaw.trim()
      : "News cover";

  let inputBuffer: Buffer;

  if (file instanceof File) {
    if (!isAllowedImageMime(file.type) && file.type !== "image/jpeg") {
      // canvas crop often emits image/jpeg
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ message: "File không phải ảnh." }, { status: 400 });
      }
    }
    const maxBytes = await resolveMaxUploadBytes();
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          message: `File vượt quá giới hạn ${Math.round(maxBytes / (1024 * 1024))}MB.`,
        },
        { status: 400 },
      );
    }
    inputBuffer = Buffer.from(await file.arrayBuffer());
  } else if (typeof sourceUrlRaw === "string" && sourceUrlRaw.trim()) {
    try {
      inputBuffer = await bufferFromSourceUrl(sourceUrlRaw.trim());
    } catch (error) {
      return NextResponse.json(
        {
          message:
            error instanceof Error ? error.message : "Không đọc được ảnh nguồn.",
        },
        { status: 400 },
      );
    }
  } else {
    return NextResponse.json({ message: "Thiếu file ảnh cover." }, { status: 400 });
  }

  let output: Buffer;
  let width = NEWS_COVER_WIDTH;
  let height = NEWS_COVER_HEIGHT;
  try {
    output = await sharp(inputBuffer)
      .rotate()
      .resize(NEWS_COVER_WIDTH, NEWS_COVER_HEIGHT, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: 82 })
      .toBuffer();
    const meta = await sharp(output).metadata();
    width = meta.width ?? NEWS_COVER_WIDTH;
    height = meta.height ?? NEWS_COVER_HEIGHT;
  } catch {
    return NextResponse.json(
      { message: "Không xử lý được ảnh. Thử file JPEG/PNG/WebP khác." },
      { status: 400 },
    );
  }

  const stored = await getStorage().upload({
    buffer: output,
    fileName: `news-cover-${Date.now()}.webp`,
    mimeType: "image/webp",
    folder: "media/covers",
  });

  const media = await prisma.media.create({
    data: {
      fileName: `news-cover.webp`,
      fileUrl: stored.url,
      mimeType: "image/webp",
      fileSize: stored.size,
      width,
      height,
      altText,
      uploadedById: session.user.id,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    resource: "MEDIA",
    resourceId: media.id,
    newValue: {
      fileName: media.fileName,
      fileUrl: media.fileUrl,
      kind: "news-cover",
      width,
      height,
    },
  });

  return NextResponse.json({
    ok: true,
    media: {
      id: media.id,
      fileName: media.fileName,
      fileUrl: media.fileUrl,
      mimeType: media.mimeType,
      fileSize: media.fileSize,
      width: media.width,
      height: media.height,
      altText: media.altText,
    },
  });
}
