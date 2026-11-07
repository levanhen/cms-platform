# CMS Platform – System Requirements

| Field | Value |
|---|---|
| Project | CMS Platform (BO + Public Web) |
| Document | CMS Requirement Specification (SRS) |
| Version | 1.6 |
| Status | Draft |
| Architecture | Monorepo: `apps/bo-cms` + `apps/web` |
| Shared data | PostgreSQL + Prisma (`packages/db`) |
| Web cache | Redis (+ ISR / on-demand revalidate) |
| Language | TypeScript |
| BO Auth | Auth.js |
| BO UI | Tailwind CSS + shadcn/ui (Vietnamese) |
| Web UI | Tailwind CSS (Vietnamese in the MVP; future VI+EN — [i18n.md](./i18n.md)) |
| Forms (BO) | React Hook Form + Zod |
| Deployment | Docker / VPS / Cloud (2 apps) |

> Related documents: [overview.md](./overview.md) · [web-frontend.md](./web-frontend.md) · [tech.md](./tech.md) · [data-model.md](./data-model.md) · [rbac-matrix.md](./rbac-matrix.md) · [modules/](./modules/)

---

# 1. Project Overview

The system consists of two frontends:

1. **BO CMS (`apps/bo-cms`)** – Internal Back Office for administration (Super Admin, Admin, Editor, Viewer).
2. **Web (`apps/web`)** – Public frontend where end users view published content.

BO manages: User, Role, Permission, Page, Service, Project, News, Document, Media, Audit Log, Settings.

Web displays: Page, Service, Project, News, Document (publicly downloadable if Published).

NestJS and Keycloak are not used in this version.  
Detailed Web spec: [web-frontend.md](./web-frontend.md).

---

# 2. Goals

1. A centralized administration interface (BO).
2. A public frontend that reads Published content (Web).
3. Authentication + RBAC on BO.
4. A single shared PostgreSQL; no duplicated domain model.
5. CMS CRUD on BO; Web is read-only.
6. Search, Filter, Sort, Pagination (BO lists; Web lists where needed).
7. Draft / Published / Archived lifecycle — only Published content appears on the Web.
8. Published Documents are publicly downloadable on the Web.
9. Audit Log for important operations (BO).
10. A simple monorepo that is easy to deploy and maintain.
11. Redis cache on the Web to improve speed and support SEO (SSR HTML + invalidation on publish).

---

# 3. Technology Stack (summary)

Details: [tech.md](./tech.md).

```text
pnpm monorepo
apps/bo-cms · apps/web · packages/db
Next.js · TypeScript · PostgreSQL · Prisma · Redis (web)
Auth.js (BO) · Tailwind · shadcn/ui (BO) · RHF · Zod · Tiptap (BO)
```

---

# 4. High-Level Architecture

```text
Editor/Admin                Visitor
     │                         │
     ▼                         ▼
 apps/bo-cms                apps/web
 (Auth + RBAC + CRUD)       (read Published + Redis cache)
     │                         │
     │         revalidate API  │
     └─────────────────────────┤
                               │
                               ▼
                          Redis (web-only)
                               │
     └────────────┬────────────┘
                  ▼
           packages/db (Prisma)
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
  PostgreSQL           Object Storage
```

No separate NestJS backend. The Web reads the DB directly via the shared Prisma package; **Redis** caches payloads to improve speed and keep SEO crawling stable.

---

# 5. Application Modules

## 5.1. Back Office (`apps/bo-cms`)

```text
BO CMS
├── Authentication
├── Dashboard
├── User / Role / Permission Management
├── Page / Service / Project / News Management
├── Document / Media Management
├── Contact messages (inbox from Web)
├── Newsletter (list + export CSV)
├── Audit Logs
└── System Settings
```

Spec: [modules/](./modules/).

## 5.2. Public Web (`apps/web`)

```text
Web
├── Home
├── Pages / Services / Projects / News / Documents
├── Contact (persist + anti-spam + SMTP optional) + Newsletter subscribe
├── SEO: sitemap, robots, llms.txt
└── Redis cache + /api/revalidate
```

Spec: [web-frontend.md](./web-frontend.md) (v1.6).

---

# 6. Authentication

Login is required before accessing any administration pages.

Protected routes:

```text
/dashboard /users /roles /permissions
/pages /services /projects /news
/documents /media /contacts /newsletter /audit-logs /settings
```

Not logged in → `/login`.

Minimum session data: `id`, `email`, `name`, `roles`, `permissions`. Passwords are never stored in the session.

Logout: invalidate the session → `/login`.

Details: [modules/authentication.md](./modules/authentication.md).

---

# 7. User Management

Route: `/users`

List: Avatar, Name, Email, Username, Role, Status, Created At, Updated At, Actions.

Fields:

```text
id, email, username, name, avatar, status,
created_at, updated_at, deleted_at
```

Status: `ACTIVE` | `INACTIVE`

Create: Email, Username, Name, Password, Role, Status.  
Passwords are hashed before being stored; never returned by the API; never shown in the UI.

Update: Name, Email, Username, Avatar, Role, Status.

Delete: Soft delete (`deleted_at`). No hard delete if the user already has Audit Log entries.

Details: [modules/users.md](./modules/users.md).

---

# 8. Role Management

Route: `/roles`

Default roles: Super Admin, Admin, Editor, Viewer.

Fields: `id`, `name`, `description`, `is_system`, `created_at`, `updated_at`.

Actions: Create, View, Edit, Delete, Assign Permissions.

Default system roles cannot be deleted while they are in use.

Details: [modules/roles-permissions.md](./modules/roles-permissions.md).

---

# 9. Permission Management

Route: `/permissions`

Format: `resource:action`

```text
user:*  role:*  page:*  service:*  project:*
news:*  document:*  media:*  audit_log:view  setting:*
```

(where `*` = view | create | update | delete | publish, depending on the resource)

Authorization **must** be checked on the server. Hiding buttons in the UI is only a UX measure.

Missing permission → `403 Forbidden`.

Default matrix: [rbac-matrix.md](./rbac-matrix.md).

---

# 10. Dashboard

Route: `/dashboard`

Displays KPIs (Users, Pages, Services, Projects, News, Documents, Published, Draft), recent activity, recently updated content, and quick actions (optional).

Complex charts are not required in the MVP.

UI shell + layout: [ui-dashboard.md](./ui-dashboard.md).  
Module logic: [modules/dashboard.md](./modules/dashboard.md).

---

# 11. Page Management

Route: `/pages`

Static content: About Us, Contact, Privacy Policy, Terms, FAQ, …

Fields: `id`, `title`, `slug`, `summary`, `content`, `featured_image`, `seo_title`, `seo_description`, `status`, `published_at`, `created_by`, `updated_by`, timestamps, `deleted_at`.

Status: `DRAFT` | `PUBLISHED` | `ARCHIVED`

Actions: Create, View, Edit, Save Draft, Publish, Unpublish, Archive, Delete.

Details: [modules/pages.md](./modules/pages.md).

---

# 12. Service Management

Route: `/services`

Manages the services offered by the organization / system.

Fields: `id`, `name`, `slug`, `short_description`, `description`, `icon`, `featured_image`, `category`, `price`, `display_order`, `status`, SEO fields, audit fields, `deleted_at`.

Actions: Create, View, Edit, Delete, Publish, Unpublish, Archive, Reorder.

Details: [modules/services.md](./modules/services.md).

---

# 13. Project Management

Route: `/projects`

Manages projects / portfolio / case studies.

Fields:

```text
id, title, slug, summary, content,
client_name, location,
start_date, end_date,
featured_image, gallery,
category, status,
seo_title, seo_description,
display_order,
created_by, updated_by,
created_at, updated_at, deleted_at, published_at
```

Status: `DRAFT` | `PUBLISHED` | `ARCHIVED`

Actions: Create, View, Edit, Delete, Publish, Unpublish, Archive, Reorder.

Details: [modules/projects.md](./modules/projects.md).

---

# 14. News Management

Route: `/news`

Fields: `id`, `title`, `slug`, `excerpt`, `content`, `thumbnail`, `featured_image`, `category_id`, `author_id`, SEO, status, timestamps, soft delete.

News Category: `/news/categories` — `id`, `name`, `slug`, `description`, `status`, timestamps.

News Tags: many-to-many via `news_tag_relations`.

Features: Rich Text, Image upload, Featured Image, Category, Tags, SEO, Publish/Unpublish.  
Schedule Publish: optional / future.

Details: [modules/news.md](./modules/news.md).

---

# 15. Document Management

BO route: `/documents` · Web route: `/documents` (+ download)

Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT.

Fields: `id`, `title`, `description`, `file_name`, `file_url`, `file_type`, `file_size`, `category`, `status`, `uploaded_by`, timestamps, `deleted_at`.

Actions (BO): Upload, View, Download, Edit Metadata, Delete, Publish, Archive.

**Web:** list + **public download** when `status = PUBLISHED` (re-checked server-side). Draft/Archived documents are neither listed nor downloadable.

Validation: extension, MIME type, size (configurable maximum).

Storage abstraction: local (dev) / S3-compatible (prod). Binary files are not stored in PostgreSQL in production.

Details: [modules/documents.md](./modules/documents.md) · [web-frontend.md](./web-frontend.md).

---

# 16. Media Management

Route: `/media`

Shared library: Images, Videos, Documents (assets).

Fields: `id`, `file_name`, `file_url`, `mime_type`, `file_size`, `width`, `height`, `alt_text`, `uploaded_by`, timestamps.

Actions: Upload, Preview, Search, Filter, Delete, Copy URL, Edit Metadata.

Details: [modules/media.md](./modules/media.md).

---

# 17. Audit Log

Route: `/audit-logs`

Audited actions:

```text
CREATE UPDATE DELETE PUBLISH UNPUBLISH
LOGIN LOGOUT ROLE_CHANGE STATUS_CHANGE
```

Fields: `id`, `user_id`, `action`, `resource`, `resource_id`, `old_value`, `new_value`, `ip_address`, `user_agent`, `created_at`.

Append-only; regular users cannot edit or delete entries.

Details: [modules/audit-logs.md](./modules/audit-logs.md).

---

# 18. System Settings

Route: `/settings`

Groups: General, SEO, Media, System.

Examples: Site Name, Description, Logo, Favicon, Default Language, Timezone, Maximum Upload Size.

Validation is required.

Details: [modules/settings.md](./modules/settings.md).

---

# 19. Content Lifecycle

Applies to: Page, Service, Project, News, Document.

```text
DRAFT → PUBLISHED → ARCHIVED
         │
         └── Unpublish → DRAFT
```

| Status | BO | Web |
|---|---|---|
| DRAFT | Manageable | Not displayed (404) |
| PUBLISHED | Manageable | Displayed / downloadable |
| ARCHIVED | Manageable | Not displayed (404) |

---

# 20. Search / Filter / Sort / Pagination

Search on: Users, Pages, Services, Projects, News, Documents, Media, Audit Logs.

Filter: Status, Category, Author, Created/Updated/Published Date.

Sort examples: `created_at DESC`, `title ASC`.

Default pagination: `page=1`, `limit=20` + meta `{ page, limit, total, totalPages }`.

UI: Previous, Next, Page Number, Page Size.

---

# 21. Server Actions and Route Handlers

- **Server Actions**: Create / Update / Delete / Publish / Unpublish.
- **Route Handlers**: Upload, Download, API/external (when needed).

A full REST API for every internal CRUD operation is not required.

---

# 22. Database

Core tables:

```text
users, roles, permissions, user_roles, role_permissions
pages, services, projects
news, news_categories, news_tags, news_tag_relations
documents, media, audit_logs, settings
```

Schema & relationship details: [data-model.md](./data-model.md).

---

# 23. UI Layout

Sidebar + Header + Main Content. Sidebar in Vietnamese. Menu items are hidden based on permissions (UX); the server still enforces checks.

---

# 24. Error Handling

`400 / 401 / 403 / 404 / 409 / 422 / 500` — user-friendly messages in Vietnamese; never expose stack traces/SQL.

---

# 25. Security Requirements

MUST:

- HTTPS in production
- Hashed passwords; no plaintext (BO)
- Validate all input (Zod)
- Server-side authorization (BO)
- Web queries only Published + not-deleted content; no content mutations
- Recommended: read-only DB credentials for `web`
- Validate file uploads + enforce size limits (BO)
- Document downloads on the web re-check Published status
- Rate-limit sensitive endpoints (BO login; web downloads recommended)
- Audit important operations (BO)
- Secure session cookies + CSRF per Auth.js (BO)
- Never trust permissions sent from the client
- Never expose `password_hash` / internal audit data to the web

---

# 26. Performance

- BO initial page load < 2s (under normal conditions)
- BO CRUD (excluding large uploads) < 500ms
- Web (warm cache): better TTFB/perceived load time thanks to Redis
- Web (cold) < 2–2.5s under normal conditions
- Lists are always paginated
- Indexes: email, username, slug, status, created_at, updated_at, published_at
- Redis caches Published payloads; BO publish → on-demand invalidate + revalidate
- SEO: SSR HTML with complete meta, even when data comes from Redis

---

# 27. Scalability

New modules follow the pattern: Model → Permission → Actions → Validation → List UI → Form UI.

---

# 28. MVP Scope

## Phase 1 – Foundation

Monorepo (pnpm), `packages/db`, PostgreSQL, Prisma migration + seed, TypeScript tooling.

## Phase 2 – BO Access

`apps/bo-cms`: Tailwind, shadcn/ui, Auth.js, Layout, Authz, Users, Roles, Permissions.

## Phase 3 – BO Content

Pages, Services, Projects, News (+ Categories, Tags), Documents, Media.

## Phase 4 – BO Supporting

Dashboard, Audit Logs, Settings.

## Phase 5 – Public Web

`apps/web`: layout, content modules, Documents download, Home, Contact, Newsletter, SEO/LLMs, **Redis**, `/api/revalidate` + BO hooks. Details & backlog: [web-frontend.md](./web-frontend.md).

## Phase 6 – Testing & Deployment

Unit / Integration / E2E (BO + Web + cache invalidation), Docker (2 apps + Redis), Production, DB Backup.

---

# 29. Recommended Implementation Order

```text
01 Monorepo + packages/db
02 PostgreSQL schema + seed
03 apps/bo-cms setup (UI shell)
04 Auth.js + RBAC
05 Users / Roles / Permissions
06 Pages / Services / Projects
07 News / Documents / Media
08 Dashboard / Audit / Settings
09 apps/web setup + Redis
10 Web: Pages + News (cached)
11 Web: Services + Projects
12 Web: Documents + Home + SEO
13 Web revalidate API + BO invalidate hooks
14 Testing (BO + Web + cache)
15 Production Deployment (2 apps + Redis)
```

---

# 30. Acceptance Criteria

## Authentication

- Users who are not logged in cannot access the CMS.
- Successful login → Dashboard.
- Secure session; Logout works; session expiry is handled correctly.

## Authorization

- Users only see modules they have permission for.
- Without permission → the action cannot be performed (including by calling a Server Action directly).

## User

- Admin can create / update / deactivate / assign roles.
- Deactivated users cannot log in.

## Role

- Create / edit / assign permissions.
- System roles in use cannot be deleted.

## Page / Service / Project / News / Document

- CRUD + publish lifecycle according to permissions.
- News has Category + Tags + Rich Text.
- Document upload is validated + downloadable; binaries are not stored in the production DB.
- Projects can manage gallery / client metadata.

## Media

- Upload, preview, metadata; usable in Page / Service / Project / News.

## Audit

- Logs CREATE / UPDATE / DELETE / PUBLISH / LOGIN / ROLE_CHANGE.
- Regular users cannot edit the Audit Log.

## Public Web

- Only Published content is shown; Draft/Archived → 404.
- News/Services/Projects/Pages as specified in [web-frontend.md](./web-frontend.md).
- Published Documents are publicly downloadable; Drafts are not.
- Contact: anti-spam + saved to DB; BO inbox (`/contacts`); SMTP optional. Spec: [modules/contact-messages.md](./modules/contact-messages.md).
- Newsletter: subscribers in DB; BO **list + CSV export**. Spec: [modules/newsletter.md](./modules/newsletter.md).
- No mutations writing **CMS content** from the web (supporting forms are allowed).
- Redis + invalidation from BO; SEO/llms in HTML / text routes.
- Remaining verification & hardening: checklist §13 in web-frontend.md.

---

# 31. Out of Scope – MVP

Keycloak, NestJS, Microservices, Multi-tenant SaaS, E-commerce, Payment, CRM, Marketing Automation, Advanced Workflow, Visual Page Builder, AI Content, Complex Version Control, Advanced Approval Workflow, full Public REST API for third parties, Member login on the web, Draft preview token, Redis for BO sessions.

**Multi-language content / locale routing** — not implemented in the MVP, but the **future direction is decided** (VI source → Translate EN): [i18n.md](./i18n.md).

**Multi-site + themes (1 BO → multiple websites / landing pages from templates)** — not implemented in the MVP, but the **future direction is decided**: [multi-site.md](./multi-site.md). Themes are selected in BO; the public web does not select themes; custom templates = an additional service added to the catalog.

---

# 32. Future Extensions

- **Multi-language (VI → EN Translate)** — direction decided: [i18n.md](./i18n.md). The MVP remains single-language (VI).
- **Multi-site + Themes (1 BO → multiple websites / landing pages from templates)** — direction decided: [multi-site.md](./multi-site.md). The MVP remains a single site + a single UI.
- Content Versioning, Approval Workflow, Scheduled Publishing
- Elasticsearch, advanced CDN, Notification, Email, Webhook
- Public API, Multi-tenant SaaS, Member area on the web
- Redis rate-limit/login (BO)

If multiple API clients / mobile / high traffic are needed → a NestJS backend can be split out later while keeping the domain model.

---

# 33. Final Architecture Decision

```text
Monorepo
├── apps/bo-cms  → Auth + RBAC + CRUD → packages/db → PostgreSQL
│                    └── revalidate hook ──▶ apps/web
├── apps/web     → Redis cache → packages/db → PostgreSQL (Published only)
└── shared Object Storage (media / documents)
```

Goal: BO administration + a fast (Redis) and SEO-friendly public Web. No NestJS / Keycloak at the current stage.
