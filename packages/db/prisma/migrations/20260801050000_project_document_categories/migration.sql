-- Project / Document categories (separate taxonomies)

CREATE TABLE "project_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_categories_slug_key" ON "project_categories"("slug");

CREATE TABLE "document_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_categories_slug_key" ON "document_categories"("slug");

-- Migrate projects.category (string) → category_id
ALTER TABLE "projects" ADD COLUMN "category_id" TEXT;

INSERT INTO "project_categories" ("id", "name", "slug", "description", "status", "created_at", "updated_at")
SELECT
  md5('project-cat:' || lower(trim(p."category"))),
  trim(p."category"),
  regexp_replace(lower(trim(p."category")), '[^a-z0-9]+', '-', 'g'),
  NULL,
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT trim("category") AS "category"
  FROM "projects"
  WHERE "category" IS NOT NULL AND trim("category") <> ''
) p
ON CONFLICT ("slug") DO NOTHING;

UPDATE "projects" pr
SET "category_id" = pc."id"
FROM "project_categories" pc
WHERE pr."category" IS NOT NULL
  AND trim(pr."category") <> ''
  AND pc."name" = trim(pr."category");

DROP INDEX IF EXISTS "projects_category_idx";
ALTER TABLE "projects" DROP COLUMN "category";
CREATE INDEX "projects_category_id_idx" ON "projects"("category_id");
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate documents.category (string) → category_id
ALTER TABLE "documents" ADD COLUMN "category_id" TEXT;

INSERT INTO "document_categories" ("id", "name", "slug", "description", "status", "created_at", "updated_at")
SELECT
  md5('document-cat:' || lower(trim(d."category"))),
  trim(d."category"),
  regexp_replace(lower(trim(d."category")), '[^a-z0-9]+', '-', 'g'),
  NULL,
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT trim("category") AS "category"
  FROM "documents"
  WHERE "category" IS NOT NULL AND trim("category") <> ''
) d
ON CONFLICT ("slug") DO NOTHING;

UPDATE "documents" doc
SET "category_id" = dc."id"
FROM "document_categories" dc
WHERE doc."category" IS NOT NULL
  AND trim(doc."category") <> ''
  AND dc."name" = trim(doc."category");

DROP INDEX IF EXISTS "documents_category_idx";
ALTER TABLE "documents" DROP COLUMN "category";
CREATE INDEX "documents_category_id_idx" ON "documents"("category_id");
ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
