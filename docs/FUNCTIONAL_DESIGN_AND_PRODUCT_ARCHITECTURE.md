# MahaSetu — Functional Design & Product Architecture

**Product:** MahaSetu (महासेतु) — Government Digital Platform Interoperability & Unified Service Delivery System  
**Organization:** Government of Maharashtra  
**Document type:** Functional Design Specification + Product Architecture  
**Application version:** 1.0.0 (production deployment)  
**Codebase:** Next.js 14 App Router (`mahasetu`)

---

## 1. Purpose of this document

This document describes **what the product does**, **who uses it**, **how every page and workflow behaves**, and **how the system is architected** so that existing government systems can interoperate without being replaced.

It reflects the **current production implementation**: PostgreSQL persistence, real authentication, role-based access, and three live service pipelines.

| Capability | How MahaSetu addresses it |
|---|---|
| API-based exchange | Adapter layer + departmental connector APIs (`/api/mock/*` and in-process adapters) |
| Common data standards & master data | Common Data Model (CDM) + persisted field-mapping studio |
| Consent-based data sharing | DPDP-style consent engine (grant / deny / revoke, purpose, fields, expiry) stored in PostgreSQL |
| Identity & access | Email/password registration, HMAC session cookies, role-based portal and API guards |
| Event-driven notifications | Event bus + SSE stream + in-app notifications table |
| Unified application tracking | Citizen timeline + officer department queue on the same PostgreSQL records |
| Configurable workflow orchestration | Service-specific pipelines after consent → verify → officer decision |
| Reusable connectors | `BaseAdapter` + Revenue / Municipal / Employment adapters |
| Audit logs & RBAC | SHA-256 hash-chained audit ledger; roles `CITIZEN`, `OFFICER_*`, `ADMIN` |
| Monitoring | Admin connector health/ping, audit trail, `/api/health` |

---

## 2. Problem statement (business context)

Government departments operate independent portals, registries, and databases with different data formats, authentication methods, and process definitions.

**Consequences**

- Citizens re-submit the same proofs on every portal.  
- No single window for application tracking.  
- Officers lack a consolidated, verified view across departments.  

**Constraint:** Interoperability must be secure and standards-based **without replacing** legacy systems.

**Product thesis:** MahaSetu sits between departments as middleware — adapters speak native schemas, a mapping engine normalizes to CDM, consent gates every fetch, and events keep all portals synchronized.

---

## 3. Product vision, goals, and non-goals

### 3.1 Vision

A federated service-delivery layer where citizens register once, apply for services through a single window, grant purpose-bound consent, and departments exchange verified records through reusable connectors.

### 3.2 Product goals

| Goal | Implementation |
|---|---|
| Fewer duplicate submissions | Address/tax records fetched from Revenue connector after consent — no re-upload |
| Reduced processing time | Adapter pipeline runs in milliseconds; SLAs shown per service |
| Consistent records | Same citizen mobile/identity resolved across Revenue CDM and Municipal dispatch |
| Improved citizen experience | Register → apply → consent → track → certificate print |
| Cross-department coordination | Officer console shows linked clearances before sanction |
| Compliance visibility | Timeline, audit hash chain, consent purpose and field list |

### 3.3 Non-goals (current release)

- Live Aadhaar / DigiLocker / ePramaan federation (OIDC SSO is a future integration).  
- Replacing departmental systems of record (connectors simulate legacy APIs).  
- Kafka / Redis-backed event mesh (in-process bus + Postgres `Event` table).  
- Grievance management and full beneficiary 360° dashboard.  
- Multi-state deployment (configured for Maharashtra departments in seed data).

---

## 4. Personas, roles, and access

### 4.1 Personas

| Persona | Access | Primary portal | Intent |
|---|---|---|---|
| **Citizen** | Self-registration | `/register` → `/citizen` | Apply, grant consent, track, download certificate |
| **Municipal officer** | Seeded account | `/department` | Review license applications with revenue clearance |
| **Revenue officer** | Seeded account | `/department` | Review address clearances; query revenue records |
| **Employment officer** | Seeded account | `/department` | Review subsidy applications |
| **Gateway administrator** | Seeded account | `/admin` | Mappings, sandbox, connector health, audit |

### 4.2 Roles

| Role | Portal access |
|---|---|
| `CITIZEN` | `/citizen` |
| `OFFICER_MUNICIPAL` | `/department` (municipal queue) |
| `OFFICER_REVENUE` | `/department` (revenue queue + record lookup) |
| `OFFICER_EMPLOYMENT` | `/department` (employment queue) |
| `ADMIN` | `/admin` (+ can view department console) |

### 4.3 Authentication & RBAC

| Layer | Behaviour |
|---|---|
| **Registration** | `/register` creates `User` + `Citizen` + revenue connector enrolment |
| **Login** | `/login` with email/password → `mahasetu_session` HTTP-only cookie |
| **Middleware** | Unauthenticated users redirected to `/login` for protected pages |
| **API guards** | Each route enforces role (e.g. only `CITIZEN` can apply; officers scoped to their department) |
| **SSE** | Authenticated stream; citizens receive only their own events |

Seeded staff accounts are created by `node prisma/seed.js`. Citizens are never seeded — they self-register.

---

## 5. Product architecture

### 5.1 Logical architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  PRESENTATION                                                         │
│  /  /login  /register  /citizen  /department  /admin                 │
│  Navbar (session-aware chrome, theme toggle, SSE ticker)              │
│  Light / dark theme (class strategy, persisted)                       │
└──────────────────────────────────────────────────────────────────────┘
                              │ HTTP / EventSource
┌──────────────────────────────────────────────────────────────────────┐
│  API GATEWAY (Next.js route handlers)                                 │
│  Auth · Applications · Consents · Services · Integrations · Audit     │
└──────────────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────────────┐
│  MAHASETU CORE                                                        │
│  Interop Pipeline · Consent Manager · Mapping Engine · Event Bus      │
│  Audit Logger · Application Store (Prisma)                          │
└──────────────────────────────────────────────────────────────────────┘
                              │ Adapters
┌──────────────┬─────────────────────┬─────────────────────────────────┐
│ Revenue      │ Municipal           │ Employment                       │
│ (RevNet)     │ (MuniSys)           │ (KaushalPortal)                  │
│ Postgres +   │ Postgres +          │ In-memory schemes                │
│ mock API     │ mock API            │ mock API                         │
└──────────────┴─────────────────────┴─────────────────────────────────┘
```

### 5.2 Department connectors

| System | Department | Native schema examples |
|---|---|---|
| **RevNet** | Revenue & Land Records | `citizen.fullName`, `address_record.city_name`, `property_tax_cleared` |
| **MuniSys** | Municipal Corporation | `applicant_name`, `premises_address`, `revenue_clearance_ref` |
| **KaushalPortal** | Employment & Skills | `candidate_profile.legal_name`, `scheme_eligibility.max_grant_inr` |

Revenue and Municipal connector state persists in PostgreSQL (`RevenueCitizenRecord`, `MunicipalPermit`). Citizen registration automatically enrols the citizen in the revenue connector.

### 5.3 Common Data Model (CDM)

Canonical record (`CommonCitizenRecord`): identity, address, and clearances (`revenueReferenceId`, `propertyTaxCleared`, etc.). All cross-department exchange passes through CDM.

### 5.4 Deployment architecture

| Component | Choice |
|---|---|
| Runtime | Node.js + Next.js 14 |
| Database | PostgreSQL (Neon recommended for cloud) |
| ORM | Prisma |
| Sessions | HMAC-signed cookie (`SESSION_SECRET`) |
| Real-time | SSE with 15s heartbeat |
| Health | `GET /api/health` |

---

## 6. Information architecture (sitemap)

| Route | Page | Audience | Auth |
|---|---|---|---|
| `/` | Public home — platform overview | Everyone | Public |
| `/login` | Sign in | Everyone | Public |
| `/register` | Citizen registration | New citizens | Public |
| `/citizen` | Citizen services portal | Citizens | `CITIZEN` |
| `/department` | Officer console | Officers, Admin | `OFFICER_*`, `ADMIN` |
| `/admin` | Gateway administration | Administrators | `ADMIN` |

Modals on citizen portal: **Apply for service**, **View certificate**.  
Admin tabs: **Field mappings**, **Schema sandbox**, **Connectors**, **Audit trail**.

---

## 7. Page-level functional specification

### 7.1 Navbar (`src/components/Navbar.tsx`)

- Brand → home  
- Theme toggle (light / dark, persisted in `localStorage` as `mahasetu-theme`, follows system default on first visit)  
- Role-aware navigation only after a confirmed session (`GET /api/auth/me` must return `success` and a user `id`)  
- Guests: **Sign in** and **Register** — **Sign out is never shown** while anonymous or while the session check is in progress  
- Authenticated: user name + **Sign out**; SSE live-update indicator and event ticker  
- Sign out calls `POST /api/auth/logout` and clears both Secure and non-Secure session cookies so a leftover development cookie cannot keep a guest “signed in”  

### 7.2 Home — `/`

- Hero: platform value proposition  
- Guests: **Create citizen account** (`/register`), **Sign in** (`/login`)  
- Signed-in users: **Open your portal** (citizen / officer / admin, by role) — not a second registration CTA  
- Connected departments overview (Revenue, Municipal, Employment)  
- Four capability cards: CDM, consent, unified tracking, audit & access control  
- Light and dark themes; Source Serif 4 headlines, IBM Plex Sans UI, IBM Plex Mono for identifiers  

No hackathon or demo content. No write operations.

### 7.3 Login — `/login`

- Email + password form  
- `POST /api/auth/login`  
- If already authenticated, redirect to the role portal (or a same-origin `?next=` path)  
- Redirect by role: Citizen → `/citizen`, Officer → `/department`, Admin → `/admin`  
- `?next=` is accepted only when it is a relative path starting with `/` (open redirects rejected)  

### 7.4 Register — `/register`

- Full citizen enrolment: name, email, password (min 8 chars), mobile (10 digits), full address, optional Aadhaar (stored as hash only)  
- `POST /api/auth/register`  
- Creates user, citizen profile, and revenue connector record  
- Auto sign-in → redirect to `/citizen`  
- If already authenticated, redirect to the role portal instead of showing the enrolment form  

### 7.5 Citizen portal — `/citizen`

**Data load (authenticated)**

- `GET /api/citizens/me` — profile and notifications  
- `GET /api/services` — service catalogue from PostgreSQL  
- `GET /api/applications` — citizen's own applications  
- SSE on `/api/events/stream` for approval/rejection updates  

**Profile header**

- Name, verified badge, email, mobile, registered address  

**Consent banner**

Shown when an application is `CONSENT_PENDING` with a `PENDING` consent.

| Action | Result |
|---|---|
| Grant consent | `POST /api/consents/:id/approve` then `POST /api/applications/:id/verify` (runs interop pipeline) |
| Deny | `POST /api/consents/:id/revoke` with `{ deny: true }` → status `DENIED` |

**Services grid**

| Code | Name | Department | SLA | Fee |
|---|---|---|---|---|
| `BUSINESS_LICENSE` | Municipal trade & business license | Municipal | 3 days | ₹1200 |
| `ADDRESS_VERIFICATION` | Residential land record & address clearance | Revenue | 2 days | Free |
| `SKILL_SUBSIDY` | MSME enterprise & skill subsidy | Employment | 5 days | Free |

**Apply modal**

- Business license: business name + trade category required  
- Other services: uses citizen name; subsidy blocked until an approved trade license exists  
- `POST /api/applications` with `serviceId` — orchestrator selects correct consent and pipeline  

**Application tracking**

- Status badges: Awaiting consent, Officer review, Approved, Rejected  
- Four-step progress: Submitted → Consent → Department records → Decision  
- Timeline from `ApplicationTimeline` records  
- Approved applications: **View certificate** modal with print  

### 7.6 Officer console — `/department`

**Queue:** `GET /api/applications` filtered to the officer's department (or all for Admin).

**Application detail**

- Applicant name and mobile from database  
- Cross-department verification panel: revenue clearance ref, municipal permit ref, status  
- Officer remarks textarea  
- **Sanction** → `POST /api/applications/:id/approve` (only when `PENDING_OFFICER_REVIEW`)  
- **Reject** → `POST /api/applications/:id/reject`  

**Revenue record lookup** (Revenue officer / Admin)

- Search by mobile → `GET /api/mock/revenue/citizens/:mobile`  
- Displays raw legacy JSON schema  

### 7.7 Gateway admin — `/admin`

| Tab | Function |
|---|---|
| Field mappings | View rules from DB; add new rules via `POST /api/integrations/mappings` |
| Schema sandbox | Paste JSON → `POST /api/integrations/mappings` with `sourceData` → view CDM output |
| Connectors | Adapter health cards; **Ping** updates latency in DB |
| Audit trail | Hash-chained log entries with `prevHash` and `hash` |

---

## 8. End-to-end workflows

### 8.1 Business license (primary path)

```
Citizen registers → applies for BUSINESS_LICENSE
  → Application CONSENT_PENDING + Consent PENDING (MUNICIPAL requests REVENUE data)
Citizen grants consent
  → Consent GRANTED + timeline event
Verify pipeline
  → RevenueAdapter.fetchAndNormalizeCitizen(citizen.mobile)
  → CDM normalization
  → MunicipalAdapter.submitTradeLicenseApplication(CDM, business, category)
  → Application PENDING_OFFICER_REVIEW
Municipal officer sanctions
  → Application APPROVED + license reference
  → SSE APPLICATION_APPROVED → citizen notification
```

### 8.2 Address verification

```
Citizen applies for ADDRESS_VERIFICATION
  → Consent (REVENUE self-access for land-record extract)
Grant + verify
  → Revenue fetch + CDM → PENDING_OFFICER_REVIEW
Revenue officer sanctions
  → APPROVED with clearance reference
```

### 8.3 Skill subsidy

```
Prerequisite: approved BUSINESS_LICENSE for same citizen
Citizen applies for SKILL_SUBSIDY
  → Consent (EMPLOYMENT requests MUNICIPAL trade-license data)
Grant + verify
  → EmploymentAdapter.checkEligibility(mobile, hasTradeLicense=true)
  → PENDING_OFFICER_REVIEW
Employment officer sanctions
  → APPROVED with subsidy reference
```

### 8.4 Consent denial

Citizen denies → consent `DENIED` → verify blocked (403) until a new consent flow is initiated.

### 8.5 Officer rejection

Officer rejects → `REJECTED` status → timeline error entry → SSE `APPLICATION_REJECTED` → citizen notification.

---

## 9. Business rules

### 9.1 Application lifecycle

| Status | Meaning |
|---|---|
| `CONSENT_PENDING` | Waiting for citizen consent |
| `PENDING_OFFICER_REVIEW` | Interop complete; awaiting officer |
| `APPROVED` | Sanctioned; certificate available |
| `REJECTED` | Declined by officer |

Application numbers: `MH-MUNI-YYYY-*`, `MH-REV-YYYY-*`, `MH-EMP-YYYY-*`.

### 9.2 Consent rules

- Purpose-bound, field-specific, 30-day expiry  
- Status: `PENDING` | `GRANTED` | `DENIED` | `REVOKED`  
- Interop verify returns **403** if consent is not `GRANTED` or is expired  
- Consent spec varies by service (Municipal←Revenue, Revenue self, Employment←Municipal)

### 9.3 Service prerequisites

- **Skill subsidy** requires an existing `APPROVED` business license for the same citizen (checked at apply and verify).

### 9.4 Audit chain

Each `AuditLog` entry: `hash = SHA256(id|actorId|action|entityId|timestamp|prevHash)`. Stored in PostgreSQL with `prevHash` column.

### 9.5 Notifications

`notifyCitizen()` writes to `Notification` table on pipeline milestones and officer decisions. Citizen portal also shows SSE-driven banners.

---

## 10. Domain data model

```
User 1──1 Citizen 1──* Application *──1 Service *──1 Department
                 └──* Consent *──1 Application
Application 1──* ApplicationTimeline
Department 1──* Integration, FieldMapping
RevenueCitizenRecord (mobile → legacy JSON payload)
MunicipalPermit (linked via mahasetuApplicationId)
AuditLog (append-only hash chain)
Event, Notification
```

### Seeded master data (`prisma/seed.js`)

- Departments: REVENUE, MUNICIPAL, EMPLOYMENT  
- Services: BUSINESS_LICENSE, ADDRESS_VERIFICATION, SKILL_SUBSIDY  
- Field mappings (RevNet → CDM → MuniSys)  
- Integrations with endpoint URLs and auth types  
- Staff user accounts (not citizens)  

---

## 11. Security & privacy

| Requirement | Treatment |
|---|---|
| Consent-based sharing | Explicit grant; purpose; field list; deny/revoke |
| Password storage | scrypt hash with per-user salt |
| Session security | HTTP-only cookie; HMAC signature; 7-day expiry |
| Identity | Aadhaar stored as SHA-256 hash only |
| Audit | Tamper-evident hash chain with actor, role, IP |
| Department isolation | Officers see only their department's application queue |
| Transport | TLS required in production (`secure` cookie flag) |

---

## 12. Non-functional requirements

| NFR | Target |
|---|---|
| Database | PostgreSQL required; health endpoint verifies connectivity |
| Interop latency | Sub-second for in-process adapter calls |
| Real-time | SSE push within seconds of officer action |
| Connector health | Ping updates status and latency in `Integration` table |
| Scalability | Single Node process; horizontal scaling needs shared SSE/Redis (future) |

---

## 13. Acceptance test flow (production)

1. Run `npx prisma db push` and `node prisma/seed.js` against production PostgreSQL.  
2. Register a new citizen at `/register`.  
3. Sign in → apply for **Municipal trade & business license**.  
4. Grant consent → confirm application moves to **Officer review**.  
5. Sign in as `municipal.officer@mahasetu.gov.in` → sanction application.  
6. Return to citizen portal → status **Approved**; view/print certificate.  
7. Apply for **Skill subsidy** (should succeed after license approval).  
8. Admin: verify mappings, run sandbox transform, ping connectors, inspect audit chain.  
9. `GET /api/health` returns `{ ok: true, database: "up" }`.

---

## 14. Future extensions

- OIDC / ePramaan government SSO  
- HTTP adapters to live departmental APIs (replace in-process mocks)  
- Prisma Migrate workflow (replace `db push`)  
- Redis-backed SSE for multi-instance deployments  
- Grievance module and officer beneficiary 360° view  
- SMS/email notifications alongside in-app alerts  

---

*End of Functional Design & Product Architecture. Companion: `docs/DEVELOPER_DOCUMENTATION.md`.*
