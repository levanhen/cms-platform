# Module: Roles & Permissions

Routes: `/roles`, `/permissions`  
Permissions: `role:*`, (permissions are mainly view/seed)

---

## 1. Goal

Manage Roles and assign Permissions via RBAC. The permission catalog is mainly seeded; the permissions UI may be read-only in the MVP.

---

## 2. Roles

| Field | Notes |
|---|---|
| name | unique |
| description | |
| is_system | Super Admin / Admin / Editor / Viewer = true |
| timestamps | |

Default roles cannot be deleted. A role currently assigned to users cannot be deleted.

### Actions

Create, View, Edit, Delete, **Assign permissions**.

### UI Assign Permissions

Grouped by: User, Role, Page, Service, Project, News, Document, Media, Audit Log, Settings.  
Checkboxes per `resource:action`.

---

## 3. Permissions

| Field | Notes |
|---|---|
| code | unique `resource:action` |
| group_name | |
| description | Localized to Vietnamese in the UI |

Route `/permissions`: list/search (MVP may restrict it to Super Admin only).

Do not allow deleting a permission attached to a role (or cascade-remove the join — recommended: forbid deleting the seeded catalog).

---

## 4. Business Rules

1. Default matrix: [rbac-matrix.md](../rbac-matrix.md).
2. After a role's permissions change, sessions of users with that role should be refreshed (re-login or a session update strategy).
3. Super Admin always bypasses checks, or is granted all permissions at seed time.
4. Authorization is always server-side.

---

## 5. Acceptance

- [ ] Seed 4 roles + full permission catalog
- [ ] Assign permissions UI works
- [ ] System roles cannot be deleted
- [ ] Roles in use cannot be deleted
- [ ] Editor cannot mutate via `/roles`
