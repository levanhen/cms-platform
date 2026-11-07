"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Folder, FolderOpen } from "lucide-react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMediaFolderAction } from "@/features/media/actions";
import { cn } from "@/lib/utils";

export type MediaItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  altText: string | null;
  folderId?: string | null;
};

type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  _count: { media: number; children: number };
};

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  canUpload = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  canUpload?: boolean;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("Gốc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [creatingFolder, startCreateFolder] = useTransition();
  const [newFolderName, setNewFolderName] = useState("");

  const load = useCallback(async (q = "", nextFolderId: string | null = folderId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("includeFolders", "1");
      if (q) params.set("search", q);
      params.set("folderId", nextFolderId ?? "root");
      const res = await fetch(`/api/media?${params.toString()}`);
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as {
        items: MediaItem[];
        folders?: FolderItem[];
      };
      setItems(data.items);
      setFolders(data.folders ?? []);
    } catch {
      notify.error("Không thể tải thư viện media.");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setFolderId(null);
      setFolderName("Gốc");
      void load(search, null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function openFolder(folder: FolderItem) {
    setFolderId(folder.id);
    setFolderName(folder.name);
    setSelected(new Set());
    void load(search, folder.id);
  }

  function goRoot() {
    setFolderId(null);
    setFolderName("Gốc");
    setSelected(new Set());
    void load(search, null);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (multiple) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }

  function confirmSelect() {
    const chosen = items.filter((item) => selected.has(item.id));
    if (chosen.length === 0) {
      notify.error("Chọn ít nhất một file.");
      return;
    }
    onSelect(chosen);
    onOpenChange(false);
  }

  function onUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    startUpload(async () => {
      try {
        const body = new FormData();
        body.append("file", file);
        if (folderId) body.append("folderId", folderId);
        const res = await fetch("/api/media/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          notify.error(data.message ?? "Tải lên thất bại.");
          return;
        }
        notify.success("Đã tải lên media.");
        await load(search, folderId);
        setSelected(new Set([data.media.id]));
      } catch (error) {
        notify.unexpected(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Thư viện media</DialogTitle>
          <DialogDescription>
            Chọn ảnh theo thư mục hoặc tải lên file mới.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-primary hover:underline"
            onClick={goRoot}
          >
            <FolderOpen className="h-4 w-4" />
            Gốc
          </button>
          {folderId ? (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{folderName}</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1 space-y-1">
            <Label htmlFor="media-search">Tìm kiếm</Label>
            <Input
              id="media-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên file..."
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void load(search, folderId)}
            disabled={loading}
          >
            Lọc
          </Button>
          {canUpload ? (
            <>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Tên thư mục mới"
                className="h-10 w-40"
              />
              <Button
                type="button"
                variant="outline"
                disabled={creatingFolder || !newFolderName.trim()}
                onClick={() => {
                  startCreateFolder(async () => {
                    try {
                      const result = await createMediaFolderAction({
                        name: newFolderName.trim(),
                        parentId: folderId,
                      });
                      if (!result.ok) {
                        notify.error(result.message ?? "Không thể tạo thư mục.");
                        return;
                      }
                      notify.success("Đã tạo thư mục.");
                      setNewFolderName("");
                      await load(search, folderId);
                    } catch (error) {
                      notify.unexpected(error);
                    }
                  });
                }}
              >
                Tạo thư mục
              </Button>
              <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-blue-700">
                {uploading ? "Đang tải..." : "Tải lên"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => onUpload(e.target.files)}
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="max-h-[45vh] space-y-3 overflow-y-auto rounded-lg border border-border p-2">
          {folders.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => openFolder(folder)}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Đang tải...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Chưa có media trong thư mục này.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => {
                const active = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={cn(
                      "overflow-hidden rounded-lg border text-left",
                      active ? "border-primary ring-2 ring-primary/30" : "border-border",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.fileUrl}
                      alt={item.altText ?? item.fileName}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="truncate px-2 py-1 text-xs">{item.fileName}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={confirmSelect}>
            Chọn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
