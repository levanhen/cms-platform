# Module: Documents

Route: `/documents`  
Permissions: `document:view|create|update|delete|publish`

---

## 1. Goal

Manage business documents with metadata and a publish lifecycle (distinct from the Media library, which is purely for assets).

---

## 2. Supported Files

```text
PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
```

---

## 3. Fields

| Field | Required | Notes |
|---|---|---|
| title | ✓ | |
| description | | |
| file_name | ✓ | original name |
| file_url | ✓ | storage key/url |
| file_type | ✓ | |
| file_size | ✓ | bytes |
| category | | string in MVP → **FK `category_id` → `document_categories`** |
| status | ✓ | DRAFT / PUBLISHED / ARCHIVED |
| uploaded_by | ✓ | |

---

## 4. Actions

Upload, View metadata, Download, Edit metadata, Delete, Publish, Archive.

---

## 5. Validation

1. Extension ∈ allowlist.
2. MIME type matches the extension (deny mismatches).
3. Size ≤ `MAX_UPLOAD_SIZE` (Settings / env).
4. Virus scanning: out of MVP scope.

---

## 6. Storage

- Metadata in PostgreSQL.
- Binary via `StorageProvider` (local/S3).
- Soft delete: may keep the file or delete from storage asynchronously (decision: soft-delete metadata; hard purge of files = future job).

---

## 7. Difference from Media

| Document | Media |
|---|---|
| Business document + publish status | Reusable asset |
| Download is the main use case | Embed / copy URL |
| Business category | Alt text, width/height |

A PDF may be uploaded to either depending on context; Documents is for the published document library, Media is for editors picking images/files.

---

## 8. Public Web

- List Published documents at `/documents`.
- **Public download** when Published; the server re-checks status before download.
- Draft / Archived: not listed, download → 404.
- Details: [web-frontend.md](../web-frontend.md).

---

## 9. Acceptance

- [ ] Upload validation OK / rejects wrong type or size
- [ ] Download with permission (BO)
- [ ] Edit metadata + publish
- [ ] Soft delete
- [ ] Web: Published download OK; Draft blocked
