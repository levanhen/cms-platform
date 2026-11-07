# Module: Settings

Route: `/settings`  
Permissions: `setting:view|update`

---

## 1. Goal

Grouped key-value system configuration; validated before saving.

---

## 2. Groups

### General

| Key | Example |
|---|---|
| site_name | CMS Internal |
| site_description | … |
| logo | media URL |
| favicon | media URL |
| default_language | vi (source locale; future i18n: [i18n.md](../i18n.md)) |
| timezone | Asia/Ho_Chi_Minh |

### Contact (public on the Web)

| Key | Example |
|---|---|
| contact_address | 123 Example Street, 4th Floor… |
| contact_phone | (+84) 0123 456 789 |
| contact_email | info@example.com |

`contact_email` is also the SMTP recipient address for the Contact form (if `SMTP_*` is configured). The message inbox is managed in the BO at `/contacts` — [contact-messages.md](./contact-messages.md).

### SEO

| Key | Example |
|---|---|
| default_seo_title | |
| default_seo_description | |

### Media

| Key | Example |
|---|---|
| max_upload_size_mb | 20 |
| allowed_image_mimes | image/jpeg,image/png,… |
| allowed_document_mimes | … |

### System

| Key | Example |
|---|---|
| maintenance_mode | false (future use) |

---

## 3. Storage Model

Table `settings`: unique `key`, `value` JSON/text, `group_name`, `updated_by`, `updated_at`.

Alternatively, one JSON blob row per group — recommended: **key-value**, which is easier to extend.

---

## 4. UI

Tabs: **Chung** (General) | **Liên hệ** (Contact) | **SEO** | **Media** | **Hệ thống** (System).  
Button: **Lưu cài đặt** (Save settings).  
Toast for success / validation errors.

Contact keys are public — the Web reads them via `web:settings:public` (header/footer).

---

## 5. Business Rules

1. Admin / Super Admin only, per the matrix.
2. Changing the max upload size affects Document/Media validation immediately after saving.
3. Audit `UPDATE` on resource `SETTING`.
4. Invalidate the Web cache after saving public Settings: call the revalidate API → delete the Redis key `web:settings:public` (+ layout tags). Do not rely on TTL alone.

---

## 6. Acceptance

- [ ] View + update per group
- [ ] Zod validation
- [ ] Unauthorized access blocked
- [ ] Default values present in the seed
- [ ] Updating public settings → Web receives new values after invalidation
