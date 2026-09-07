# MahaSetu

Government interoperability platform: citizens apply once, departments exchange records through adapters and a common data model, and every share is consent-gated and audited.

## Requirements

- Node.js 18+
- PostgreSQL 15+ (`docker compose up -d` starts Postgres on port 5432)

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL, SESSION_SECRET (long random string), and production passwords

npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
```

Production:

```bash
npm run build
npm start
```

Health check: `GET /api/health`

## Seeded staff accounts

Created by `node prisma/seed.js` (change passwords immediately):

| Role | Email | Password env |
|---|---|---|
| Admin | `ADMIN_EMAIL` (default `admin@mahasetu.gov.in`) | `ADMIN_PASSWORD` |
| Municipal officer | `municipal.officer@mahasetu.gov.in` | `SEED_PASSWORD` |
| Revenue officer | `revenue.officer@mahasetu.gov.in` | `SEED_PASSWORD` |
| Employment officer | `employment.officer@mahasetu.gov.in` | `SEED_PASSWORD` |

Citizens self-register at `/register`. Registration enrols their address in the revenue connector so other departments can request it only after consent.

## Application flow

1. Citizen signs in and applies for a service.
2. Citizen grants (or denies) purpose-bound consent.
3. Gateway fetches source-department records, normalizes them, and dispatches to the target system.
4. The responsible officer reviews the linked clearances and sanctions or rejects.
5. The citizen dashboard updates over the live event stream; an approved certificate can be printed.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Prisma generate + Next.js production build |
| `npm start` | Production server |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Departments, services, mappings, staff users |
| `npm run test:interop` | Mapping-engine unit tests |
