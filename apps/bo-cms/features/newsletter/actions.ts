"use server";

import { NewsletterStatus, prisma } from "@cms/db";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { assertPermission, toActionError } from "@/lib/permissions/assert";

export async function unsubscribeNewsletterAction(id: string) {
  try {
    const session = await assertPermission("newsletter:delete");
    const row = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!row) {
      return { ok: false as const, message: "Không tìm thấy email đăng ký." };
    }

    if (row.status === NewsletterStatus.UNSUBSCRIBED) {
      return { ok: true as const };
    }

    await prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        status: NewsletterStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "STATUS_CHANGE",
      resource: "NEWSLETTER",
      resourceId: id,
      oldValue: { email: row.email, status: row.status },
      newValue: { email: row.email, status: NewsletterStatus.UNSUBSCRIBED },
    });

    revalidatePath("/newsletter");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteNewsletterAction(id: string) {
  try {
    const session = await assertPermission("newsletter:delete");
    const row = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!row) {
      return { ok: false as const, message: "Không tìm thấy email đăng ký." };
    }

    await prisma.newsletterSubscriber.delete({ where: { id } });

    await writeAuditLog({
      userId: session.user.id,
      action: "DELETE",
      resource: "NEWSLETTER",
      resourceId: id,
      oldValue: { email: row.email, status: row.status },
    });

    revalidatePath("/newsletter");
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
