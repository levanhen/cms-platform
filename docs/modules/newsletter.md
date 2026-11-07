# Module: Newsletter (BO)

Route: `/newsletter`  
Permissions: `newsletter:view` (export shares the view permission)  
Related: [web-frontend.md](../web-frontend.md) § Newsletter, [data-model.md](../data-model.md) `newsletter_subscribers`

---

## 1. Goal

Collect newsletter sign-up emails from the Web; the BO **only needs to view the list and export CSV**.

**Not** part of the MVP: composing/sending email campaigns, marketing automation.

---

## 2. Web

- Footer (or an equivalent form) → `POST /api/newsletter`
- Stored in `newsletter_subscribers` (`ACTIVE`); honeypot + basic rate limit
- Duplicate ACTIVE email → idempotent / friendly message

---

## 3. BO UI (minimum)

| Feature | Required |
|---|---|
| List subscribers (email, status, subscribed_at, source) | ✓ |
| Search / filter by status | ✓ (recommended) |
| **Export CSV** of subscribers | ✓ |
| Unsubscribe / delete subscriber | Optional (not required for MVP) |

---

## 4. Permissions

| Code | Description |
|---|---|
| `newsletter:view` | View list + export CSV |
| `newsletter:delete` | Optional — unsubscribe/delete if implemented |

---

## 5. Acceptance

- [ ] Web subscription is saved to DB
- [ ] BO CSV export includes the useful columns (email, status, subscribed_at, source)
- [ ] Without `newsletter:view` → cannot access `/newsletter` / cannot export
