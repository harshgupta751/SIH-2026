# MahaSetu — Developer Documentation

**Repository:** SIH-2026 · **Package name:** `mahasetu` · **Version:** 1.0.0  
**Problem:** SIH26129 — System integration and interoperability among government digital platforms  
**Companion document:** [Functional Design & Product Architecture](./FUNCTIONAL_DESIGN_AND_PRODUCT_ARCHITECTURE.md)

This guide is for engineers who need to run, understand, extend, and test the complete codebase.

---

## 1. What this system is

MahaSetu is a **Next.js 14** interoperability middleware prototype. It does not replace departmental systems. It:

1. Speaks to **mock legacy backends** (RevNet, MuniSys, KaushalPortal) through **adapters**.  
2. Normalizes payloads with a **Common Data Model (CDM)** and a **JSON-path mapping engine**.  
3. Gates cross-department calls with a **DPDP-style consent manager**.  
4. Records a **SHA-256 hash-chained audit log**.  
5. Pushes **Server-Sent Events** so citizen and officer UIs stay in sync.

Runtime case files, consents, events, and audit logs live in **in-memory singletons** (demo-stable across Next.js HMR via `globalThis`). Prisma + PostgreSQL define a **persistence schema** and seed script for departments, services, users, mappings, and integrations.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.6 (`strict: true`) |
| Framework | Next.js 14.2.15 App Router |
| UI | React 18.3, Tailwind CSS 3.4, Lucide React, `clsx` / `tailwind-merge` |
| ORM | Prisma 5.21 + `@prisma/client` |
| Database (optional) | PostgreSQL (Neon or Docker); `.env.example` also mentions SQLite |
| Crypto | Node.js `crypto` (SHA-256) |
| Real-time | `EventEmitter` + SSE `ReadableStream` |
| Containers | Docker Compose: Postgres 15 Alpine, Redis 7 Alpine |

---

## 3. Repository map

```
SIH-2026/
├── prisma/
│   ├── schema.prisma          # PostgreSQL data model
│   └── seed.js                # Departments, services, Rahul Sharma, mappings, integrations
├── scripts/
│   ├── test-interop.ts        # 6-test interop suite (preferred)
│   └── test-interop.js        # JS variant
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout, Navbar, footer, metadata
│   │   ├── page.tsx           # Overview /
│   │   ├── globals.css
│   │   ├── citizen/page.tsx
│   │   ├── department/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── demo/page.tsx
│   │   └── api/               # Route handlers (see §8)
│   ├── components/Navbar.tsx
│   └── lib/
│       ├── db/prisma.ts                 # Prisma singleton
│       ├── db/application-store.ts      # In-memory apps, services, mappings
│       ├── consent/consent-manager.ts
│       ├── audit/audit-logger.ts
│       ├── events/event-bus.ts
│       ├── interop/
│       │   ├── types.ts
│       │   ├── mapping-engine.ts
│       │   ├── registry.ts
│       │   └── adapters/{base,revenue,municipal,employment}.adapter.ts
│       └── mock-departments/{revenue,municipal,employment}-system.ts
├── docker-compose.yml
├── next.config.mjs            # reactStrictMode: false (SSE)
├── tailwind.config.ts
├── tsconfig.json              # paths: @/* → ./src/*
├── package.json
├── .env.example
└── README.md
```

Path alias: import from `@/lib/...` and `@/components/...`.

---

## 4. Prerequisites

- Node.js 18+ (20 recommended)  
- npm  
- Optional: Docker Desktop (Postgres/Redis)  
- Optional: `npx tsx` for TypeScript tests (`npm run test:interop` currently runs `node scripts/test-interop.js`)

---

## 5. Local setup

### 5.1 Clone and install

```bash
npm install
```

### 5.2 Environment

Copy `.env.example` to `.env`.

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Important:** `prisma/schema.prisma` sets `provider = "postgresql"`. A SQLite URL will not match the schema. For local Postgres:

```bash
docker compose up -d
```

Then:

```
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/mahasetu?schema=public"
```

### 5.3 Schema and seed (optional for UI demo)

The **web demo does not require Prisma** because APIs use in-memory stores. Use Prisma when you want the modelled database:

```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
# or: npm run db:seed
npm run db:studio   # optional GUI
```

`npm run build` runs `prisma generate && next build`.

### 5.4 Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

| URL | Surface |
|---|---|
| `/` | Overview & topology |
| `/demo` | 10-step killer demo |
| `/citizen` | Citizen portal |
| `/department` | Officer console |
| `/admin` | Mapping studio, sandbox, adapters, audit |

### 5.5 Production-style local run

```bash
npm run build
npm start
```

### 5.6 Lint

```bash
npm run lint
```

---

## 6. Runtime architecture for developers

### 6.1 Two persistence stories

| Concern | Implementation | Location |
|---|---|---|
| Live applications, mappings used by APIs | `applicationStore` Map/Array | `src/lib/db/application-store.ts` |
| Consents | `consentManager` Map | `src/lib/consent/consent-manager.ts` |
| Audit chain | `auditLogger` array | `src/lib/audit/audit-logger.ts` |
| Events | `eventBus` EventEmitter + history | `src/lib/events/event-bus.ts` |
| RevNet / MuniSys / Kaushal data | Mock class Maps | `src/lib/mock-departments/*` |
| Relational model + seed | Prisma | `prisma/*` |
| Prisma client | `prisma` singleton | `src/lib/db/prisma.ts` |

**Singletons** are stored on `global` (`__mahasetu_app_store`, `__mahasetu_event_bus`, `prisma`) so Next.js hot reload does not wipe demo state.

**Consequence:** restarting the Node process resets applications (except constructor seeds). Prisma seed does **not** populate the in-memory application store.

### 6.2 Request path (trade license)

```
POST /api/applications
  applicationStore.createApplication()           status CONSENT_PENDING
  consentManager.createConsentRequest()
  eventBus.publish(APPLICATION_CREATED)
  auditLogger.log(APPLICATION_CREATED)

POST /api/consents/:id/approve
  consentManager.grantConsent()
  applicationStore.addTimelineEvent(CONSENT_GRANTED)
  eventBus + auditLogger

POST /api/applications/:id/verify
  consent must be GRANTED or 403
  revenueAdapter.fetchAndNormalizeCitizen('9876543210')
    revenueMockSystem.getCitizenRecord()
    DataMappingEngine.transformRevenueToCDM()
  municipalAdapter.submitTradeLicenseApplication()
    DataMappingEngine.transformCDMToMunicipal()
    municipalMockSystem.registerApplication()
  update application PENDING_OFFICER_REVIEW
  events REVENUE_FETCHED, DATA_NORMALIZED, MUNICIPAL_DISPATCHED

POST /api/applications/:id/approve
  municipalAdapter.approveTradeApplication()
  status APPROVED, license number
  event APPLICATION_APPROVED  →  EventSource clients
```

### 6.3 Why `reactStrictMode: false`

SSE is opened in `Navbar` and portal `useEffect`s. React 18 Strict Mode double-mounts effects in development, which would duplicate EventSource connections. See `next.config.mjs`.

---

## 7. Module reference

### 7.1 Types — `src/lib/interop/types.ts`

- `CommonCitizenRecord` — CDM  
- `RevNetCitizenResponse` — Revenue native  
- `MuniSysApplicationPayload` — Municipal native  
- `KaushalCitizenPayload` — Employment native  
- `FieldMappingRule` — mapping config  
- `AdapterResponse<T>` — adapter envelope  
- `MahaSetuEventType`, `MahaSetuEvent` — bus payloads  

### 7.2 DataMappingEngine — `src/lib/interop/mapping-engine.ts`

| Method | Role |
|---|---|
| `getNestedValue(obj, path)` | Dot-path read |
| `setNestedValue(obj, path, value)` | Dot-path write (creates objects) |
| `transformRevenueToCDM(raw, customRules?)` | RevNet → CDM; optional rule overrides |
| `transformCDMToMunicipal(cdm, businessTitle, tradeCategory)` | CDM → MuniSys |
| `executeMapping(sourceData, rules)` | Generic; `TO_UPPER`, `BOOLEAN_FLAG` |

CDM clearance id: `REV-CLR-` + `Date.now().toString().slice(-6)`.  
Citizen id: `CIT-` + last 4 digits of mobile.  
Pune → `ward_no` `WARD-14`.

### 7.3 Adapters

**`BaseAdapter`:** `execute(operation)` times success/failure; `testHealth()` abstract.

**`RevenueAdapter`** (`revenueAdapter` export)

- `fetchAndNormalizeCitizen(identifier)`  
- `verifyTaxClearance(mobile)`  
- `testHealth()` via demo mobile `9876543210`  
- `endpointUrl`: `/api/mock/revenue`  
- Calls **mock class directly** (not HTTP) for zero extra hop  

**`MunicipalAdapter`**

- `submitTradeLicenseApplication(cdm, businessTitle, tradeCategory)`  
- `approveTradeApplication` / `rejectTradeApplication`  
- `getApplication`  

**`EmploymentAdapter`**

- `getSchemes()`  
- `checkEligibility(mobile, hasTradeLicense)`  

**`IntegrationRegistry.getHealthOverview()`** pings all three adapters in parallel.

### 7.4 Mock departments

**RevNet** (`revenue-system.ts`)

- Seed: Rahul Sharma `9876543210`; Priya Deshmukh `9123456780`  
- `getCitizenRecord`: unknown keys **fallback to Rahul**  
- `verifyAddressAndTax`: `REV-CLR-*` if tax cleared and `VERIFIED_ACTIVE`  

**MuniSys** (`municipal-system.ts`)

- Seed approved Joshi Hardware `MUNI-2026-9012`  
- `registerApplication` → `MUNI-2026-{4 digits}`, `permitId` `PRM-{6}`  
- Approve → `MH-PUNE-TRADE-{6 digits}`  
- Reject sets `officerDecision`  

**KaushalPortal** (`employment-system.ts`)

- Schemes `PMEGP_2026`, `MUDRA_TARUN`  
- Eligibility JSON as in types  

### 7.5 ConsentManager

In-memory Map. Seeds `CNS-MH-1001` PENDING for `MH-MUNI-2026-10231` (demo id; may not match a live application).

Methods: `createConsentRequest`, `grantConsent`, `revokeConsent`, `denyConsent`, `getConsent`, `getConsentsForCitizen`, `getConsentForApplication`.

New ids: `CNS-MH-{1000–9999}`. Expiry +30 days. `getConsentsForCitizen` also returns records for `CIT-3210` when filtering.

### 7.6 AuditLogger

Genesis log `SYSTEM_INITIALIZED`.  
Hash: SHA-256 of `id|actorId|action|entityId|timestamp|lastHash`.  
`getRecentLogs(limit)`, `getLogsForApplication(applicationId)`.

### 7.7 ReactiveEventBus

Extends `EventEmitter`, `setMaxListeners(100)`.  
`publish` emits named type and `*`. History max 200.  
`GET /api/events/stream` subscribes to `*`.

### 7.8 ApplicationStore

Seeds three services, nine field mappings, one historical APPROVED application `MH-MUNI-2026-9012`.

| Method | Notes |
|---|---|
| `createApplication` | Number `MH-MUNI-2026-{5 digits}`; status `CONSENT_PENDING` |
| `getAllApplications` | Newest first |
| `updateApplication` | Merge + `updatedAt` |
| `addTimelineEvent` | Appends timestamp |
| `addFieldMapping` / `updateFieldMapping` | Used by mappings PUT; Admin UI add-rule is local-only |

### 7.9 Prisma client

`src/lib/db/prisma.ts` — development logging `error`/`warn`. **API routes do not import prisma** except this file existing for future persistence.

---

## 8. HTTP API reference

Unless noted, JSON `{ success: true|false }`. Errors often `{ success: false, error }` with 400/403/404/500.

### 8.1 Auth

**`POST /api/auth/login`**

Body: `{ role?: 'CITIZEN' | 'OFFICER_MUNICIPAL' | 'OFFICER_REVENUE' | 'ADMIN' }`  
Default role CITIZEN (Rahul Sharma).

Response: `{ success, token: 'jwt_mock_<role>_token', user }`.  
Sets cookies `mahasetu_role`, `mahasetu_user` (JSON).

**`GET /api/auth/me`**

Reads `mahasetu_user` cookie or returns default citizen.

### 8.2 Citizen profile

**`GET /api/citizens/me`**

Hard-coded Rahul Sharma profile (`digiLockerLinked: true`, masked Aadhaar).

### 8.3 Catalogues

**`GET /api/services`** → `{ success, services }` from `applicationStore`.

**`GET /api/departments`** → static three-department array (not Prisma).

### 8.4 Applications

**`GET /api/applications`**  
Query: `citizenId` optional filter.

**`POST /api/applications`**

Body defaults:

```json
{
  "serviceId": "BUSINESS_LICENSE",
  "departmentId": "MUNICIPAL",
  "citizenId": "CIT-3210",
  "businessName": "Rahul Enterprises",
  "tradeCategory": "COMMERCIAL_RETAIL"
}
```

Always creates a MUNICIPAL←REVENUE consent. Returns `{ application, consentRequired: true, consentRequest }`.

**`GET /api/applications/:id`** → `{ application, consent }`.

**`POST /api/applications/:id/verify`**  
Consent gate; runs Revenue + Municipal pipeline. Returns `pipelineTelemetry` (`step1_source`, `step2_cdm`, `step3_target`).

**`POST /api/applications/:id/approve`**

```json
{ "comments": "...", "officerName": "M. Kulkarni" }
```

Returns `{ application, licenseNumber }`.

**`POST /api/applications/:id/reject`**

```json
{ "reason": "...", "officerName": "M. Kulkarni" }
```

### 8.5 Consents

**`GET /api/consents?citizenId=`**  
**`POST /api/consents`** body passed to `createConsentRequest`.  
**`POST /api/consents/:id/approve`**  
**`POST /api/consents/:id/revoke`**

### 8.6 Integrations & mappings

**`GET /api/integrations`** — `IntegrationRegistry.getHealthOverview()`.

**`POST /api/integrations/test`** `{ departmentCode: 'REVENUE'|'MUNICIPAL'|'EMPLOYMENT' }`.

**`GET /api/integrations/mappings`** — store rules.

**`PUT /api/integrations/mappings`** `{ id, updates }` — update existing rule.

**`POST /api/integrations/mappings`** `{ sourceData, rules? }` — `executeMapping`; default rules from store.

### 8.7 Audit & events

**`GET /api/audit-logs?applicationId=&limit=50`**

**`GET /api/events/stream`**  
`Content-Type: text/event-stream`  
First event: `{ type: 'CONNECTED', timestamp, recentEvents }`  
Then live `MahaSetuEvent` JSON  
Comments: `: heartbeat` every 15s  
`dynamic = 'force-dynamic'`

Client:

```js
const es = new EventSource('/api/events/stream');
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  // CONNECTED packet has type; live events have eventType
};
```

### 8.8 Mock departmental APIs (legacy systems)

These simulate **external** HTTP APIs. Adapters currently call mock **classes**; HTTP routes exist for officers, tests, and future HTTP adapters.

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/mock/revenue/citizens/:id` | RevNet citizen JSON |
| POST | `/api/mock/revenue/verify` | `{ mobile }` tax/address verify |
| GET | `/api/mock/municipal/applications` | All MuniSys permits |
| POST | `/api/mock/municipal/applications` | Register from MuniSys payload |
| GET | `/api/mock/municipal/applications/:id` | One permit |
| POST | `/api/mock/municipal/applications/:id/approve` | `{ comments }` |
| GET | `/api/mock/employment/schemes` | Scheme list |
| GET | `/api/mock/employment/citizens/:id/eligibility?hasTradeLicense=true` | Eligibility JSON |

---

## 9. Frontend pages (implementation notes)

All pages are **client components**. Data fetching is `fetch` to same-origin APIs.

| File | Notes |
|---|---|
| `src/app/layout.tsx` | Metadata; Navbar; footer |
| `src/app/page.tsx` | Fetches integrations; mostly static marketing |
| `src/app/demo/page.tsx` | Local `STEPS` + fixture payloads; **no write APIs** |
| `src/app/citizen/page.tsx` | Hard-coded `CIT-3210`; apply always `departmentId: 'MUNICIPAL'` |
| `src/app/department/page.tsx` | Loads **all** applications; Municipal vs Revenue views |
| `src/app/admin/page.tsx` | Add-rule is **React state only**; sandbox POSTs mappings |
| `src/components/Navbar.tsx` | Imports `Link` from `next/navigation` (unused; routing via `router.push`) |

Styling: `globals.css` `.glass-panel`; Tailwind `india.saffron` / `india.green` for navbar bar.

---

## 10. Prisma schema (for persistence work)

Models: `User`, `Citizen`, `Department`, `Service`, `Application`, `ApplicationTimeline`, `Consent`, `Integration`, `FieldMapping`, `AuditLog`, `Event`, `Notification`.

Roles and statuses are **strings** (not Prisma enums) to stay flexible.

`Service.requiredClearances` and several JSON-ish fields are **stringified JSON**.

Seed (`prisma/seed.js`): upsert departments by `code`, services by `code`, citizen user `rahul.sharma@example.gov.in`, field mappings if missing, integrations if missing. **Does not seed officers or applications.**

To use Prisma in an API route:

```ts
import { prisma } from '@/lib/db/prisma';
```

Do not instantiate `PrismaClient` per request.

---

## 11. Docker Compose

```yaml
mahasetu-postgres  postgres:15-alpine  5432  user/pass: postgres / postgrespassword  db: mahasetu
mahasetu-redis     redis:7-alpine      6379  (not used by application code yet)
```

---

## 12. Testing

### 12.1 Interop suite

```bash
npm run test:interop          # node scripts/test-interop.js
npx tsx scripts/test-interop.ts
```

Tests:

1. RevNet returns Rahul Sharma + `city_name`  
2. `transformRevenueToCDM` name/city/`revenueVerified`  
3. `transformCDMToMunicipal` applicant/business  
4. MuniSys register + approve certificate  
5. Consent create + grant  
6. Audit `log2.prevHash === log1.hash`  

### 12.2 Manual E2E

1. `npm run dev`  
2. `/citizen` → Apply → Grant consent  
3. `/department` → Sanction  
4. `/citizen` → Approved + certificate  
5. `/admin` → sandbox + ping + audit  

### 12.3 curl examples

```bash
curl -s http://localhost:3000/api/services
curl -s http://localhost:3000/api/mock/revenue/citizens/9876543210
curl -s -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d "{\"businessName\":\"Rahul Enterprises\",\"tradeCategory\":\"COMMERCIAL_RETAIL\"}"
```

Then approve consent and POST verify using ids from the create response.

---

## 13. How to extend

### 13.1 Add a department connector

1. Define native payload in `src/lib/interop/types.ts`.  
2. Implement `src/lib/mock-departments/<dept>-system.ts`.  
3. Extend `BaseAdapter` in `src/lib/interop/adapters/<dept>.adapter.ts`.  
4. Register in `IntegrationRegistry`.  
5. Add `/api/mock/<dept>/...` routes.  
6. Add seed department + mappings.  
7. Add `testHealth` branch in `/api/integrations/test`.  
8. Optionally add CDM fields under `clearances`.

### 13.2 Add a mapping rule (runtime)

Preferred: `applicationStore.addFieldMapping({ sourceSystem, sourceField, targetSystem, targetField, transformation })` or `PUT /api/integrations/mappings` for updates.

Wire Admin “Add Rule” form to that API instead of local `setMappings`.

### 13.3 Persist applications to Postgres

Replace `applicationStore` methods with `prisma.application` CRUD; keep adapters/mocks. Mirror timeline and consent tables. Move audit `hash`/`prevHash` onto `AuditLog` (schema today has `hash` only—add `prevHash` if chaining in DB).

### 13.4 Enforce RBAC

Read `mahasetu_role` cookie (or real JWT) in API routes; 401/403 by role. Drive Navbar and portals from `/api/auth/me`.

### 13.5 HTTP adapters instead of in-process mocks

Change `RevenueAdapter.fetchAndNormalizeCitizen` to `fetch(this.endpointUrl + '/citizens/' + id)` so adapters exercise `/api/mock/*` over HTTP (or real departmental URLs from `Department.apiBaseUrl`).

---

## 14. Environment and scripts

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` | `prisma generate && next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `db:push` | `prisma db push` |
| `db:seed` | `node prisma/seed.js` |
| `db:studio` | `prisma studio` |
| `test:interop` | `node scripts/test-interop.js` |

---

## 15. Known prototype limitations (do not treat as production)

1. **In-memory state** — lost on server restart; not multi-instance safe.  
2. **Prisma unused by APIs** — schema/seed are scaffolding.  
3. **Verify always queries mobile `9876543210`**, not the logged-in citizen’s mobile.  
4. **Citizen Apply** posts `departmentId: 'MUNICIPAL'` regardless of selected service.  
5. **Admin new mapping rules** are not persisted to `applicationStore`.  
6. **FORMAT_MOBILE / CONCAT_ADDRESS** declared on types; generic `executeMapping` does not implement them (address concat lives inside `transformRevenueToCDM`).  
7. **Auth cookies unused** by page UIs.  
8. **MuniSys approve** looks up `application.municipalPermitRef` (permitId). Gateway then overwrites `municipalPermitRef` with a new license number.  
9. **Consent deny** calls revoke API (`REVOKED` not `DENIED`).  
10. **SSE CONNECTED** payload vs live events: clients should tolerate missing `eventType`.  
11. **RevNet unknown ID** silently returns Rahul Sharma.  
12. **No automated UI tests**; interop script covers core libraries only.  
13. **Redis** in Compose is unused.  
14. **`.env.example` SQLite URL** conflicts with Prisma `postgresql` provider.

---

## 16. Coding conventions

- TypeScript strict; prefer interfaces in `types.ts` for cross-department contracts.  
- Adapters never assume CDM field names on the wire to a department.  
- Publish an event **and** write an audit log for citizen/officer/system mutations.  
- Keep mock systems **schema-incompatible** on purpose (that is the demo).  
- Do not add secrets to git; use `.env`. Docker Compose includes a local demo password only.

---

## 17. Metadata and branding

- App title: `MahaSetu | Government Interoperability & Unified Service Delivery Platform`  
- SIH id shown as SIH26129 in UI (problem statement listing 26129).  

---

## 18. Quick file index (APIs)

```
src/app/api/auth/login/route.ts
src/app/api/auth/me/route.ts
src/app/api/citizens/me/route.ts
src/app/api/services/route.ts
src/app/api/departments/route.ts
src/app/api/applications/route.ts
src/app/api/applications/[id]/route.ts
src/app/api/applications/[id]/verify/route.ts
src/app/api/applications/[id]/approve/route.ts
src/app/api/applications/[id]/reject/route.ts
src/app/api/consents/route.ts
src/app/api/consents/[id]/approve/route.ts
src/app/api/consents/[id]/revoke/route.ts
src/app/api/integrations/route.ts
src/app/api/integrations/test/route.ts
src/app/api/integrations/mappings/route.ts
src/app/api/audit-logs/route.ts
src/app/api/events/stream/route.ts
src/app/api/mock/revenue/citizens/[id]/route.ts
src/app/api/mock/revenue/verify/route.ts
src/app/api/mock/municipal/applications/route.ts
src/app/api/mock/municipal/applications/[id]/route.ts
src/app/api/mock/municipal/applications/[id]/approve/route.ts
src/app/api/mock/employment/schemes/route.ts
src/app/api/mock/employment/citizens/[id]/eligibility/route.ts
```

---

*End of Developer Documentation.*
