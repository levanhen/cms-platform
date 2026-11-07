# Module: Services

Route: `/services`  
Permissions: `service:view|create|update|delete|publish`

---

## 1. Goal

Manage the catalog of **services** the organization offers (distinct from Projects = completed projects).

---

## 2. Fields

| Field | Required | Notes |
|---|---|---|
| name | ✓ | |
| slug | ✓ | unique |
| short_description | | |
| description | | Tiptap |
| icon | | class name / media |
| featured_image | | |
| category | | string in MVP |
| price | | nullable decimal |
| display_order | | int, supports reordering |
| seo_* | | |
| status | ✓ | DRAFT / PUBLISHED / ARCHIVED |

---

## 3. Screens

- List with Order, Price, Category, Status columns.
- Reorder: drag-and-drop or increment/decrement `display_order` (MVP: buttons or a number input are fine).

Vietnamese UI labels: **Dịch vụ** (Services), **Thêm dịch vụ** (Add service), **Thứ tự hiển thị** (Display order), …

---

## 4. Business Rules

1. Unlike Projects: `client_name` / timeline are not required.
2. Soft delete + publish lifecycle.
3. Auditing like the other content modules.

---

## 5. Acceptance

- [ ] CRUD + publish + reorder (BO)
- [ ] Search/filter/sort/pagination (BO)
- [ ] RBAC matches the matrix
- [ ] Published shown at `/services` and `/services/[slug]`
