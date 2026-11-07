-- Composite indexes for common BO list filters (deletedAt + status / updatedAt)
CREATE INDEX IF NOT EXISTS "pages_deleted_at_updated_at_idx" ON "pages"("deleted_at", "updated_at");
CREATE INDEX IF NOT EXISTS "pages_deleted_at_status_idx" ON "pages"("deleted_at", "status");

CREATE INDEX IF NOT EXISTS "services_deleted_at_updated_at_idx" ON "services"("deleted_at", "updated_at");
CREATE INDEX IF NOT EXISTS "services_deleted_at_status_idx" ON "services"("deleted_at", "status");

CREATE INDEX IF NOT EXISTS "projects_deleted_at_updated_at_idx" ON "projects"("deleted_at", "updated_at");
CREATE INDEX IF NOT EXISTS "projects_deleted_at_status_idx" ON "projects"("deleted_at", "status");

CREATE INDEX IF NOT EXISTS "news_deleted_at_updated_at_idx" ON "news"("deleted_at", "updated_at");
CREATE INDEX IF NOT EXISTS "news_deleted_at_status_idx" ON "news"("deleted_at", "status");

CREATE INDEX IF NOT EXISTS "documents_deleted_at_updated_at_idx" ON "documents"("deleted_at", "updated_at");
CREATE INDEX IF NOT EXISTS "documents_deleted_at_status_idx" ON "documents"("deleted_at", "status");
