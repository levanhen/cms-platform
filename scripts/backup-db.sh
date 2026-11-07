#!/usr/bin/env bash
# Backup PostgreSQL (CMS) — cron-friendly.
# Usage:
#   bash scripts/backup-db.sh
#   BACKUP_DIR=/var/backups/cms bash scripts/backup-db.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/cms_$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Prefer docker compose service name `postgres` (infra compose)
if docker compose -f "$ROOT/docker-compose.yml" ps --status running 2>/dev/null | grep -q postgres; then
  docker compose -f "$ROOT/docker-compose.yml" exec -T postgres \
    pg_dump -U cms -d cms --no-owner --no-acl | gzip > "$OUT"
elif docker compose -f "$ROOT/docker-compose.full.yml" ps --status running 2>/dev/null | grep -q postgres; then
  docker compose -f "$ROOT/docker-compose.full.yml" exec -T postgres \
    pg_dump -U cms -d cms --no-owner --no-acl | gzip > "$OUT"
else
  echo "Postgres container not running. Start docker compose first." >&2
  exit 1
fi

echo "Wrote $OUT"
# Keep last 14 backups
ls -1t "$BACKUP_DIR"/cms_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
