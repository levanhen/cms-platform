import { ContentStatus, prisma } from "@cms/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions/constants";
import { getStorage } from "@/lib/storage";
import {
  getFileExtension,
  isAllowedDocumentFile,
  resolveMaxUploadBytes,
} from "@/lib/storage/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  if (!hasPermission(session.user.permissions, "document:create")) {
    return NextResponse.json({ message: "Không có quyền tải lên." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const titleRaw = formData.get("title");
  const descriptionRaw = formData.get("description");
  const categoryRaw = formData.get("categoryId");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Thiếu file tải lên." }, { status: 400 });
  }

  if (!isAllowedDocumentFile(file.name, file.type || "application/octet-stream")) {
    return NextResponse.json(
      {
        message:
          "File không hợp lệ. Chỉ hỗ trợ PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT.",
      },
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

  const title =
    typeof titleRaw === "string" && titleRaw.trim()
      ? titleRaw.trim()
      : file.name.replace(/\.[^.]+$/, "");
  const description =
    typeof descriptionRaw === "string" && descriptionRaw.trim()
      ? descriptionRaw.trim()
      : null;
  const categoryId =
    typeof categoryRaw === "string" && categoryRaw.trim()
      ? categoryRaw.trim()
      : null;

  if (categoryId) {
    const category = await prisma.documentCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json({ message: "Không tìm thấy danh mục." }, { status: 400 });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await getStorage().upload({
    buffer,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    folder: "documents",
  });

  const ext = getFileExtension(file.name);
  const doc = await prisma.document.create({
    data: {
      title,
      description,
      fileName: file.name,
      fileUrl: stored.url,
      fileType: ext || file.type || "bin",
      fileSize: stored.size,
      categoryId,
      status: ContentStatus.DRAFT,
      uploadedById: session.user.id,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    resource: "DOCUMENT",
    resourceId: doc.id,
    newValue: {
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.status,
    },
  });

  return NextResponse.json({ ok: true, id: doc.id });
}
