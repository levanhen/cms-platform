"use client";

import { useState, useTransition } from "react";
import { notify } from "@/lib/notify";
import { ImageField } from "@/components/editors/lazy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateSettingsAction,
  type SettingsFormInput,
} from "@/features/settings/actions";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "Chung" },
  { id: "contact", label: "Liên hệ" },
  { id: "seo", label: "SEO" },
  { id: "media", label: "Media" },
  { id: "system", label: "Hệ thống" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsForm({
  initial,
  canUpdate,
  canUploadMedia,
}: {
  initial: SettingsFormInput;
  canUpdate: boolean;
  canUploadMedia: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<TabId>("general");
  const [form, setForm] = useState(initial);

  function setField<K extends keyof SettingsFormInput>(
    key: K,
    value: SettingsFormInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canUpdate) return;
    startTransition(async () => {
      try {
        const result = await updateSettingsAction(form);
        if (!result.ok) {
          notify.error(result.message ?? "Không thể lưu cài đặt.");
          return;
        }
        notify.success("Đã lưu cài đặt.");
      } catch (error) {
        notify.unexpected(error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="grid max-w-2xl gap-4">
          <div className="space-y-2">
            <Label htmlFor="site_name">Tên site</Label>
            <Input
              id="site_name"
              value={form.site_name}
              disabled={!canUpdate}
              onChange={(e) => setField("site_name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_description">Mô tả</Label>
            <textarea
              id="site_description"
              value={form.site_description}
              disabled={!canUpdate}
              onChange={(e) => setField("site_description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
          <ImageField
            label="Logo"
            value={form.logo ?? ""}
            canUpload={canUpdate && canUploadMedia}
            onChange={(url) => setField("logo", url)}
          />
          <ImageField
            label="Favicon"
            value={form.favicon ?? ""}
            canUpload={canUpdate && canUploadMedia}
            onChange={(url) => setField("favicon", url)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_language">Ngôn ngữ mặc định</Label>
              <Input
                id="default_language"
                value={form.default_language}
                disabled={!canUpdate}
                onChange={(e) => setField("default_language", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Múi giờ</Label>
              <Input
                id="timezone"
                value={form.timezone}
                disabled={!canUpdate}
                onChange={(e) => setField("timezone", e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {tab === "contact" ? (
        <div className="grid max-w-2xl gap-4">
          <p className="text-sm text-muted-foreground">
            Thông tin này hiển thị trên header/footer website công khai.
          </p>
          <div className="space-y-2">
            <Label htmlFor="contact_address">Địa chỉ</Label>
            <textarea
              id="contact_address"
              value={form.contact_address}
              disabled={!canUpdate}
              onChange={(e) => setField("contact_address", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
              placeholder="275 South Poal, 4th Floor Central Plaza, Main Town"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Điện thoại</Label>
            <Input
              id="contact_phone"
              value={form.contact_phone}
              disabled={!canUpdate}
              onChange={(e) => setField("contact_phone", e.target.value)}
              placeholder="(+84) 0123 456 789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              disabled={!canUpdate}
              onChange={(e) => setField("contact_email", e.target.value)}
              placeholder="info@example.com"
            />
          </div>
        </div>
      ) : null}

      {tab === "seo" ? (
        <div className="grid max-w-2xl gap-4">
          <div className="space-y-2">
            <Label htmlFor="default_seo_title">SEO title mặc định</Label>
            <Input
              id="default_seo_title"
              value={form.default_seo_title}
              disabled={!canUpdate}
              onChange={(e) => setField("default_seo_title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_seo_description">SEO description mặc định</Label>
            <textarea
              id="default_seo_description"
              value={form.default_seo_description}
              disabled={!canUpdate}
              onChange={(e) =>
                setField("default_seo_description", e.target.value)
              }
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
        </div>
      ) : null}

      {tab === "media" ? (
        <div className="grid max-w-2xl gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_upload_size_mb">Giới hạn upload (MB)</Label>
            <Input
              id="max_upload_size_mb"
              type="number"
              min={1}
              max={200}
              value={form.max_upload_size_mb}
              disabled={!canUpdate}
              onChange={(e) =>
                setField("max_upload_size_mb", Number(e.target.value) || 1)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowed_image_mimes">MIME ảnh cho phép</Label>
            <Input
              id="allowed_image_mimes"
              value={form.allowed_image_mimes}
              disabled={!canUpdate}
              onChange={(e) => setField("allowed_image_mimes", e.target.value)}
              placeholder="image/jpeg,image/png,..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowed_document_mimes">MIME tài liệu cho phép</Label>
            <Input
              id="allowed_document_mimes"
              value={form.allowed_document_mimes}
              disabled={!canUpdate}
              onChange={(e) =>
                setField("allowed_document_mimes", e.target.value)
              }
              placeholder="application/pdf,..."
            />
          </div>
        </div>
      ) : null}

      {tab === "system" ? (
        <div className="max-w-2xl space-y-4">
          <label className="flex items-center gap-3 rounded-lg border border-border p-4">
            <input
              type="checkbox"
              checked={form.maintenance_mode}
              disabled={!canUpdate}
              onChange={(e) => setField("maintenance_mode", e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <div className="text-sm font-medium">Chế độ bảo trì</div>
              <div className="text-xs text-muted-foreground">
                Dự phòng cho Web (Phase 5) — chưa chặn BO.
              </div>
            </div>
          </label>
        </div>
      ) : null}

      {canUpdate ? (
        <Button type="submit" disabled={pending} className="font-semibold">
          {pending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Bạn chỉ có quyền xem cài đặt.
        </p>
      )}
    </form>
  );
}
