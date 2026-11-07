# CMS Platform – Data Model

| Field | Value |
|---|---|
| Document | Data Model Specification |
| Version | 1.5 |
| Location | `packages/db` (Prisma) — shared by `apps/bo-cms` and `apps/web` |
| Related | [requirement.md](./requirement.md), [tech.md](./tech.md), [web-frontend.md](./web-frontend.md), [i18n.md](./i18n.md), [multi-site.md](./multi-site.md) |

> One schema / one database. Migrations and seeding run only from `packages/db`.  
> The Web **only reads** content records that are `PUBLISHED` + `deleted_at IS NULL` (see visibility at the end of this file).  
> **MVP:** single-language content (treated as `vi`); **a single site**.  
> Future: i18n [i18n.md](./i18n.md); multi-site [multi-site.md](./multi-site.md) (`sites` + `site_id`).

---

## 1. Core Tables

```text
users
roles
permissions
user_roles
role_permissions

pages
services
projects

news
news_categories
news_tags
news_tag_relations

documents
media
audit_logs
settings
newsletter_subscribers
contact_messages
```

---

## 2. Entity Definitions

### 2.1. users

| Column | Type | Constraints |
|---|---|---|
| id | uuid / cuid | PK |
| email | string | UNIQUE, NOT NULL |
| username | string | UNIQUE, NOT NULL |
| name | string | NOT NULL |
| password_hash | string | NOT NULL |
| avatar | string? | URL/path |
| status | enum | ACTIVE \| INACTIVE |
| created_at | datetime | |
| updated_at | datetime | |
| deleted_at | datetime? | soft delete |

Indexes: `email`, `username`, `status`, `deleted_at`.

### 2.2. roles

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | string | UNIQUE |
| description | string? | |
| is_system | boolean | default false; seeded roles = true |
| created_at / updated_at | datetime | |

### 2.3. permissions

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| code | string | UNIQUE, format `resource:action` |
| group_name | string | User, Role, Page, … |
| description | string? | |
| created_at / updated_at | datetime | |

### 2.4. user_roles

| Column | Type |
|---|---|
| user_id | FK → users |
| role_id | FK → roles |

Composite PK `(user_id, role_id)`.

### 2.5. role_permissions

| Column | Type |
|---|---|
| role_id | FK → roles |
| permission_id | FK → permissions |

Composite PK `(role_id, permission_id)`.

---

### 2.6. pages

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | string | NOT NULL |
| slug | string | UNIQUE |
| summary | text? | |
| content | text? | rich text HTML/JSON |
| featured_image | string? | media URL/key |
| seo_title | string? | |
| seo_description | string? | |
| status | enum | DRAFT \| PUBLISHED \| ARCHIVED |
| published_at | datetime? | |
| created_by | FK → users | |
| updated_by | FK → users? | |
| created_at / updated_at | datetime | |
| deleted_at | datetime? | |

Indexes: `slug`, `status`, `published_at`, `created_at`.

### 2.7. services

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | string | NOT NULL |
| slug | string | UNIQUE |
| short_description | string? | |
| description | text? | |
| icon | string? | |
| featured_image | string? | |
| category | string? | MVP: string; future: FK |
| price | decimal? | nullable |
| display_order | int | default 0 |
| status | enum | DRAFT \| PUBLISHED \| ARCHIVED |
| seo_title / seo_description | string? | |
| created_by / updated_by | FK users | |
| published_at / timestamps / deleted_at | | |

Indexes: `slug`, `status`, `display_order`, `category`.

### 2.8. projects

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | string | NOT NULL |
| slug | string | UNIQUE |
| summary | text? | |
| content | text? | |
| client_name | string? | |
| location | string? | |
| start_date | date? | |
| end_date | date? | |
| featured_image | string? | |
| gallery | json? | array of media URLs/keys |
| category | string? | |
| status | enum | DRAFT \| PUBLISHED \| ARCHIVED |
| seo_title / seo_description | string? | |
| display_order | int | default 0 |
| created_by / updated_by | FK users | |
| published_at / timestamps / deleted_at | | |

Indexes: `slug`, `status`, `display_order`, `category`, `start_date`.

### 2.9. news_categories

| Column | Type |
|---|---|
| id | uuid | PK |
| name | string | UNIQUE-ish |
| slug | string | UNIQUE |
| description | text? | |
| status | enum | ACTIVE \| INACTIVE (or DRAFT/PUBLISHED if unified) |
| created_at / updated_at | datetime | |

### 2.10. news_tags

| Column | Type |
|---|---|
| id | uuid | PK |
| name | string | |
| slug | string | UNIQUE |

### 2.11. news

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | string | |
| slug | string | UNIQUE |
| excerpt | text? | |
| content | text? | |
| thumbnail / featured_image | string? | |
| category_id | FK → news_categories? | |
| author_id | FK → users | |
| seo_* | string? | |
| status | enum | DRAFT \| PUBLISHED \| ARCHIVED |
| published_at | datetime? | |
| created_by / updated_by | FK users | |
| timestamps / deleted_at | | |

### 2.12. news_tag_relations

| Column | Type |
|---|---|
| news_id | FK → news |
| tag_id | FK → news_tags |

PK `(news_id, tag_id)`.

### 2.13. documents

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | string | |
| description | text? | |
| file_name | string | |
| file_url | string | storage key/url |
| file_type | string | extension/MIME |
| file_size | int | bytes |
| category | string? | |
| status | enum | DRAFT \| PUBLISHED \| ARCHIVED |
| uploaded_by | FK → users | |
| timestamps / deleted_at | | |

### 2.14. media

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| file_name | string | |
| file_url | string | |
| mime_type | string | |
| file_size | int | |
| width / height | int? | images |
| alt_text | string? | |
| uploaded_by | FK → users | |
| created_at / updated_at | datetime | |

In the MVP, soft delete is not required for media; a hard delete plus deletion of the stored file is acceptable.

### 2.15. audit_logs

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | FK → users? | nullable for system actions |
| action | string/enum | CREATE, UPDATE, … |
| resource | string | USER, NEWS, PROJECT, … |
| resource_id | string? | |
| old_value | json? | |
| new_value | json? | |
| ip_address | string? | |
| user_agent | string? | |
| created_at | datetime | |

Append-only. Indexes: `user_id`, `resource`, `action`, `created_at`.

### 2.16. settings

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| key | string | UNIQUE |
| value | json / text | |
| group_name | string | general, seo, media, system |
| updated_by | FK users? | |
| updated_at | datetime | |

### 2.17. newsletter_subscribers

| Column | Type | Notes |
|---|---|---|
| id | uuid / cuid | PK |
| email | string | UNIQUE, NOT NULL (lowercase) |
| status | enum | ACTIVE \| UNSUBSCRIBED |
| source | string? | e.g. `footer` |
| ip_address | string? | |
| user_agent | string? | |
| subscribed_at | datetime | |
| unsubscribed_at | datetime? | |
| created_at / updated_at | datetime | |

Indexes: `email` (unique), `status`, `subscribed_at`.

BO: list + **CSV export** (campaigns not required). See [modules/newsletter.md](./modules/newsletter.md).

### 2.18. contact_messages

Messages submitted via the Contact form (Liên hệ) on the Web. Persisting them is mandatory; SMTP is a secondary channel.

| Column | Type | Notes |
|---|---|---|
| id | uuid / cuid | PK |
| name | string | NOT NULL |
| email | string | NOT NULL (lowercase) |
| phone | string? | |
| subject | string | NOT NULL |
| message | text | NOT NULL |
| status | enum | `NEW` \| `READ` \| `ARCHIVED` |
| ip_address | string? | anti-spam / audit |
| user_agent | string? | |
| content_hash | string | hash of normalized `email\|subject\|message` — 24h duplicate prevention |
| email_sent | boolean | default false — SMTP delivery succeeded |
| email_error | string? | most recent SMTP error (if any) |
| created_at / updated_at | datetime | |

Indexes: `status`, `created_at`, `email`, `content_hash`, `(ip_address, created_at)`.

Deletion: hard delete from the BO (`contact:delete`). No soft delete in the MVP.

BO spec: [modules/contact-messages.md](./modules/contact-messages.md).

---

## 3. Relationships

```text
User ──< UserRole >── Role ──< RolePermission >── Permission
User ──< AuditLog
User ──< News (author)
User ── create/update Page | Service | Project | News | Document | Media

News >── Category
News ──< NewsTagRelation >── Tag

Page / Service / Project / News  ··· reference Media via URL/key (MVP)
Document >── User (uploaded_by)
```

MVP: content entities store `featured_image` / `gallery` as URL/key strings instead of requiring a Media FK. A relation table can be added later.

---

## 4. Soft Delete Policy

| Entity | Soft delete |
|---|---|
| users, pages, services, projects, news, documents | Yes (`deleted_at`) |
| roles, permissions | Hard delete forbidden if `is_system` / in use |
| media | Hard delete + storage delete (MVP) |
| audit_logs | Never deleted |
| settings | No soft delete |
| newsletter_subscribers | Unsubscribe = `UNSUBSCRIBED` (row kept); optional hard delete from the BO |
| contact_messages | Hard delete from the BO |

Default query (BO content lists): exclude `deleted_at IS NOT NULL`.

---

## 5. Public Web Visibility

Applies to reads from `apps/web` on: `pages`, `services`, `projects`, `news`, `documents`.

```text
status = PUBLISHED
AND deleted_at IS NULL
```

| Consumer | Recommended DB privileges |
|---|---|
| `apps/bo-cms` | Read/Write (full app user) |
| `apps/web` | Read-only (SELECT) if the infrastructure allows it |

The Web does **not** query / expose: `password_hash`, detailed permission tables for the UI, `audit_logs` (unless there is a public page — none in the MVP).

Settings: the Web only reads public keys (`site_name`, logo, default SEO, …).

---

## 6. Slug Rules

- Unique within each content table.
- Auto-generated from title/name; manual editing allowed.
- Normalize: lowercase, dashes, strip special characters.
- Conflict → `409` or auto-suffix `-2`, `-3` (pick one strategy during implementation; recommended: auto-suffix on create, report a conflict when a manual edit on update collides).

---

## 7. Future: Multi-language (not yet migrated)

MVP: each content entity has **one set of text fields** (no `locale` column).

i18n phase (after MVP):

- Source `vi` + `en` translations via a **Translate** workflow — details in [i18n.md](./i18n.md).
- Recommended: a `translations` table / JSON per entity (`locale`, `slug`, title/content/SEO…).
- Migration: all existing data maps → `locale = vi`.
- Redis / slug uniqueness: by `(locale, slug)`.

---

## 8. Seed Data (minimum)

1. Full set of permissions per [rbac-matrix.md](./rbac-matrix.md).
2. Roles: Super Admin, Admin, Editor, Viewer + role_permissions.
3. Super Admin user (credentials from env).
4. Default settings (site name, max upload size, timezone).
5. Sample **Published** Page / News / Service / Project / Document for smoke testing **both the BO and the Web**.

---

## 9. Prisma Notes

- Package: `packages/db` — a single `schema.prisma`, exporting a shared client.
- Enums: `UserStatus`, `ContentStatus`, `AuditAction` (or string + app-level validation).
- Use `cuid()` or `uuid()` consistently.
- `@updatedAt` for `updated_at`.
- Cascade: deleting a Role → deletes `role_permissions` / `user_roles` join rows; do not cascade-delete a User while audit records exist (soft delete the User).
