"use server";

import { prisma, type Prisma } from "@cms/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, toActionError } from "@/lib/permissions/assert";
import { triggerWebRevalidate } from "@/lib/revalidate";
import { isStoredMediaUrl } from "@/lib/storage/validate";

const settingsSchema = z.object({
  site_name: z.string().min(1).max(200),
  site_description: z.string().max(500),
  logo: z.string().max(500).optional().or(z.literal("")),
  favicon: z.string().max(500).optional().or(z.literal("")),
  default_language: z.string().min(2).max(10),
  timezone: z.string().min(1).max(100),
  contact_address: z.string().max(500),
  contact_phone: z.string().max(100),
  contact_email: z
    .string()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Email liên hệ không hợp lệ.",
    }),
  default_seo_title: z.string().max(200),
  default_seo_description: z.string().max(500),
  max_upload_size_mb: z.coerce.number().int().min(1).max(200),
  allowed_image_mimes: z.string().max(500),
  allowed_document_mimes: z.string().max(500),
  maintenance_mode: z.boolean(),
});

export type SettingsFormInput = z.infer<typeof settingsSchema>;

const SETTING_META: Record<
  keyof SettingsFormInput,
  { groupName: string }
> = {
  site_name: { groupName: "general" },
  site_description: { groupName: "general" },
  logo: { groupName: "general" },
  favicon: { groupName: "general" },
  default_language: { groupName: "general" },
  timezone: { groupName: "general" },
  contact_address: { groupName: "contact" },
  contact_phone: { groupName: "contact" },
  contact_email: { groupName: "contact" },
  default_seo_title: { groupName: "seo" },
  default_seo_description: { groupName: "seo" },
  max_upload_size_mb: { groupName: "media" },
  allowed_image_mimes: { groupName: "media" },
  allowed_document_mimes: { groupName: "media" },
  maintenance_mode: { groupName: "system" },
};

function toJsonValue(value: string | number | boolean): Prisma.InputJsonValue {
  return value;
}

export async function updateSettingsAction(input: SettingsFormInput) {
  try {
    const session = await assertPermission("setting:update");
    const data = settingsSchema.parse(input);

    if (!isStoredMediaUrl(data.logo || null) || !isStoredMediaUrl(data.favicon || null)) {
      return {
        ok: false as const,
        message: "Logo/favicon phải tải lên qua thư viện media, không dùng URL ngoài.",
      };
    }

    const keys = Object.keys(SETTING_META) as (keyof SettingsFormInput)[];
    const existing = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });
    const existingMap = new Map(existing.map((row) => [row.key, row]));

    const oldValue: Record<string, Prisma.InputJsonValue | null> = {};
    const newValue: Record<string, Prisma.InputJsonValue> = {};

    for (const key of keys) {
      const value = data[key];
      const normalized: string | number | boolean =
        value === undefined || value === null
          ? ""
          : typeof value === "string" &&
              value.trim() === "" &&
              (key === "logo" || key === "favicon")
            ? ""
            : value;

      oldValue[key] =
        (existingMap.get(key)?.value as Prisma.InputJsonValue | null) ?? null;
      newValue[key] = normalized;

      await prisma.setting.upsert({
        where: { key },
        update: {
          value: toJsonValue(normalized),
          groupName: SETTING_META[key].groupName,
          updatedById: session.user.id,
        },
        create: {
          key,
          value: toJsonValue(normalized),
          groupName: SETTING_META[key].groupName,
          updatedById: session.user.id,
        },
      });
    }

    await writeAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      resource: "SETTING",
      resourceId: "settings",
      oldValue: oldValue as Prisma.InputJsonValue,
      newValue: newValue as Prisma.InputJsonValue,
    });

    await triggerWebRevalidate(["web:settings:public", "web:layout"]);
    revalidatePath("/settings");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
