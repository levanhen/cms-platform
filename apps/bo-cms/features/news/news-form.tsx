"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { NewsCoverField, RichTextEditor } from "@/components/editors/lazy";
import {
  ContentFormLayout,
  FormSection,
} from "@/components/layout/content-form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createNewsAction,
  publishNewsAction,
  updateNewsAction,
} from "@/features/news/actions";
import {
  CONTENT_STATUS_LABELS,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import { slugify } from "@/lib/content/slug";

type CategoryOption = { id: string; name: string };

type NewsInitial = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: string | null;
  categoryId: string | null;
  tagNames: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  status: ContentStatusValue;
};

export function NewsForm({
  initial,
  categories,
  canPublish,
}: {
  initial?: NewsInitial;
  categories: CategoryOption[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [tagInput, setTagInput] = useState((initial?.tagNames ?? []).join(", "));
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seoDescription ?? "",
  );

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  function payload() {
    return {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      categoryId,
      tagNames: tagInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      seoTitle,
      seoDescription,
    };
  }

  function save(andPublish: boolean) {
    startTransition(async () => {
      try {
        const result = initial
          ? await updateNewsAction({ id: initial.id, ...payload() })
          : await createNewsAction(payload());

        if (!result.ok) {
          notify.error("message" in result ? result.message : "Không thể lưu tin.");
          return;
        }

        let newsId = initial?.id;
        if (!newsId && "id" in result && typeof result.id === "string") {
          newsId = result.id;
        }

        if (andPublish && newsId && canPublish) {
          const publishResult = await publishNewsAction(newsId);
          if (!publishResult.ok) {
            notify.error(
              "message" in publishResult
                ? publishResult.message
                : "Đã lưu nhưng không thể xuất bản.",
            );
            router.push(`/news/${newsId}`);
            router.refresh();
            return;
          }
          notify.success("Đã lưu và xuất bản tin.");
        } else {
          notify.success(initial ? "Đã cập nhật tin." : "Đã tạo tin (nháp).");
        }

        router.push("/news");
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
                <Label htmlFor="excerpt">Đoạn trích</Label>
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <RichTextEditor value={content} onChange={setContent} />
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
            <FormSection title="Phân loại">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="categoryId">Danh mục</Label>
                  <Link
                    href="/news/categories"
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
                <Label htmlFor="tags">Thẻ (phân tách bằng dấu phẩy)</Label>
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="tin-tuc, su-kien"
                />
              </div>
              <NewsCoverField
                value={featuredImage}
                onChange={setFeaturedImage}
              />
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
            <Button type="button" variant="outline" onClick={() => router.push("/news")}>
              Hủy
            </Button>
          </>
        }
      />
    </form>
  );
}
