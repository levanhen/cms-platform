# Multi-site (1 BO → multiple Websites) – Future Extension

| Field | Value |
|---|---|
| Status | **Future** — not implemented in the MVP |
| Scope | Multiple public websites within **one organization**, managed by **one Back Office** + a **theme/template** selected in the BO |
| Related | [overview.md](./overview.md), [requirement.md](./requirement.md), [data-model.md](./data-model.md), [web-frontend.md](./web-frontend.md), [rbac-matrix.md](./rbac-matrix.md), [i18n.md](./i18n.md) |

> Current MVP: **a single site** (one Settings set, one Web app, one `NEXT_PUBLIC_SITE_URL`, one fixed design).  
> This spec **locks in the extension direction** to avoid the wrong refactor when an organization needs multiple domains / landing pages / design templates.

**Not to be confused with:**
- **i18n** ([i18n.md](./i18n.md)) — multiple languages on the **same** website/brand.
- **Multi-tenant SaaS** — multiple companies sharing a hosted platform (out of scope for the first phase).
- **Visual page builder** — free-form drag-and-drop blocks (out of scope for the first multi-site + themes phase).

---

## 1. Product goals

Build an internal CMS for **one organization**:

- A single BO login manages everything.
- The organization creates **several websites** (corporate site, landing pages, simple sites…).
- Each site selects **one template (theme)** available in the system.
- The system ships a few **basic templates**; if a custom design is needed → a theme is built as an **additional service**, added to the catalog → the organization selects it in the BO.
- External users (website visitors) **only browse / submit forms** — they do not choose themes, layouts, or configure anything.

```text
Development team (platform)   Organization (BO)                 Visitors (Web)
  build theme pack        →   choose template + enter content →   browse / contact only
  add to catalog              publish site
```

---

## 2. Agreed principles

| Principle | Details |
|---|---|
| Root entity | `sites` table (+ `theme_key`) |
| Data isolation | Content / settings / media / contact / newsletter are tied to `site_id` |
| BO context | `activeSiteId`; every operation is filtered by site |
| Where the theme is chosen | **Only in the BO** when creating/editing a site — no theme selection UI on the public web |
| What a theme is | A code pack in the repo (layout + tokens + module flags); no arbitrary ZIP uploads in phase 1 |
| Basic themes | A few templates shipped out of the box (e.g. `corporate`, `landing`, `minimal`) |
| Custom themes | Design/dev service → add the pack to the catalog → appears in the BO for the organization to choose |
| Public web | Resolve site → load the assigned theme → render; zero configuration for end users |
| Cache / storage / revalidate | Per `siteId` (the theme only affects presentation) |
| MVP migration | Site `default` + `theme_key = corporate` (or the theme closest to the current UI) |

---

## 3. Themes / templates

### 3.1. Roles

| Role | Theme permissions |
|---|---|
| **Organization (BO)** | Choose a theme from the available list; change a site's theme (with care); configure settings/content |
| **Development team (platform)** | Create/ship new theme packs (basic or custom as a service) |
| **Web visitors** | Cannot choose / do not see the theme catalog |

### 3.2. Theme pack (in code)

Each theme is a code module, for example:

```text
apps/web/themes/
  corporate/     # close to the current MVP UI: services, projects, news…
  landing/       # hero + CTA + contact, few modules
  minimal/       # pages + contact
  {custom-slug}/ # theme built as a custom service
```

Each pack declares (manifest):

| Field | Meaning |
|---|---|
| `key` | e.g. `corporate`, `landing` — stored in `sites.theme_key` |
| `name` / `description` | Shown in the BO when choosing a template |
| `preview_image` | Demo image in the BO (optional) |
| `enabled_modules` | Content modules in use: `pages`, `services`, `projects`, `news`, `documents`… |
| `home_sections` | Fixed home page sections (hero, features, CTA…) |
| `tokens` | CSS variables: colors, fonts (can be overridden by site Settings) |

**Shared content model** (current Prisma + `site_id`). The theme only determines **presentation** and **which modules are enabled** on that site — no per-theme schema.

### 3.3. BO: choosing a template

When **creating a site** / **editing a site**:

1. Choose a `theme_key` from the catalog (radio/card preview).
2. Fill in domain, site name, basic settings.
3. After saving: editors enter content for the modules the theme allows (disabled modules → hidden from the menu or creation disabled on that site).

Changing the theme after content exists: allowed, but with a warning (sections/modules may not map 1:1). Content is never auto-deleted.

### 3.4. Custom theme service

1. A client requests a custom design.
2. The dev team builds a new pack (`themes/{key}`) + registers it in the catalog.
3. Deploy/release the platform.
4. In the BO, the organization sees the new template and assigns it to the relevant site.

Phase 1 does **not** include: a self-upload theme marketplace, or a drag-and-drop theme editor in the UI.

### 3.5. Proposed basic templates (themes phase)

| Key | Purpose | Suggested modules |
|---|---|---|
| `corporate` | Full corporate site (close to the current MVP web) | pages, services, projects, news, documents, contact, newsletter |
| `landing` | Landing / campaign | pages (few), contact; strong CTA; news/projects can be disabled |
| `minimal` | Simple introduction site | pages, contact |

The number of templates can grow over time; the catalog is read from a code registry (no DB table required in phase 1). Optional later: a `themes` metadata table if templates need to be enabled/disabled per environment.

---

## 4. Data model

### 4.1. `sites`

| Column | Type | Notes |
|---|---|---|
| id | cuid / uuid | PK |
| name | string | Display name in the BO |
| slug | string | UNIQUE, stable (e.g. `main`, `brand-b`) |
| primary_domain | string | UNIQUE (e.g. `www.example.com`) |
| extra_domains | json / string[]? | Optional aliases |
| status | enum | `ACTIVE` \| `INACTIVE` |
| theme_key | string | NOT NULL — theme pack key (e.g. `corporate`) |
| locale_default | string | e.g. `vi` — compatible with future i18n |
| revalidate_url | string? | Optional override |
| created_at / updated_at | datetime | |

### 4.2. Adding `site_id` (NOT NULL + index)

- `pages`, `services`, `projects`, `news` (+ categories / tags if scoped)
- `documents`, `media`, `media_folders`
- `settings` → unique `(site_id, key)`
- `contact_messages`, `newsletter_subscribers`
- Optional: `audit_logs.site_id`

### 4.3. Users ↔ sites

`user_sites` table (`user_id`, `site_id`).

- Super Admin: all sites.
- Regular users: only assigned sites.
- Global role catalog; additionally enforce `site_id` + membership.

### 4.4. Per-site uniqueness

- pages / news / services / projects: `@@unique([siteId, slug])`
- newsletter: `@@unique([siteId, email])`
- settings: `@@unique([siteId, key])`

---

## 5. BO UX – efficient management without confusion

**Golden rule:** in the BO there is always **exactly one active working site** (`activeSiteId`), clearly displayed. Every content screen belongs only to that site — you never edit site A while seeing site B's data.

### 5.1. Site context is always visible

- A **site switcher** fixed in the header: site name + primary domain + theme badge (read-only).
- Optional: a subtle per-site color/label for quick recognition.
- Switching site → reset lists/filters to the new context (do not keep old filters/pagination that could cause confusion).
- Users with only **1 site** → no switcher (or just a fixed name without a dropdown) — less noise for day-to-day editors.

### 5.2. Two navigation layers

| Layer | Content | Daily users |
|---|---|---|
| **Per site** (default) | Pages, Services, News, Media, Contacts, Newsletter, site Settings, site Dashboard… | Site editors / admins |
| **Organization-wide** (global) | `/sites` (site CRUD + theme), User↔Site assignment, global Roles | Super Admin / global Admin |

Editors do **not** need to visit "Sites" every day — just the switcher (if >1 site) + content modules.

### 5.3. Site creation wizard (short)

When creating a new site:

1. Name + domain  
2. Choose a **theme template** (card preview)  
3. Assign managers (optional)  
4. Save → **automatically switch** `activeSiteId` to the new site + a suggested checklist (home page / contact / logo)

Do not expose complex modules the theme has disabled (e.g. `landing` does not show News/Projects).

### 5.4. Menu by theme

- Only show modules listed in the assigned theme's `enabled_modules`.
- Fewer menu items = less confusion; the server still rejects calls to actions of disabled modules.

### 5.5. No "all sites" configuration mixing

- Settings (logo, SEO, contact…) = **only for the selected site**.
- The first phase has **no** "apply settings to all sites" (it easily breaks branding / causes confusion).
- The media picker / upload always writes the current `site_id`; assets from other sites are not shown.

### 5.6. Per-site dashboard

- KPIs, new contacts, recent activity = **active site**.
- Optional (Super Admin): an "all sites overview" screen (e.g. number of NEW contacts per site) — separate from the editor's daily dashboard.

### 5.7. Dangerous operations

- Deleting / deactivating a site, changing a domain, changing the theme: explicit confirmation + ideally retyping the site name/slug.
- Changing the theme: warn that modules/sections may not map 1:1; never auto-delete content.

### 5.8. Daily flow (organization)

```text
Login
  → (if >1 site) choose / restore the working site
  → Sidebar shows only modules for that site + theme
  → Edit content / view contacts / site settings
  → Need to work on another site: switch once, then continue
```

Organization-wide admins occasionally visit `/sites` to create new sites or assign users — keeping the mental models of "operating content" and "managing the site portfolio" separate.

### 5.9. UX checklist (BO acceptance)

- [ ] The header always shows which site is active (name + domain).
- [ ] Single-site users are not bothered by a complex switcher.
- [ ] Switching sites leaves no leftover data/filters from the previous site in lists.
- [ ] Modules disabled by the theme do not appear in that site's sidebar.
- [ ] Settings/Media/Contacts are never mixed across sites.
- [ ] Creating a site via the wizard → lands in the new site's context + clear next steps.

---

## 6. Public Web

1. Resolve the site (`Host` / `SITE_ID`).
2. Read `theme_key` → load the pack's layout/components.
3. Query Published content for **only** that `site_id`.
4. End users: no CMS login, no settings, no template selection.

### Deploy

- **Recommended for phase 1:** a single multi-theme `apps/web` codebase; one or more instances per domain (env points to the site).
- Revalidate per site; Redis keys `web:{siteId}:…`.

---

## 7. Permissions (additional)

| Code | Description |
|---|---|
| `site:view` | View the site list |
| `site:create` | Create a site (+ choose a theme) |
| `site:update` | Edit site / domain / theme / status |
| `site:delete` | Delete / deactivate a site |

No "choose theme on the web" permission is needed.  
Update [rbac-matrix.md](./rbac-matrix.md) when implementing.

---

## 8. Migration from the MVP

1. Create `sites`; insert `default` (domain from `NEXT_PUBLIC_SITE_URL`, `theme_key = corporate`).
2. Backfill `site_id` on all related tables.
3. Extract the current web UI into the `themes/corporate` pack (or keep it compatible).
4. BO forces active site = default — behavior identical to the MVP.
5. Only then add sites/landing pages with other themes.

---

## 9. Out of scope (first multi-site + themes phase)

- True multi-tenant SaaS (multiple companies).
- External visitors choosing / changing themes.
- Theme ZIP uploads / self-serve marketplace.
- Visual page builder / free-form drag-and-drop blocks.
- Syndicating one article to multiple sites.
- Full i18n — [i18n.md](./i18n.md).
- WYSIWYG theme editor in the BO (only pack selection + basic token settings).

---

## 10. Acceptance

### Multi-site
- [ ] ≥2 sites; content from A is not exposed on web B.
- [ ] BO switcher; settings/contacts/newsletter/media separated per site.
- [ ] Revalidate / Redis target the correct site.
- [ ] Site-restricted users are blocked (UI + server).
- [ ] BO UX avoids confusion: see checklist §5.9.

### Themes
- [ ] Creating a site requires choosing a `theme_key` from the basic catalog.
- [ ] The web renders the assigned theme's layout; changing the theme in the BO → the web's presentation changes after revalidation.
- [ ] Modules not in the theme are hidden/disabled in that site's BO.
- [ ] No theme selection UI on the public frontend.
- [ ] Adding a new theme pack (code) → it appears in the BO for selection (after deploy).

---

## 11. Suggested implementation order

```text
1. sites schema (+ theme_key) + site_id backfill + default site
2. Theme registry + extract corporate from the current web UI
3. BO: /sites + switcher + theme selection on create/edit
4. Scoped queries/actions + hide modules per enabled_modules
5. Web: resolve site → load theme pack
6. Add landing + minimal; QA 2 domains × 2 themes
7. (Service) add custom theme packs on client request
```

---

## 12. Effort / risks (for reference)

- Multi-site alone is already a large refactor; **+ themes** adds presentation/registry effort but matches the goal of "a few sites / landing pages from templates".
- Still lighter than a page builder.
- Short term, if multi-site is not done yet: clone the stack or keep a single MVP site as today; themes wait for this phase.
