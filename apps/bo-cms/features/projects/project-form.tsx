"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { ImageField, MediaPicker, RichTextEditor } from "@/components/editors/lazy";
import {
  ContentFormLayout,
  FormSection,
} from "@/components/layout/content-form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProjectAction,
  publishProjectAction,
  updateProjectAction,
} from "@/features/projects/actions";
import {
  CONTENT_STATUS_LABELS,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import { slugify } from "@/lib/content/slug";

type CategoryOption = { id: string; name: string };

type ProjectInitial = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  clientName: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  featuredImage: string | null;
  gallery: string;
  categoryId: string | null;
  displayOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ContentStatusValue;
};

export function ProjectForm({
  initial,
  categories,
  canPublish,
}: {
  initial?: ProjectInitial;
  categories: CategoryOption[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [gallery, setGallery] = useState(initial?.gallery ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    String(initial?.displayOrder ?? 0),
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seoDescription ?? "",
  );

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const galleryUrls = gallery
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  function payload() {
    return {
      title,
      slug,
      summary,
      content,
      clientName,
      location,
      startDate,
      endDate,
      featuredImage,
      gallery,
      categoryId,
      displayOrder: Number(displayOrder) || 0,
      seoTitle,
      seoDescription,
    };
  }

  function save(andPublish: boolean) {
    startTransition(async () => {
      try {
        const result = initial
          ? await updateProjectAction({ id: initial.id, ...payload() })
          : await createProjectAction(payload());

        if (!result.ok) {
          notify.error("message" in result ? result.message : "Không thể lưu dự án.");
          return;
        }

        let projectId = initial?.id;
        if (!projectId && "id" in result && typeof result.id === "string") {
          projectId = result.id;
        }

        if (andPublish && projectId && canPublish) {
          const publishResult = await publishProjectAction(projectId);
          if (!publishResult.ok) {
            notify.error(
              "message" in publishResult
                ? publishResult.message
                : "Đã lưu nhưng không thể xuất bản.",
            );
            router.push(`/projects/${projectId}`);
            router.refresh();
            return;
          }
          notify.success("Đã lưu và xuất bản dự án.");
        } else {
          notify.success(initial ? "Đã cập nhật dự án." : "Đã tạo dự án (nháp).");
        }

        router.push("/projects");
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
        save(false);
      }}
    >
      <ContentFormLayout
        main={
          <>
            <FormSection title="Nội dung chính">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  onBlur={() => setSlug(slugify(slug || title))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Tóm tắt</Label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Thư viện ảnh</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setGalleryOpen(true)}
                  >
                    Chọn / tải lên
                  </Button>
                </div>
                {galleryUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {galleryUrls.map((url) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="aspect-square rounded-md object-cover"
                        />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-background/90 px-1.5 text-xs"
                          onClick={() =>
                            setGallery(
                              galleryUrls.filter((item) => item !== url).join("\n"),
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Chưa có ảnh gallery.</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Chọn ảnh từ thư viện media (không dán URL ngoài).
                </p>
              </div>
            </FormSection>
            <FormSection title="SEO">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO title</Label>
                <Input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO description</Label>
                <textarea
                  id="seoDescription"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </FormSection>
          </>
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
            <FormSection title="Thông tin phụ">
              <div className="space-y-2">
                <Label htmlFor="clientName">Khách hàng</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="categoryId">Danh mục</Label>
                  <Link
                    href="/projects/categories"
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
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Thứ tự hiển thị</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                />
              </div>
              <ImageField value={featuredImage} onChange={setFeaturedImage} />
            </FormSection>
          </>
        }
        actions={
          <>
            <Button type="submit" disabled={pending} className="font-semibold">
              {pending ? "Đang lưu..." : initial ? "Lưu" : "Lưu nháp"}
            </Button>
            {canPublish && (!initial || initial.status !== "PUBLISHED") ? (
              <Button variant="success" className="font-semibold" type="button" disabled={pending} onClick={() => save(true)}>
                {pending ? "Đang xử lý..." : "Lưu & Xuất bản"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/projects")}
            >
              Hủy
            </Button>
          </>
        }
      />
      <MediaPicker
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        multiple
        onSelect={(items) => {
          const urls = [...galleryUrls, ...items.map((item) => item.fileUrl)];
          setGallery(Array.from(new Set(urls)).join("\n"));
        }}
      />
    </form>
  );
}
