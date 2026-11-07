export const SUPER_ADMIN_ROLE_NAME = "Super Admin";

export function isSuperAdmin(roles: string[] | undefined | null) {
  return Boolean(roles?.includes(SUPER_ADMIN_ROLE_NAME));
}
