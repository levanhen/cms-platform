# Module: Contact Messages (BO)

Route: `/contacts`  
Permissions: `contact:view` | `contact:update` | `contact:delete`  
Related: [web-frontend.md](../web-frontend.md) § Contact, [data-model.md](../data-model.md) `contact_messages`

---

## 1. Goal

Manage messages submitted from the Contact form on the Web:

- Store every submission in the DB (independent of SMTP success).
- Staff can view / mark status / delete in the BO.
- SMTP (if configured) additionally sends an email to `Settings.contact_email`.

---

## 2. Web submit (`POST /api/contact`)

Fields: `name`, `email`, `phone?`, `subject`, `message` (+ hidden honeypot).

### Anti-bot / anti-spam (required)

| Measure | Details |
|---|---|
| Honeypot | Hidden field (e.g. `company`); if a bot fills it → return a fake `{ ok: true }`, **do not** save to DB |
| Per-IP rate limit | At most **5** requests / **60s** / IP → `429` |
| Repeat-submission cooldown | The same **IP** or same **email** cannot submit again within **15 minutes** → `429` |
| Duplicate content | Normalized hash of `email + subject + message`; duplicate within **24h** → `429` |

Friendly error messages in Vietnamese (do not leak internal anti-spam details).

### After passing anti-spam

1. Insert into `contact_messages` (`status = NEW`, store `ip`, `user_agent`, `content_hash`).
2. If SMTP is available: send mail to `contact_email`, set `email_sent` / record `email_error` on failure.
3. SMTP failure does **not** roll back the DB record — staff can still see it in the BO.

---

## 3. BO UI

| Screen | Description |
|---|---|
| List `/contacts` | Search (name/email/subject), filter by status, pagination, sort `createdAt desc` |
| Detail `/contacts/[id]` | All fields; when first opened (NEW) → may auto-set `READ`, or provide a "Đánh dấu đã đọc" (Mark as read) button |
| Actions | Change status `NEW` → `READ` → `ARCHIVED`; hard delete (requires `contact:delete`) |

No composing / replying to emails in the MVP (reply via a mail client using the sender's address).

---

## 4. Status

| Status | Meaning |
|---|---|
| `NEW` | Newly received, not yet handled |
| `READ` | Viewed |
| `ARCHIVED` | Handled / archived |

---

## 5. Permissions

| Code | Behavior |
|---|---|
| `contact:view` | List + detail |
| `contact:update` | Change status |
| `contact:delete` | Delete message |

Matrix: [rbac-matrix.md](../rbac-matrix.md).

---

## 6. Acceptance

- [ ] Valid submission → row in DB + (optional) SMTP email
- [ ] Honeypot / rate limit / cooldown / duplicate → no DB spam
- [ ] BO list/filter/status/delete according to permissions
- [ ] Without `contact:view` → cannot access `/contacts`
