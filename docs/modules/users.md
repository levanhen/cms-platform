# Module: Users

Route: `/users`  
Permissions: `user:view|create|update|delete`

---

## 1. Goal

Manage internal accounts: create, edit, activate/deactivate, soft delete, assign roles.

---

## 2. Fields

| Field | Required | Notes |
|---|---|---|
| email | ✓ | unique |
| username | ✓ | unique |
| name | ✓ | |
| password | ✓ (create) | hash; optional change on update |
| avatar | | URL/media |
| status | ✓ | ACTIVE / INACTIVE |
| roles | ✓ | ≥ 1 role recommended |
| created_at / updated_at / deleted_at | | system |

---

## 3. Screens

### List `/users`

Columns: Avatar, Name, Email, Username, Role, Status, Created date, Actions.

Toolbar: Search, Status filter, **Thêm người dùng** (Add user).

Actions per permission: View, Edit, Activate, Deactivate, Delete.

### Create / Edit

Vietnamese form; Zod validation.

### Detail

Read-only info + roles + the user's recent audit entries (optional).

---

## 4. Business Rules

1. Email / username unique (soft-deleted records ignored per policy: recommended partial unique index on `deleted_at IS NULL`, or suffix the email on soft delete).
2. Passwords are never returned to the client.
3. Users may not deactivate / delete themselves (recommended).
4. Soft delete sets `deleted_at`; status may be set to INACTIVE first.
5. INACTIVE users cannot log in.
6. Assigning roles requires `user:update`; role changes are audited as `ROLE_CHANGE`.
7. Super Admin / Admin only, per the matrix.

---

## 5. Server Actions (proposed)

```text
listUsers
getUser
createUser
updateUser
setUserStatus
deleteUser
```

---

## 6. Acceptance

- [ ] CRUD + soft delete
- [ ] Assign role
- [ ] Inactive users cannot log in
- [ ] Password hashed
- [ ] Unauthorized → 403
