# Phase 6 – Verify / Deploy Checklist

Related: [tech.md](./tech.md) § Security, [tasks/README.md](../tasks/README.md), [../README.md](../README.md).

---

## 1. Automated smoke

With both BO and Web running:

```bash
pnpm test
REVALIDATE_SECRET=... WEB_URL=http://localhost:3001 BO_URL=http://localhost:3000 \
  bash scripts/verify-mvp.sh
```

---

## 2. Manual verify (content / cache)

| # | Check | Expected |
|---|---|---|
| 1 | Create a Draft Page/News, open its slug on the Web | **404** |
| 2 | Publish → Web (may take a few seconds) | New content appears |
| 3 | Unpublish / Archive | Web **404**, removed from sitemap |
| 4 | Draft Document: `/documents/{id}/download` | **404** |
| 5 | URL `/uploads/documents/...` on the Web | **403** |
| 6 | Reorder Published Services/Projects | Web list order changes (without waiting for a long TTL) |
| 7 | Contact form → BO `/contacts` | Row exists; spam/cooldown → 429 |
| 8 | Newsletter → BO CSV export | File downloads successfully |

---

## 3. Security ops (production)

- [ ] HTTPS (Nginx/Caddy) for `admin.*` + `www.*`
- [ ] Strong `AUTH_SECRET`, `REVALIDATE_SECRET`, and DB password; never commit `.env`
- [ ] Postgres/Redis bound only to `127.0.0.1` (or an internal Docker network)
- [ ] Change the seeded Super Admin password
- [ ] `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` set to the correct domain; rebuild after changing `NEXT_PUBLIC_*`
- [ ] (Recommended) Read-only DB user for `apps/web` if privileges are separated

Already implemented in code: password hashing, Zod + RBAC, upload validation, login rate limiting, HTML sanitization, Draft document blocking, revalidate secret + rate limiting.

---

## 4. Backup

```bash
bash scripts/backup-db.sh
# Example cron (daily at 02:30):
# 30 2 * * * cd /path/to/cms3 && bash scripts/backup-db.sh >> /var/log/cms-backup.log 2>&1
```

Restore:

```bash
gunzip -c backups/cms_YYYYMMDD_HHMMSS.sql.gz \
  | docker compose exec -T postgres psql -U cms -d cms
```

---

## 5. Docker images (optional)

`docker-compose.yml` runs only PostgreSQL + Redis. The apps can be built as images with `Dockerfile.bo-cms` and `Dockerfile.web`; run migrations + seed from the host (port 5433):

```bash
pnpm --filter @cms/db exec prisma migrate deploy
pnpm db:seed
```

Or use PM2 on the host as described in [README.md](../README.md) § Deploy.
