# Module: Audit Logs

Route: `/audit-logs`  
Permission: `audit_log:view`

---

## 1. Goal

Record important actions to support security and operational traceability. Append-only.

---

## 2. Audited Actions

```text
CREATE
UPDATE
DELETE
PUBLISH
UNPUBLISH
LOGIN
LOGOUT
ROLE_CHANGE
STATUS_CHANGE
```

---

## 3. Fields

| Field | Notes |
|---|---|
| user_id | nullable for system actions |
| action | enum/string |
| resource | USER, ROLE, PAGE, SERVICE, PROJECT, NEWS, DOCUMENT, MEDIA, SETTING, … |
| resource_id | |
| old_value / new_value | JSON (avoid storing passwords/hashes) |
| ip_address / user_agent | |
| created_at | |

---

## 4. Screens

- List filters: action, resource, user, date range.
- Detail drawer: old/new diff (pretty-printed JSON).
- No Edit / Delete buttons for regular users.
- Super Admin also **cannot** edit log content in the MVP (view only).

Vietnamese UI labels: **Nhật ký hệ thống** (System log), **Hành động** (Action), **Tài nguyên** (Resource), …

---

## 5. Business Rules

1. Ideally, write the log in the same transaction as the mutation when feasible; if auditing fails, the whole operation must not silently succeed (recommended: fail the mutation if the audit fails, or use a queue — MVP: same request, logging after success is also acceptable if clearly documented).
2. Never record passwords / tokens in `new_value`.
3. Retention/purge: future.

---

## 6. Acceptance

- [ ] CREATE/UPDATE/DELETE/PUBLISH/LOGIN/ROLE_CHANGE are recorded
- [ ] Filter/search/pagination
- [ ] Cannot be edited from the UI
- [ ] Hidden from Editor/Viewer
