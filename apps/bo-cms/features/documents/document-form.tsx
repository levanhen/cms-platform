"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { notify } from "@/lib/notify";
import {
  ContentFormLayout,
  FormSection,
} from "@/components/layout/content-form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  publishDocumentAction,
  updateDocumentAction,
} from "@/features/documents/actions";
import {
  CONTENT_STATUS_LABELS,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";

type CategoryOption = { id: string; name: string };

type DocumentInitial = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: ContentStatusValue;
};

export function DocumentForm({
  initial,
  categories,
  canPublish,
  mode = "edit",
}: {
  initial?: DocumentInitial;
  categories: CategoryOption[];
  canPublish: boolean;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [file, setFile] = useState<File | null>(null);

  function onSubmit(andPublish: boolean) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          if (!file) {
            notify.error("Vui lòng chọn file tài liệu.");
            return;
          }
          const body = new FormData();
          body.append("file", file);
          body.append("title", title || file.name);
          if (description.trim()) body.append("description", description.trim());
          if (categoryId) body.append("categoryId", categoryId);

          const res = await fetch("/api/documents/upload", { method: "POST", body });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            notify.error(data.message ?? "Tải lên thất bại.");
            return;
          }

          if (andPublish && canPublish && data.id) {
            const publishResult = await publishDocumentAction(data.id);
            if (!publishResult.ok) {
              notify.error(
                "message" in publishResult
                  ? publishResult.message
                  : "Đã tải lên nhưng không xuất bản được.",
              );
              router.push(`/documents/${data.id}`);
              router.refresh();
              return;
            }
            notify.success("Đã tải lên và xuất bản tài liệu.");
          } else {
            notify.success("Đã tải lên tài liệu (nháp).");
          }
          router.push("/documents");
          router.refresh();
          return;
        }

        if (!initial) return;
        const result = await updateDocumentAction({
          id: initial.id,
          title,
          description,
          categoryId,
        });
        if (!result.ok) {
          notify.error(result.message ?? "Không thể lưu.");
          return;
        }

        if (andPublish && canPublish && initial.status !== "PUBLISHED") {
          const publishResult = await publishDocumentAction(initial.id);
          if (!publishResult.ok) {
            notify.error(
              "message" in publishResult
                ? publishResult.message
                : "Đã lưu nhưng không xuất bản được.",
            );
            router.refresh();
            return;
          }
          notify.success("Đã lưu và xuất bản tài liệu.");
        } else {
          notify.success("Đã cập nhật tài liệu.");
        }
        router.push("/documents");
        router.refresh();
      } catch (error) {
        notify.unexpected(error);
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(false);
      }}
    >
      <ContentFormLayout
        main={
          <FormSection title="Thông tin tài liệu">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required={mode === "edit"}
                placeholder={mode === "create" ? "Để trống sẽ lấy tên file" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {mode === "create" ? (
              <div className="space-y-2">
                <Label htmlFor="file">File tài liệu</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <div>
                  File: <span className="font-medium">{initial?.fileName}</span>
                </div>
                <div className="text-muted-foreground">
                  Loại: {initial?.fileType} · {initial?.fileSize.toLocaleString("vi-VN")}{" "}
                  bytes
                </div>
              </div>
            )}
          </FormSection>
        }
        side={
          <>
            <FormSection title="Xuất bản">
              <div className="text-sm">
                <div className="text-muted-foreground">Trạng thái</div>
                <div className="font-medium">
                  {initial
                    ? CONTENT_STATUS_LABELS[initial.status]
                    : CONTENT_STATUS_LABELS.DRAFT}
                </div>
              </div>
            </FormSection>
            <FormSection title="Phân loại">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="categoryId">Danh mục</Label>
                  <Link
                    href="/documents/categories"
                    className="text-xs text-primary hover:underline"
                  >
                    Quản lý danh mục
                  </Link>
                </div>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">— Không chọn —</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormSection>
          </>
        }
        actions={
          <>
            <Button type="submit" disabled={pending} className="font-semibold">
              {pending
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tải lên (nháp)"
                  : "Lưu"}
            </Button>
            {canPublish && (!initial || initial.status !== "PUBLISHED") ? (
              <Button
                type="button"
                variant="success"
                className="font-semibold"
                disabled={pending}
                onClick={() => onSubmit(true)}
              >
                {pending ? "Đang xử lý..." : "Lưu & Xuất bản"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/documents")}
            >
              Hủy
            </Button>
          </>
        }
      />
    </form>
  );
}
