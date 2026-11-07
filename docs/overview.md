# CMS Platform – Product Overview

| Field | Value |
|---|---|
| Project | CMS Platform (BO + Public Web) |
| Version | 1.6 |
| Status | Draft |
| BO UI language | Vietnamese |
| Web UI language | Vietnamese (MVP); VI + EN in the future — see [i18n.md](./i18n.md) |
| Audience | Product / Engineering |

---

## 1. Problem statement

The organization needs:

1. **Back Office (`bo-cms`)** – administration of accounts, permissions, content, documents, media, audit, and settings.
2. **Public frontend (`web`)** – end users view published Pages, Services, Projects, and News, and download published Documents.

No NestJS / Keycloak in the MVP. Architecture:

```text
Monorepo: apps/bo-cms + apps/web → packages/db (Prisma) → PostgreSQL
                                         ↓
                                  Object Storage
                                         ↑
                              apps/web ↔ Redis (cache)
```

---

## 2. Two frontend products

| | BO CMS (`apps/bo-cms`) | Web (`apps/web`) |
|---|---|---|
| Users | Super Admin, Admin, Editor, Viewer | Visitors / end users |
| Purpose | Administer & publish content | Read / browse public content |
| Auth | Auth.js + RBAC | None (public) in the MVP |
| Data access | Read/write all statuses | `PUBLISHED` only (+ not soft-deleted) |
| Upload | Yes | No |
| Rich editor | Tiptap | Renders published content only |

Detailed web spec: [web-frontend.md](./web-frontend.md).

---

## 3. Product goals

### Platform

1. A single data source (PostgreSQL) for both BO and Web.
2. Unified content lifecycle: Draft → Published → Archived; **only Published content appears on the web**.
3. Shared storage for media/documents.
4. Easy-to-maintain monorepo; no NestJS in the MVP.

### BO

5. Auth + RBAC.
6. CRUD for CMS modules + search/filter/sort/pagination.
7. Append-only Audit Log.
8. Vietnamese admin UI.

### Web

9. Public site renders Page / Service / Project / News by slug.
10. Published Documents are publicly downloadable.
11. SEO: meta + OG/Twitter + JSON-LD + sitemap/robots + `llms.txt` (full SSR).
12. Contact: spam-protected form → saved to DB (+ SMTP if available); BO manages the inbox.
13. Newsletter subscription: saved to DB; BO list + **CSV export** (no campaigns in the MVP).
14. Read performance: **Redis cache** + on-demand revalidation when BO publishes.

---

## 4. Personas

### Back Office

| Role | Purpose |
|---|---|
| **Super Admin** | Full access; users, roles, settings |
| **Admin** | Day-to-day CMS operations |
| **Editor** | Create / edit / publish content |
| **Viewer** | Read-only access in BO |

Details: [rbac-matrix.md](./rbac-matrix.md).

### Public Web

| Persona | Purpose |
|---|---|
| **Visitor** | View pages, services, projects, news; download published documents |

No member accounts on the web in the MVP.

---

## 5. MVP scope

### In the MVP

**Platform / shared**

- Monorepo: `bo-cms`, `web`, `packages/db`
- Shared PostgreSQL + Prisma
- Object Storage abstraction
- Redis service (used by `apps/web`)

**BO**

- Auth, Users, Roles, Permissions
- Pages, Services, Projects, News (+ Category, Tags)
- Documents, Media, Dashboard, Audit Logs, Settings
- Contact messages inbox (`/contacts`)
- Newsletter list + **CSV export** (`/newsletter`) — no campaigns
- Soft delete; publish lifecycle

**Web**

- Home, Page by slug, Services, Projects, News (list/detail)
- Documents list + **public download** (Published only)
- Contact form (anti-spam + persisted to DB; SMTP optional)
- Newsletter subscribe
- SEO metadata from content / settings
- **Redis** cache + on-demand invalidation from BO (performance / SEO)
- Good read performance; 404 for draft/archived/missing content

### Not in the MVP

- NestJS, Keycloak, Microservices, Multi-tenant SaaS
- **Multiple websites / 1 BO + theme templates** (**future**: [multi-site.md](./multi-site.md); MVP is a single site). Themes are selected in BO; web visitors do not configure them.
- Full public REST API for third parties (the web reading the DB directly ≠ a public API)
- Member login on the web
- Token-based draft preview (future)
- Newsletter campaigns / marketing automation
- E-commerce, Payment, CRM, Visual Page Builder, AI, complex approval workflows
- Multi-language content (**future**: VI source → Translate EN — [i18n.md](./i18n.md); MVP is single-language)

---

## 6. Module map

```text
CMS Platform
│
├── apps/bo-cms (Back Office)
│   ├── Authentication / Dashboard
│   ├── Users / Roles / Permissions
│   ├── Pages / Services / Projects / News
│   ├── Documents / Media
│   ├── Contacts (inbox) / Newsletter (export)
│   ├── Audit Logs / Settings
│
├── apps/web (Public Frontend)
│   ├── Home
│   ├── Pages (slug)
│   ├── Services / Projects / News
│   ├── Documents (list + download)
│   └── Contact / Newsletter subscribe
│
└── packages/db
    └── Prisma schema + migrations + seed
```

### Service vs Project

| | Service | Project |
|---|---|---|
| Purpose | Services currently offered | Projects / portfolio |
| Specific fields | price, display_order | client_name, dates, gallery |

### Document vs Media

| | Document | Media |
|---|---|---|
| BO | Metadata + publish | Asset library |
| Web | List + download if Published | Serves URLs used in articles / images |

---

## 7. Main business flow

```text
Editor (BO)          Visitor (Web)
    │                     │
    ▼                     │
Create Draft ──publish──► PUBLISHED ──read──► Displayed on web
    │                     │
    └── Archive/Unpublish ┴──► Hidden from web (404 / not listed)
```

Document download: only when `status = PUBLISHED` and not soft-deleted.

---

## 8. Success criteria (acceptance summary)

- BO meets the acceptance criteria in [requirement.md](./requirement.md).
- Publishing from BO → Redis invalidation/revalidation → content appears on the web.
- Draft / Archived content is **never** exposed on the web (including via guessed URLs).
- Published Documents are publicly downloadable; Drafts are not.
- The web performs no DB-writing mutations (no Server Actions that create/update content).
- Public HTML always includes complete SEO meta (including on cache hits).
- Recommended: the `web` DB role/credentials are **read-only** if the infrastructure allows.

---

## 9. Agreed technical constraints

| Area | Decision |
|---|---|
| Repo | Monorepo (pnpm workspace recommended) |
| Apps | `apps/bo-cms`, `apps/web` |
| Shared DB package | `packages/db` (Prisma) |
| Data for web | Reads PostgreSQL directly, filtered to Published |
| BO auth | Auth.js |
| Web auth | None (MVP) |
| UI | Tailwind; BO uses shadcn/ui |
| Storage | Local (dev) / S3-compatible (prod), shared |
| Cache (Web) | Redis (payload) + Next ISR; BO calls the revalidate API |

Details: [tech.md](./tech.md).

---

## 10. Development roadmap (summary)

| Phase | Content |
|---|---|
| 1 | Monorepo foundation + `packages/db` + seed |
| 2 | BO Access: Auth, Users, Roles, Permissions |
| 3 | BO Content: Pages, Services, Projects, News, Documents, Media |
| 4 | BO Supporting: Dashboard, Audit, Settings |
| 5 | **Web frontend**: routes + Redis cache + revalidate + SEO |
| 6 | Testing & Deployment (2 apps + DB + Redis + storage) |

Detailed order: [requirement.md](./requirement.md) § Implementation Order.
