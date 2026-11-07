import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@cms/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPathInsideRoot } from "@/lib/path-safe";
import { hasPermission } from "@/lib/permissions/constants";
import { getLocalStorageRoot } from "@/lib/storage";
import { keyFromPublicUrl } from "@/lib/storage/validate";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  if (!hasPermission(session.user.permissions, "document:view")) {
    return NextResponse.json({ message: "Không có quyền tải xuống." }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: { id, deletedAt: null },
  });
  if (!doc) {
    return NextResponse.json({ message: "Không tìm thấy tài liệu." }, { status: 404 });
  }

  const key = keyFromPublicUrl(doc.fileUrl);
  if (!key) {
    return NextResponse.json({ message: "Đường dẫn file không hợp lệ." }, { status: 400 });
  }

  const root = getLocalStorageRoot();
  const fullPath = path.resolve(root, key);
  if (!isPathInsideRoot(root, fullPath)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(fullPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "Content-Length": String(data.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ message: "Không đọc được file." }, { status: 404 });
  }
}
