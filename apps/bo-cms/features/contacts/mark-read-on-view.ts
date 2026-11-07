"use server";

import { ContactMessageStatus, prisma } from "@cms/db";
import { revalidatePath } from "next/cache";

/** Best-effort: mark NEW → READ when staff opens detail (requires contact:update already checked). */
export async function markContactReadOnView(id: string) {
  const result = await prisma.contactMessage.updateMany({
    where: { id, status: ContactMessageStatus.NEW },
    data: { status: ContactMessageStatus.READ },
  });
  if (result.count > 0) {
    revalidatePath("/contacts");
    revalidatePath("/", "layout");
  }
}
