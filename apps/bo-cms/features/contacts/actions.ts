"use server";

import { ContactMessageStatus, prisma } from "@cms/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, toActionError } from "@/lib/permissions/assert";

const statusSchema = z.nativeEnum(ContactMessageStatus);

export async function updateContactStatusAction(
  id: string,
  status: ContactMessageStatus,
) {
  try {
    const session = await assertPermission("contact:update");
    const nextStatus = statusSchema.parse(status);

    const current = await prisma.contactMessage.findUnique({ where: { id } });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy tin nhắn." };
    }

    await prisma.contactMessage.update({
      where: { id },
      data: { status: nextStatus },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      resource: "CONTACT_MESSAGE",
      resourceId: id,
      oldValue: { status: current.status, email: current.email },
      newValue: { status: nextStatus, email: current.email },
    });

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteContactAction(id: string) {
  try {
    const session = await assertPermission("contact:delete");
    const current = await prisma.contactMessage.findUnique({ where: { id } });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy tin nhắn." };
    }

    await prisma.contactMessage.delete({ where: { id } });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "CONTACT_MESSAGE",
      resourceId: id,
      oldValue: {
        email: current.email,
        subject: current.subject,
        status: current.status,
      },
    });

    revalidatePath("/contacts");
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function markContactReadAction(id: string) {
  try {
    await assertPermission("contact:update");
    const current = await prisma.contactMessage.findUnique({ where: { id } });
    if (!current) {
      return { ok: false as const, message: "Không tìm thấy tin nhắn." };
    }
    if (current.status !== ContactMessageStatus.NEW) {
      return { ok: true as const };
    }
    return updateContactStatusAction(id, ContactMessageStatus.READ);
  } catch (error) {
    return toActionError(error);
  }
}
