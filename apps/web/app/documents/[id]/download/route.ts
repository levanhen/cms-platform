import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getPublishedDocumentForDownload } from "@/lib/queries/published";
import { keyFromPublicUrl, resolveStoragePath } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const doc = await getPublishedDocumentForDownload(id);
  if (!doc) {
    return NextResponse.json({ message: "Không tìm thấy tài liệu." }, { status: 404 });
  }

  const key = keyFromPublicUrl(doc.fileUrl);
  if (!key) {
    return NextResponse.json({ message: "Đường dẫn file không hợp lệ." }, { status: 400 });
  }

  const fullPath = resolveStoragePath(key);
  if (!fullPath) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(fullPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": doc.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "Không đọc được file." }, { status: 404 });
  }
}
