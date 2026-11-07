# Module: Projects

Route: `/projects`  
Permissions: `project:view|create|update|delete|publish`

---

## 1. Goal

Manage **projects / portfolio / case studies** (distinct from Services = services currently sold/offered).

---

## 2. Fields

| Field | Required | Notes |
|---|---|---|
| title | ✓ | |
| slug | ✓ | unique |
| summary | | |
| content | | Tiptap |
| client_name | | client name |
| location | | |
| start_date / end_date | | date; end ≥ start if both are set |
| featured_image | | |
| gallery | | JSON array of media URLs/keys |
| category | | string in MVP → **FK `category_id` → `project_categories`** |
| display_order | | |
| seo_* | | |
| status | ✓ | DRAFT / PUBLISHED / ARCHIVED |
| published_at | | |

---

## 3. Screens

- List: Title, Client, Category, Timeline, Status, Order.
- Form: Thông tin chung (General info) / Nội dung (Content) / Gallery / SEO.
- Gallery: select multiple from the Media Library or upload (reuses the media module).

Vietnamese UI labels: **Dự án** (Projects), **Thêm dự án** (Add project), **Khách hàng** (Client), **Thư viện ảnh** (Gallery), …

---

## 4. Business Rules

1. `end_date` must not be before `start_date`.
2. Gallery stores references only; files live in storage/media.
3. Soft delete + standard lifecycle.
4. Reordering works like Services.
5. Full auditing.

---

## 5. Quick comparison with Service

| | Service | Project |
|---|---|---|
| Entity | Service | Project |
| Price | Yes | No |
| Client / dates | No | Yes |
| Gallery | Not required | Yes |

---

## 6. Acceptance

- [ ] CRUD + publish + gallery + reorder (BO)
- [ ] Validate date range
- [ ] RBAC `project:*`
- [ ] Published shown at `/projects` and `/projects/[slug]`
