# CMS Platform – Task Checklist

MVP implementation checklist based on [docs/requirement.md](../docs/requirement.md) + [docs/tech.md](../docs/tech.md).

**How to use:** mark `[x]` when done. Detailed specs live in `docs/`.

| Phase | Status |
|---|---|
| 1. Foundation | Code ready — requires running Docker + seed locally |
| 2. BO Access | Code ready — requires `pnpm install` + `dev:bo` |
| 3. BO Content | Done — Pages/Services/Projects/News/Documents/Media |
| 4. BO Supporting | Done — Dashboard / Audit / Settings |
| 5. Public Web + Redis | Done (MVP) — verify with `pnpm verify` |
| 6. Testing & Deployment | Done (unit + Docker + docs/scripts) — staging manual QA remaining |

---

## Phase 1 – Foundation

- [x] Initialize monorepo (pnpm workspace): `apps/*`, `packages/*`
- [x] Create `packages/db` (Prisma schema per [data-model.md](../docs/data-model.md))
- [x] Docker Compose: PostgreSQL (+ Redis ready for phase 5)
- [x] Migration SQL + seed script (roles, permissions, Super Admin, settings, sample Published content)
- [ ] Verify locally: `docker compose up` + migrate/seed (Docker daemon must be running)
- [x] Basic shared TypeScript config
- [x] Sample env (`.env.example`) for DB / apps

> One-shot setup: `bash scripts/setup-foundation.sh` (Node ≥20, pnpm, Docker).

---

## Phase 2 – BO Access

- [x] Scaffold `apps/bo-cms` (Next.js App Router, Tailwind, UI kit)
- [x] BO layout per [ui-dashboard.md](../docs/ui-dashboard.md): sidebar, header, page header, zinc+blue theme
- [x] Auth.js: login / logout / session ([modules/authentication.md](../docs/modules/authentication.md))
- [x] Login page UI per the UI spec
- [x] Middleware protecting dashboard routes
- [x] RBAC helpers (`assertPermission`, constants)
- [x] Users: list / create / update / soft delete ([modules/users.md](../docs/modules/users.md))
- [x] Roles: CRUD + assign permissions ([modules/roles-permissions.md](../docs/modules/roles-permissions.md))
- [x] Permissions: list/seed view (catalog)
- [x] Block INACTIVE / soft-deleted users from logging in
- [x] Standard list page pattern (search / pagination UI)
- [ ] Verify locally: `pnpm install` + migrate/seed + `pnpm dev:bo`

> Content modules (Pages/News/…) are placeholders — Phase 3.

---

## Phase 3 – BO Content

- [x] Content lifecycle helpers (Draft / Published / Archived)
- [x] Pages: CRUD + publish ([modules/pages.md](../docs/modules/pages.md))
- [x] Services: CRUD + publish + reorder ([modules/services.md](../docs/modules/services.md))
- [x] Projects: CRUD + publish + gallery + reorder ([modules/projects.md](../docs/modules/projects.md))
- [x] News: CRUD + Category + Tags + publish ([modules/news.md](../docs/modules/news.md))
- [x] Documents: upload / metadata / publish / BO download ([modules/documents.md](../docs/modules/documents.md))
- [x] Media library: upload / preview / picker / folders ([modules/media.md](../docs/modules/media.md))
- [x] Storage abstraction (local → S3-ready interface)
- [x] Shared rich text editor (full TipTap: text/colors/tables/media/YouTube/HTML source)
- [x] Standard lists: search / filter / sort / pagination (Pages / Services / Projects / News / Documents / Media)

---

## Phase 4 – BO Supporting

- [x] Dashboard overview UI + data ([modules/dashboard.md](../docs/modules/dashboard.md), [ui-dashboard.md](../docs/ui-dashboard.md))
- [x] Append-only Audit Logs + UI ([modules/audit-logs.md](../docs/modules/audit-logs.md))
- [x] Settings groups + validation ([modules/settings.md](../docs/modules/settings.md))
- [x] Hook calling Web revalidate after publish / settings (Phase 5)
- [x] Newsletter BO: list + CSV export ([modules/newsletter.md](../docs/modules/newsletter.md))
- [x] Contact messages BO inbox + permissions seed ([modules/contact-messages.md](../docs/modules/contact-messages.md))

---

## Phase 5 – Public Web + Redis

See [web-frontend.md](../docs/web-frontend.md).

- [x] Scaffold `apps/web` (Next.js, Tailwind, Vietnamese nav/footer layout)
- [x] Redis client + `getOrSet` cache helpers ([tech.md](../docs/tech.md) § Redis)
- [x] Published-only query helpers (`getPublished*`, `listPublished*`)
- [x] Pages by slug (cached + SEO meta)
- [x] News list + detail (cached)
- [x] Services list + detail (cached)
- [x] Projects list + detail (cached)
- [x] Documents list + **public download** (Published only; binaries not cached)
- [x] Home composition (Architecture style: hero / about / services / projects / news)
- [x] Newsletter: footer form → DB + BO list/CSV export (`/newsletter`) — complete per [modules/newsletter.md](../docs/modules/newsletter.md)
- [x] Contact inbox: `contact_messages` schema + Web persistence + anti-spam (honeypot, IP rate limit, 15-minute cooldown, 24h duplicate check) + BO `/contacts` ([modules/contact-messages.md](../docs/modules/contact-messages.md))
- [x] `sitemap.xml` / `robots.txt` (+ sitemap caching)
- [x] Standard SEO: canonical, OG/Twitter, JSON-LD; `/llms.txt` + `/llms-full.txt`
- [x] `POST /api/revalidate` (secret)
- [x] BO: call revalidate after publish / unpublish / updating Published content / updating public settings
- [ ] Manual verification: Draft/Archived → 404; cache warm; Draft documents not exposed via `/uploads` — checklist [phase-6-verify.md](../docs/phase-6-verify.md)
- [x] Hardening: block draft docs on public `/uploads`; path containment; HTML sanitize (BO save + web render); login rate-limit; JWT re-sync ACTIVE/permissions; callbackUrl allowlist; Super Admin assign guard; lock system role permissions
- [x] Hardening: invalidate reorder list keys (`web:service:list` / `web:project:list`)
- [x] Smoke script: `pnpm verify` (`scripts/verify-mvp.sh`)

---

## Phase 6 – Testing & Deployment

- [x] Unit: permissions, path-safe, callbackUrl, revalidate expandTags (`pnpm test`)
- [ ] In-depth integration tests (Server Actions / Redis hit-miss) — optional; `pnpm verify` smoke test is sufficient for MVP
- [ ] Full Playwright E2E — optional; manual checklist in [phase-6-verify.md](../docs/phase-6-verify.md)
- [x] Docker images: `Dockerfile.bo-cms`, `Dockerfile.web`
- [x] Deploy guide: README + [phase-6-verify.md](../docs/phase-6-verify.md) (PM2 or Docker; staging `admin.*` / `www.*` via Nginx)
- [x] DB backup: `scripts/backup-db.sh` / `pnpm backup:db` (+ sample cron in docs)
- [x] Security ops checklist documented in [phase-6-verify.md](../docs/phase-6-verify.md) / [tech.md](../docs/tech.md) §14

---

## Future – Multi-language (post-MVP)

See [docs/i18n.md](../docs/i18n.md). Not implemented in Phases 1–6.

- [ ] Translations schema (VI source + EN)
- [ ] BO: Translate VI → EN button/tab; publish EN independently
- [ ] Web: locale routing + switcher; per-locale Redis keys
- [ ] Migrate MVP data → `locale = vi`
- [ ] Multilingual public Settings text (if needed)

---

## Future – Multi-site + Themes (post-MVP)

See [docs/multi-site.md](../docs/multi-site.md). One organization, multiple websites, **one BO**; choose a **theme template** in the BO (not on the public web).

- [ ] `sites` schema (+ `theme_key`) + `site_id` on content/settings/media/contact/newsletter; migrate to a `default` site
- [ ] Theme registry + basic packs (`corporate`, `landing`, `minimal`); extract the current web UI → `corporate`
- [ ] BO: active site context + site switcher + `/sites` module (choose theme when creating/editing); keep the UX uncluttered (§5 [multi-site.md](../docs/multi-site.md))
- [ ] Site creation wizard; single-site users don't see a complex switcher; dashboard/KPIs scoped to the active site
- [ ] Scoped queries/actions; hide modules according to the theme's `enabled_modules`; per-site storage prefix
- [ ] Web resolves site → loads theme pack; per-site Redis + revalidation
- [ ] `user_sites` + `site:*` permissions; isolation QA across 2 domains × themes
- [ ] (Service offering) process for adding custom theme packs to the catalog for organizations to choose from

---

## Quick notes

| Decision | Value |
|---|---|
| Apps | `apps/bo-cms`, `apps/web` |
| DB | `packages/db` → PostgreSQL |
| Cache | Redis for Web only |
| Document download | Public if Published |
| UI language (MVP) | Vietnamese |
| Sites (MVP) | Single site |
| i18n (future) | VI source → Translate to EN ([docs/i18n.md](../docs/i18n.md)) |
| Multi-site (future) | 1 BO → multiple websites + theme templates ([docs/multi-site.md](../docs/multi-site.md)) |

Spec: [docs/README.md](../docs/README.md)
