# BO CMS – UI Dashboard Specification

| Field | Value |
|---|---|
| Document | Back Office UI / Dashboard Design Spec |
| Version | 1.0 |
| App | `apps/bo-cms` |
| Stack UI | Tailwind CSS + shadcn/ui |
| Language | Vietnamese |
| Theme | Light (default); zinc neutrals + **blue** accent |
| Related | [modules/dashboard.md](./modules/dashboard.md), [tech.md](./tech.md), [rbac-matrix.md](./rbac-matrix.md) |

---

## 1. Goals

Build a **clean, clear, modern** Back Office interface following the common admin dashboard pattern (shadcn sidebar + content):

1. A unified shell for every BO page (`/dashboard`, lists, forms).
2. The **"Tổng quan"** (Overview) page (`/dashboard`) is the entry point after login.
3. Professional look, easy to scan figures; optimized for desktop, works well on tablet/mobile.
4. Respect RBAC: hide nav items/cards the user has no permission for (the server still enforces).

---

## 2. Design principles

| Principle | Application |
|---|---|
| Clarity first | One clear hierarchy: page title → KPIs → activity |
| Moderate density | Not overcrowded; standard gaps, no "dashboard bloat" |
| Consistency | Same Card, Table, Button, Form patterns across the whole BO |
| Permission-aware | UI reflects permissions; no fake empty modules |
| Performance feel | Skeleton immediately on load; avoid layout shift |
| Accessible | Focus ring, contrast, `aria-label` for icon-only controls |

### Avoid

- Purple gradient / glow / glassmorphism "AI default" look
- Multi-layer shadows, cluttered pill badges
- Drag-and-drop customizable widgets (out of MVP)
- Complex charts on the dashboard (MVP)
- Mandatory dark mode (may come in a later phase with a shadcn theme)

---

## 3. Visual tokens

### 3.1. Color

Use shadcn CSS variables; mapping:

| Token | Direction |
|---|---|
| Background | `zinc-50` / `--background` |
| Card / sidebar | `white` / `--card` |
| Border | `zinc-200` / `--border` |
| Text | `zinc-900` / muted `zinc-500` |
| **Primary (accent)** | **Blue** (`blue-600`, equivalent to `--primary`) |
| Destructive | `red-600` |
| Success / Published | `emerald-600` (badge) |
| Warning / Draft | `amber-600` |
| Muted / Archived | `zinc-500` |

Sidebar active item: primary/10 background + primary text (or shadcn `accent`).

### 3.2. Typography

| Role | Suggested style |
|---|---|
| App name (sidebar) | `font-semibold text-sm` |
| Page title | `text-2xl font-semibold tracking-tight` |
| Page description | `text-sm text-muted-foreground` |
| KPI number | `text-3xl font-semibold tabular-nums` |
| KPI label | `text-sm text-muted-foreground` |
| Section title | `text-base font-semibold` |
| Table / list body | `text-sm` |

Font: shadcn default (Geist / Inter via setup) — acceptable for an admin app; a display font is not required.

### 3.3. Spacing & radius

- Content padding: `p-4 md:p-6 lg:p-8`
- KPI grid gap: `gap-4`
- Card radius: shadcn default (`rounded-xl`)
- Border: light `1px` — prefer borders over heavy shadows

---

## 4. Application shell

Applies to every route in `(dashboard)`.

```text
┌──────────────────────────────────────────────────────────────┐
│ ┌────────────┐ ┌──────────────────────────────────────────┐ │
│ │  Sidebar   │ │  Header (sticky)                         │ │
│ │  (fixed /  │ ├──────────────────────────────────────────┤ │
│ │  collaps.) │ │  Main scrollable                         │ │
│ │            │ │  - Page header (title + actions)         │ │
│ │            │ │  - Content                               │ │
│ └────────────┘ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 4.1. Sidebar

**Desktop**

- Width ~256px expanded; ~64px collapsed (icon-only) — use the shadcn `Sidebar` pattern.
- Top: logo/mark + app name (e.g. **CMS** / name from Settings).
- Nav groups (suggested):

| Group (VI) | Group (EN) | Items (VI) | Items (EN) | Route |
|---|---|---|---|---|
| Tổng quan | Overview | Tổng quan | Overview | `/dashboard` |
| Quản trị | Administration | Người dùng, Vai trò, Quyền | Users, Roles, Permissions | `/users`, `/roles`, `/permissions` |
| Nội dung | Content | Trang, Dịch vụ, Dự án, Tin tức | Pages, Services, Projects, News | `/pages`, `/services`, `/projects`, `/news` |
| Tài nguyên | Resources | Tài liệu, Thư viện media | Documents, Media library | `/documents`, `/media` |
| Hệ thống | System | Nhật ký, Cài đặt | Audit logs, Settings | `/audit-logs`, `/settings` |

- Hide an item if the corresponding `*:view` permission is missing.
- Clear active state (accent).
- Bottom (optional): mini user block or version.

**Mobile**

- Sidebar hidden → opened via a Sheet / off-canvas from the menu button in the header.
- Closes after a link is selected.

### 4.2. Header (top bar)

Left → right:

1. Mobile menu trigger  
2. Breadcrumb (e.g. `Tổng quan` (Overview) or `Tin tức / Chỉnh sửa` (News / Edit))  
3. Spacer  
4. (Optional, MVP+) Global search — **not required for MVP**  
5. User menu: Avatar + name · **"Hồ sơ"** (Profile, optional) · **"Đăng xuất"** (Log out)

Header is `sticky`, with a light bottom border, height ~56px.

### 4.3. Page header (inside main)

Every list/form:

```text
[Title]                    [Primary action]
[Optional short description]
```

Example for the News list: title **"Tin tức"** (News), button **"Thêm tin tức"** (Add news) (if `news:create`).

### 4.4. Required shadcn components

| Component | Used for |
|---|---|
| `Sidebar` | Shell |
| `Breadcrumb` | Header |
| `Card` | KPI, sections |
| `Button`, `DropdownMenu` | Actions |
| `Table` + pagination | Lists |
| `Badge` | Status |
| `Avatar` | User |
| `Skeleton` | Loading |
| `Sheet` / `Dialog` | Mobile nav, confirm |
| `Input`, `Select`, `Form` | Filters / forms |
| `Separator`, `Tooltip` | Layout / icon buttons |

---

## 5. Overview page (`/dashboard`)

Permission: authenticated. Widgets are hidden based on `*:view`.

### 5.1. Page layout

```text
Page header: Tổng quan
             Xin chào, {name} · short summary (optional)

┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Users  │ │ Pages  │ │Service │ │Project │   ← KPI row 1
└────────┘ └────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ News   │ │ Docs   │ │Publish │ │ Draft  │   ← KPI row 2
└────────┘ └────────┘ └────────┘ └────────┘

┌───────────────────────┐ ┌───────────────────────┐
│ Hoạt động gần đây     │ │ Nội dung mới cập nhật │
│ (audit list)          │ │ (content list)        │
└───────────────────────┘ └───────────────────────┘

┌─────────────────────────────────────────────────┐
│ Thao tác nhanh (optional)                        │
│ [Thêm tin] [Thêm trang] [Tải tài liệu] …         │
└─────────────────────────────────────────────────┘
```

UI labels in the diagram: "Tổng quan" (Overview), "Xin chào, {name}" (Hello, {name}), "Hoạt động gần đây" (Recent activity), "Nội dung mới cập nhật" (Recently updated content), "Thao tác nhanh" (Quick actions), "Thêm tin" (Add news), "Thêm trang" (Add page), "Tải tài liệu" (Upload document).

KPI grid:

- `xl`: 4 columns  
- `md`: 2 columns  
- `default`: 1 column  

Bottom two columns:

- `lg`: 2 equal columns  
- mobile: stacked

### 5.2. KPI card anatomy

```text
┌─────────────────────────┐
│ [icon]        Nhãn      │
│ 1,234                   │
│ Xem tất cả →            │
└─────────────────────────┘
```

("Nhãn" = Label; "Xem tất cả" = View all.)

| Element | Spec |
|---|---|
| Container | `Card` + `CardContent`; subtle border/accent on hover; `cursor-pointer` if linked |
| Icon | Lucide, size 16–20, inside a `rounded-md bg-muted` or primary/10 box |
| Number | `tabular-nums`, `vi-VN` format (dot as thousands separator) |
| Link | Whole card or "Xem tất cả" (View all) to the module list |
| Loading | `Skeleton` with the same size as the card |
| Hidden | Not rendered if the permission is missing |

Mapping:

| Card (VI) | Card (EN) | Permission | Link |
|---|---|---|---|
| Người dùng | Users | `user:view` | `/users` |
| Trang | Pages | `page:view` | `/pages` |
| Dịch vụ | Services | `service:view` | `/services` |
| Dự án | Projects | `project:view` | `/projects` |
| Tin tức | News | `news:view` | `/news` |
| Tài liệu | Documents | `document:view` | `/documents` |
| Đã xuất bản | Published | at least one content view permission | — or Published filter |
| Bản nháp | Drafts | same as above | — or Draft filter |

### 5.3. Recent activity ("Hoạt động gần đây")

- Shown if `audit_log:view`.
- Maximum 10 rows.
- Each row: avatar/initials (optional) · **action** · resource · relative time (`2 phút trước` (2 minutes ago)).
- Click → `/audit-logs` (or the detail view if available).
- Empty: *"Chưa có hoạt động."* (No activity yet.)

### 5.4. Recently updated content ("Nội dung mới cập nhật")

- Union of Page/Service/Project/News (per permission), sorted `updated_at DESC`, limit 10.
- Columns/row: type (Badge) · title · status Badge · updated_at.
- Click → edit/detail route.
- Empty: *"Chưa có nội dung."* (No content yet.)

### 5.5. Quick actions ("Thao tác nhanh", optional MVP)

Show a button if the corresponding `*:create` permission exists:

- "Thêm tin tức" (Add news) → `/news/new`
- "Thêm trang" (Add page) → `/pages/new`
- Add project / service / upload document similarly

Don't cram in more than 4–5 buttons.

### 5.6. Not on the MVP dashboard

- Mandatory charts / sparklines  
- Calendar / schedule  
- Drag-and-drop widget layout  
- Realtime websocket (light polling/revalidation is acceptable)

---

## 6. List pages (common BO standard)

Applies to Users, Pages, Services, Projects, News, Documents, Media, Audit, …

```text
Page header (title + primary CTA)
Toolbar: search | filters | (view options)
Data Table
Footer: pagination (page size, prev/next, total)
```

| Element | Spec |
|---|---|
| Search | Debounced; Vietnamese placeholder (e.g. *"Tìm theo tiêu đề…"* (Search by title…)) |
| Filters | Status, date — `Select` / popover |
| Status | `Badge` colored per §3.1 |
| Row actions | Dropdown: "Xem" (View), "Sửa" (Edit), … per permission |
| Empty | Simple illustration or text + CTA to create new |
| Loading | Table skeleton rows |

---

## 7. Form pages

- Max form content width ~ `max-w-3xl` or `max-w-4xl` (rich text may be wider).
- Sticky bottom action bar or header actions: **"Hủy"** (Cancel) · **"Lưu nháp"** (Save draft) · **"Xuất bản"** (Publish) (per lifecycle).
- Validation errors under each field (RHF + Zod); error/success toasts in Vietnamese.
- Optional tabs: "Nội dung" (Content) | SEO | Media.

---

## 8. Login page

- Centered card, logo + **"Đăng nhập"** (Log in).
- Fields: "Email/Tên đăng nhập" (Email/Username), "Mật khẩu" (Password).
- Full-width primary button.
- No sidebar.
- Background `zinc-50` or a subtle light pattern (no heavy hero image).

Error copy: see [modules/authentication.md](./modules/authentication.md).

---

## 9. States & feedback

| State | UI |
|---|---|
| Loading | Skeleton (dashboard/list); button `disabled` + spinner while submitting |
| Empty | Vietnamese text + optional CTA |
| Forbidden UI | Hide controls; if the URL is accessed directly → *"Không có quyền"* (Forbidden) page (403) |
| Not found | *"Không tìm thấy"* (Not found) (404) |
| Toast | Short success / error messages in Vietnamese |
| Confirm destructive | `AlertDialog` before deleting |

---

## 10. Responsive breakpoints

| Breakpoint | Behavior |
|---|---|
| `< md` | Sidebar as sheet; KPI 1 column; table with horizontal scroll or card list |
| `md–lg` | KPI 2 columns; sidebar may be collapsed |
| `≥ xl` | KPI 4 columns; sidebar expanded by default |

Touch: button hit area ≥ 40px on mobile.

---

## 11. Motion

Minimal and subtle:

1. Short sidebar collapse/expand transition (~200ms).  
2. Mobile sheet slide-in.  
3. KPI card hover (border/background) — no strong bounce/scale.

Reduce motion when `prefers-reduced-motion` is set.

---

## 12. Content copy (VI) – dashboard

| UI | Copy (VI) | Meaning (EN) |
|---|---|---|
| Page title | Tổng quan | Overview |
| Greeting | Xin chào, {name} | Hello, {name} |
| Section | Hoạt động gần đây | Recent activity |
| Section | Nội dung mới cập nhật | Recently updated content |
| Section | Thao tác nhanh | Quick actions |
| KPI links | Xem tất cả | View all |
| Empty activity | Chưa có hoạt động. | No activity yet. |
| Empty content | Chưa có nội dung. | No content yet. |

Sidebar labels: Tổng quan (Overview), Người dùng (Users), Vai trò (Roles), Quyền (Permissions), Trang (Pages), Dịch vụ (Services), Dự án (Projects), Tin tức (News), Tài liệu (Documents), Thư viện media (Media library), Nhật ký (Audit logs), Cài đặt (Settings), Đăng xuất (Log out).

---

## 13. Implementation notes

1. Create `components/layout/app-sidebar.tsx`, `site-header.tsx`, `page-header.tsx`.  
2. Dashboard features: `features/dashboard/kpi-cards.tsx`, `recent-activity.tsx`, `recent-content.tsx`, `quick-actions.tsx`.  
3. Fetch data server-side (RSC) + permission check; do not treat permissions fetched on the client as the source of truth.  
4. Use the shadcn **sidebar-07 / dashboard** structure as a reference skeleton — customize copy/tokens according to this spec.  
5. Icons: consistently use `lucide-react`.

---

## 14. Acceptance criteria

### Shell

- [ ] Sidebar + header work on desktop & mobile
- [ ] Nav items correctly hidden by permission
- [ ] Active route highlighted
- [ ] User menu + log out
- [ ] Correct breadcrumb on list/detail pages

### Dashboard

- [ ] KPI cards with correct mapping + Vietnamese number format
- [ ] Cards without permission are not shown
- [ ] Clicking a card → the correct list
- [ ] Skeleton while loading
- [ ] Recent activity / recent content (or empty state)
- [ ] Loads in < 2s with a medium dataset
- [ ] No complex charts (MVP)

### Visual / UX

- [ ] Zinc + blue accent; no purple glow
- [ ] Responsive breakpoints met
- [ ] Visible focus / basic contrast OK
- [ ] Toasts & destructive confirmations in Vietnamese

---

## 15. Out of scope (UI)

- Full dark mode  
- Customizable widget grid  
- Advanced charts / analytics suite  
- In-app notification center  
- Global command palette (may come in a later phase)
