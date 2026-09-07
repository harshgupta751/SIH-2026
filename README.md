# MahaSetu

Government interoperability platform: citizens apply once, departments exchange records through adapters and a common data model, and every share is consent-gated and audited.

## Requirements

- Node.js 18+
- PostgreSQL 15+ (`docker compose up -d` starts Postgres on port 5432)

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL, SESSION_SECRET (long random string), GEMINI_API_KEY, and production passwords

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

## Deploy on Vercel

1. Import the repo and set **Environment Variables** (Production + Preview):

| Variable | Required |
|---|---|
| `DATABASE_URL` | Yes — Neon PostgreSQL connection string |
| `SESSION_SECRET` | Yes — min 16 random characters |
| `GEMINI_API_KEY` | Yes — for assistant chatbot |
| `NEXT_PUBLIC_APP_URL` | Yes — your Vercel URL (e.g. `https://your-app.vercel.app`) |

2. Build command (default via `vercel.json`): `prisma generate && next build`

3. After first deploy, run schema + seed against Neon (from your machine):

```bash
npx prisma db push
node prisma/seed.js
```

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

Use the **MahaSetu assistant** (floating chat on every page) for platform help — powered by Google Gemini with strict MahaSetu-only scope. Set `GEMINI_API_KEY` in `.env` (see `.env.example`).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Prisma generate + Next.js production build |
| `npm start` | Production server |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Departments, services, mappings, staff users |
| `npm run test:interop` | Mapping-engine unit tests |
| `npm run test:chatbot` | Assistant scope and intent tests |

## Demo for judges

See **[Demo Guide for Judges](./docs/DEMO_GUIDE_FOR_JUDGES.md)** — complete live-demo script, accounts, timeline, and Q&A prep for SIH presentation.
