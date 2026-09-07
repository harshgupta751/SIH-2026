# MahaSetu — Functional Design & Product Architecture

**Product:** MahaSetu (महासेतु) — Government Digital Platform Interoperability & Unified Service Delivery System  
**Problem Statement ID:** SIH26129  
**Organization:** Government of Maharashtra  
**Department:** Maharashtra State Innovation Society, Department of Skills, Employment, Entrepreneurship and Innovation  
**Category:** Software · **Theme:** Miscellaneous  
**Document type:** Functional Design Specification + Product Architecture  
**Application version:** 1.0.0 (hackathon prototype)  
**Codebase:** Next.js 14 App Router (`mahasetu`)

---

## 1. Purpose of this document

This document describes **what the product does**, **who uses it**, **how every page and workflow behaves**, and **how the system is architected** so that existing government systems can interoperate without being replaced.

It is written from the **implemented MahaSetu codebase**, aligned to SIH 26129 expected outcomes:

| SIH expected capability | How MahaSetu addresses it |
|---|---|
| API-based exchange | Adapter layer + mock departmental REST APIs (`/api/mock/*`) |
| Common data standards & master data | Common Data Model (CDM) + field-mapping studio |
| Consent-based data sharing | DPDP-style consent engine (grant / deny / revoke, purpose, fields, expiry) |
| SSO / federated identity | Role-based session API (`/api/auth/login`, `/api/auth/me`) with citizen, officer, admin personas |
| Event-driven notifications | In-process event bus + Server-Sent Events (`/api/events/stream`) |
| Unified application tracking | Citizen portal timeline + officer queue sharing the same application store |
| Configurable workflow orchestration | Service-driven dependency discovery (trade license → revenue clearance) then consent → verify → dispatch → sanction |
| Reusable connectors (legacy + modern) | `BaseAdapter` + Revenue / Municipal / Employment adapters |
| Audit logs & RBAC | SHA-256 hash-chained audit ledger; roles CITIZEN, OFFICER_*, ADMIN |
| Data-quality checks & exception handling | Adapter `execute()` timing/error envelope; mapping engine nested-path extraction; consent gate before interop |
| Monitoring dashboards | Home topology, Admin adapter health/ping, latency display |

---

## 2. Problem statement (business context)

Government departments operate independent portals, registries, and databases. They differ in:

- Data formats and identifiers  
- Authentication methods and APIs  
- Process definitions and ownership  

**Consequences today**

- Citizens and businesses re-submit the same proofs (address, tax clearance, identity) on every portal.  
- Applications are tracked separately; there is no single window.  
- Officers cannot see a consolidated view of beneficiaries, applications, clearances, grievances, and outcomes.  

**Constraint:** Interoperability must be **secure and standards-based** and must **not replace** legacy systems.

**MahaSetu product thesis:** Do not rebuild departmental websites. Sit between them as middleware: adapters speak each system’s native schema; a mapping engine normalizes to a Common Data Model; consent gates every cross-department fetch; events keep citizen and officer UIs in sync.

---

## 3. Product vision, goals, and non-goals

### 3.1 Vision

A federated service-delivery layer for Maharashtra in which a citizen applies once, grants purpose-bound consent, and departments exchange verified records through reusable connectors—while each department keeps its own system of record.

### 3.2 Product goals (measurable for the prototype)

| Goal | Prototype demonstration |
|---|---|
| Fewer duplicate submissions | Trade license application does **not** re-collect address/tax PDFs; RevNet is queried after consent |
| Reduced processing time | Interop pipeline (fetch → CDM → MuniSys) runs in milliseconds; SLA shown per service (3 / 2 / 5 days) |
| Consistent records | Same citizen identity (`CIT-3210` / mobile `9876543210`) resolved across RevNet, CDM, and MuniSys |
| Improved citizen experience | Single window (`/citizen`), live status stepper, SSE approval banner, printable license |
| Cross-department coordination | Officer console shows MahaSetu verification ledger (RevNet facts inside MuniSys review) |
| Service-level compliance visibility | Timeline stages, audit hashes, adapter latency |

### 3.3 Non-goals (prototype scope)

- Production Aadhaar/DigiLocker federation ( DigiLocker is **shown as linked**, not integrated).  
- Real Kafka cluster, Redis cache, or Neon DB as the **runtime** application store (Prisma/Postgres exist for schema + seed; live APIs use in-memory stores).  
- Full RBAC enforcement on every API (roles exist; most APIs are open for demo).  
- Complete skill-subsidy application journey (Employment adapter and schemes exist; the killer path is **Municipal Trade License**).  
- Multi-tenant production SSO (OAuth2/OIDC with IdP). Login is a **mock federated identity** API.

---

## 4. Personas, roles, and access

### 4.1 Personas

| Persona | Demo identity | Primary portal | Intent |
|---|---|---|---|
| **Citizen** | Rahul Sharma, `CIT-3210`, Pune, mobile `9876543210` | `/citizen` | Apply for services, grant/deny consent, track applications, download license |
| **Municipal officer** | Manoj Kulkarni, Ward 14 Licensing | `/department` (Municipal tab) | Review pre-verified files, sanction or reject trade licenses |
| **Revenue officer** | Sunita Patil (login API) / RevNet query UI | `/department` (Revenue tab) | Look up cadastral / tax records in legacy schema |
| **Gateway administrator** | Dr. Alok Verma (login API) | `/admin` | Field mappings, schema sandbox, adapter health, audit trail |
| **Evaluator / jury** | — | `/` and `/demo` | Understand topology and 10-step interop story |

### 4.2 Roles (data model)

Stored conceptually on `User.role`:

- `CITIZEN`  
- `OFFICER_MUNICIPAL`  
- `OFFICER_REVENUE`  
- `OFFICER_EMPLOYMENT`  
- `ADMIN`  

Login (`POST /api/auth/login`) currently materializes: CITIZEN, OFFICER_MUNICIPAL, OFFICER_REVENUE, ADMIN. Cookies: `mahasetu_role`, `mahasetu_user`. Default session if no cookie: citizen Rahul Sharma.

### 4.3 RBAC (intended vs implemented)

| Capability | Intended | Implemented in UI/API |
|---|---|---|
| Citizen apply / consent | Citizen only | Citizen portal; APIs not locked |
| Approve / reject license | Municipal officer | Department portal buttons; `/api/applications/:id/approve|reject` |
| Query RevNet | Revenue officer / adapters | Department Revenue tab + mock APIs |
| Mapping / audit / ping | Admin | Admin studio |
| Cross-dept fetch | System after GRANTED consent | Enforced in `/api/applications/:id/verify` (HTTP 403 if consent not GRANTED) |

---

## 5. Product architecture

### 5.1 Logical architecture (layers)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION                                                            │
│  /  Overview   /demo  Killer Demo   /citizen   /department   /admin     │
│  Navbar (SSE ticker) · Global layout · Tailwind UI                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ HTTP / EventSource
┌─────────────────────────────────────────────────────────────────────────┐
│  UNIFIED SERVICE GATEWAY (Next.js API routes)                            │
│  Applications · Consents · Auth · Services · Departments                 │
│  Integrations / mappings / ping · Audit · SSE stream                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│  MAHASETU CORE                                                           │
│  Consent Manager · Application Store · Audit Logger (SHA-256 chain)      │
│  Reactive Event Bus · Data Mapping Engine · Integration Registry         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │ Adapters (do not rewrite departments)
┌──────────────┬─────────────────────┬────────────────────────────────────┐
│ RevenueAdapter│ MunicipalAdapter    │ EmploymentAdapter                   │
│ → RevNet      │ → MuniSys           │ → KaushalPortal                     │
│ /api/mock/    │ /api/mock/municipal │ /api/mock/employment                │
│ revenue       │                     │                                    │
└──────────────┴─────────────────────┴────────────────────────────────────┘
```

### 5.2 Heterogeneous systems (simulated legacy)

| System | Department | Native schema examples | Responsibilities |
|---|---|---|---|
| **RevNet** | Revenue & Land Records | `citizen.fullName`, `address_record.city_name`, `property_tax_cleared` | Property/address, cadastral area, tax clearance |
| **MuniSys** | Municipal Corporation | `applicant_name`, `premises_address`, `revenue_clearance_ref` | Trade licensing, ward, officer sanction |
| **KaushalPortal** | Employment & Skill | `candidate_profile.legal_name`, `scheme_eligibility.max_grant_inr` | PMEGP / Mudra schemes, eligibility |

Each mock is an **independent in-memory backend** with its own identifiers and JSON shape. MahaSetu never requires them to share a database.

### 5.3 Common Data Model (CDM)

Canonical citizen record used between adapters (`CommonCitizenRecord`):

- Identity: `citizenId`, `name`, `mobile`, `email?`, `identityHash`  
- Address: `line1`, `locality`, `city`, `district`, `state`, `postalCode`, `fullFormattedAddress`  
- Clearances: `revenueVerified`, `revenueReferenceId`, `propertyTaxCleared`, `landHoldingSqft`, `municipalVerified`, `municipalPermitNumber`, `employmentEligible`, `schemeCode`  

**Master-data idea in the prototype:** services, departments, and field mappings act as configurable catalogues. Citizen “golden” demo record is Rahul Sharma / CIT-3210.

### 5.4 Bidirectional mapping (core product capability)

```
RevNet JSON  →  RevenueAdapter  →  DataMappingEngine.transformRevenueToCDM()
                                      ↓
                               CommonCitizenRecord
                                      ↓
              DataMappingEngine.transformCDMToMunicipal()  →  MunicipalAdapter  →  MuniSys JSON
```

Generic rule execution: `DataMappingEngine.executeMapping(sourceData, rules)` used by Admin **Schema Sandbox**.

Transformations defined: `DIRECT`, `TO_UPPER`, `CONCAT_ADDRESS`, `BOOLEAN_FLAG`, `FORMAT_MOBILE`. Runtime generic mapper applies `TO_UPPER` and `BOOLEAN_FLAG`; revenue→CDM also concatenates address and generates `REV-CLR-*` clearance IDs.

### 5.5 Physical / deployment architecture

| Component | Prototype choice |
|---|---|
| App runtime | Node.js, Next.js 14 (`npm run dev` / `next start`) |
| UI | React 18 client pages (`'use client'`), Tailwind CSS, Lucide icons |
| Persistence (schema) | Prisma + PostgreSQL (`prisma/schema.prisma`); Docker Compose Postgres 15 + Redis 7 |
| Persistence (live demo) | Process-global in-memory stores (survive HMR via `globalThis` singletons) |
| Real-time | SSE (`text/event-stream`), 15s heartbeat |
| Crypto | Node `crypto` SHA-256 for audit chain; mock consent signature hashes |
| Config | `.env` `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV` |

`reactStrictMode` is **false** to avoid duplicate SSE connections in development.

### 5.6 Architectural principles

1. **Leave legacy intact** — adapters call mock departmental APIs/services; departments keep idiosyncratic JSON.  
2. **Normalize at the edge of MahaSetu** — CDM is the contract, not RevNet or MuniSys.  
3. **Consent before fetch** — verify pipeline refuses exchange until consent is `GRANTED`.  
4. **Events as the coordination fabric** — create, consent, fetch, dispatch, approve/reject all publish typed events.  
5. **Non-repudiation** — every sensitive action can be hashed into a chain (`prevHash` → `hash`).  
6. **Demo-first observability** — topology, payload inspector, sandbox, ping, audit UI.

---

## 6. Information architecture (sitemap)

Global chrome: **Navbar** (brand MahaSetu / SIH26129, tricolor bar, role tabs, Event Mesh live indicator, floating event ticker) + **footer** (platform credit and department triangle).

| Route | Page name | Audience |
|---|---|---|
| `/` | Overview & live topology | All |
| `/demo` | Killer Demo walkthrough | Jury / trainers |
| `/citizen` | Citizen Portal | Citizen |
| `/department` | Officer Verification & Interop Studio | Officers |
| `/admin` | Gateway Middleware & Schema Studio | Admin |

There are no nested app routes beyond these five pages. All other surfaces are **modals** (apply, certificate) or **tabs** (department Municipal/Revenue; admin Mappings/Sandbox/Adapters/Audit).

---

## 7. Page-level functional specification

### 7.1 Shared: Navbar (`src/components/Navbar.tsx`)

**Features**

- Brand click → `/`  
- Navigation: Overview, Citizen Portal (badge “Rahul”), Department Portal (badge “Officer”), Interop Admin (badge “Gateway”), Killer Demo (highlighted)  
- Active route styling  
- Opens `EventSource('/api/events/stream')`  
  - On open: “Event Mesh Live”  
  - On message: ticker `eventType` + truncated `summary` for 6 seconds  
  - On error: “Connecting…”  

**Business logic:** Cross-cutting awareness of the event mesh so evaluators see live interop even while switching portals.

---

### 7.2 Overview — `/` (`src/app/page.tsx`)

**Purpose:** Position MahaSetu as middleware, not another citizen portal.

**Sections and functions**

1. **Hero**  
   - SIH26129 badge, title, value proposition (“We do not rebuild government websites. We bridge them.”)  
   - CTAs: Launch Killer Demo → `/demo`; Citizen Portal → `/citizen`; Admin & Schema Studio → `/admin`  

2. **Live Distributed Interoperability Topology**  
   - On load: `GET /api/integrations` (health of three adapters; UI currently shows static 38/42/35 ms and “All 3 Adapters Online”).  
   - Three department cards: RevNet, MuniSys, KaushalPortal with **idiosyncratic schema snippets**.  
   - Central CDM engine strip: JSONPath mapper, DPDP consent guard, reactive SSE mesh.  

3. **Four feature pillars**  
   Dynamic Data Mapping · DPDP Consent Manager · Reactive Event Bus · Tamper-Evident Audit  

4. **Comparison table**  
   Siloed portals vs MahaSetu on verification, formats, privacy, tracking.  

**Business rules:** Marketing/education only; no write operations.

---

### 7.3 Killer Demo — `/demo` (`src/app/demo/page.tsx`)

**Purpose:** Narrated 10-step interoperability story with payload inspector.

**Controls**

- Auto-Play (3.2s per step) / Pause  
- Next Step (disabled at 10 or while playing)  
- Reset to step 1  
- Click any step chip to jump  

**Ten steps (product storyboard)**

| Step | Title | Actor | What the product claims happens |
|---|---|---|---|
| 1 | Citizen Login | Rahul Sharma | DigiLocker-verified session, profile CIT-3210 |
| 2 | Apply for Business License | Citizen Portal | Application `MH-MUNI-2026-10231` for Rahul Enterprises |
| 3 | Dependency Discovery & DPDP Consent | Gateway | Trade license requires RevNet address + tax; consent UI |
| 4 | Citizen Grants Data Consent | Rahul | Signed consent stored + audited |
| 5 | RevNet API Query | RevenueAdapter | Legacy JSON for mobile 9876543210 |
| 6 | Dynamic Data Mapping to CDM | Mapping Engine | Nested fields → CDM |
| 7 | MuniSys Dispatch | MunicipalAdapter | Target schema + `REV-CLR-*` |
| 8 | Officer Cross-Department Inspection | M. Kulkarni | Ledger instead of physical docs |
| 9 | Officer Sanctions License | MuniSys + Event Bus | Permit + `APPLICATION_APPROVED` |
| 10 | Real-Time SSE Citizen Sync | SSE | Dashboard → Approved; certificate ready |

**Live Schema Transformation Inspector (three columns)**

1. RevNet raw JSON (highlights from step 5)  
2. MahaSetu CDM (from step 6)  
3. MuniSys dispatched JSON (from step 7)  

Payloads are **curated demo fixtures** (not live API calls on this page).

**Dual preview**

- Left: Citizen view status machine — Draft → Awaiting Consent (step ≥3) → Municipal Officer Review (step ≥7) → Approved (step 10); revenue ref from step 5; permit `MH-PUNE-MUNI-LIC-4412` at step 10.  
- Right: Officer console — pre-verified MahaSetu data; approve affordance active from step 9.  

**Business logic:** This page is **simulation/education**. The **executable** workflow lives on `/citizen` + `/department`.

---

### 7.4 Citizen Portal — `/citizen` (`src/app/citizen/page.tsx`)

**Purpose:** Single-window service delivery for the verified citizen.

#### 7.4.1 Data load

On mount (and refresh / SSE-triggered reload):

- `GET /api/citizens/me` → profile  
- `GET /api/services` → catalogue  
- `GET /api/applications?citizenId=CIT-3210` → applications  
- If any application `status === CONSENT_PENDING`, `GET /api/applications/:id` and if consent `PENDING`, show consent banner  

SSE: reload on `APPLICATION_APPROVED` (celebration banner), `REVENUE_FETCHED`, `MUNICIPAL_DISPATCHED`.

#### 7.4.2 Profile header

- Display name (API or fallback “Rahul Sharma”), Verified Citizen badge  
- Citizen ID `CIT-3210`, mobile, “DigiLocker Linked”  
- Official registered address (Revenue records copy)  

#### 7.4.3 Consent authorization banner (DPDP Act 2023)

Shown when `activeConsent` is set.

**Displays:** requesting department, source department, application id, requested `dataFields` chips.

**Actions**

| Action | API | Follow-on |
|---|---|---|
| Grant DPDP Consent | `POST /api/consents/:id/approve` then `POST /api/applications/:applicationId/verify` | Clears banner; success alert with revenue reference from pipeline telemetry |
| Deny | `POST /api/consents/:id/revoke` | Clears banner, reloads list |

**Business rule:** Granting consent is what **unlocks** RevNet fetch and MuniSys dispatch. Deny/revoke uses the revoke endpoint (status becomes `REVOKED`).

#### 7.4.4 Government services grid

Each card from `applicationStore` services:

| Code | Name | Department | SLA | Fee | Interop requirement (copy) |
|---|---|---|---|---|---|
| `BUSINESS_LICENSE` | Municipal Trade & Business License | MuniSys | 3 days | ₹1200 | Revenue address & property tax clearance |
| `ADDRESS_VERIFICATION` | Official Residential & Land Record Verification | RevNet | 2 days | Free | Revenue Inspector digital sign-off |
| `SKILL_SUBSIDY` | MSME Youth Enterprise & Skill Subsidy | KaushalPortal | 5 days | Free | Verified trade license + domicile |

**Apply Now** opens modal. **Implemented apply POST always sends** `serviceId` from selected card (or `BUSINESS_LICENSE`), **`departmentId: 'MUNICIPAL'`**, citizen `CIT-3210`, business name, trade category. The orchestrated interop path is therefore the **trade-license / municipal** path even if another card is selected (prototype limitation; product intent is service-specific orchestration).

#### 7.4.5 Apply modal

Fields:

- Business / Establishment Name (required, default `Rahul Enterprises`)  
- Trade Category: `COMMERCIAL_RETAIL` | `IT_AND_COMMUNICATIONS` | `FOOD_AND_BEVERAGE` | `MANUFACTURING_SMALL`  
- Notice: submission will discover Revenue dependency and prompt DPDP consent  

Submit: `POST /api/applications`. On success, close modal; if `consentRequired`, set `activeConsent` from `consentRequest`.

#### 7.4.6 Application tracking

Empty state: prompt to apply.

Each application card:

- Application number, status badge mapping:  
  - `APPROVED` → Approved ✅  
  - `PENDING_OFFICER_REVIEW` → Municipal Officer Review 🟡  
  - `CONSENT_PENDING` → Awaiting Consent ⏳  
  - else raw status  
- Business name and trade category  
- Applied date  
- If approved: **View Trade License**  

**Five-step visual pipeline**

1. Application — always complete after create  
2. Citizen Consent — pending while `CONSENT_PENDING`, else authorized  
3. RevNet Check — complete if `revenueClearanceRef` present  
4. MuniSys Review — pending officer vs approved  
5. Trade License — issued iff `APPROVED`  

**Live event log:** `app.timeline[]` details + actor.

#### 7.4.7 Trade license certificate modal

Statutory-style certificate:

- Municipal Corporation of Pune  
- Certificate No = `municipalPermitRef`  
- Licensee Rahul Sharma, establishment, premises, revenue clearance ref, officer M. Kulkarni  
- Print / Save (`window.print()`)  

---

### 7.5 Department Portal — `/department` (`src/app/department/page.tsx`)

**Purpose:** Officer operations with **cross-department verification ledger**.

Header: logged in as Manoj Kulkarni (Municipal). Role switcher: **Municipal Dept (MuniSys)** | **Revenue Dept (RevNet)**.

SSE reload on `APPLICATION_CREATED`, `MUNICIPAL_DISPATCHED`, `APPLICATION_APPROVED`.

#### 7.5.1 Municipal view

**Queue (left):** `GET /api/applications` (all applications, not filtered by department). Click to select. Shows number, status, business name, revenue check Clear/Pending.

**Detail (right):**

- Ward 14 review header  
- **MahaSetu Cross-Department Verification Ledger** (hero feature):  
  - Applicant name (CDM) — demo copy “Rahul Sharma”  
  - Revenue clearance reference (from application or fallback `REV-CLR-990142`)  
  - Verified cadastral address  
  - Property tax arrears CLEARED  
  - Land holding 1,200 sq.ft.  
- Officer notes textarea (default statutory comment)  
- **Reject Application** → `POST /api/applications/:id/reject` `{ reason, officerName }`  
- **Sanction Trade License** → `POST /api/applications/:id/approve` `{ comments, officerName: 'M. Kulkarni (Ward 14 Licensing)' }`  
- Both disabled while processing or if already `APPROVED`  

**Business rules**

- Officer does not re-verify address by asking for PDFs; ledger is the interop proof.  
- Success banner shows generated `licenseNumber`.  

#### 7.5.2 Revenue view (RevNet)

Simulated **legacy officer workstation**:

- Search by mobile (default `9876543210`)  
- `GET /api/mock/revenue/citizens/:mobile`  
- Shows name, verification_status, house/locality, city/district, tax cleared/pending  
- **Raw idiosyncratic JSON** for teaching schema mismatch  

No write operations on RevNet from this UI.

---

### 7.6 Interop Admin — `/admin` (`src/app/admin/page.tsx`)

**Purpose:** Configure and observe the middleware.

Loads: `GET /api/integrations`, `GET /api/integrations/mappings`, `GET /api/audit-logs`.

#### Tab: Field Mapping Studio

- Table of rules: id, source system, source JSON path, target system, target field, transformation  
- **Register New Schema Mapping Rule** (client-side append only in current UI): source RevNet / MahaSetu_CDM / KaushalPortal; target MahaSetu_CDM / MuniSys; paths; submit adds `FMP-0N` locally  

**Intended product behavior:** persist via store `addFieldMapping`. **Implemented UI:** does not call PUT/POST for new rules (sandbox POST uses existing store rules).

#### Tab: Schema Sandbox

- Paste RevNet-like JSON (default Ananya Deshpande sample)  
- **Execute Translation** → `POST /api/integrations/mappings` `{ sourceData }` using stored rules  
- Right pane: normalized object  

#### Tab: Connected Adapters

- Cards per integration: department code, latency, system name, endpoint, HEALTHY & CONNECTED  
- **Ping Adapter** → `POST /api/integrations/test` `{ departmentCode }` then refresh  

#### Tab: Cryptographic Audit Trail

- List: id, action, actor role/id, time, purpose, department, `hash`, `prevHash`  

---

## 8. End-to-end workflows

### 8.1 Primary workflow: Trade license via interoperability (killer path)

```
Citizen Apply
    → Application CONSENT_PENDING + Consent PENDING
    → Event APPLICATION_CREATED + Audit APPLICATION_CREATED
Citizen Grant Consent
    → Consent GRANTED + Timeline CONSENT_GRANTED
    → Event CONSENT_GRANTED + Audit CONSENT_GRANTED
Verify pipeline (gated)
    → RevenueAdapter.fetchAndNormalizeCitizen('9876543210')
    → Event REVENUE_FETCHED
    → Event DATA_NORMALIZED
    → MunicipalAdapter.submitTradeLicenseApplication(CDM, business, category)
    → Event MUNICIPAL_DISPATCHED
    → Application PENDING_OFFICER_REVIEW + revenueClearanceRef + municipalPermitRef
    → Timeline REVENUE_VERIFIED, ADAPTER_TRANSLATED
    → Audit CROSS_DEPT_INTEROP_EXECUTION
Officer Sanction
    → municipalAdapter.approveTradeApplication
    → Application APPROVED + license number
    → Event APPLICATION_APPROVED → Citizen SSE banner
    → Audit APPLICATION_APPROVED
```

### 8.2 Consent denial / revocation

Citizen Deny → `revokeConsent` → Event `CONSENT_REVOKED` → Audit. Verify API continues to block if consent exists and is not `GRANTED`.

### 8.3 Officer rejection

`POST .../reject` → MuniSys reject → status `REJECTED` → timeline ERROR → Event `APPLICATION_REJECTED` → Audit.

### 8.4 Revenue record lookup (legacy system still works)

Officer switches to Revenue tab → query RevNet by mobile → native JSON. Demonstrates **federated** access: MahaSetu does not replace RevNet UI; it also exposes it.

### 8.5 Admin mapping experiment

Paste JSON → executeMapping → inspect CDM-like object. Ping adapters for HEALTHY/DOWN + latency.

### 8.6 Mock identity (SSO stand-in)

`POST /api/auth/login` `{ role }` returns mock JWT string and sets cookies. `GET /api/auth/me` reads cookie or defaults to citizen. Portals currently **hard-code persona copy** rather than switching UI from this API (login is available for future wiring).

---

## 9. Business rules and requirements (detailed)

### 9.1 Application lifecycle

| Status | Meaning | Typical next action |
|---|---|---|
| `DRAFT` | Schema-supported; not used on create | — |
| `CONSENT_PENDING` | Created; waiting DPDP grant | Grant or deny consent |
| `REVENUE_VERIFIED` | Schema-supported | Pipeline currently jumps to officer review after verify |
| `PENDING_OFFICER_REVIEW` | In MuniSys queue | Approve or reject |
| `APPROVED` | License number issued | View certificate |
| `REJECTED` | Officer declined | Citizen sees status |

Create always starts at `CONSENT_PENDING`. Application numbers: `MH-MUNI-2026-{10000–99999}`.

### 9.2 Service catalogue rules (seed + in-memory)

| Service | Required clearances (Prisma JSON / store copy) | Fee | SLA days |
|---|---|---|---|
| Business license | `REVENUE_ADDRESS_AND_TAX_CLEARANCE` | 1200 | 3 |
| Address verification | `REVENUE_TITLE_CLEARANCE` | 0 | 2 |
| Skill subsidy | `TRADE_LICENSE`, `DOMICILE_CERTIFICATE` | 0 | 5 |

**Create-application orchestrator (current code):** always creates Municipal consent request (MUNICIPAL ← REVENUE) with fields `name`, `address`, `property_tax_cleared`, `land_holding_sqft`.

### 9.3 Consent rules (DPDP-aligned prototype)

- Purpose-bound string  
- Granular `dataFields`  
- Status: `PENDING` | `GRANTED` | `DENIED` | `REVOKED`  
- Expiry: 30 days from create  
- Signature: mock `sha256_*` hash  
- Interop **must not** run if a linked consent exists and status ≠ `GRANTED` (403)  
- If no consent record is found, verify currently **proceeds** (edge case)

### 9.4 Mapping / data-quality rules

- Nested path get/set (`citizen.fullName`)  
- Missing nested values → empty string / 0 / undefined skipped in generic mapper  
- Revenue verification_status must be `VERIFIED_ACTIVE` for `revenueVerified`  
- `property_tax_cleared` coerced to boolean  
- CDM `citizenId` derived as `CIT-{last 4 of mobile}` (Rahul → `CIT-3210`)  
- Ward: Pune → `WARD-14`, else `WARD-01`  
- If CDM `revenueVerified`, MuniSys `approval_state` = `PENDING_MUNICIPAL_VERIFICATION`, else `PENDING_REVENUE_VERIFICATION`  
- Clearance id: `REV-CLR-` + last 6 digits of timestamp  

### 9.5 Adapter / exception rules

`BaseAdapter.execute`:

- Success envelope: departmentCode, systemName, data, rawPayload, executionTimeMs  
- Failure: success false, error message, null data  

Revenue fetch throws if execute failed. Municipal submit throws if register failed. Health: HEALTHY if execute success else DOWN.

RevNet lookup: unknown identifier **falls back to Rahul Sharma** (demo reliability).

### 9.6 Approval / license numbering

On MahaSetu approve: license `MH-PUNE-MUNI-LIC-{10000–99999}` stored as `municipalPermitRef`. MuniSys mock itself issues `MH-PUNE-TRADE-{6 digits}` internally; gateway overwrites citizen-facing number.

Approve uses `application.municipalPermitRef` (permitId like `PRM-******`) against MuniSys; mismatch can throw “not found in MuniSys” if ids diverge—happy path uses permitId returned at dispatch.

### 9.7 Audit chain

Hash payload: `id|actorId|action|entityId|timestamp|prevHash` → SHA-256 hex. Genesis `prevHash` is 64 zeros. Newest logs first.

### 9.8 Events

Types: `APPLICATION_CREATED`, `CONSENT_REQUESTED` (type exists), `CONSENT_GRANTED`, `CONSENT_REVOKED`, `REVENUE_FETCHED`, `DATA_NORMALIZED`, `MUNICIPAL_DISPATCHED`, `OFFICER_REVIEW_STARTED` (type exists), `APPLICATION_APPROVED`, `APPLICATION_REJECTED`.

History capped at 200. SSE sends last 5 on connect, then live `*` emissions.

### 9.9 Notifications (schema)

Prisma `Notification` (title, message, type INFO/SUCCESS/WARNING/ACTION_REQUIRED, read flag). **Runtime citizen alerts** are UI banners driven by SSE, not this table.

### 9.10 Employment / KaushalPortal rules (adapter level)

Schemes:

- `PMEGP_2026` max grant ₹2,50,000; if no trade license  
- `MUDRA_TARUN` max grant ₹5,00,000; if `hasTradeLicense`  

Eligibility payload always `eligible_for_subsidy: true`, `requires_address_clearance: true`. Mobile `9876543210` maps to legal_name Rahul Sharma.

---

## 10. Domain data model (product entities)

### 10.1 Conceptual ER

```
User 1──1 Citizen 1──* Application *──1 Service *──1 Department
                 └──* Consent *──1 Application
Application 1──* ApplicationTimeline
Department 1──* Integration
Department 1──* FieldMapping
AuditLog (append-only chain)
Event (bus history; also Prisma model)
Notification *──1 Citizen
```

### 10.2 Entity dictionary (business meaning)

| Entity | Business meaning |
|---|---|
| User | Login principal and role |
| Citizen | Service recipient; Aadhaar stored as hash |
| Department | Connected government org (code REVENUE / MUNICIPAL / EMPLOYMENT) |
| Service | Catalogue item with SLA, fee, required clearances |
| Application | Cross-department case file in MahaSetu |
| ApplicationTimeline | Human-readable pipeline history |
| Consent | Purpose-bound authorization to share fields from sourceDept to requestedByDept |
| Integration | Connector instance (URL, auth type API_KEY / OAUTH2 / MUTUAL_TLS, latency) |
| FieldMapping | Runtime translation rule |
| AuditLog | Tamper-evident activity |
| Event | Workflow signal |
| Notification | Citizen inbox (modelled) |

### 10.3 Seeded demo master data

Departments: Revenue (`/api/mock/revenue`), Municipal, Employment.  
Integrations: RevNet API_KEY 38ms; MuniSys OAUTH2 42ms; KaushalPortal API_KEY 35ms.  
Citizen: Rahul Sharma, Kothrud, Pune 411038.  
Historical in-memory application: `MH-MUNI-2026-9012` already APPROVED (Sharma Digital Services) so the portal is never empty.

Secondary RevNet citizen: Priya Deshmukh, `9123456780`, Baner.

---

## 11. API surface (functional)

Citizen/officer/admin UIs depend on these contracts. (Technical request/response detail is in Developer Documentation.)

| Area | Methods | Functional role |
|---|---|---|
| Auth | POST login, GET me | Federated identity stand-in |
| Citizens | GET me | Profile |
| Services / Departments | GET | Catalogues |
| Applications | GET list/filter, POST create, GET by id | Case file |
| Verify | POST | Consent-gated interop pipeline |
| Approve / Reject | POST | Officer decision |
| Consents | GET, POST, approve, revoke | DPDP lifecycle |
| Integrations | GET health, POST test ping | Monitoring |
| Mappings | GET, PUT update, POST transform | MDM / sandbox |
| Audit | GET | Compliance |
| Events | GET SSE | Unified live tracking |
| Mock RevNet / MuniSys / Kaushal | GET/POST | Legacy systems of record |

---

## 12. Security, privacy, and compliance (product)

| Requirement | Product treatment |
|---|---|
| Consent-based sharing | Explicit grant; purpose; field list; expiry; revoke |
| Least data | Only listed fields requested in consent copy |
| Identity | Aadhaar as hash; masked Aadhaar on profile `XXXX-XXXX-1234` |
| Audit | Actor, role, action, entity, department, purpose, IP default 127.0.0.1, hash chain |
| Connector auth types | API_KEY, OAUTH2, MUTUAL_TLS (declared on Integration; mocks do not enforce) |
| Transport | Prototype HTTP local; production would be TLS + mTLS between adapters |

---

## 13. UX principles

- **Single window** for the citizen; department systems remain visible as named silos on Overview.  
- **Show the JSON** (demo, admin, revenue tab) so evaluators believe mapping is real.  
- **Status in plain language** plus raw status codes for officers.  
- **India tricolor** accent on navbar; saffron/green tokens in Tailwind.  
- Glass panels, stepper, and SSE banners for “live government mesh” feel.  
- Certificate modal supports print for tangible outcome.

---

## 14. Non-functional requirements

| NFR | Prototype target |
|---|---|
| Interop latency | Adapter health typically tens of milliseconds (in-process mocks) |
| Real-time | SSE push; 15s heartbeat |
| Availability of connectors | HEALTHY / DEGRADED / DOWN (DEGRADED reserved; health returns HEALTHY or DOWN) |
| Audit integrity | prevHash linkage verifiable in tests |
| Scalability | In-memory + single Node process; Kafka/Redis in compose for future |
| Accessibility | Semantic buttons/labels; not a full WCAG audit |
| Browser | Modern EventSource support |

---

## 15. Mapping SIH 26129 “expected solution” to modules

| Expected solution element | Product module / page |
|---|---|
| Interoperability framework / middleware | MahaSetu Core + adapters |
| Federated service delivery | Citizen single window + departmental mocks |
| API-based exchange | `/api/mock/*` + adapters |
| Common data standards | CDM types + mapping engine |
| Master-data management | Services, departments, field mappings, Admin studio |
| Consent-based sharing | Consent manager + citizen banner |
| SSO / federated identity | Auth login/me + DigiLocker-linked profile copy |
| Event-driven notifications | Event bus + Navbar ticker + citizen alerts |
| Unified application tracking | Citizen stepper + officer queue |
| Configurable workflow orchestration | Create → consent → verify → officer |
| Reusable connectors | BaseAdapter subclasses |
| Audit logs | AuditLogger + Admin tab |
| RBAC | User.role + portal separation |
| Data-quality / exceptions | Mapping + adapter errors + 403 consent |
| Monitoring dashboards | Home topology, Admin integrations, ping |

---

## 16. Demo script (product acceptance)

1. Open `/` — explain three silos + CDM bridge.  
2. Open `/demo` — auto-play 10 steps and three JSON columns.  
3. Open `/citizen` — Apply for Trade License (Rahul Enterprises).  
4. Grant DPDP consent — watch pipeline message with `REV-CLR-*`.  
5. Open `/department` — ledger shows clearance; Sanction Trade License.  
6. Return to `/citizen` (or wait for SSE) — Approved + View Trade License.  
7. Open `/admin` — mappings, sandbox transform, ping adapters, show hash chain.  
8. Optional: Revenue tab query `9876543210` vs `9123456780`.  
9. Run `npm run test:interop` / `npx tsx scripts/test-interop.ts` for six automated proofs.

---

## 17. Future product extensions (out of current code, aligned to PS)

- Wire `/api/auth` into real portal switching and API RBAC.  
- Persist applications/consents/audit to Prisma instead of memory.  
- Persist Admin “Add Rule” via `applicationStore.addFieldMapping` / Prisma `FieldMapping`.  
- Orchestrate `ADDRESS_VERIFICATION` and `SKILL_SUBSIDY` with EmploymentAdapter (license as prerequisite).  
- True IdP (Aadhaar/ePramaan), mTLS connectors, Kafka, SLA dashboards with exception queues.  
- Grievance and multi-application beneficiary 360° view for officials.

---

*End of Functional Design & Product Architecture. Companion: `docs/DEVELOPER_DOCUMENTATION.md`.*
