import { prisma, type AuditAction, type Prisma } from "@cms/db";

export async function writeAuditLog(input: {
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? undefined,
      oldValue: input.oldValue,
      newValue: input.newValue,
    },
  });
}
