import { prisma } from "@cms/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions/constants";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }
  if (!hasPermission(session.user.permissions, "media:view")) {
    return NextResponse.json({ message: "Không có quyền." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const folderId = searchParams.get("folderId");
  const includeFolders = searchParams.get("includeFolders") === "1";

  const folderFilter =
    folderId === null || folderId === undefined
      ? undefined
      : folderId === "" || folderId === "root"
        ? { folderId: null }
        : { folderId };

  const items = await prisma.media.findMany({
    where: {
      ...folderFilter,
      ...(search
        ? {
            OR: [
              { fileName: { contains: search, mode: "insensitive" } },
              { altText: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      mimeType: true,
      fileSize: true,
      altText: true,
      folderId: true,
    },
  });

  if (!includeFolders) {
    return NextResponse.json({ items });
  }

  const parentId =
    !folderId || folderId === "" || folderId === "root" ? null : folderId;

  const folders = await prisma.mediaFolder.findMany({
    where: { parentId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      parentId: true,
      _count: { select: { media: true, children: true } },
    },
  });

  return NextResponse.json({ items, folders });
}
