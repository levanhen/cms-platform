# CMS Platform

A self-hosted content management system built as a **pnpm monorepo** with two Next.js apps sharing one PostgreSQL database:

- **Back Office (`apps/bo-cms`)** — internal admin for users, roles & permissions, content, documents, media, audit logs and settings.
- **Public Web (`apps/web`)** — the public-facing site that renders published content, cached with Redis and optimized for SEO.

> **Note:** The current UI of both apps is in **Vietnamese**. Multi-language support (VI + EN) is planned — see [docs/i18n.md](./docs/i18n.md).

## Features

**Back Office**

- Authentication with Auth.js (credentials) and role-based access control (RBAC)
- Users, roles and a permission catalog (Super Admin / Admin / Editor / Viewer out of the box)
- Content modules: **Pages, Services, Projects, News, Documents, Media**
- Unified content lifecycle: `DRAFT → PUBLISHED → ARCHIVED`, soft delete
- Rich text editing (Tiptap), media library with local storage
- Dashboard overview, audit logs, site settings
- Contact message inbox and newsletter subscriber list with CSV export
- UI built with shadcn/ui + Tailwind CSS

**Public Web**

- Renders only `PUBLISHED` content directly from the shared database
- Redis caching with on-demand revalidation triggered from the Back Office on publish
- Public download of published documents
- Contact form (stored in DB, anti-spam, optional SMTP notification) and newsletter signup
- SEO & AI discovery: `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`

## Tech stack

| Layer | Technology |
|---|---|
| Apps | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui |
| Auth | Auth.js (NextAuth v5) |
| Database | PostgreSQL 16 + Prisma (`packages/db`) |
| Cache | Redis 7 (`apps/web`) |
| Validation | Zod |
| Tests | Vitest |
| Tooling | pnpm workspaces, Docker / Docker Compose |

## Repository structure

```text
.
├── apps/
│   ├── bo-cms/              # Back Office (Next.js)
│   └── web/                 # Public website (Next.js)
├── packages/
│   ├── db/                  # Prisma schema, migrations, seed
│   └── typescript-config/   # Shared tsconfig
├── docs/                    # Product & technical specifications
├── tasks/                   # Implementation checklist
├── scripts/                 # Setup, verify and backup scripts
├── tests/                   # Unit tests (Vitest)
├── docker-compose.yml       # PostgreSQL + Redis (Docker)
├── Dockerfile.bo-cms
└── Dockerfile.web
```

## Getting started

### Prerequisites

- Node.js **22+**
- [pnpm](https://pnpm.io/installation)
- Docker + Docker Compose

### Quick start

```bash
git clone <your-fork-url> cms-platform
cd cms-platform
cp .env.example .env
bash scripts/setup-foundation.sh
```

Or step by step:

```bash
docker compose up -d                              # PostgreSQL :5433, Redis :6380
pnpm install
pnpm db:generate
pnpm --filter @cms/db exec prisma migrate deploy
pnpm db:seed
```

The seed creates a Super Admin account plus published demo content (services, projects, news, pages, documents) so the public site has something to show right away. `pnpm db:seed` is idempotent (upsert) and can be re-run at any time.

> Prisma and Next.js do **not** read the root `.env` automatically. If a command can't find your variables, copy it into each package:
> `cp .env packages/db/.env && cp .env apps/bo-cms/.env && cp .env apps/web/.env`

### Run the Back Office

```bash
pnpm dev:bo
```

Open <http://localhost:3000/login> and sign in with the seeded Super Admin:

| Email | Password |
|---|---|
| `admin@example.com` | value of `SEED_ADMIN_PASSWORD` in `.env` (default `Admin@123456`) |

**Change these credentials before any public deployment.**

### Run the Public Web

```bash
pnpm dev:web
```

Open <http://localhost:3001>. When content is published in the Back Office, the web cache is invalidated via `WEB_REVALIDATE_URL` + `REVALIDATE_SECRET`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev:bo` / `pnpm dev:web` | Start an app in dev mode |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Create/apply a dev migration |
| `pnpm db:seed` | Seed roles, permissions, admin and demo content |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm lint` / `pnpm typecheck` | Lint / type-check all packages |
| `pnpm test` | Run unit tests |
| `pnpm verify` | Smoke test against running BO + Web (optionally set `REVALIDATE_SECRET`) |
| `pnpm backup:db` | Dump the PostgreSQL database |

## Configuration

All configuration is done through environment variables. See [.env.example](./.env.example) for the full list.

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Password for the PostgreSQL container in `docker-compose.yml` (must match `DATABASE_URL`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (web cache) |
| `AUTH_SECRET` | Auth.js secret — use a long random string |
| `AUTH_URL` | Public URL of the Back Office |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the website (used for SEO and the BO "view website" link) |
| `WEB_REVALIDATE_URL` | Revalidate endpoint the BO calls on publish (prefer a loopback URL) |
| `REVALIDATE_SECRET` | Shared secret between BO and Web for revalidation |
| `SEED_ADMIN_*` | Super Admin account created by the seed |
| `STORAGE_DRIVER`, `STORAGE_LOCAL_PATH`, `MAX_UPLOAD_SIZE_MB` | Upload storage settings |
| `SMTP_*` | Optional SMTP for contact form notifications |

Generate secrets with e.g. `openssl rand -base64 32`.

## Deployment

The reference setup runs the Node apps on the host and PostgreSQL/Redis in Docker. Since ports 3000/3001 are often taken on a server, the examples use **3010 (BO)** and **3011 (Web)**.

| Service | Host port | Notes |
|---|---|---|
| PostgreSQL | `127.0.0.1:5433` → `5432` | Bound to loopback only |
| Redis | `127.0.0.1:6380` → `6379` | Bound to loopback only |
| Back Office | `3010` | |
| Public Web | `3011` | |

### 1. Environment

```bash
cp .env.example .env
```

```bash
POSTGRES_PASSWORD=<DB_PASSWORD>
DATABASE_URL=postgresql://cms:<DB_PASSWORD>@127.0.0.1:5433/cms?schema=public
REDIS_URL=redis://127.0.0.1:6380

AUTH_SECRET=<long-random-string>
AUTH_URL=https://admin.example.com

NEXT_PUBLIC_SITE_URL=https://www.example.com
WEB_REVALIDATE_URL=http://127.0.0.1:3011/api/revalidate
REVALIDATE_SECRET=<another-random-string>

SEED_ADMIN_PASSWORD=<strong-password>
```

Copy it to every package (see note above), and remember that `NEXT_PUBLIC_*` variables are baked in at **build time** — rebuild after changing URLs or ports.

```bash
cp .env packages/db/.env && cp .env apps/bo-cms/.env && cp .env apps/web/.env
```

### 2. Infrastructure, migrations, seed

```bash
docker compose up -d
pnpm install
pnpm db:generate
pnpm --filter @cms/db exec prisma migrate deploy
pnpm db:seed
```

### 3. Build

```bash
pnpm --filter @cms/web build
pnpm --filter @cms/bo-cms build
```

### 4. Run with PM2

```bash
npm i -g pm2

pm2 start "pnpm --filter @cms/web exec next start --port 3011" --name cms-web
pm2 start "pnpm --filter @cms/bo-cms exec next start --port 3010" --name cms-bo
pm2 save
pm2 startup
```

Check with `pm2 status` and `pm2 logs cms-web` / `pm2 logs cms-bo`. Only ports 3010/3011 (or your reverse proxy) need to be reachable from outside — never expose 5433/6380.

### 5. Redeploy

```bash
git pull
pnpm install
cp .env packages/db/.env && cp .env apps/bo-cms/.env && cp .env apps/web/.env
pnpm db:generate
pnpm --filter @cms/db exec prisma migrate deploy
pnpm --filter @cms/web build
pnpm --filter @cms/bo-cms build
pm2 restart cms-web cms-bo
```

(`deploy.sh` runs the same steps.)

### Changing ports

1. Start the apps with `--port <NEW_PORT>`.
2. Update `AUTH_URL`, `NEXT_PUBLIC_SITE_URL` and `WEB_REVALIDATE_URL` in `.env` and copy it to the packages.
3. **Rebuild**, then `pm2 restart`.

### Behind a reverse proxy (HTTPS)

Point `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` to your `https://` domains, but keep `WEB_REVALIDATE_URL` on the internal loopback address (e.g. `http://127.0.0.1:3011/api/revalidate`).

### Docker images (optional)

`docker-compose.yml` only runs PostgreSQL and Redis. If you prefer to containerize the apps as well, `Dockerfile.bo-cms` and `Dockerfile.web` build standalone images; pass the same environment variables at runtime (and `NEXT_PUBLIC_*` as build args):

```bash
docker build -f Dockerfile.web -t cms-web --build-arg NEXT_PUBLIC_SITE_URL=https://www.example.com .
docker build -f Dockerfile.bo-cms -t cms-bo --build-arg NEXT_PUBLIC_SITE_URL=https://www.example.com .
```

Verification, backup and security operations are described in [docs/phase-6-verify.md](./docs/phase-6-verify.md).

### Production checklist

- Do not run `pnpm dev` in production.
- Change the PostgreSQL password (`POSTGRES_PASSWORD` and `DATABASE_URL`), `AUTH_SECRET`, `REVALIDATE_SECRET` and the seeded admin password.
- Serve both apps over HTTPS.

## Documentation

The full specification lives in [`docs/`](./docs/README.md):

- [Product overview](./docs/overview.md) and [system requirements](./docs/requirement.md)
- [Technical architecture](./docs/tech.md), [data model](./docs/data-model.md), [RBAC matrix](./docs/rbac-matrix.md)
- [Back Office UI](./docs/ui-dashboard.md) and [public web](./docs/web-frontend.md)
- Per-module specs in [`docs/modules/`](./docs/modules/)
- Roadmap: [i18n](./docs/i18n.md), [multi-site & themes](./docs/multi-site.md)

Implementation progress is tracked in [tasks/README.md](./tasks/README.md).

## Contributing

Issues and pull requests are welcome. Before opening a PR, please run:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

## License

Released under the [MIT License](./LICENSE).
