import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import type { SettingsFormInput } from "@/features/settings/actions";
import { SettingsForm } from "@/features/settings/settings-form";
import { hasPermission } from "@/lib/permissions/constants";
import { requirePagePermission } from "@/lib/permissions/require-page";

const DEFAULTS: SettingsFormInput = {
  site_name: "CMS Platform",
  site_description: "",
  logo: "",
  favicon: "",
  default_language: "vi",
  timezone: "Asia/Ho_Chi_Minh",
  contact_address: "275 South Poal, 4th Floor Central Plaza, Main Town",
  contact_phone: "(+84) 0123 456 789",
  contact_email: "info@example.com",
  default_seo_title: "",
  default_seo_description: "",
  max_upload_size_mb: 20,
  allowed_image_mimes: "image/jpeg,image/png,image/webp,image/gif",
  allowed_document_mimes:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain",
  maintenance_mode: false,
};

function readString(value: unknown, fallback: string) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export default async function SettingsPage() {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "setting:view");

  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));

  const initial: SettingsFormInput = {
    site_name: readString(map.get("site_name"), DEFAULTS.site_name),
    site_description: readString(
      map.get("site_description"),
      DEFAULTS.site_description,
    ),
    logo: readString(map.get("logo"), DEFAULTS.logo ?? ""),
    favicon: readString(map.get("favicon"), DEFAULTS.favicon ?? ""),
    default_language: readString(
      map.get("default_language"),
      DEFAULTS.default_language,
    ),
    timezone: readString(map.get("timezone"), DEFAULTS.timezone),
    contact_address: readString(map.get("contact_address"), DEFAULTS.contact_address),
    contact_phone: readString(map.get("contact_phone"), DEFAULTS.contact_phone),
    contact_email: readString(map.get("contact_email"), DEFAULTS.contact_email),
    default_seo_title: readString(
      map.get("default_seo_title"),
      DEFAULTS.default_seo_title,
    ),
    default_seo_description: readString(
      map.get("default_seo_description"),
      DEFAULTS.default_seo_description,
    ),
    max_upload_size_mb: readNumber(
      map.get("max_upload_size_mb"),
      DEFAULTS.max_upload_size_mb,
    ),
    allowed_image_mimes: readString(
      map.get("allowed_image_mimes"),
      DEFAULTS.allowed_image_mimes,
    ),
    allowed_document_mimes: readString(
      map.get("allowed_document_mimes"),
      DEFAULTS.allowed_document_mimes,
    ),
    maintenance_mode: readBoolean(
      map.get("maintenance_mode"),
      DEFAULTS.maintenance_mode,
    ),
  };

  return (
    <div>
      <PageHeader
        title="Cài đặt"
        description="Cấu hình hệ thống theo nhóm"
      
        breadcrumbs={[{ label: "Cài đặt" }]}
      />
      <SettingsForm
        initial={initial}
        canUpdate={hasPermission(session?.user.permissions, "setting:update")}
        canUploadMedia={hasPermission(session?.user.permissions, "media:create")}
      />
    </div>
  );
}
