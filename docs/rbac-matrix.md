# CMS Internal – RBAC Matrix

| Field | Value |
|---|---|
| Document | Role × Permission Matrix |
| Version | 1.2 |
| Related | [modules/roles-permissions.md](./modules/roles-permissions.md) |

---

## 1. Permission Catalog

Format: `resource:action`

### User

| Code | Description |
|---|---|
| `user:view` | View user list / details |
| `user:create` | Create users |
| `user:update` | Edit users / change status / assign roles |
| `user:delete` | Soft delete users |

### Role

| Code | Description |
|---|---|
| `role:view` | View roles |
| `role:create` | Create roles |
| `role:update` | Edit roles / assign permissions |
| `role:delete` | Delete roles (not system roles in use) |

### Page

| Code | Description |
|---|---|
| `page:view` | View pages |
| `page:create` | Create pages |
| `page:update` | Edit pages |
| `page:delete` | Soft delete pages |
| `page:publish` | Publish / Unpublish / Archive |

### Service

| Code | Description |
|---|---|
| `service:view` | View services |
| `service:create` | Create services |
| `service:update` | Edit / reorder |
| `service:delete` | Soft delete |
| `service:publish` | Publish / Unpublish / Archive |

### Project

| Code | Description |
|---|---|
| `project:view` | View projects |
| `project:create` | Create projects |
| `project:update` | Edit / reorder |
| `project:delete` | Soft delete |
| `project:publish` | Publish / Unpublish / Archive |

### News

| Code | Description |
|---|---|
| `news:view` | View news / categories / tags |
| `news:create` | Create news (+ categories/tags if policy allows) |
| `news:update` | Edit news |
| `news:delete` | Soft delete |
| `news:publish` | Publish / Unpublish / Archive |

### Document

| Code | Description |
|---|---|
| `document:view` | View / download (per policy) |
| `document:create` | Upload |
| `document:update` | Edit metadata |
| `document:delete` | Soft delete |
| `document:publish` | Publish / Archive |

### Media

| Code | Description |
|---|---|
| `media:view` | View the media library |
| `media:create` | Upload |
| `media:delete` | Delete media |
| `media:update` | Edit metadata (alt text, …) |

### Audit & Settings

| Code | Description |
|---|---|
| `audit_log:view` | View the audit log |
| `setting:view` | View settings |
| `setting:update` | Update settings |

### Newsletter

| Code | Description |
|---|---|
| `newsletter:view` | View the newsletter subscriber list + **CSV export** |
| `newsletter:delete` | Optional — unsubscribe / delete subscribers (not required for MVP) |

### Contact messages

| Code | Description |
|---|---|
| `contact:view` | View contact message list / details |
| `contact:update` | Change status (`NEW` / `READ` / `ARCHIVED`) |
| `contact:delete` | Delete messages |

---

## 2. Default Role Matrix

| Permission | Super Admin | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|
| `user:view` | ✓ | ✓ | | |
| `user:create` | ✓ | ✓ | | |
| `user:update` | ✓ | ✓ | | |
| `user:delete` | ✓ | ✓ | | |
| `role:view` | ✓ | ✓ | | |
| `role:create` | ✓ | | | |
| `role:update` | ✓ | | | |
| `role:delete` | ✓ | | | |
| `page:view` | ✓ | ✓ | ✓ | ✓ |
| `page:create` | ✓ | ✓ | ✓ | |
| `page:update` | ✓ | ✓ | ✓ | |
| `page:delete` | ✓ | ✓ | | |
| `page:publish` | ✓ | ✓ | ✓ | |
| `service:view` | ✓ | ✓ | ✓ | ✓ |
| `service:create` | ✓ | ✓ | ✓ | |
| `service:update` | ✓ | ✓ | ✓ | |
| `service:delete` | ✓ | ✓ | | |
| `service:publish` | ✓ | ✓ | ✓ | |
| `project:view` | ✓ | ✓ | ✓ | ✓ |
| `project:create` | ✓ | ✓ | ✓ | |
| `project:update` | ✓ | ✓ | ✓ | |
| `project:delete` | ✓ | ✓ | | |
| `project:publish` | ✓ | ✓ | ✓ | |
| `news:view` | ✓ | ✓ | ✓ | ✓ |
| `news:create` | ✓ | ✓ | ✓ | |
| `news:update` | ✓ | ✓ | ✓ | |
| `news:delete` | ✓ | ✓ | | |
| `news:publish` | ✓ | ✓ | ✓ | |
| `document:view` | ✓ | ✓ | ✓ | ✓ |
| `document:create` | ✓ | ✓ | ✓ | |
| `document:update` | ✓ | ✓ | ✓ | |
| `document:delete` | ✓ | ✓ | | |
| `document:publish` | ✓ | ✓ | ✓ | |
| `media:view` | ✓ | ✓ | ✓ | ✓ |
| `media:create` | ✓ | ✓ | ✓ | |
| `media:update` | ✓ | ✓ | ✓ | |
| `media:delete` | ✓ | ✓ | | |
| `audit_log:view` | ✓ | ✓ | | |
| `setting:view` | ✓ | ✓ | | |
| `setting:update` | ✓ | ✓ | | |
| `newsletter:view` | ✓ | ✓ | ✓ | ✓ |
| `newsletter:delete` | ✓ | ✓ | | |
| `contact:view` | ✓ | ✓ | ✓ | ✓ |
| `contact:update` | ✓ | ✓ | ✓ | |
| `contact:delete` | ✓ | ✓ | | |

Notes:

- **Super Admin**: every permission (including future ones); the seed assigns all.
- **Admin**: manages day-to-day content operations + users; cannot create/delete system Roles (MVP: Admin has no mutating `role:*` permissions).
- **Editor**: content CRUD + publish; cannot delete certain sensitive resources (deleting content is Admin+ only); no access to users/roles/settings/audit.
- **Viewer**: `*:view` for content + media + documents + `newsletter:view` + `contact:view`.

This may be fine-tuned when implementing the seed — update this file if anything changes.

---

## 3. Enforcement Rules

1. Sidebar items / buttons are hidden based on permissions (UX).
2. Server Actions / Route Handlers **must** call `assertPermission(user, code)`.
3. Middleware only ensures the user is authenticated; fine-grained authorization happens in the action layer.
4. Permissions are resolved at login → stored in the session; when roles are reassigned, the session should be invalidated / refreshed.
5. `is_system` roles cannot be deleted; their `name` can be locked against changes.

---

## 4. Seed Mapping Summary

```text
Super Admin → ALL permissions
Admin       → users.* + content.* + media.* + document.* + audit_log:view + setting.*
Editor      → content view/create/update/publish + media view/create/update + document view/create/update/publish
Viewer      → content/media/document *:view
```

(`content` = page, service, project, news)
