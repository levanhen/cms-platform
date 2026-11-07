# Module: Pages

Route: `/pages`  
Permissions: `page:view|create|update|delete|publish`

---

## 1. Goal

Manage static content pages (About, Contact, Policy, …).

---

## 2. Fields

| Field | Required | Notes |
|---|---|---|
| title | ✓ | |
| slug | ✓ | unique, auto-generated from title |
| summary | | |
| content | | Tiptap |
| featured_image | | media picker / URL |
| seo_title / seo_description | | |
| status | ✓ | DRAFT / PUBLISHED / ARCHIVED |
| published_at | | set on publish |
| created_by / updated_by | | |

---

## 3. Screens

- List: search by title/slug, filter by status, sort.
- Form: Nội dung (Content) / SEO tabs (optional UX).
- Actions: Save draft, Publish, Unpublish, Archive, Delete.

Vietnamese UI labels: **Trang** (Pages), **Thêm trang** (Add page), **Xuất bản** (Publish), **Lưu nháp** (Save draft), …

---

## 4. Business Rules

1. Only `PUBLISHED` records (and not soft-deleted) are displayed by `apps/web` — see [web-frontend.md](../web-frontend.md).
2. Soft delete.
3. Unique slug.
4. Publishing requires `page:publish` (can be separate from update).
5. Audit CREATE/UPDATE/DELETE/PUBLISH/UNPUBLISH.

---

## 5. Public Web

- Route: `/pages/[slug]` (recommended).
- 404 if Draft / Archived / deleted.
- SEO from `seo_*` / falls back to title, summary.

---

## 6. Acceptance

- [ ] CRUD + lifecycle (BO)
- [ ] Rich text is saved
- [ ] SEO fields are saved
- [ ] Permissions enforced
- [ ] Published shown on the web; Draft not shown
