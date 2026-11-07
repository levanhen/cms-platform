git pull
pnpm install
cp .env packages/db/.env && cp .env apps/bo-cms/.env && cp .env apps/web/.env
pnpm db:generate
pnpm --filter @cms/db exec prisma migrate deploy
pnpm --filter @cms/web build
pnpm --filter @cms/bo-cms build
pm2 restart cms-web cms-bo