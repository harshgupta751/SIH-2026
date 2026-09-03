# MahaSetu (महासेतु) — SIH26129
### Government Digital Platform Interoperability & Unified Service Delivery System

> **Smart India Hackathon (SIH 2026) • Problem Statement ID: SIH26129**  
> *"We do not build redundant government websites. We build the interoperability middleware that allows heterogeneous, legacy departmental digital systems to communicate seamlessly through standardized APIs, dynamic schema normalization, DPDP-compliant consent authorization, and reactive cross-department workflows."*

---

## 🎯 Executive Summary & Pitch
Different government departments operate in deep silos with disparate databases, non-standard APIs, incompatible JSON schemas, and conflicting workflows. A citizen applying for a business license must repeatedly submit the same address proofs, title deeds, and tax clearance certificates across multiple portals.

**MahaSetu** is an enterprise-grade government interoperability middleware platform. Rather than rebuilding existing departmental systems, MahaSetu introduces:
1. **Adapter Layer**: Communicates with heterogeneous departmental backends without altering their internal code.
2. **Dynamic Data Mapping Engine**: Normalizes legacy, idiosyncratic payloads into a unified **Common Data Model (CDM)**.
3. **DPDP Act Consent Engine**: Guarantees purpose-bound, granular, and revocable citizen data authorization.
4. **Tamper-Evident Audit Ledger**: Non-repudiation logging with SHA-256 cryptographic hash chaining.
5. **Reactive Event Bus (SSE)**: Kafka-compliant distributed event distribution with real-time push synchronization across portals.

---

## 🏛️ The 3 Simulated Department Systems (Mocks)

| System | Department | Role & Responsibility | Idiosyncratic Schema Format |
|---|---|---|---|
| **RevNet** | Revenue & Land Records | Property verification, cadastral land parcels, property tax status | `citizen.fullName`, `address_record.city_name`, `property_tax_cleared` |
| **MuniSys** | Municipal Corporation | Trade licensing, zoning compliance, official inspections | `applicant_name`, `premises_address`, `revenue_clearance_ref` |
| **KaushalPortal** | Employment & Skill Dept | Vocational training, PMEGP startup subsidies, youth schemes | `candidate_profile.legal_name`, `scheme_eligibility.max_grant_inr` |

---

## 🔄 Core Innovation: Dynamic Schema Transformation

```
  [RevNet (Revenue Dept)] ──► Idiosyncratic JSON: { citizen: { fullName, mobile }, address_record: { city_name, pin, property_tax_cleared } }
            │
            ▼
  [Revenue Adapter]
            │
            ▼
  [Dynamic Mapping Engine] ──► Normalizes using runtime JSONPath rules
            │
            ▼
  [Common Data Model (CDM)] ──► Standard Model: { citizenId, name, mobile, address: { city, postalCode }, clearances }
            │
            ▼
  [Municipal Adapter] ──► Formats payload for Municipal requirements
            │
            ▼
  [MuniSys (Municipal Dept)] ──► Target JSON: { applicant_name, premises_address, revenue_clearance_ref }
```

---

## 🚀 The 10-Step Killer Demo Flow

1. **Rahul Sharma Logs In**: Accesses MahaSetu as a verified citizen (`CIT-3210`, Pune).
2. **Applies for Trade License**: Selects *Municipal Trade & Business License* for `Rahul Enterprises`.
3. **Dependency Discovery**: MahaSetu automatically detects requirement: Business license requires address and tax clearance from the Revenue Department.
4. **DPDP Consent Prompt**: Rahul reviews requested fields and clicks **[Grant Consent]**. Cryptographic consent record logged.
5. **RevNet API Query**: MahaSetu invokes `RevenueAdapter`, querying RevNet for Rahul's property records.
6. **Data Normalization (CDM)**: The mapping engine transforms RevNet's nested format into the standardized `CommonCitizenRecord`.
7. **MuniSys Dispatch**: `MunicipalAdapter` injects the normalized application into MuniSys with `REV-CLR-XXXXXX`.
8. **Officer Review Studio**: Municipal Officer logs into `/department`, sees pre-cleared Revenue clearance on the MahaSetu ledger, avoiding manual document requests.
9. **Officer Sanctions License**: Officer clicks **[Sanction Trade License]**. Event `APPLICATION_APPROVED` emitted to reactive bus.
10. **Real-Time Citizen Sync**: Rahul's dashboard instantly updates via Server-Sent Events (SSE) to **Approved ✅**, and the official Municipal Trade License Certificate is downloadable!

---

## 💻 Tech Stack & Architecture

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend & Middleware**: Next.js API Route Handlers, Custom Middleware, Dynamic JSONPath Transformation Engine.
- **Database & Persistence**: Prisma ORM with live cloud **PostgreSQL (Neon)** + SQLite support.
- **Event Bus**: In-process Reactive Event Stream adhering to Kafka event semantics with **Server-Sent Events (SSE)**.
- **Security & Compliance**: DPDP Act 2023 Consent Manager, SHA-256 Hash Chained Audit Log.

---

## 🏃 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database schema
npx prisma db push

# 3. Seed demo departments, services & mappings
node prisma/seed.js

# 4. Run automated interop test suite
npx tsx scripts/test-interop.ts

# 5. Start dev server
npm run dev
# Or production server
npm run build && npm start
```

Open your browser at `http://localhost:3000`:
- **Overview & Topology**: `http://localhost:3000`
- **Killer Demo Showcase**: `http://localhost:3000/demo`
- **Citizen Portal**: `http://localhost:3000/citizen`
- **Department Officer Console**: `http://localhost:3000/department`
- **Interop Admin Studio**: `http://localhost:3000/admin`
