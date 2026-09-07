# MahaSetu — Developer Documentation

**Repository:** SIH-2026 · **Package:** `mahasetu` · **Version:** 1.0.0  
**Companion:** [Functional Design & Product Architecture](./FUNCTIONAL_DESIGN_AND_PRODUCT_ARCHITECTURE.md)

Engineering guide for running, extending, and deploying the production MahaSetu platform.

---

## 1. What this system is

MahaSetu is a **Next.js 14** government interoperability platform. It does not replace departmental systems. It:

1. Connects to **department connectors** (Revenue, Municipal, Employment) through **adapters**.  
2. Normalizes payloads with a **Common Data Model (CDM)** and **JSON-path mapping engine**.  
3. Gates cross-department exchange with a **DPDP-style consent manager** (PostgreSQL-backed).  
4. Records a **SHA-256 hash-chained audit log** in PostgreSQL.  
5. Pushes **Server-Sent Events** so citizen and officer UIs stay in sync.  
6. Authenticates users with **email/password**, **HMAC session cookies**, and **role-based access control**.

All application state (users, citizens, applications, consents, audit, events, revenue/municipal connector records) persists in **PostgreSQL** via Prisma.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.6 (`strict: true`) |
| Framework | Next.js 14.2.15 App Router |
| UI | React 18.3, Tailwind CSS 3.4 (`darkMode: 'class'`), Lucide React |
| Fonts | Source Serif 4 (display), IBM Plex Sans (UI), IBM Plex Mono (IDs) |
| ORM | Prisma 5.21 + `@prisma/client` |
| Database | **PostgreSQL** (Neon, Docker, or self-hosted) — **required** |
| Auth | scrypt password hashing + HMAC-signed `mahasetu_session` cookie |
| Crypto | Node.js `crypto` (SHA-256 audit chain) |
| Real-time | `EventEmitter` singleton + SSE; events also written to `Event` table |
| Assistant | Google Gemini API (`@google/generative-ai`) with scoped system prompt |
| Edge middleware | `src/middleware.ts` + Web Crypto session verification |

---

## 3. Repository map

```
SIH-2026/
├── prisma/
│   ├── schema.prisma
│   └── seed.js                 # Departments, services, mappings, staff users
├── scripts/
│   └── test-interop.ts         # Mapping-engine unit tests
├── src/
│   ├── middleware.ts           # Route protection by role
│   ├── app/
│   │   ├── page.tsx            # Public home
│   │   ├── login/              # Sign in
│   │   ├── register/           # Citizen registration
│   │   ├── citizen/            # Citizen portal
│   │   ├── department/         # Officer console
│   │   ├── admin/              # Gateway admin
│   │   └── api/                # REST + SSE (see §8)
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── BrandMark.tsx
│   │   ├── chat/MahaSetuAssistant.tsx
│   │   └── theme/              # ThemeProvider + ThemeToggle
│   └── lib/
│       ├── auth/               # password, session, session-edge, guards, use-session
│       ├── chatbot/            # knowledge, Gemini client, scope guard, fallback
│       ├── cn.ts
│       ├── db/prisma.ts
│       ├── db/application-store.ts   # Prisma-backed app/service/mapping helpers
│       ├── consent/consent-manager.ts
│       ├── audit/audit-logger.ts
│       ├── events/event-bus.ts
│       ├── interop/
│       │   ├── pipeline.ts     # Service-specific interop orchestration
│       │   ├── mapping-engine.ts
│       │   ├── registry.ts
│       │   ├── types.ts
│       │   └── adapters/
│       └── mock-departments/   # DB-backed connector simulators
├── docker-compose.yml          # Optional local Postgres + Redis
├── .env.example
└── README.md
```

Path alias: `@/*` → `./src/*`.

---

## 4. Prerequisites

- Node.js 18+ (20 recommended)  
- npm  
- **PostgreSQL 15+** (Neon cloud or `docker compose up -d`)  
- A saved `.env` file (Prisma reads the file on disk, not unsaved editor buffers)

---

## 5. Setup and deployment

### 5.1 Install

```bash
npm install
```

### 5.2 Environment (`.env`)

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&schema=public"
SESSION_SECRET="long-random-string-min-16-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

ADMIN_EMAIL="admin@mahasetu.gov.in"
ADMIN_PASSWORD="ChangeMe#2026"
SEED_PASSWORD="ChangeMe#2026"

# Gemini — MahaSetu assistant chatbot (get a key at https://aistudio.google.com/apikey)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash"
```

**Neon notes**

- Use the **direct** host (no `-pooler`) for `prisma db push` if the pooler connection fails.  
- Use **double quotes** around `DATABASE_URL`; avoid single quotes.  
- **Save** `.env` before running Prisma or starting the server.

### 5.3 Database bootstrap (required before first run)

```bash
npx prisma generate
npx prisma db push --accept-data-loss   # first deploy on existing DB
node prisma/seed.js                   # departments, services, staff accounts
```

### 5.4 Run

```bash
npm run dev          # development
npm run build        # prisma generate + next build
npm start            # production
```

Health check: `GET /api/health` → `{ ok: true, database: "up" }`.

### 5.5 Routes

| URL | Surface | Auth |
|---|---|---|
| `/` | Public home | Public |
| `/login` | Sign in | Public |
| `/register` | Citizen registration | Public |
| `/citizen` | Citizen portal | `CITIZEN` |
| `/department` | Officer console | `OFFICER_*` or `ADMIN` |
| `/admin` | Gateway admin | `ADMIN` |

---

## 6. Runtime architecture

### 6.1 Persistence

| Concern | Storage | Module |
|---|---|---|
| Users, citizens, applications, timelines | PostgreSQL | `application-store.ts` + Prisma |
| Consents | PostgreSQL | `consent-manager.ts` |
| Audit log (hash chain) | PostgreSQL | `audit-logger.ts` |
| Events (SSE history) | PostgreSQL + in-process bus | `event-bus.ts` |
| Revenue connector records | PostgreSQL `RevenueCitizenRecord` | `revenue-system.ts` |
| Municipal permits | PostgreSQL `MunicipalPermit` | `municipal-system.ts` |
| Employment schemes | In-memory catalogue | `employment-system.ts` |
| Field mappings, integrations | PostgreSQL | Prisma seed + admin APIs |

Citizen **registration** calls `upsertRevenueRecord()` so the revenue connector has the citizen’s address before any cross-department fetch.

### 6.2 Authentication

| Piece | Location | Behaviour |
|---|---|---|
| Password hash | `lib/auth/password.ts` | scrypt + salt |
| Session token | `lib/auth/session.ts` | HMAC-SHA256 signed JSON in `mahasetu_session` cookie |
| Edge verification | `lib/auth/session-edge.ts` | Web Crypto (middleware-safe) |
| API guards | `lib/auth/guards.ts` | `requireSession`, `requireRoles`, `forbidden` |
| Client session | `lib/auth/use-session.ts` | Confirms `GET /api/auth/me` before showing authenticated chrome |
| Logout | `POST /api/auth/logout` | Expires `mahasetu_session` (Secure and non-Secure) |
| Route middleware | `src/middleware.ts` | Redirects unauthenticated users to `/login` |
| Theme | `ThemeProvider` + `html.dark` | Light/dark tokens in `globals.css`; no flash via boot script |

### 6.3 Interop pipeline (`lib/interop/pipeline.ts`)

Triggered by `POST /api/applications/:id/verify` after consent is `GRANTED`:

| Service code | Pipeline |
|---|---|
| `BUSINESS_LICENSE` | Revenue fetch → CDM → Municipal dispatch → `PENDING_OFFICER_REVIEW` |
| `ADDRESS_VERIFICATION` | Revenue fetch → CDM → `PENDING_OFFICER_REVIEW` (revenue officer sign-off) |
| `SKILL_SUBSIDY` | Requires approved `BUSINESS_LICENSE` → Employment eligibility check → `PENDING_OFFICER_REVIEW` |

Uses the **logged-in citizen’s mobile** from PostgreSQL (not a hardcoded demo number).

### 6.4 Request flow (trade license)

```
POST /api/applications          (CITIZEN, session required)
  → createApplication() in Postgres
  → createConsentRequest() per service type
  → event APPLICATION_CREATED + audit

POST /api/consents/:id/approve  (CITIZEN)
  → grantConsent()
  → timeline CONSENT_GRANTED + event + audit

POST /api/applications/:id/verify
  → assertConsentGranted() or 403
  → runInteropPipeline() for service code
  → events REVENUE_FETCHED, DATA_NORMALIZED, MUNICIPAL_DISPATCHED (as applicable)
  → notifications to citizen

POST /api/applications/:id/approve  (OFFICER_* / ADMIN)
  → department-scoped queue check
  → municipal/revenue/employment sanction logic
  → APPLICATION_APPROVED event → SSE
```

### 6.5 Why `reactStrictMode: false`

Prevents duplicate SSE `EventSource` connections in React 18 Strict Mode during development (`next.config.mjs`).

---

## 7. Module reference

### 7.1 `application-store.ts`

Prisma-backed helpers: `getServices`, `createApplication`, `listApplications`, `getApplicationById`, `updateApplication`, `addTimelineEvent`, `getFieldMappings`, `addFieldMapping`, `notifyCitizen`.

Application numbers: `MH-MUNI-YYYY-*`, `MH-REV-YYYY-*`, `MH-EMP-YYYY-*` by owning department.

### 7.2 `consent-manager.ts`

Async Prisma CRUD: `createConsentRequest`, `grantConsent`, `denyConsent`, `revokeConsent`, `getConsentForApplication`. Expiry: 30 days.

### 7.3 `audit-logger.ts`

`writeAudit()` appends to `AuditLog` with `prevHash` → `hash` SHA-256 chain. `getRecentLogs`, `getLogsForApplication`.

### 7.4 `event-bus.ts`

`publish()` writes to `Event` table and emits on in-process `EventEmitter`. SSE stream filters events by citizen for `CITIZEN` role.

### 7.5 Adapters

- **RevenueAdapter** — reads `RevenueCitizenRecord` from Postgres; no fallback citizen.  
- **MunicipalAdapter** — reads/writes `MunicipalPermit`; links `mahasetuApplicationId`.  
- **EmploymentAdapter** — scheme eligibility; enriches name from `Citizen` table.

### 7.6 `DataMappingEngine`

`transformRevenueToCDM`, `transformCDMToMunicipal`, `executeMapping` with `DIRECT`, `TO_UPPER`, `BOOLEAN_FLAG`, `FORMAT_MOBILE`.

---

## 8. HTTP API reference

All protected routes require a valid `mahasetu_session` cookie unless noted. JSON responses use `{ success: true|false }`.

### 8.1 Auth (public)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `fullName, email, password, mobile, address…` | Creates `User` + `Citizen` + revenue record; sets session |
| POST | `/api/auth/login` | `email, password` | Sets `mahasetu_session` |
| POST | `/api/auth/logout` | — | Clears session (Secure and non-Secure cookie variants) |
| GET | `/api/auth/me` | — | Current session user or 401 |

### 8.2 Citizen

| Method | Path | Role |
|---|---|---|
| GET | `/api/citizens/me` | `CITIZEN` |
| GET | `/api/services` | Any authenticated |
| GET | `/api/applications` | `CITIZEN` (own apps), `OFFICER_*` (dept queue), `ADMIN` (all) |
| POST | `/api/applications` | `CITIZEN` — body: `{ serviceId, businessName?, tradeCategory? }` |
| GET | `/api/applications/:id` | Owner citizen or dept officer |
| POST | `/api/applications/:id/verify` | `CITIZEN` (owner) — runs interop pipeline |
| POST | `/api/consents` | `CITIZEN` (own `citizenId` only), `ADMIN` |
| POST | `/api/consents/:id/approve` | `CITIZEN` |
| POST | `/api/consents/:id/revoke` | `CITIZEN` — `{ deny: true }` for pending → `DENIED` |

### 8.3 Officer

| Method | Path | Role |
|---|---|---|
| POST | `/api/applications/:id/approve` | `OFFICER_*`, `ADMIN` — dept-scoped |
| POST | `/api/applications/:id/reject` | `OFFICER_*`, `ADMIN` |

### 8.4 Admin

| Method | Path | Role |
|---|---|---|
| GET/PUT/POST | `/api/integrations/mappings` | `ADMIN` |
| GET | `/api/audit-logs` | `ADMIN` |
| POST | `/api/integrations/test` | `ADMIN` |
| GET | `/api/integrations` | `OFFICER_*`, `ADMIN` |

### 8.5 Real-time, health & assistant

| Method | Path | Notes |
|---|---|---|
| GET | `/api/events/stream` | SSE; authenticated; citizen-filtered events |
| GET | `/api/health` | Public; DB connectivity probe |
| POST | `/api/chat` | Public; body `{ message }` — MahaSetu-scoped assistant only |

### 8.6 Mock departmental APIs

Simulate external legacy systems. Protected by officer/admin roles. Adapters call the DB layer directly in-process; HTTP routes exist for officer lookup and future HTTP-based connectors.

---

## 9. Prisma schema

Key models: `User`, `Citizen`, `Department`, `Service`, `Application`, `ApplicationTimeline`, `Consent`, `Integration`, `FieldMapping`, `AuditLog`, `Event`, `Notification`, `RevenueCitizenRecord`, `MunicipalPermit`.

`Application` includes `businessName`, `tradeCategory`, `officerComments` as first-class columns.

### Seed (`prisma/seed.js`)

Creates:

- 3 departments, 3 services, 9 field mappings, 3 integrations  
- Staff users: `admin@mahasetu.gov.in`, `municipal.officer@…`, `revenue.officer@…`, `employment.officer@…`  
- Passwords from `ADMIN_PASSWORD` / `SEED_PASSWORD` env vars  

Does **not** seed citizen accounts — citizens register via `/register`.

---

## 10. Scripts

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` | `prisma generate && next build` |
| `start` | `next start` |
| `db:push` | `prisma db push` |
| `db:seed` | `node prisma/seed.js` |
| `db:studio` | `prisma studio` |
| `test:interop` | `npx tsx scripts/test-interop.ts` |
| `test:chatbot` | `npx tsx scripts/test-chatbot.ts` |

---

## 11. MahaSetu assistant (chatbot)

Floating UI in `src/components/chat/MahaSetuAssistant.tsx`, mounted from `src/app/layout.tsx`.

| Piece | Path | Role |
|---|---|---|
| Knowledge | `src/lib/chatbot/knowledge.ts` | Reference facts, in/out-of-scope patterns, fallback intents |
| System prompt | `src/lib/chatbot/system-prompt.ts` | Gemini system instruction (MahaSetu-only rules + knowledge digest) |
| Gemini client | `src/lib/chatbot/gemini.ts` | `askGemini()` via `@google/generative-ai` |
| Responder | `src/lib/chatbot/responder.ts` | `validateChatMessage()` guard → Gemini → fallback |
| Fallback | `src/lib/chatbot/fallback.ts` | Rule-based answers when API key missing or request fails |
| API | `src/app/api/chat/route.ts` | `POST` JSON `{ message }` |

**Flow**

1. `validateChatMessage()` — blocks empty, too-long, off-topic, and unknown questions **before** calling Gemini.  
2. Greetings answered locally (no API call).  
3. In-scope questions → `askGemini()` with `MAHASETU_SYSTEM_PROMPT`.  
4. Gemini instructed to refuse off-topic questions with the exact `CHAT_OUT_OF_SCOPE` sentence.  
5. On API error or missing `GEMINI_API_KEY` → `answerChatMessageFallback()`.

**Environment**

```env
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-2.0-flash"   # optional
```

Restart the server after changing `.env`.

```bash
npm run test:chatbot
```

---

## 12. Testing

```bash
npm run test:interop    # mapping engine unit tests (no DB)
npm run test:chatbot    # assistant scope and intent tests
```

Manual E2E:

1. Register at `/register`  
2. Apply for business license at `/citizen`  
3. Grant consent → verify pipeline runs  
4. Sign in as `municipal.officer@mahasetu.gov.in` → sanction at `/department`  
5. Citizen sees approval via SSE  

---

## 13. How to extend

### Add a chatbot intent

1. Add patterns + answer to `CHAT_KNOWLEDGE` in `src/lib/chatbot/knowledge.ts`.  
2. Optionally add `links` for deep navigation.  
3. Run `npm run test:chatbot` to verify scope rules still pass.

### Add a department connector

1. Extend `types.ts` with native payload.  
2. Add Prisma model or table if connector state must persist.  
3. Implement adapter + `mock-departments` service.  
4. Register in `IntegrationRegistry` and seed department/mappings.  
5. Add pipeline branch in `pipeline.ts` if a new service workflow is needed.

### Point adapters at real HTTP APIs

Replace in-process mock calls in adapters with `fetch(department.apiBaseUrl + …)` using `Integration.endpointUrl` from Postgres.

### Production hardening (recommended next steps)

- Move to Prisma Migrate instead of `db push`  
- Use Neon pooler URL for app runtime + direct URL for migrations  
- Add rate limiting on auth endpoints  
- Integrate OIDC / ePramaan for government SSO  
- Redis-backed SSE for multi-instance deployments  

---

## 14. Known limitations

1. **Employment connector** — scheme catalogue is in-memory; only eligibility is exercised in the subsidy pipeline.  
2. **Mock departmental systems** — Revenue and Municipal persist in Postgres but represent simulated legacy schemas, not live government APIs.  
3. **API route middleware** — page routes are role-protected; API routes enforce auth per-handler (not globally in middleware).  
4. **Redis** in `docker-compose.yml` is unused.  
5. **Next.js 14.2.15** — upgrade to a patched release for known security advisories.  
6. **`.env` must be saved** — Prisma and `npm start` read the on-disk file only.

7. **Assistant** — requires `GEMINI_API_KEY` for full answers; falls back to rule-based intents if unset or on API failure. Scope guard still blocks obvious off-topic questions before Gemini is called.

---

## 15. API file index

```
src/app/api/chat/route.ts
src/app/api/auth/{login,logout,register,me}/route.ts
src/app/api/citizens/me/route.ts
src/app/api/applications/route.ts
src/app/api/applications/[id]/{route,verify,approve,reject}/route.ts
src/app/api/consents/route.ts
src/app/api/consents/[id]/{approve,revoke}/route.ts
src/app/api/integrations/{route,test,mappings}/route.ts
src/app/api/audit-logs/route.ts
src/app/api/events/stream/route.ts
src/app/api/health/route.ts
src/app/api/mock/{revenue,municipal,employment}/...
```

---

*End of Developer Documentation.*
