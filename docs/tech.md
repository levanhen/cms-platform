# CMS Platform – Technical Specification

| Field | Value |
|---|---|
| Document | Technical Spec |
| Version | 1.4 |
| Related | [overview.md](./overview.md), [requirement.md](./requirement.md), [web-frontend.md](./web-frontend.md), [data-model.md](./data-model.md) |

---

## 1. Technology Stack

### 1.1. Monorepo

| Layer | Choice | Notes |
|---|---|---|
| Workspace | pnpm (recommended) | `apps/*` + `packages/*` |
| Apps | Next.js App Router × 2 | `bo-cms`, `web` |
| Language | TypeScript | Strict mode |
| ORM | Prisma in `packages/db` | Shared schema + client |
| Database | PostgreSQL 15+ | A single shared database |
| Cache | **Redis** | Mainly for `apps/web` |
| Storage | Local / S3-compatible | Shared between both apps |

### 1.2. Back Office (`apps/bo-cms`)

| Layer | Choice |
|---|---|
| Auth | Auth.js (Credentials + session) |
| Validation | Zod |
| Forms | React Hook Form + Zod |
| UI | Tailwind + shadcn/ui (Vietnamese) |
| Rich text | Tiptap |
| Mutations | Server Actions (+ Route Handlers for upload/download) |
| Redis | Not used directly (MVP) — only calls the Web revalidate API |

### 1.3. Public Web (`apps/web`)

| Layer | Choice |
|---|---|
| Auth | None (MVP) |
| Data | Prisma, reads Published content only |
| Cache | Redis payload (`getOrSet`) + Next.js `revalidatePath` (on demand, triggered from BO) |
| UI | Tailwind (brand site; does not have to use shadcn like the BO) |
| Rendering | Server Components (full HTML for SEO) |
| Download | Route Handler (re-checks Published; binaries are not cached in Redis) |

### 1.4. Not used in the MVP

- NestJS, Keycloak, GraphQL, Elasticsearch
- A full public REST API for third parties
- Redis for BO sessions / BO query cache (Redis scope is web-only)

---

## 2. High-Level Architecture

```text
┌──────────────┐              ┌──────────────┐
│  Internal    │              │   Visitor    │
│  User (BO)   │              │   (Web)      │
└──────┬───────┘              └──────┬───────┘
       │                             │
       ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  apps/bo-cms     │        │  apps/web        │
│  Auth.js + RBAC  │        │  RSC + SEO HTML  │
│  CRUD / Publish  │──reval─▶│  Redis cache     │
│                  │  API   │  Published read  │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         │              ┌────────────┤
         │              ▼            │
         │         ┌─────────┐       │
         │         │  Redis  │       │
         │         └─────────┘       │
         └─────────────┬─────────────┘
                       ▼
              ┌─────────────────┐
              │  packages/db    │
              └────────┬────────┘
            ┌──────────┴──────────┐
            ▼                     ▼
      PostgreSQL            Object Storage
```

**Redis scope (decided):** serves `apps/web` only (query/payload cache). The BO does not use a Redis client in the MVP; after publishing, it calls the Web invalidate/revalidate endpoint.

---

## 3. Monorepo Structure

```text
cms-platform/
├── apps/
│   ├── bo-cms/                 # Back Office
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── middleware.ts
│   └── web/                    # Public frontend
│       ├── app/
│       ├── components/
│       └── lib/queries/
├── packages/
│   ├── db/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/index.ts
│   ├── validations/            # optional shared Zod
│   └── tsconfig/               # optional
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── docker-compose.yml          # postgres + redis (+ minio optional)
```

### Conventions

- Migrations and seeding run **only** from `packages/db`.
- Both apps import the shared DB package.
- The BO owns RBAC / audit / upload.
- The Web only has helpers that read Published content, plus the Redis cache layer.
- The Redis client lives only in `apps/web` (MVP).

---

## 4. Request Patterns

### 4.1. BO – Server Actions

Mutations: Create / Update / Delete / Publish / Assign Role / Settings.

Each action: session → permission → Zod → Prisma → Audit → typed result.

After **Publish / Unpublish / Archive / Update Published / Update public Settings**: call the Web `POST /api/revalidate` endpoint (shared secret) to delete Redis keys + `revalidatePath` (and `revalidateTag` if tags are added later).

### 4.2. BO – Route Handlers

Internal upload / download.

### 4.3. Web – Server Components + Queries + Redis

Read flow:

```text
Request → check Redis key → HIT: use payload
                        → MISS: Prisma (Published filter) → set Redis (TTL) → render HTML
```

Helpers such as `getPublished*`, `listPublished*`, `getPublicSettings` must:

1. Filter on `status = PUBLISHED` + `deleted_at IS NULL`
2. Go through the cache wrapper (Redis)
3. Return enough data to render SEO meta in the HTML (do not cache an "empty shell")

### 4.4. Web – Document download

1. Load by id + Published check (short-lived caching of **metadata** is allowed; file binaries are **not** cached in Redis)  
2. Reject Draft → 404  
3. Stream / signed URL  

### 4.5. Web – Revalidate API

```text
POST /api/revalidate
Header/body: secret = REVALIDATE_SECRET
Body: { tags?: string[], paths?: string[], keys?: string[] }
```

- Delete the related Redis keys (or by tag pattern).
- Trigger Next.js on-demand revalidation.
- Accept only the correct secret; rate limiting is recommended.

---

## 5. Redis Cache Strategy (Web)

### 5.1. Goals

- Reduce TTFB / PostgreSQL load for public pages.
- Keep performance stable when SEO crawlers hit many URLs.
- Still serve full SSR/RSC HTML (`title`, description, OG, content).

### 5.2. Key patterns (proposed)

| Key | Content | Suggested TTL |
|---|---|---|
| `web:settings:public` | site name, logo, default SEO | 30–60 min |
| `web:page:{slug}` | Published Page | 10–60 min |
| `web:news:list:{page}:{q?}` | News list | 1–5 min |
| `web:news:{slug}` | News detail | 10–60 min |
| `web:service:list` / `web:service:{slug}` | Services | 5–60 min |
| `web:project:list` / `web:project:{slug}` | Projects | 5–60 min |
| `web:document:list:{page}` | Documents list metadata | 1–5 min |
| `web:sitemap` | Sitemap fragment | 10–30 min |

The `web:` prefix avoids collisions with other keys added later.

### 5.3. Invalidation rules

| BO event | Invalidate |
|---|---|
| Publish/Unpublish/Update Page | `web:page:{slug}`, `web:sitemap`, related lists |
| News create/update/publish | news slug + news lists + sitemap |
| Service / Project | list + slug + sitemap |
| Document publish/unpublish | document lists (+ detail, if any) |
| Settings (public keys) | `web:settings:public` (+ layout tags) |

TTL remains a safety net if invalidation fails.

### 5.4. Never cached in Redis

- Document / Media file binaries
- PII / `password_hash` / audit
- Drafts / internal BO payloads

---

## 6. Authentication (BO only)

Auth.js Credentials; details in [modules/authentication.md](./modules/authentication.md).

Web MVP: no Auth.js.

BO session: `id`, `email`, `name`, `roles[]`, `permissions[]`.

---

## 7. Authorization

- BO: `resource:action` — [rbac-matrix.md](./rbac-matrix.md).
- Web: published visibility policy (no user RBAC).

---

## 8. Storage Abstraction

```text
StorageProvider: upload | delete | getSignedUrl? | exists
```

Dev: local. Prod: S3-compatible.  
URLs must be resolvable from **both the BO and the Web**.  
Metadata lives in PostgreSQL; binaries live outside the DB.

---

## 9. Content Lifecycle & Visibility

| Status | `bo-cms` | `web` |
|---|---|---|
| DRAFT | Manage | Hidden / 404 |
| PUBLISHED | Manage | Visible + doc download |
| ARCHIVED | Manage | Hidden / 404 |

---

## 10. List / Query Conventions

- BO: `page`, `limit`, `search`, `status`, `sort`, `order` (default limit 20).
- Web: pagination for long lists; optional title search.

---

## 11. Error Handling

BO: 400–500 messages in Vietnamese.  
Web: not Published → **404** (no Draft leakage). Downloading a Draft → 404.

---

## 12. BO UI Layout

Full details: **[ui-dashboard.md](./ui-dashboard.md)**.

Summary:

- Shell: Sidebar (collapsible) + sticky Header + Main — shadcn Sidebar pattern.
- Theme: light, **zinc neutrals + blue accent**.
- Sidebar (Vietnamese labels, grouped): Tổng quan (Overview) · Người dùng / Vai trò / Quyền (Users / Roles / Permissions) · Trang / Dịch vụ / Dự án / Tin tức (Pages / Services / Projects / News) · Tài liệu / Thư viện (Documents / Media Library) · Nhật ký / Cài đặt (Audit Log / Settings).
- Menu items are hidden based on permissions (UX); the server still enforces them.
- List/form pages: page header + toolbar + standard table/form using the same design system.

---

## 13. Web UI Layout

Header nav + Main + Footer. Routes: [web-frontend.md](./web-frontend.md).

---

## 14. Security Checklist

Detailed ops checklist: [phase-6-verify.md](./phase-6-verify.md).

### Shared

- [ ] HTTPS; per-app secrets; Prisma never reaches the browser *(ops)*
- [x] Redis holds no secrets/PII; bound to localhost / Docker network *(compose defaults to `127.0.0.1`)*

### BO

- [x] Password hashing; Zod + authz; upload validation; login rate limiting; audit *(code)*
- [x] Revalidate calls use `REVALIDATE_SECRET` (never exposed to the client) *(code)*
- [ ] Secure cookie/session on the HTTPS domain *(ops — enable once TLS is in place)*

### Web

- [x] Published-only; download re-check; block `/uploads/documents` Draft bypass *(code)*
- [ ] Read-only DB user (recommended) *(ops)*
- [x] Rate limit on `/api/revalidate` *(code)*; download rate limiting *(optional, remaining)*
- [ ] Redis auth/password if exposed beyond the localhost Docker network *(ops)*

---

## 15. Performance Targets

| Metric | Target |
|---|---|
| BO list load | < 2s |
| BO CRUD | < 500ms (excluding large uploads) |
| Web home/detail (cache warm) | < 1–1.5s perceived; consistently low TTFB |
| Web cold (cache miss) | < 2–2.5s under normal conditions |

Strategy: Redis payload cache + on-demand invalidation from the BO (`revalidatePath` + key deletion). `revalidateTag` / full ISR is an enhancement.  
Redis TTL = safety net; SEO still receives full HTML from RSC (not SPA-only).

---

## 16. Environment Variables

### Shared

```text
DATABASE_URL=
```

### apps/bo-cms

```text
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
STORAGE_DRIVER=local|s3
STORAGE_LOCAL_PATH=
S3_ENDPOINT= S3_REGION= S3_BUCKET= S3_ACCESS_KEY= S3_SECRET_KEY=
NEXT_PUBLIC_APP_NAME=
MAX_UPLOAD_SIZE_MB=20
WEB_REVALIDATE_URL=https://www.example.com/api/revalidate
REVALIDATE_SECRET=
```

### apps/web

```text
DATABASE_URL=              # ideally read-only
REDIS_URL=redis://…        # or REDIS_HOST / PORT / PASSWORD
STORAGE_DRIVER= / S3_…
NEXT_PUBLIC_SITE_URL=
REVALIDATE_SECRET=
SMTP_HOST= SMTP_PORT=587 SMTP_SECURE=false
SMTP_USER= SMTP_PASS=
SMTP_FROM=                 # optional: contact form → email to Settings.contact_email (message is always stored in DB)
```

---

## 17. Testing

| Layer | BO | Web |
|---|---|---|
| Unit | Zod, permissions | published helpers, cache key builders |
| Integration | Server Actions + revalidate call | Redis hit/miss; download Published vs Draft |
| E2E | Login, CRUD, deny | Publish in BO → invalidate → Web shows new content; Draft 404 |

---

## 18. Deployment

- Services: `bo-cms`, `web`, **Redis**, PostgreSQL, storage
- `docker-compose`: postgres + redis (+ minio optional)
- Separate hosts: `admin.*` → BO, `www.*` → Web
- Redis only on a private network
- Regular DB backups; Redis persistence optional (cache-only is fine)

---

## 19. Extensibility

1. Model + migration in `packages/db`  
2. BO permissions + UI + module doc  
3. Web published routes + Redis keys/invalidation map  
4. Update acceptance criteria  

---

## 20. BO App Internal Structure

```text
apps/bo-cms/
├── app/ (auth) + (dashboard) + api/
├── components/ ui|layout|forms|tables|editors
├── features/ users|roles|pages|services|projects|news|…
├── lib/ auth|permissions|storage|audit|revalidate|utils
└── middleware.ts
```

The Web additionally has `lib/cache/` (Redis client + getOrSet) and `app/api/revalidate/`.
