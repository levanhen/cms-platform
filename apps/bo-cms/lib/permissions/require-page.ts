import { redirect } from "next/navigation";
import {
  hasPermission,
  type PermissionCode,
} from "@/lib/permissions/constants";

/** Redirect to 403 page when the current user lacks a view/action permission. */
export function requirePagePermission(
  permissions: string[] | undefined,
  code: PermissionCode,
) {
  if (!hasPermission(permissions, code)) {
    redirect("/forbidden");
  }
}
