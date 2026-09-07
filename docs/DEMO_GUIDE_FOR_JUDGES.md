# MahaSetu — Judge & Invigilator Demo Guide

**Purpose:** Step-by-step playbook for presenting the MahaSetu MVP live to SIH judges, invigilators, or evaluators.  
**Recommended duration:** 6–8 minutes live demo + 2 minutes Q&A buffer  
**Demo URL:** Your deployed link (Vercel / local) — fill in before presentation day

---

## 1. What judges must see (evaluation checklist)

Before you rehearse, know what scores you. Every demo action below maps to a **SIH interoperability requirement**:

| Judge expectation | What you show live |
|---|---|
| Problem is real | Citizen applies once; no duplicate document upload |
| Legacy systems stay | Revenue / Municipal / Employment adapters — not replacement portals |
| API-based exchange | Consent → verify pipeline → timeline events |
| Common data model | Admin → Schema sandbox OR mention CDM during officer view |
| Consent-based sharing | Consent banner with purpose + field list → Grant |
| Unified tracking | Citizen timeline + SSE live update after officer action |
| Officer workflow | Department queue → cross-dept verification → Sanction |
| Audit & compliance | Admin → Audit trail (hash chain) |
| Production readiness | Real login, PostgreSQL, role-based portals |

**Golden rule:** Tell one complete story (trade license), then show 2–3 power features in 60 seconds each. Do not click randomly.

---

## 2. Pre-demo checklist (24 hours before)

### Environment

- [ ] App deployed and reachable (Vercel URL or `npm run build && npm start` on demo laptop)
- [ ] `GET /api/health` returns `{ "ok": true, "database": "up" }`
- [ ] Neon / PostgreSQL has schema: `npx prisma db push`
- [ ] Seed data loaded: `node prisma/seed.js`
- [ ] `.env` on server has: `DATABASE_URL`, `SESSION_SECRET`, `GEMINI_API_KEY`
- [ ] Test on the **same network** you will use on demo day (college Wi‑Fi / hotspot)

### Browser setup

- [ ] Use **Chrome or Edge** (latest)
- [ ] **Two browser profiles** or one normal + one Incognito window:
  - Profile A = Citizen
  - Profile B = Officer / Admin
- [ ] Clear cookies OR use fresh profiles (avoids wrong navbar state)
- [ ] Zoom / display scaling at 100% so UI is readable on projector
- [ ] Dark mode ON (optional — looks premium on stage; both themes work)
- [ ] Disable notifications / Do Not Disturb on demo laptop

### Accounts (write on a cheat sheet)

| Role | Email | Password |
|---|---|---|
| **Citizen** | Register fresh before demo OR use pre-created account | Your chosen password |
| **Municipal officer** | `municipal.officer@mahasetu.gov.in` | Value of `SEED_PASSWORD` in `.env` (default `ChangeMe#2026`) |
| **Revenue officer** | `revenue.officer@mahasetu.gov.in` | Same `SEED_PASSWORD` |
| **Employment officer** | `employment.officer@mahasetu.gov.in` | Same `SEED_PASSWORD` |
| **Admin** | `admin@mahasetu.gov.in` | Value of `ADMIN_PASSWORD` in `.env` |

**Citizen tip:** Register once before the session with a memorable name (e.g. “Demo Citizen”) and mobile `9876543210`. Registration auto-enrols address in the Revenue connector.

### Backup plan

- [ ] **Screen recording** (2–3 min) of full trade-license flow — if live demo fails, play video
- [ ] Screenshots of: consent banner, officer verification panel, certificate, audit trail
- [ ] Printed **one-page cheat sheet** (this doc’s Section 5 script)

### Rehearse

- [ ] Full run-through **twice** end-to-end under 8 minutes
- [ ] Assign who speaks vs who clicks (Section 8)

---

## 3. Demo opening (30 seconds — before touching the app)

**Speaker 1 says:**

> “Good morning. We built **MahaSetu** — an interoperability gateway for Maharashtra government services. Citizens register once. Departments keep their existing systems. Data moves only after **explicit consent**, through a **common data model**, with a full **audit trail**. We will show a real trade-license application from citizen registration to officer sanction and certificate — in under five minutes.”

**Then open:** Home page `/`

**Point out (5 sec):** “One gateway. Existing systems stay.” — matches problem statement constraint.

---

## 4. Primary demo script — Trade license (5 minutes)

This is your **main story**. Follow steps in order.

### Step 1 — Citizen registration (45 sec)

| Action | Screen | What to say |
|---|---|---|
| Click **Register** | `/register` | “Citizen self-registers — no seeded demo account.” |
| Fill form | Name, email, password, mobile, Maharashtra address | “Address is enrolled in the Revenue master at registration.” |
| Submit | Redirect to `/citizen` | “One profile, reused across departments after consent.” |

**Sample data (use or adapt):**

```
Name:     Priya Sharma
Email:    priya.demo@example.com
Password: Demo@2026
Mobile:   9876543210
Address:  Shop 12, MG Road, Camp, Pune, Maharashtra - 411001
```

---

### Step 2 — Apply for trade license (30 sec)

| Action | Screen | What to say |
|---|---|---|
| Scroll to **Available services** | Citizen portal | “Three live services — we demo the primary path.” |
| Click **Apply** on *Municipal trade & business license* | Apply modal | “Fee ₹1200, SLA 3 days — from seeded catalogue.” |
| Enter business name + trade category | e.g. “Sharma General Store”, Commercial retail | “Business-specific fields only where needed.” |
| Submit | Application created | “Status: Awaiting consent — no data leaves Revenue yet.” |

---

### Step 3 — Consent (60 sec) — **Most important for judges**

| Action | Screen | What to say |
|---|---|---|
| Show **Consent required** banner | Yellow/copper bordered card | “Municipal is requesting specific fields from Revenue — purpose-bound, field-level.” |
| Read **purpose** and **data fields** aloud | e.g. name, address, property_tax_cleared | “This is DPDP-style consent — citizen sees exactly what will be shared.” |
| Click **Grant consent** | Pipeline runs automatically | “Gateway fetches Revenue record, normalizes to CDM, dispatches to Municipal.” |
| Show application status | **Officer review** | “Timeline updated. Revenue clearance ref appears — no re-upload.” |

**Optional 10 sec:** Point to navbar **Live** indicator — “SSE keeps citizen and officer views in sync.”

**If asked about Deny:** “Deny blocks the pipeline with 403 — we can show in Q&A if needed.”

---

### Step 4 — Officer sanction (90 sec)

| Action | Screen | What to say |
|---|---|---|
| Open **Incognito / second profile** | `/login` | “Officers use the same login — role routes them to their console.” |
| Sign in as `municipal.officer@mahasetu.gov.in` | `/department` | “Queue is department-scoped — municipal officer sees only municipal apps.” |
| Select the application | Detail panel | “Applicant name, mobile, application number.” |
| Show **Cross-department verification** | Dark panel | “Revenue clearance ref and municipal permit ref — officer decides on verified federation, not paper copies.” |
| Add remark (optional) | Textarea | “Officer comments stored on the record.” |
| Click **Sanction** | Success message | “Application approved. Reference generated.” |

---

### Step 5 — Citizen approval + certificate (45 sec)

| Action | Screen | What to say |
|---|---|---|
| Switch back to **citizen browser** | `/citizen` | “Live update — no manual refresh needed.” |
| Show status **Approved** | Application card | “Same record citizen and officer see.” |
| Click **View certificate** | Certificate modal | “Print-ready sanction proof.” |
| Click **Print / save** (optional) | Print dialog | “Citizen keeps digital certificate.” |

**Closing line for primary demo:**

> “One application. One consent. Revenue and Municipal exchanged records through adapters. Officer sanctioned on verified data. Fully audited.”

---

## 5. Secondary demos (pick 2–3 — 60 sec each)

Only after the primary flow. Do not skip Step 1–5.

### A. Gateway admin — Audit & connectors (60 sec)

| Login | `admin@mahasetu.gov.in` |
| Go to | `/admin` |

1. **Audit trail** tab — “Every action hash-chained with `prevHash` — tamper-evident.”
2. **Connectors** tab — Ping one connector — “Health and latency stored in DB.”
3. **Schema sandbox** (optional) — Paste sample JSON → Transform — “RevNet payload → Common Data Model.”

---

### B. Skill subsidy — Cross-department prerequisite (45 sec)

Back as citizen (approved trade license required):

1. Apply for **MSME enterprise & skill subsidy**
2. Say: “Employment service checks for an **approved trade license** — enforced at apply and verify.”
3. Grant consent → Employment eligibility pipeline runs

---

### C. Revenue officer — Record lookup (30 sec)

Login: `revenue.officer@mahasetu.gov.in`

1. Scroll to **Revenue record lookup**
2. Search citizen mobile `9876543210`
3. Show legacy JSON schema — “Adapter speaks native RevNet format; gateway maps to CDM.”

---

### D. MahaSetu assistant (20 sec)

1. Click floating chat icon (bottom-right)
2. Ask: **“How does consent work?”** → In-scope answer
3. Ask: **“What is an array?”** → Refuses — “Platform-scoped Gemini assistant only.”

---

## 6. Suggested timeline (8-minute slot)

| Time | Segment | Owner |
|---|---|---|
| 0:00–0:30 | Opening + problem framing | Team lead |
| 0:30–1:15 | Citizen register + apply | Demo operator |
| 1:15–2:15 | Consent grant + pipeline | Demo operator + narrate |
| 2:15–3:45 | Officer login + sanction | Second member |
| 3:45–4:30 | Citizen approval + certificate | Demo operator |
| 4:30–5:30 | Admin audit OR subsidy prerequisite | Technical member |
| 5:30–6:00 | Assistant chatbot | Any member |
| 6:00–8:00 | Q&A | All |

---

## 7. Team roles (4–5 members)

| Role | Responsibility |
|---|---|
| **Narrator / lead** | Problem statement, transitions, Q&A |
| **Demo operator** | Mouse/keyboard — citizen flow |
| **Officer operator** | Second browser — sanction |
| **Technical backup** | Admin tab, health check, fix Wi‑Fi |
| **Timekeeper** | Silent signals at 4 min and 6 min |

**One person drives. Others do not interrupt unless demo breaks.**

---

## 8. Judge Q&A — prepared answers

### “Why not replace all departmental systems?”

> “Cost, risk, and the problem statement itself. Departments keep RevNet, MuniSys, and KaushalPortal. MahaSetu is middleware — adapters, CDM, consent, audit.”

### “How is privacy ensured?”

> “Purpose-bound consent, explicit field list, 30-day expiry, deny/revoke. Verify API returns 403 without GRANTED consent. Aadhaar stored as hash only. Audit chain for every exchange.”

### “Is this real or mock?”

> “Production stack: PostgreSQL, real auth, RBAC, SSE. Department connectors simulate legacy APIs with native schemas — same adapter pattern for live government APIs.”

### “What if citizen denies consent?”

> “Application stays blocked. No cross-department fetch. Officer cannot proceed until citizen grants or a new consent flow is started.”

### “How do you scale to more departments?”

> “Add adapter + field mappings in admin studio + pipeline branch. Seed pattern already supports new connectors.”

### “What happens if database is down?”

> “`/api/health` returns database down. Officers and citizens cannot transact — fail-safe, not silent failure.”

---

## 9. What NOT to do in front of judges

| Avoid | Why |
|---|---|
| Clicking every menu randomly | Looks unprepared |
| Saying “demo data” or “hackathon prototype” | Undermines production narrative |
| Using `/demo` or fake personas | Removed from product — use real register flow |
| Sharing `.env` passwords on slide | Security red flag |
| Long silence while debugging | Have backup video ready |
| Two people controlling one mouse | Chaotic |
| Claiming live Aadhaar / DigiLocker integration | Not implemented — say “roadmap” |
| Apologizing for UI | Confident, short narration |

---

## 10. Technical troubleshooting (demo day)

| Symptom | Fix (under 30 sec) |
|---|---|
| “Sign out” shown but not logged in | Hard refresh; use Incognito |
| Consent grant does not advance status | Check `/api/health`; verify Neon connection |
| Officer queue empty | Wrong officer login; ensure application is `PENDING_OFFICER_REVIEW` |
| Sanction button disabled | Status must be Officer review, not still Awaiting consent |
| SSE not updating | Refresh citizen page once; check officer sanction succeeded |
| Chatbot generic answers | `GEMINI_API_KEY` missing on server |
| Vercel 500 on API | `DATABASE_URL` + `SESSION_SECRET` set in Vercel env |

**Emergency reset (2 min):** Re-register new citizen with new email → apply again → grant consent.

---

## 11. Post-demo handout (optional one-pager for judges)

```
MahaSetu — Government Interoperability Gateway
────────────────────────────────────────────
• Citizens: register → apply → consent → track → certificate
• Officers: department queue → federated verification → sanction
• Admin: mappings, connector health, hash-chained audit
• Stack: Next.js 14, PostgreSQL, Prisma, SSE, Gemini assistant
• Services: Trade license | Address clearance | Skill subsidy
• Demo URL: ___________________________
• Health: /api/health
```

---

## 12. Quick reference — application statuses

| Status | Meaning | What citizen sees |
|---|---|---|
| `CONSENT_PENDING` | Waiting for consent | Awaiting consent |
| `PENDING_OFFICER_REVIEW` | Interop done | Officer review |
| `APPROVED` | Sanctioned | View certificate |
| `REJECTED` | Declined | Rejected |

**Progress steps on citizen card:** Submitted → Consent → Department records → Decision

---

## 13. Rehearsal sign-off

Before going on stage, one team member confirms aloud:

- [ ] Health check green  
- [ ] Citizen account ready (or register path tested)  
- [ ] Officer password works  
- [ ] Admin password works  
- [ ] Backup video plays  
- [ ] Full script under 8 minutes  

---

*Companion docs: `FUNCTIONAL_DESIGN_AND_PRODUCT_ARCHITECTURE.md`, `DEVELOPER_DOCUMENTATION.md`, `README.md`*
