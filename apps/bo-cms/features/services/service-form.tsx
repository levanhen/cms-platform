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
  createServiceAction,
  publishServiceAction,
  updateServiceAction,
} from "@/features/services/actions";
import {
  CONTENT_STATUS_LABELS,
  type ContentStatusValue,
} from "@/lib/content/lifecycle";
import { slugify } from "@/lib/content/slug";

type ServiceInitial = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  icon: string | null;
  featuredImage: string | null;
  category: string | null;
  price: string | null;
  displayOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ContentStatusValue;
};

export function ServiceForm({
  initial,
  canPublish,
}: {
  initial?: ServiceInitial;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [shortDescription, setShortDescription] = useState(
    initial?.shortDescription ?? "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    String(initial?.displayOrder ?? 0),
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seoDescription ?? "",
  );

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  function payload() {
    return {
      name,
      slug,
      shortDescription,
      description,
      icon,
      featuredImage,
      category,
      price,
      displayOrder: Number(displayOrder) || 0,
      seoTitle,
      seoDescription,
    };
  }

  function save(andPublish: boolean) {
    startTransition(async () => {
      try {
        const result = initial
          ? await updateServiceAction({ id: initial.id, ...payload() })
          : await createServiceAction(payload());

        if (!result.ok) {
          notify.error("message" in result ? result.message : "Không thể lưu dịch vụ.");
          return;
        }

        let serviceId = initial?.id;
        if (!serviceId && "id" in result && typeof result.id === "string") {
          serviceId = result.id;
        }

        if (andPublish && serviceId && canPublish) {
          const publishResult = await publishServiceAction(serviceId);
          if (!publishResult.ok) {
            notify.error(
              "message" in publishResult
                ? publishResult.message
                : "Đã lưu nhưng không thể xuất bản.",
            );
            router.push(`/services/${serviceId}`);
            router.refresh();
            return;
          }
          notify.success("Đã lưu và xuất bản dịch vụ.");
        } else {
          notify.success(initial ? "Đã cập nhật dịch vụ." : "Đã tạo dịch vụ (nháp).");
        }

        router.push("/services");
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
                <Label htmlFor="name">Tên dịch vụ</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  onBlur={() => setSlug(slugify(slug || name))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Mô tả ngắn</Label>
                <textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả chi tiết</Label>
                <RichTextEditor value={description} onChange={setDescription} />
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
                <Label htmlFor="category">Danh mục</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
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
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="lucide:briefcase"
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
              onClick={() => router.push("/services")}
            >
              Hủy
            </Button>
          </>
        }
      />
    </form>
  );
}
