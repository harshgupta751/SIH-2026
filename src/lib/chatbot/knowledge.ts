export type ChatIntent = {
  id: string;
  patterns: RegExp[];
  answer: string;
  links?: { label: string; href: string }[];
};

export const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
  /\b(what is|define|explain|how to code|write code for)\b.{0,40}\b(array|javascript|python|java|react|node|sql|html|css|algorithm|function|variable|loop|class|object)\b/i,
  /\b(programming|coding|leetcode|hackerrank|software engineer interview)\b/i,
  /\b(weather|cricket|football|movie|song|recipe|joke|poem|story|celebrity)\b/i,
  /\b(stock|crypto|bitcoin|forex|ipl)\b/i,
  /\b(homework|assignment|exam|math problem|physics|chemistry)\b/i,
  /\b(chatgpt|openai|gemini|claude)\b/i,
];

export const IN_SCOPE_SIGNALS: RegExp[] = [
  /\bmahasetu\b/i,
  /\b(citizen|officer|admin|gateway)\b/i,
  /\b(register|registration|sign in|sign up|login|logout|password|account)\b/i,
  /\b(application|apply|service|certificate|sanction|reject|approve)\b/i,
  /\b(consent|grant|deny|revoke|data sharing|dpdp)\b/i,
  /\b(revenue|municipal|employment|revnet|munisys|kaushal)\b/i,
  /\b(trade license|business license|address verification|skill subsidy|subsidy)\b/i,
  /\b(interop|adapter|connector|cdm|common data model|mapping|audit)\b/i,
  /\b(portal|timeline|status|officer review|pending)\b/i,
  /\b(aadhaar|mobile|pin code|address)\b/i,
  /\b(sse|live update|notification|event stream)\b/i,
  /\b(seed|staff|department console|field mapping|sandbox)\b/i,
  /\b(this (app|site|website|platform)|how (do|can) i)\b/i,
];

export const CHAT_GREETING_PATTERNS: RegExp[] = [
  /^(hi|hello|hey|namaste|good (morning|afternoon|evening))[\s!.?]*$/i,
  /^help[\s!.?]*$/i,
  /^what can you (do|help with)[\s!.?]*$/i,
];

export const CHAT_KNOWLEDGE: ChatIntent[] = [
  {
    id: 'what-is-mahasetu',
    patterns: [
      /\b(what is|about|purpose of|explain)\b.{0,30}\bmahasetu\b/i,
      /\bmahasetu\b.{0,30}\b(do|work|platform)\b/i,
      /\bwhat does this (app|site|platform) do\b/i,
    ],
    answer:
      'MahaSetu is the Government of Maharashtra interoperability gateway. Citizens register once, apply for services, and grant consent before any department reads their records. Revenue, Municipal, and Employment systems stay in place — the gateway maps data to a common model, runs consent-gated exchange, and keeps an auditable timeline.',
    links: [{ label: 'Home', href: '/' }],
  },
  {
    id: 'register-citizen',
    patterns: [
      /\b(how|where).{0,20}\bregister\b/i,
      /\bcreate (an )?account\b/i,
      /\bnew citizen\b/i,
      /\bcitizen registration\b/i,
    ],
    answer:
      'Citizens self-register at /register with name, email, password (min 8 characters), 10-digit mobile, and full Maharashtra address. Optional Aadhaar is stored as a hash only. Registration also enrols your address in the revenue connector so other departments can request it only after you grant consent. You are signed in automatically and taken to the citizen portal.',
    links: [{ label: 'Register', href: '/register' }],
  },
  {
    id: 'login',
    patterns: [
      /\b(how|where).{0,15}\b(sign in|login|log in)\b/i,
      /\bofficer.{0,20}\b(login|sign in)\b/i,
      /\bstaff account\b/i,
    ],
    answer:
      'Use /login with your email and password. Citizens, municipal officers, revenue officers, employment officers, and gateway administrators all use the same sign-in page. After login you are redirected to your role portal: Citizen → /citizen, Officers → /department, Admin → /admin.',
    links: [{ label: 'Sign in', href: '/login' }],
  },
  {
    id: 'services-list',
    patterns: [
      /\bwhat services\b/i,
      /\bavailable services\b/i,
      /\blist.{0,15}services\b/i,
      /\bwhich (scheme|license|subsidy)\b/i,
    ],
    answer:
      'Three services are live on MahaSetu:\n\n1. Municipal trade & business license (BUSINESS_LICENSE) — SLA 3 days, fee ₹1200. Requires business name and trade category.\n2. Residential land record & address clearance (ADDRESS_VERIFICATION) — SLA 2 days, free.\n3. MSME enterprise & skill subsidy (SKILL_SUBSIDY) — SLA 5 days, free. Requires an approved trade license first.',
    links: [{ label: 'Citizen portal', href: '/citizen' }],
  },
  {
    id: 'apply-flow',
    patterns: [
      /\bhow.{0,20}\bapply\b/i,
      /\bstart application\b/i,
      /\bsubmit.{0,15}application\b/i,
    ],
    answer:
      'Sign in as a citizen → open Citizen services → choose a service → Apply. For a trade license, enter business name and trade category. After submit, the application is CONSENT_PENDING until you grant consent. Grant consent on the banner, which triggers record exchange. Status then moves to Officer review, then Approved or Rejected. Approved applications show View certificate for print/save.',
    links: [{ label: 'Citizen portal', href: '/citizen' }],
  },
  {
    id: 'consent',
    patterns: [
      /\bconsent\b/i,
      /\bgrant.{0,15}permission\b/i,
      /\bdeny.{0,10}consent\b/i,
      /\bdata sharing\b/i,
      /\bwho can (see|access) my data\b/i,
    ],
    answer:
      'Consent is purpose-bound and field-specific (30-day expiry). When you apply, the target department requests specific fields from a source department — for example Municipal requesting Revenue address records for a trade license. You must Grant consent before the interoperability pipeline runs; Deny blocks verification. Consent statuses: PENDING, GRANTED, DENIED, REVOKED. You can deny a pending request from the consent banner on the citizen portal.',
  },
  {
    id: 'application-status',
    patterns: [
      /\b(application )?status\b/i,
      /\btrack.{0,15}application\b/i,
      /\bwhere is my application\b/i,
      /\bawaiting consent\b/i,
      /\bofficer review\b/i,
    ],
    answer:
      'Application statuses on MahaSetu:\n\n• CONSENT_PENDING — waiting for your consent\n• PENDING_OFFICER_REVIEW — records exchanged; officer queue\n• APPROVED — sanctioned; certificate available\n• REJECTED — declined by officer\n\nYour citizen portal shows a four-step progress bar (Submitted → Consent → Department records → Decision) and a full timeline. Live SSE updates refresh the page when an officer acts.',
  },
  {
    id: 'business-license-flow',
    patterns: [
      /\btrade license\b/i,
      /\bbusiness license\b/i,
      /\bmunicipal license\b/i,
      /\bbusiness_license\b/i,
    ],
    answer:
      'Trade license flow: Register → apply for Municipal trade & business license → grant consent (Municipal requests Revenue records) → gateway fetches revenue data, normalizes to CDM, dispatches to Municipal → municipal officer sanctions at /department → you receive approval and can print the certificate. Application numbers use prefix MH-MUNI-YYYY-*.',
  },
  {
    id: 'address-verification',
    patterns: [
      /\baddress verification\b/i,
      /\bland record\b/i,
      /\baddress clearance\b/i,
    ],
    answer:
      'Address verification: apply for ADDRESS_VERIFICATION → grant consent for Revenue to retrieve your land-record extract → interoperability pipeline prepares the extract → revenue officer reviews and sanctions → approved clearance reference appears on your application. Fee: free. SLA: 2 days.',
  },
  {
    id: 'skill-subsidy',
    patterns: [
      /\bskill subsidy\b/i,
      /\bsubsidy\b/i,
      /\bmsme\b/i,
      /\bemployment scheme\b/i,
    ],
    answer:
      'Skill subsidy requires an approved BUSINESS_LICENSE for the same citizen. Apply for SKILL_SUBSIDY → grant consent (Employment requests Municipal trade-license data) → eligibility is checked → employment officer sanctions. If you have no approved trade license yet, the apply action is blocked with an error message.',
  },
  {
    id: 'officer-console',
    patterns: [
      /\bofficer\b/i,
      /\bsanction\b/i,
      /\breject application\b/i,
      /\bdepartment console\b/i,
      /\bqueue\b/i,
    ],
    answer:
      'Officers sign in at /login and open /department. The queue lists applications for their department only (Admin sees all). Select an application to view cross-department verification (revenue clearance, municipal permit refs), add remarks, then Sanction (only when status is PENDING_OFFICER_REVIEW) or Reject. Revenue officers can also look up legacy revenue JSON by citizen mobile.',
    links: [{ label: 'Officer console', href: '/department' }],
  },
  {
    id: 'admin-gateway',
    patterns: [
      /\badmin\b/i,
      /\bgateway admin\b/i,
      /\bfield mapping\b/i,
      /\bschema sandbox\b/i,
      /\bconnector\b/i,
      /\baudit trail\b/i,
    ],
    answer:
      'Gateway administrators use /admin with four tabs: Field mappings (view/add RevNet → CDM → MuniSys rules), Schema sandbox (paste JSON and preview CDM output), Connectors (ping departmental adapters and see latency), and Audit trail (hash-chained log with prevHash). Default admin email is set in seed data (admin@mahasetu.gov.in).',
    links: [{ label: 'Gateway admin', href: '/admin' }],
  },
  {
    id: 'seed-accounts',
    patterns: [
      /\bseed\b/i,
      /\bdefault password\b/i,
      /\bofficer email\b/i,
      /\bmunicipal\.officer\b/i,
      /\badmin@mahasetu\b/i,
    ],
    answer:
      'Staff accounts are created by node prisma/seed.js (not citizens). Defaults:\n\n• Admin — admin@mahasetu.gov.in (password from ADMIN_PASSWORD in .env)\n• Municipal officer — municipal.officer@mahasetu.gov.in\n• Revenue officer — revenue.officer@mahasetu.gov.in\n• Employment officer — employment.officer@mahasetu.gov.in\n\nOfficer passwords use SEED_PASSWORD. Change these immediately in production. Citizens never use seeded accounts — they register at /register.',
  },
  {
    id: 'certificate',
    patterns: [
      /\bcertificate\b/i,
      /\bprint\b/i,
      /\bdownload\b/i,
      /\bview certificate\b/i,
    ],
    answer:
      'When your application status is APPROVED, open the citizen portal and click View certificate on that application. The modal shows holder name, application reference, establishment (if applicable), and revenue clearance. Use Print / save to print or save as PDF from the browser.',
  },
  {
    id: 'security-privacy',
    patterns: [
      /\bsecurity\b/i,
      /\bprivacy\b/i,
      /\baadhaar\b/i,
      /\baudit\b/i,
      /\bpassword\b/i,
      /\bsession\b/i,
    ],
    answer:
      'MahaSetu security: passwords hashed with scrypt; sessions use HTTP-only HMAC-signed cookies (7-day expiry); Aadhaar stored as SHA-256 hash only; every action appended to a tamper-evident audit chain; officers scoped to their department queue; cross-department reads blocked without GRANTED consent (expired consent returns 403). Use TLS in production.',
  },
  {
    id: 'departments-connected',
    patterns: [
      /\bwhich departments\b/i,
      /\bconnected systems\b/i,
      /\brevenue\b/i,
      /\bmunicipal\b/i,
      /\bemployment\b/i,
      /\brevnet\b/i,
    ],
    answer:
      'Three departmental connectors are integrated:\n\n• Revenue & land records (RevNet) — address, cadastral holding, property-tax clearance\n• Municipal corporation (MuniSys) — trade licensing with revenue clearance reference\n• Employment & skills (KaushalPortal) — subsidy eligibility using approved trade license\n\nRevenue and Municipal connector state persists in PostgreSQL; adapters normalize to the Common Data Model.',
  },
  {
    id: 'live-updates',
    patterns: [
      /\blive update\b/i,
      /\bsse\b/i,
      /\breal.?time\b/i,
      /\bnotification\b/i,
      /\bevent stream\b/i,
    ],
    answer:
      'MahaSetu pushes Server-Sent Events on /api/events/stream when you are signed in. The navbar shows Live when connected. Citizens receive only their own events (e.g. APPLICATION_APPROVED). Officer queues refresh on new events. In-app notifications are also stored in PostgreSQL.',
  },
  {
    id: 'setup-deploy',
    patterns: [
      /\bsetup\b/i,
      /\binstall\b/i,
      /\bdeploy\b/i,
      /\bdatabase\b/i,
      /\bprisma\b/i,
      /\bneon\b/i,
      /\bhealth check\b/i,
    ],
    answer:
      'Setup: copy .env.example → set DATABASE_URL and SESSION_SECRET → npm install → npx prisma generate → npx prisma db push → node prisma/seed.js → npm run dev (or npm run build && npm start). Health: GET /api/health returns { ok: true, database: "up" } when PostgreSQL is reachable. Save .env to disk before running Prisma.',
  },
  {
    id: 'theme',
    patterns: [
      /\bdark mode\b/i,
      /\blight mode\b/i,
      /\btheme\b/i,
    ],
    answer:
      'Use the sun/moon control in the top navigation bar to switch light and dark themes. Your choice is saved in localStorage (mahasetu-theme) and follows your system preference on first visit.',
  },
  {
    id: 'forgot-password',
    patterns: [
      /\bforgot password\b/i,
      /\breset password\b/i,
      /\brecover account\b/i,
    ],
    answer:
      'Self-service password reset is not available in this release. Contact your department IT administrator for officer and admin accounts. Citizens who cannot sign in should register only if they do not already have an account, or contact platform support for account recovery.',
  },
];

export const CHAT_SUGGESTED_PROMPTS = [
  'How do I register as a citizen?',
  'What services can I apply for?',
  'How does consent work?',
  'How do officers approve applications?',
];

export const CHAT_WELCOME =
  'I am the MahaSetu assistant. I answer questions about this platform only — registration, services, consent, applications, officer review, and administration. I cannot help with general programming, homework, or topics outside MahaSetu.';

export const CHAT_OUT_OF_SCOPE =
  'I can only help with MahaSetu — this government interoperability platform. For example: how to register, apply for a service, grant consent, track an application, or use the officer/admin consoles. Please ask something about MahaSetu.';

export const CHAT_NO_MATCH_IN_SCOPE =
  'I could not find a specific answer for that MahaSetu question. Try asking about registration, available services, consent, application status, trade licenses, subsidies, officer approval, or gateway administration.';
