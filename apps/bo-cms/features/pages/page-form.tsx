"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { ImageField, RichTextEditor } from "@/components/editors/lazy";
import {
  ContentFormLayout,
  FormSection,
} from "@/components/layout/content-form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CONTENT_STATUS_LABELS,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import {
  createPageAction,
  publishPageAction,
  updatePageAction,
} from "@/features/pages/actions";
import { slugify } from "@/lib/content/slug";

type PageInitial = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ContentStatusValue;
};

export function PageForm({
  initial,
  canPublish,
}: {
  initial?: PageInitial;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  function payload() {
    return {
      title,
      slug,
      summary,
      content,
      featuredImage,
      seoTitle,
      seoDescription,
    };
  }

  function save(andPublish: boolean) {
    startTransition(async () => {
      try {
        const result = initial
          ? await updatePageAction({ id: initial.id, ...payload() })
          : await createPageAction(payload());

        if (!result.ok) {
          notify.error("message" in result ? result.message : "Không thể lưu trang.");
          return;
        }

        let pageId = initial?.id;
        if (!pageId && "id" in result && typeof result.id === "string") {
          pageId = result.id;
        }

        if (andPublish && pageId && canPublish) {
          const publishResult = await publishPageAction(pageId);
          if (!publishResult.ok) {
            notify.error(
              "message" in publishResult
                ? publishResult.message
                : "Đã lưu nhưng không thể xuất bản.",
            );
            router.push(`/pages/${pageId}`);
            router.refresh();
            return;
          }
          notify.success("Đã lưu và xuất bản trang.");
        } else {
          notify.success(initial ? "Đã cập nhật trang." : "Đã tạo trang (nháp).");
        }

        router.push("/pages");
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
              <p className="text-xs text-muted-foreground">
                Lưu nháp giữ bản nháp. Xuất bản cần quyền `page:publish`.
              </p>
            </FormSection>
            <FormSection title="Ảnh & phụ">
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
              onClick={() => router.push("/pages")}
            >
              Hủy
            </Button>
          </>
        }
      />
    </form>
  );
}
