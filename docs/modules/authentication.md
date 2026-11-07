# Module: Authentication

Route: `/login` · Protected: all of `(dashboard)/*`

---

## 1. Goal

Authenticate internal users, maintain a secure session, support logout, and block invalid users (inactive / deleted).

---

## 2. Use Cases

| ID | Use case | Actor |
|---|---|---|
| AUTH-01 | Log in with email/username + password | All |
| AUTH-02 | Redirect to the intended page after login | Authenticated |
| AUTH-03 | Log out | Authenticated |
| AUTH-04 | Block access when not logged in | Guest |
| AUTH-05 | Reject login when status ≠ ACTIVE | System |
| AUTH-06 | Handle session expiry | System |

---

## 3. UI (Vietnamese)

### Login Page

- Title: **Đăng nhập** (Log in)
- Fields: Email hoặc Tên đăng nhập (Email or Username), Mật khẩu (Password)
- CTA: **Đăng nhập** (Log in)
- Errors:
  - Wrong credentials: *Email/tên đăng nhập hoặc mật khẩu không đúng.* (Incorrect email/username or password.)
  - Inactive: *Tài khoản đã bị vô hiệu hóa.* (The account has been disabled.)
  - Generic 500: *Không thể đăng nhập. Vui lòng thử lại.* (Unable to log in. Please try again.)

No self-registration in the MVP. "Quên mật khẩu" (Forgot password) is not required in the MVP (future).

---

## 4. Flow

```text
Guest → /login → Auth.js Credentials
  → Validate Zod
  → Find user (email OR username) WHERE deleted_at IS NULL
  → Check status === ACTIVE
  → Verify password hash
  → Load roles + permissions
  → Create session
  → Redirect /dashboard (or callbackUrl)
```

Logout:

```text
User → Logout → Invalidate session → /login
```

---

## 5. Session Payload

```ts
{
  user: {
    id: string
    email: string
    name: string
    roles: string[]
    permissions: string[]
  }
}
```

---

## 6. Server Rules

- Rate-limit login (recommended: N attempts / IP / time window).
- Do not leak "user exists vs. wrong password" beyond the generic message (except inactive accounts, which may get a specific message after the credentials are verified — optional hardening: always generic).
- Audit: `LOGIN`, `LOGOUT`.
- Middleware protects dashboard routes.

---

## 7. Acceptance

- [ ] Guest visiting `/users` → `/login`
- [ ] Correct login → dashboard
- [ ] Wrong password → friendly error, no 500
- [ ] Inactive user cannot get in
- [ ] Logout clears the session
- [ ] Expired session forces re-login
