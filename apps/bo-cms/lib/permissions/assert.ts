import { auth } from "@/auth";
import { LifecycleError } from "@/lib/content/lifecycle";
import { hasPermission, type PermissionCode } from "@/lib/permissions/constants";

export class ActionError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "CONFLICT";

  constructor(
    code: ActionError["code"],
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ActionError("UNAUTHORIZED", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
  return session;
}

export async function assertPermission(code: PermissionCode) {
  const session = await requireSession();
  if (!hasPermission(session.user.permissions, code)) {
    throw new ActionError("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
  }
  return session;
}

export function toActionError(error: unknown) {
  if (error instanceof ActionError) {
    return { ok: false as const, code: error.code, message: error.message };
  }
  if (error instanceof LifecycleError) {
    return { ok: false as const, code: "CONFLICT" as const, message: error.message };
  }
  console.error(error);
  return {
    ok: false as const,
    code: "VALIDATION" as const,
    message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
  };
}
