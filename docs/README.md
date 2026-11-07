# CMS Platform – Documentation Index

Specification documents for a CMS system made up of **2 frontends** in a monorepo:

| App | Purpose |
|---|---|
| `apps/bo-cms` | Back Office – internal administration |
| `apps/web` | CMS frontend – displays content to end users |

Both apps share **PostgreSQL** (Prisma in `packages/db`) and **Object Storage**.  
`apps/web` additionally uses **Redis** for caching (performance + SEO).

## Documentation structure

| File | Description |
|---|---|
| [overview.md](./overview.md) | Product overview, goals, scope, personas |
| [requirement.md](./requirement.md) | System Requirements (SRS) – mainly BO + platform constraints |
| [web-frontend.md](./web-frontend.md) | Public frontend spec (`apps/web`) |
| [tech.md](./tech.md) | Stack, monorepo, architecture, deployment |
| [ui-dashboard.md](./ui-dashboard.md) | BO UI shell + "Tổng quan" (Overview) page (shadcn) |
| [data-model.md](./data-model.md) | Shared data model |
| [i18n.md](./i18n.md) | Future: multi-language VI → Translate EN |
| [multi-site.md](./multi-site.md) | Future: 1 BO → multiple websites + themes/templates (selected in BO) |
| [rbac-matrix.md](./rbac-matrix.md) | Role × Permission matrix (BO only) |
| [phase-6-verify.md](./phase-6-verify.md) | Verification / deployment / backup / security operations |

## Module specs (Back Office)

| Module | File |
|---|---|
| Authentication | [modules/authentication.md](./modules/authentication.md) |
| Dashboard | [modules/dashboard.md](./modules/dashboard.md) |
| Users | [modules/users.md](./modules/users.md) |
| Roles & Permissions | [modules/roles-permissions.md](./modules/roles-permissions.md) |
| Pages | [modules/pages.md](./modules/pages.md) |
| Services | [modules/services.md](./modules/services.md) |
| Projects | [modules/projects.md](./modules/projects.md) |
| News | [modules/news.md](./modules/news.md) |
| Documents | [modules/documents.md](./modules/documents.md) |
| Media | [modules/media.md](./modules/media.md) |
| Audit Logs | [modules/audit-logs.md](./modules/audit-logs.md) |
| Settings | [modules/settings.md](./modules/settings.md) |
| Contact messages | [modules/contact-messages.md](./modules/contact-messages.md) |
| Newsletter | [modules/newsletter.md](./modules/newsletter.md) |

## Key decisions

- Monorepo: `apps/bo-cms` + `apps/web` + `packages/db`.
- Shared DB: web reads PostgreSQL directly, **`PUBLISHED` content only**.
- **Redis** cache for `apps/web`; BO publish → invalidate/revalidate.
- `PUBLISHED` documents can be **downloaded publicly** on the web.
- **Contact:** Web form → saved to DB + anti-spam; BO inbox at `/contacts`; SMTP as a secondary channel (if configured).
- **Newsletter:** Web subscribe; BO **list + CSV export** (no campaigns).
- SEO/LLMs (`llms.txt`).
- Keep both the **Service** and **Project** modules.
- BO UI: **Vietnamese**, shadcn, **zinc + blue** theme ([ui-dashboard.md](./ui-dashboard.md)).
- Web UI: **Vietnamese** (MVP); in the future VI + EN via a Translate flow — [i18n.md](./i18n.md).
- MVP = **a single site** / a single UI; multiple websites + theme templates (selected in BO) = future — [multi-site.md](./multi-site.md).
- No NestJS / Keycloak / full Public REST API in the MVP.

## Suggested reading order

1. `overview.md`
2. `requirement.md` + `web-frontend.md`
3. `tech.md` + `data-model.md` + `rbac-matrix.md`
4. `modules/` (BO) in implementation order  
5. Start working through the checklist: [../tasks/README.md](../tasks/README.md)
