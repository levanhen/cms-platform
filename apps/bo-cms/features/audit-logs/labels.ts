import { AuditAction } from "@cms/db";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  PUBLISH: "Xuất bản",
  UNPUBLISH: "Hủy xuất bản",
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
  ROLE_CHANGE: "Đổi vai trò",
  STATUS_CHANGE: "Đổi trạng thái",
};

export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  USER: "Người dùng",
  ROLE: "Vai trò",
  PAGE: "Trang",
  SERVICE: "Dịch vụ",
  PROJECT: "Dự án",
  NEWS: "Tin tức",
  NEWS_CATEGORY: "Danh mục tin",
  PROJECT_CATEGORY: "Danh mục dự án",
  DOCUMENT_CATEGORY: "Danh mục tài liệu",
  DOCUMENT: "Tài liệu",
  MEDIA: "Media",
  MEDIA_FOLDER: "Thư mục media",
  SETTING: "Cài đặt",
  NEWSLETTER: "Nhận tin",
};

export const AUDIT_ACTIONS = Object.values(AuditAction);

export function auditResourceLabel(resource: string) {
  return AUDIT_RESOURCE_LABELS[resource] ?? resource;
}
