import { prisma } from "@cms/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/constants";
import { getStorage } from "@/lib/storage";
import { isAllowedImageMime, resolveMaxUploadBytes } from "@/lib/storage/validate";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  if (!hasPermission(session.user.permissions, "media:create")) {
    return NextResponse.json(
      { message: "Bạn không có quyền tải lên media." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const altTextRaw = formData.get("altText");
  const folderIdRaw = formData.get("folderId");
  const altText =
    typeof altTextRaw === "string" && altTextRaw.trim()
      ? altTextRaw.trim()
      : null;
  const folderId =
    typeof folderIdRaw === "string" && folderIdRaw.trim()
      ? folderIdRaw.trim()
      : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Thiếu file tải lên." }, { status: 400 });
  }

  if (!isAllowedImageMime(file.type)) {
    return NextResponse.json(
      { message: "Chỉ hỗ trợ ảnh JPEG, PNG, WebP, GIF." },
      { status: 400 },
    );
  }

  const maxBytes = await resolveMaxUploadBytes();
  if (file.size > maxBytes) {
    return NextResponse.json(
      { message: `File vượt quá giới hạn ${Math.round(maxBytes / (1024 * 1024))}MB.` },
      { status: 400 },
    );
  }

  if (folderId) {
    const folder = await prisma.mediaFolder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ message: "Không tìm thấy thư mục." }, { status: 400 });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await getStorage().upload({
    buffer,
    fileName: file.name,
    mimeType: file.type,
    folder: folderId ? `media/${folderId}` : "media",
  });

  const media = await prisma.media.create({
    data: {
      fileName: file.name,
      fileUrl: stored.url,
      mimeType: file.type,
      fileSize: stored.size,
      altText,
      folderId,
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
      folderId: media.folderId,
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
      altText: media.altText,
      folderId: media.folderId,
    },
  });
}
