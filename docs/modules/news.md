# Module: News

Routes: `/news`, `/news/categories`  
Permissions: `news:view|create|update|delete|publish`

---

## 1. Goal

Manage news / articles with Category, Tags, Rich Text, SEO, and a publish lifecycle.

---

## 2. News Fields

| Field | Required | Notes |
|---|---|---|
| title | ✓ | |
| slug | ✓ | unique |
| excerpt | | |
| content | | Tiptap |
| thumbnail / featured_image | | **A single cover image**: UI crops to 16:9 → server compresses to WebP 800×450 (`/api/media/upload-cover`). Both columns are stored in sync. Internal media URLs only. |
| category_id | | FK |
| author_id | | defaults to the current user |
| tags | | many-to-many |
| seo_* | | |
| status | ✓ | DRAFT / PUBLISHED / ARCHIVED |
| published_at | | |

---

## 3. Category

Fields: `name`, `slug`, `description`, `status`.

MVP: category CRUD managed at `/news/categories`. Shares the `news:*` permissions, or refine later.

---

## 4. Tags

Fields: `name`, `slug`.

UI: multi-select / create-on-type. Relation via `news_tag_relations`.

---

## 5. Screens

- News list: Title, Category, Author, Status, Published At.
- Filters: status, category, author, date range.
- Form: Nội dung (Content) / Phân loại (Classification: category + tags) / SEO / Media.

Vietnamese UI labels: **Tin tức** (News), **Danh mục** (Category), **Thẻ** (Tags), **Đoạn trích** (Excerpt), **Xuất bản** (Publish), …

---

## 6. Business Rules

1. Soft delete news.
2. Deleting a category that is in use: forbid it or set `category_id` to null (recommended: forbid / require moving to another category).
3. Scheduled publishing: **out of MVP** (future).
4. Author defaults to the current user; Admin may change `author_id` (optional).
5. Full auditing.

---

## 7. Acceptance

- [ ] News CRUD + publish (BO)
- [ ] Category + Tags
- [ ] Rich text + images
- [ ] Search/filter/pagination
- [ ] RBAC
- [ ] Published shown at `/news` and `/news/[slug]`; Draft returns 404
