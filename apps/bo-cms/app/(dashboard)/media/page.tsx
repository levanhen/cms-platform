import Link from "next/link";
import { Folder, FolderOpen } from "lucide-react";
import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/layout/filter-bar";
import { Button } from "@/components/ui/button";
import { CreateFolderButton } from "@/features/media/create-folder-button";
import { DeleteFolderButton } from "@/features/media/delete-folder-button";
import {
  MediaCardActions,
  MediaMeta,
} from "@/features/media/media-card-actions";
import { MediaUploadButton } from "@/features/media/media-upload-button";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";
import { cn } from "@/lib/utils";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; folderId?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "media:view");

  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const folderId = params.folderId?.trim() || null;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const limit = 24;

  const currentFolder = folderId
    ? await prisma.mediaFolder.findUnique({ where: { id: folderId } })
    : null;

  if (folderId && !currentFolder) {
    redirect("/media");
  }

  const where = {
    folderId: folderId,
    ...(search
      ? {
          OR: [
            { fileName: { contains: search, mode: "insensitive" as const } },
            { altText: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items, folders, rootFolders] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        mimeType: true,
        fileSize: true,
        altText: true,
        folderId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mediaFolder.findMany({
      where: { parentId: folderId },
      orderBy: { name: "asc" },
      include: { _count: { select: { media: true, children: true } } },
    }),
    prisma.mediaFolder.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { media: true } } },
    }),
  ]);

  const canCreate = hasPermission(session?.user.permissions, "media:create");
  const canDelete = hasPermission(session?.user.permissions, "media:delete");
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefFor(nextPage: number, nextFolderId: string | null = folderId) {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (search) query.set("search", search);
    if (nextFolderId) query.set("folderId", nextFolderId);
    return `/media?${query.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Thư viện media"
        description={
          currentFolder
            ? `Thư mục: ${currentFolder.name}`
            : "Upload và phân loại ảnh theo thư mục"
        }
        breadcrumbs={[{ label: "Thư viện media" }]}
        actions={
          canCreate ? (
            <div className="flex flex-wrap gap-2">
              <CreateFolderButton parentId={folderId} />
              <MediaUploadButton folderId={folderId} />
            </div>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Thư mục
          </div>
          <Link
            href="/media"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted",
              !folderId && "bg-accent text-accent-foreground",
            )}
          >
            <FolderOpen className="h-4 w-4" />
            Tất cả / Gốc
          </Link>
          {rootFolders.map((folder) => (
            <Link
              key={folder.id}
              href={`/media?folderId=${folder.id}`}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted",
                folderId === folder.id && "bg-accent text-accent-foreground",
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <Folder className="h-4 w-4 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {folder._count.media}
              </span>
            </Link>
          ))}
        </aside>

        <div>
          <FilterBar
            fields={[
              {
                type: "search",
                defaultValue: search,
                placeholder: "Tìm theo tên file, alt...",
              },
            ]}
            hiddenFields={folderId ? { folderId } : undefined}
          >
            {folderId && canDelete ? (
              <DeleteFolderButton folderId={folderId} />
            ) : null}
          </FilterBar>

          {folders.length > 0 ? (
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/media?folderId=${folder.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/40"
                >
                  <Folder className="h-8 w-8 text-primary" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{folder.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {folder._count.media} ảnh · {folder._count.children} thư mục con
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {items.length === 0 && folders.length === 0 ? (
            <EmptyState title="Thư mục trống." />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có ảnh trong thư mục này.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.fileUrl}
                    alt={item.altText ?? item.fileName}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="space-y-1 p-3">
                    <div className="truncate text-sm font-medium">{item.fileName}</div>
                    <MediaMeta fileSize={item.fileSize} createdAt={item.createdAt} />
                    {canDelete ? (
                      <MediaCardActions mediaId={item.id} fileUrl={item.fileUrl} />
                    ) : (
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <a href={item.fileUrl} target="_blank" rel="noreferrer">
                          Xem
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Trang {page}/{totalPages} · {total} ảnh
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link className="text-primary hover:underline" href={hrefFor(page - 1)}>
                  Trước
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link className="text-primary hover:underline" href={hrefFor(page + 1)}>
                  Sau
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
