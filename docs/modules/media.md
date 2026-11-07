# Module: Media

Route: `/media`  
Permissions: `media:view|create|update|delete`

---

## 1. Goal

A shared media library for the Page / Service / Project / News editors: upload, preview, copy URL, metadata.

---

## 2. Supported (MVP)

- Images: JPEG, PNG, WebP, GIF
- Videos: MP4, WebM (optional; may be deferred to a later phase if heavy)
- Other files: per a narrow allowlist (optional)

MVP minimum: **Images required**; video/other depending on capacity.

---

## 3. Fields

| Field | Notes |
|---|---|
| file_name | |
| file_url | |
| mime_type | |
| file_size | |
| width / height | detected for images |
| alt_text | |
| uploaded_by | |
| timestamps | |

No content status lifecycle required.

---

## 4. Screens

- Grid / list with preview.
- Search by name; filter by MIME type.
- Modal picker for embedding from content module editors.
- Actions: Upload, Preview, Copy URL, Edit alt text, Delete.

Vietnamese UI labels: **Thư viện media** (Media library), **Tải lên** (Upload), **Sao chép đường dẫn** (Copy link), **Văn bản thay thế** (Alt text), …

---

## 5. Business Rules

1. Validate MIME + size.
2. Delete: remove from DB + file storage.
3. Viewers may not upload/delete.
4. When media is referenced by content: the MVP may still allow deletion (broken-link risk) or show a warning — recommended: **confirmation warning**; advanced orphan checks = future.

---

## 6. Integration

Editors (Tiptap / featured image fields) open the Media Picker → select → receive URL/key.

Projects gallery: multi-select.

Media URLs must be accessible from `apps/web` (public prefix / CDN).

---

## 7. Acceptance

- [ ] Upload + preview
- [ ] Copy URL
- [ ] Edit alt text
- [ ] Delete + storage cleanup
- [ ] Picker usable from content forms
- [ ] Images in Published content display correctly on the web
