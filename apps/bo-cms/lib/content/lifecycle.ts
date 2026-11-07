export type ContentStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ContentLifecycleFields = {
  status: ContentStatusValue;
  publishedAt: Date | null;
};

export class LifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LifecycleError";
  }
}

export function canPublish(status: ContentStatusValue) {
  return status === "DRAFT" || status === "ARCHIVED";
}

export function canUnpublish(status: ContentStatusValue) {
  return status === "PUBLISHED";
}

export function canArchive(status: ContentStatusValue) {
  return status === "PUBLISHED";
}

export function applyPublish(
  current: ContentLifecycleFields,
  now = new Date(),
): ContentLifecycleFields {
  if (!canPublish(current.status)) {
    throw new LifecycleError(
      "Chỉ có thể xuất bản nội dung ở trạng thái Nháp hoặc Đã lưu trữ.",
    );
  }
  return {
    status: "PUBLISHED",
    publishedAt: now,
  };
}

export function applyUnpublish(
  current: ContentLifecycleFields,
): ContentLifecycleFields {
  if (!canUnpublish(current.status)) {
    throw new LifecycleError(
      "Chỉ có thể hủy xuất bản nội dung đang Xuất bản.",
    );
  }
  return {
    status: "DRAFT",
    publishedAt: current.publishedAt,
  };
}

export function applyArchive(
  current: ContentLifecycleFields,
): ContentLifecycleFields {
  if (!canArchive(current.status)) {
    throw new LifecycleError(
      "Chỉ có thể lưu trữ nội dung đang Xuất bản.",
    );
  }
  return {
    status: "ARCHIVED",
    publishedAt: current.publishedAt,
  };
}

export const CONTENT_STATUS_LABELS: Record<ContentStatusValue, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Xuất bản",
  ARCHIVED: "Lưu trữ",
};

export function contentStatusBadgeVariant(
  status: ContentStatusValue,
): "muted" | "success" | "warning" {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED") return "warning";
  return "muted";
}
