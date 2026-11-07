#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

cp .env packages/db/.env
cp .env apps/bo-cms/.env
cp .env apps/web/.env

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm chưa được cài. Xem: https://pnpm.io/installation"
  exit 1
fi

echo ">> Starting Postgres + Redis..."
docker compose up -d

echo ">> Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U cms -d cms >/dev/null 2>&1; do
  sleep 1
done

echo ">> Installing dependencies..."
pnpm install

echo ">> Prisma generate + migrate + seed..."
pnpm db:generate
pnpm --filter @cms/db exec prisma migrate deploy
pnpm db:seed

echo "Phase 1 foundation ready."
echo "Next: pnpm --filter @cms/bo-cms dev  |  pnpm --filter @cms/web dev"
echo "Note: STORAGE_LOCAL_PATH is relative to monorepo root (default apps/bo-cms/uploads)."
