# Module: Dashboard

Route: `/dashboard`  
Permission: authenticated (any logged-in role)

> **Full UI:** [ui-dashboard.md](../ui-dashboard.md) (shell, tokens, KPI layout, responsive, acceptance).

---

## 1. Goal

Provide an overview of metrics and recent activity to help users orient their work.  
The landing page after login; lives inside the standard shadcn BO shell (sidebar + header).

---

## 2. Widgets (MVP)

| Widget | Source | Notes |
|---|---|---|
| Total Users | `users` (not deleted) | Shown only with `user:view` |
| Total Pages | `pages` | With `page:view` |
| Total Services | `services` | With `service:view` |
| Total Projects | `projects` | With `project:view` |
| Total News | `news` | With `news:view` |
| Total Documents | `documents` | With `document:view` |
| Published content | aggregate content | |
| Draft content | aggregate content | |
| Recent activity | `audit_logs` limit 10 | With `audit_log:view` |
| Recently created / updated content | union queries | Per permission |
| Quick actions | create links | Optional; per `*:create` |

No complex charts in the MVP.

---

## 3. UI Copy

- Title: **Tổng quan** (Overview)
- Greeting: **Xin chào, {name}** (Hello, {name})
- Cards: **Người dùng** (Users), **Trang** (Pages), **Dịch vụ** (Services), **Dự án** (Projects), **Tin tức** (News), **Tài liệu** (Documents), **Đã xuất bản** (Published), **Bản nháp** (Drafts)
- Sections: **Hoạt động gần đây** (Recent activity), **Nội dung mới cập nhật** (Recently updated content), **Thao tác nhanh** (Quick actions)

Visual / layout details: [ui-dashboard.md](../ui-dashboard.md) §5.

---

## 4. Data rules

1. Aggregates count only records that are not soft-deleted (unless the spec says otherwise).
2. Recent content: `updated_at DESC`, limit 10, filtered by module permission.
3. Do not send passwords / unnecessary raw permissions to the client.
4. Format numbers using `vi-VN`.

---

## 5. Acceptance

- [ ] Loads in < 2s with a medium dataset
- [ ] Only shows metrics the user has view permission for
- [ ] Cards link to the corresponding module list
- [ ] Skeleton loading
- [ ] Sidebar/header shell matches [ui-dashboard.md](../ui-dashboard.md)
- [ ] Responsive at the breakpoints in the UI spec
