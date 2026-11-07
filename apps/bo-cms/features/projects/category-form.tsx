"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProjectCategoryAction,
  updateProjectCategoryAction,
} from "@/features/projects/actions";
import { slugify } from "@/lib/content/slug";

export function ProjectCategoryForm({
  initial,
}: {
  initial?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: "ACTIVE" | "INACTIVE";
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    initial?.status ?? "ACTIVE",
  );

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            const payload = { name, slug, description, status };
            const result = initial
              ? await updateProjectCategoryAction({ id: initial.id, ...payload })
              : await createProjectCategoryAction(payload);
            if (!result.ok) {
              notify.error(result.message ?? "Không thể lưu danh mục.");
              return;
            }
            notify.success(initial ? "Đã cập nhật danh mục." : "Đã tạo danh mục.");
            router.push("/projects/categories");
            router.refresh();

          } catch (error) {
            notify.unexpected(error);
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Tên danh mục</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
        <Label htmlFor="description">Mô tả</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Trạng thái</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="font-semibold">
          {pending ? "Đang lưu..." : "Lưu"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/projects/categories")}
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}
