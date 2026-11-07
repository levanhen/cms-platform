export const PERMISSIONS = {
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  PAGE_VIEW: "page:view",
  PAGE_CREATE: "page:create",
  PAGE_UPDATE: "page:update",
  PAGE_DELETE: "page:delete",
  PAGE_PUBLISH: "page:publish",
  SERVICE_VIEW: "service:view",
  SERVICE_CREATE: "service:create",
  SERVICE_UPDATE: "service:update",
  SERVICE_DELETE: "service:delete",
  SERVICE_PUBLISH: "service:publish",
  PROJECT_VIEW: "project:view",
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  PROJECT_PUBLISH: "project:publish",
  NEWS_VIEW: "news:view",
  NEWS_CREATE: "news:create",
  NEWS_UPDATE: "news:update",
  NEWS_DELETE: "news:delete",
  NEWS_PUBLISH: "news:publish",
  DOCUMENT_VIEW: "document:view",
  DOCUMENT_CREATE: "document:create",
  DOCUMENT_UPDATE: "document:update",
  DOCUMENT_DELETE: "document:delete",
  DOCUMENT_PUBLISH: "document:publish",
  MEDIA_VIEW: "media:view",
  MEDIA_CREATE: "media:create",
  MEDIA_UPDATE: "media:update",
  MEDIA_DELETE: "media:delete",
  AUDIT_LOG_VIEW: "audit_log:view",
  SETTING_VIEW: "setting:view",
  SETTING_UPDATE: "setting:update",
  NEWSLETTER_VIEW: "newsletter:view",
  NEWSLETTER_DELETE: "newsletter:delete",
  CONTACT_VIEW: "contact:view",
  CONTACT_UPDATE: "contact:update",
  CONTACT_DELETE: "contact:delete",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

export function hasPermission(
  permissions: string[] | undefined,
  code: PermissionCode,
) {
  return Boolean(permissions?.includes(code));
}

export function hasAnyPermission(
  permissions: string[] | undefined,
  codes: PermissionCode[],
) {
  return codes.some((code) => hasPermission(permissions, code));
}
