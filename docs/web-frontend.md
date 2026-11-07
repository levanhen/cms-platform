# Public Web Frontend – Specification

| Field | Value |
|---|---|
| App | `apps/web` |
| Version | 1.6 |
| Status | MVP + Contact inbox / anti-spam (spec); implemented per tasks |
| Related | [overview.md](./overview.md), [requirement.md](./requirement.md), [tech.md](./tech.md), [data-model.md](./data-model.md), [i18n.md](./i18n.md), [../tasks/README.md](../tasks/README.md) |

---

## 1. Goals

A public CMS frontend that lets **end users** view content published from the Back Office.

- No login in the MVP.
- No creating/editing/deleting CMS content (only the contact / newsletter forms write supporting data).
- Only reads content records with `status = PUBLISHED` and `deleted_at IS NULL`.
- Published documents: **publicly downloadable** (re-checked server-side).
- SEO + discovery for crawlers / LLMs (`sitemap`, `robots`, `llms.txt`).

---

## 2. Data sources

```text
apps/web → packages/db (Prisma) → PostgreSQL
apps/web → Object Storage / public media URLs (images, files) via STORAGE_LOCAL_PATH
apps/web → Redis (payload cache)
```

### Mandatory query rule (content)

```text
WHERE status = 'PUBLISHED'
  AND deleted_at IS NULL
```

Helpers: `lib/queries/published.ts` (`getPublished*`, `listPublished*`, `getPublicSettings`).

**Forbidden:** returning Draft / Archived / soft-deleted records, even if the client guesses the correct slug/id.

Public settings: `site_name`, `site_description`, `logo`, `favicon`, SEO defaults, `contact_*`.

---

## 3. Routes (implemented)

| Route | Description |
|---|---|
| `/` | Home page (hero + about + services + projects + news…) |
| `/pages/[slug]` | Published static page |
| `/services` | Service list |
| `/services/[slug]` | Service detail |
| `/projects` | Project list |
| `/projects/[slug]` | Project detail |
| `/news` | News list (pagination) |
| `/news/[slug]` | News detail |
| `/documents` | Published document list |
| `/documents/[id]/download` | File download (Published only; no Redis binary cache) |
| `/contact` | Settings info + form → DB (+ SMTP if available) |
| `/uploads/[...path]` | Serves files from local storage (media/images) |
| `/api/contact` | POST contact form (anti-spam + persist) |
| `/api/newsletter` | POST newsletter subscription |
| `/api/revalidate` | POST invalidate Redis + `revalidatePath` (secret) |
| `/sitemap.xml` | Sitemap of Published content + static pages |
| `/robots.txt` | Crawl rules + host + sitemap |
| `/llms.txt` | Site summary for LLMs (generated dynamically from the DB) |
| `/llms-full.txt` | Catalog of Published URLs (generated dynamically from the DB) |

### Optional / not yet done (MVP)

| Route | Notes |
|---|---|
| `/news/category/[slug]` | Filter news by category — **optional**, not implemented |
| Tags on news detail | Recommended by spec; the query does not select tags yet — small backlog item |

Page path: **`/pages/[slug]`** (not a root `/[slug]`, to avoid conflicts).

---

## 4. Home page

Current composition:

- Hero (static brand slides) + About (Page `about-us` if Published)
- Services / Process / Why / Portfolio (Projects) / Stats / Testimonials / Team / Blog (News)
- Published data from the DB; some marketing sections still use static copy

No complex dashboard.

---

## 5. Content rendering per module

### 5.1. Pages

- `title`, `content` (TipTap HTML), `featured_image`.
- SEO: `seo_title` / `seo_description`, falling back to `title` / `summary`.
- JSON-LD: `WebPage` + `BreadcrumbList`.

### 5.2. Services

- List: name, short_description, icon/image; sorted by `display_order ASC`, then `published_at DESC`.
- Detail: description, price, category.
- JSON-LD: `Service` + breadcrumb.

### 5.3. Projects

- List: title, client, featured_image, category, dates; `display_order`.
- Detail: content, gallery, location, SEO.
- JSON-LD: `CreativeWork` + breadcrumb.

### 5.4. News

- List: title, excerpt, thumbnail/featured, category, `published_at`; pagination.
- Detail: content, author `name`, category; SEO; JSON-LD `Article`.
- Filter `/news/category/[slug]`: optional (not available yet).
- Tags on detail: backlog (the schema has a tags relation).

### 5.5. Documents

- List: title, description, file_type, file_size, category.
- Download: `/documents/[id]/download` — re-checks Published; `Cache-Control: no-store`.
- Draft/Archived are not listed.

> **Security note:** The catch-all `/uploads/*` serves files from disk. Sensitive documents should only be exposed via the download route, which checks status (hardening backlog — see security review).

### 5.6. Contact

- `/contact`: Settings `contact_address`, `contact_phone`, `contact_email`.
- Form → `POST /api/contact`:
  1. Anti-spam (mandatory): honeypot; rate limit **5/IP/60s**; **15-minute** cooldown for the same IP or email; duplicate content (hash of `email+subject+message`) within **24h** → `429`.
  2. **Always persist** to the `contact_messages` table (`NEW`).
  3. SMTP (env `SMTP_*`) sends to `contact_email` if configured — Reply-To = sender's email; SMTP errors do not block saving to the DB.
- BO inbox management: [modules/contact-messages.md](./modules/contact-messages.md) (`/contacts`).

### 5.6b. Newsletter

- Footer form → `POST /api/newsletter` → `newsletter_subscribers` table.
- Status `ACTIVE` / `UNSUBSCRIBED`; honeypot + rate limit; default source `footer`.
- BO: **list + CSV export** is sufficient ([modules/newsletter.md](./modules/newsletter.md)). No email campaigns in the MVP. Unsubscribing/deleting subscribers = optional.

### 5.7. Media

- No public `/media` library page.
- Images via `/uploads/...` URLs or external URLs (Unsplash in seed data).

---

## 6. SEO & Meta + LLMs

- `<title>`, description, **canonical**, `metadataBase` (`NEXT_PUBLIC_SITE_URL`).
- Open Graph + Twitter Card; absolute image URLs.
- `lang="vi"`.
- JSON-LD: Organization, WebSite (layout); Article / Service / CreativeWork / WebPage / ContactPage + BreadcrumbList.
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` (content **generated dynamically from the DB**, not static files on disk).

---

## 7. UI / UX

- UI chrome in Vietnamese: nav, footer, buttons.
- Layout: Header + Main + Footer.
- Nav: "Trang chủ" (Home), "Dịch vụ" (Services), "Dự án" (Projects), "Tin tức" (News), "Tài liệu" (Documents), "Liên hệ" (Contact).
- Responsive; friendly 404; simple empty states.
- Visuals: custom Tailwind (shadcn is not required as in the BO).

---

## 8. Performance & Caching

### 8.1. Cache layers (actual MVP)

```text
Visitor → Next.js RSC → Redis getOrSet(payload) → PostgreSQL
```

- **Redis**: settings, list/detail content, sitemap fragments (TTL per key).
- **On-demand**: BO → `POST /api/revalidate` → `invalidateKeys` + `revalidatePath`.
- `revalidateTag` is called in the API, but queries are **not yet** tagged with Next `cacheTag` — the effective mechanism is Redis + paths.
- Document binaries: **not** cached in Redis.
- Images: plain `<img>` (`next/image` not yet required).

Key/TTL details: [tech.md](./tech.md) § Redis.

### 8.2. Invalidation

| BO event | Web |
|---|---|
| Publish / Unpublish / Archive / Update Published | Invalidate slug + related list keys + paths |
| Update public Settings | `web:settings:public`, `web:layout` |
| Soft delete Published | Invalidate accordingly |

**Note:** Reordering Services/Projects invalidates `web:service:list` / `web:project:list` (+ sitemap).

Seeding / manual DB edits: Redis must be cleared or revalidate called — seeding does **not** invalidate automatically.

### 8.3. Targets

| Metric | Target |
|---|---|
| Home / detail (warm cache) | < 1–1.5s perceived |
| Cold / miss | < 2–2.5s under normal conditions |

---

## 9. Security (Web)

1. Never expose Prisma / secrets to the client.
2. Content queries always filter Published + not deleted.
3. Document download: re-check Published; block path traversal in the key.
4. Web DB user: read-only recommended (ops).
5. Never surface `password_hash`, audit logs, or permissions on the web.
6. Rate limit contact / newsletter; revalidate requires `REVALIDATE_SECRET`.
7. HTTPS + private Redis in production.
8. Hardening backlog: do not serve Draft documents via `/uploads/documents/...`; sanitize TipTap HTML before rendering.

---

## 10. What the Web does NOT do (MVP)

- Login / membership
- Draft preview
- Comments / likes / complex analytics
- Advanced full-text search
- Admin UI / uploads
- NestJS / multi-tenant public API
- Caching Drafts in Redis
- **i18n routing** (future — [i18n.md](./i18n.md))

---

## 11. Project structure (actual)

```text
apps/web/
├── app/
│   ├── page.tsx                 # Home
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── pages/[slug]/
│   ├── services/ … [slug]/
│   ├── projects/ … [slug]/
│   ├── news/ … [slug]/
│   ├── documents/ … [id]/download/
│   ├── contact/
│   ├── uploads/[...path]/
│   ├── api/contact|newsletter|revalidate/
│   ├── llms.txt/route.ts
│   ├── llms-full.txt/route.ts
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── layout/                  # header, footer, newsletter-form
│   ├── home/
│   ├── content/
│   ├── contact/
│   └── seo/                     # JsonLd helpers
└── lib/
    ├── cache/redis.ts
    ├── queries/published.ts
    ├── seo.ts
    ├── mail.ts
    └── storage*.ts
```

---

## 12. Integration with the BO

| BO event | Web |
|---|---|
| Publish / Unpublish / Archive / Update Published | Invalidate Redis + revalidate paths |
| Soft delete | Invalidate |
| Update public Settings | Invalidate settings/layout |
| Newsletter subscribers | Web POSTs subscriptions; BO lists + exports CSV |
| Contact messages | Web POST + anti-spam + persist; BO inbox `/contacts` |
| Upload media/doc | Files under `STORAGE_LOCAL_PATH`; URL `/uploads/...` |

Shared: `packages/db`, storage path, Settings keys, `REVALIDATE_SECRET`, `WEB_REVALIDATE_URL`.

Deploy env: copy `.env` → `packages/db`, `apps/web`, `apps/bo-cms`. See [../README.md](../README.md) § Deploy.

---

## 13. Acceptance Criteria – Web

### Implemented (code in place — needs verification per environment)

- [x] Home + navigation to the main modules
- [x] Published Page / Service / Project / News by slug
- [x] News list pagination
- [x] Documents list + download of Published documents
- [x] Contact form + newsletter subscription (web)
- [x] Contact: DB persistence + full anti-spam (cooldown / duplicate) + BO inbox
- [x] Newsletter: BO list + CSV export
- [x] SEO meta + JSON-LD + sitemap/robots/llms
- [x] Redis getOrSet + `/api/revalidate` + BO hooks
- [x] No CMS content-writing forms on the web
- [x] Basic mobile layout

### Verify / hardening (Phase 5–6)

- [ ] Draft / Archived / Deleted → 404; not included in the sitemap
- [ ] Draft documents cannot be downloaded (even with a known id) **and** are not exposed via `/uploads/documents/...`
- [ ] Publish in BO → invalidate → Web shows the new version (without waiting for a long TTL)
- [ ] Redis hits reduce queries on hot pages
- [ ] AUTH_URL / `NEXT_PUBLIC_SITE_URL` set to the correct production host

---

## 14. Implementation order (MVP done)

```text
1. App shell + settings
2. Redis + published helpers
3. Pages / News / Services / Projects / Documents
4. Home composition
5. Contact + Newsletter
6. SEO + llms + sitemap/robots
7. Revalidate API + BO hooks
8. Verify + security hardening + tests (Phase 6)
```

---

## 15. Short backlog (post-MVP web)

1. News tags on detail; optional `/news/category/[slug]`
2. Fix reorder invalidation → `web:service:list` / `web:project:list:*`
3. Sanitize HTML on render / on BO save
4. Block public serving of non-Published documents
5. `next/image` / CDN; DB GRANT SELECT for the web role
6. i18n VI→EN — [i18n.md](./i18n.md)
