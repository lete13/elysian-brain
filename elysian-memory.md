# Elysian — Master Memory Document

**v1.5 · 10 Aug 2026 · maintained by Lefteris + Claude**

Purpose: the single source of truth about Elysian for any Claude session. Keep this in the Claude project (suggested path `claude/elysian-memory.md`), alongside the feature docs.

> ⚠️ **Do NOT commit this file to `lete13/elysian-clearing`** — that repo is **public** and this document contains business financials and operational detail. Project files only.
>
> The 33-question intake (26–27 Jul 2026) is fully answered and folded in below. Standing confidentiality rule: **the company ΑΦΜ never appears in any document**; everything else (owner names, fees, revenue) is fine within this private project.

---

## 1. Business snapshot

- **Elysian** — short-term rental property management, run by **Lefteris**. Single legal entity: an **ΙΚΕ**, covering all locations including Thessaloniki (ΑΦΜ deliberately excluded from docs).
- **Team**: Lefteris (owner/manager — reviews proofs, pushes code, makes money decisions) · **Popi** (accounting — monthly checklist, Payments Check) · **George & John** (operations — Daily Ops / Checkout Tracker side).
- **External accountant**: **E-New Generation** — files the monthly VAT return (fully out of Elysian's checklist scope) and receives Elysian's platform invoices monthly (§6).
- **Portfolio: 57 apartments** — 27 leased 🏢 · 16 B2B 🤝 · 14 private 🏠 (live pull, 27 Jul 2026). Clusters: Athens metro (incl. Piraeus, Cholargos, Zografou, Nea Smyrni, Tavros, Psychiko), **Thessaloniki operation: 8 units** (launched Apr 2026 with 5) — Cornerstone, Hightower, Le Alex, Le Floor, Le Grace, Le Plaza, The Skarlatos residence, plus **ARITI 7 in Halkidiki (a sub-area of the Thessaloniki operation)**. Remaining regional units (Kefalonia, Lesbos, Corinthia, Lavrio, Porto Rafti) are **individual units under the normal model** — no separate segment.
- **Channels**: Airbnb, Booking.com, and **direct** (including Elysian's own direct websites). No other OTAs — Payments Check's Airbnb+BDC scope is complete. Watch-item: if a direct site ever takes *online* payments, those credits fall outside the Payments Check model.
- **Channel manager / PMS: Hosthub** — syncs ~every 2 hours; ↻ Refresh in Payments Check forces one. Server also has a daily `AUTO_SYNC_HOUR` cron.
- **Bank: Viva** business account — all Booking.com and Airbnb payouts in; **owner remittances out as one manual transfer per owner** after their report.
- **The app**: *Elysian Clearing Automation* — custom operational backbone (§3).

### Revenue trajectory (checkout-month attributed, workbook as of 18 Jul 2026)

| Month | Checkouts | Gross € | Owner payout € | Elysian slice € | Active apts |
|---|---|---|---|---|---|
| May 2025 | 133 | 20,522 | 16,821 | 3,701 | 12 |
| Aug 2025 | 257 | 32,495 | 27,489 | 5,005 | 16 |
| Dec 2025 | 346 | 45,007 | 38,416 | 6,590 | 30 |
| Mar 2026 | 372 | 55,440 | 46,949 | 8,491 | 37 |
| Apr 2026 | 391 | 68,627 | 58,620 | 10,006 | 42 |
| May 2026 | 530 | 114,801 | 97,133 | 17,668 | 49 |
| Jun 2026 | 555 | 111,456 | 93,957 | 17,499 | 56 |

Lifetime (May 2025 – Jun 2026): 4,370 checkouts · €696,210 gross · €589,900 to owners · €106,310 gross-less-payout (≈15–16% of gross).

---

## 2. Financial model

### ⭐ The Configuration principle (governs everything below)

**Every rate is per-apartment data in the Configuration tab, never a constant.** Management fee %, cleaning fee, all VAT/tax behaviour, business tax, fixed charges, report language — all live in `S.apts` and vary by property/profile. **Never hard-code a rate; read it live.** Schema (from the live app, 27 Jul 2026; multi-email + Oxygen contact link added Aug 2026):

`id · name · aliases · city · lat/lng · profile · isLeased · b2b · b2bPartner · b2bRemitRate · mgmtFee · cleaningFee · fixedCharges[] · businessTax · chargeVat · deductVAT · vatLiable · vatOnFees · municipalityTax · deductCT · deductCleaning · language · ownerName · ownerSurname · ownerEmail (up to three addresses — report emails go to all of them, PR #12, 8 Aug 2026) · postReportReminders[] · oxyContactId · oxyContactName (Oxygen fiscal-contact link, 5 Aug 2026)`

### Property profiles

| Profile | Count | Meaning | Accommodation VAT + municipality tax |
|---|---|---|---|
| **Leased 🏢** | 27 | Elysian leases the unit | Elysian deducts **and remits** |
| **Private 🏠** | 14 | Owner's unit, Elysian manages | **Owner** handles taxes independently |
| **B2B 🤝** | 16 | Managed for a B2B partner | Elysian deducts and remits **to the B2B partner** |

Unprofiled apartments are flagged in Monthly Close and break its scoping (none currently).

### Revenue streams
- **Management fees** — per-apartment `mgmtFee`, charged by the tool per Configuration.
- **Cleaning fees** — **Elysian revenue, kept in full** (per-apartment `cleaningFee`; tracked in `S.revenue.cleaning`).

### Taxes & levies
- **VAT / municipality tax behaviour** — profile-driven via the Configuration flags above; the tool computes it. VAT returns themselves: monthly, by E-New Generation, out of scope.
- **TAKK** — **Elysian issues it and pays it** for private apartments, due by the **20th**. Presumed = ΤΑΚΚ, Τέλος Ανθεκτικότητας στην Κλιματική Κρίση (climate-crisis resilience fee) — working assumption, unobjected. Supporting (not confirming) evidence: the Monthly Close ΤΑΚΚ step counts **nights booked, not checkouts** (`bc72c237`, 7 Aug) — consistent with a per-night resilience fee. Still awaiting explicit confirmation from Popi / E-New Generation.
- **Business tax (τέλος επιτηδεύματος)** — a **leased-profile** fixed monthly charge (`businessTax` flag; reduces the mgmt-fee base once per month). Live evidence: all 20 flagged units are leased; the only leased units *without* it are **Votsala 2–8** — exactly what invariant **P4 (leased ⇒ businessTax)** reports. **Exemption rule: units at the same exact registered address may qualify** → the Votsala decision is a verification task for the accountant: same address confirmed → exempt → relax P4; otherwise → enable the flag.
- **Παρακράτηση (contractor withholding, ~3%)** — applies to **contractor/technician invoices**. Reframed 27 Jul 2026: the VAT is unchanged; only the *payment* splits in two (part paid by the vendor, part by Elysian) — **the recorded invoice total remains the full chargeable amount**. Desired behaviour: **auto-tag these invoices as παρακράτηση and charge the total** (replaces the old "flag, don't auto-correct" convention → approved app change, pending build, §8).

### Fixed monthly charges (months-aware, fixed 20 Jul 2026)
Catalogue: **Software**, **Business Tax**, and **utilities — electricity / internet / water — depending on profile**; amounts per apartment in `fixedCharges`. Each bills **once per calendar month the report period touches** (custom 15 Jun–15 Jul range → ×2, multiplier shown on the line). The ▲▼ stepper on single-property reports overrides the month count (`moOverride` per property+period, "reset" → automatic). Business tax reduces the mgmt-fee base once per month. "Add fixed charge" works on apartments created before the field existed (PR #14, 9 Aug 2026).

### Balances, credits, direct bookings, payouts
- **Previous Balance** can be negative = credit owed to the owner. Display patch (credit label, PDF double-negative, subtotal fix) is built but **not yet pushed** — until then negatives are hidden on screen while still in payout math. (Possibly absorbed by the 7 Aug consolidation — verify, §8 ①.)
- **Direct bookings** — zero-value entries are usually the **owner's own guests**; when charged, payment is usually **cash at check-in** (hence rightly excluded from Payments Check). Planned footnote row will say exactly that.
- **Owner remittances** — **one manual transfer per owner, from Viva**, after the report goes out. The cleared remittance is now visible per property per month in the Annual Tracker (PR #13, 9 Aug 2026).

---

## 3. The Elysian Clearing app

- **Repo**: `lete13/elysian-clearing` (GitHub, **public** — mind what gets committed). **Deploy**: push → Railway auto-redeploys (~60 s) → `elysian-clearing-production.up.railway.app`.
- **Stack**: `index.html` frontend (747 KB as of 5 Aug 2026; **re-consolidated 7 Aug** — verify the current base via `/api/fe-info` before authoring fe patches) + `server.js` (~105 KB, Node/Express; **consolidated 6 Aug**; boot-patched by **`srv-boot.js`**, §7) + PostgreSQL. Clients poll shared state (`app_data` key `main`) every **60 s**. **Password auth**: `APP_PASSWORD` env + `/api/session`.

### Tab map (from code, 27 Jul 2026 · Monthly Close added Aug 2026)

**Top bar (10):** Dashboard (`dash`) · Bookings (`bk`) · Expenses (`exp`) · Configuration (`cfg`) · Reports (`rpt`) · Annual Tracker (`ann`) · 📋 **Monthly Close** (`mt`) *(replaces Monthly Tasks, Aug 2026)* · 💰 Elysian Revenue (`rev`) · 🗓 Daily Ops (`ops`) · 📊 Performance (`perf`)
**🧰 Tools dropdown (4):** Checkout Tracker (`co`) · Hosthub API (`hhapi`) · Imports incl. Run Tests (`imports`) · 💳 Payments Check (`pay`)

Key behaviours: Reports has **report locking** (`rptLocks`) with the intentional **amber drift banner** when locked figures later change; report delivery: **📧 Email report to owner** (v12, 4–5 Aug 2026) — real PDF attachment, bilingual compose modal with embedded page-1 preview, sent via `/api/email/send`; sent-record in `S.rptLocks[key].email`; manual PDF download still available (see `claude/email-report-feature.md`). Report language per apartment (`language`).

**Monthly Close** (Aug 2026 — replaces Monthly Tasks; doc: `claude/monthly-close-and-oxygen.md`): per-apartment close pipeline with Focus / Batch-by-stage / List views, a progress meter and a stage funnel. Flows by profile: **private** Report → ΤΑΚΚ → Pay → Payment → Email → Receipt · **b2b** Report → Payment → Email → Invoice · **leased** Report → Payment → Email (mechanics in §6). Apartments in a **clearing group** clear as one unit (`9ce7d3de`, 7 Aug). Send safeguards: **20 MB attachment-size guard** — oversize attachments are dropped with a warning rather than losing the whole email (PR #10); proofs lookup searches **every month the report period touches** (PR #9); the Email close-stage only credits sends made **after** that close's confirmation (PR #15); the send reopens the **confirmed** report, not a reset one (`67def7b4`). A comments box on the close card prints on the PDF and email as a **Notes** section (PRs #16/#17). **Annual Tracker** shows the cleared owner remittance per month per property, written by the Email close-stage exactly once (PR #13). **Imports**: myDATA Excel expense import — single-line splits, credit notes, template support (PR #2, 1 Aug 2026).

### Server API surface (from code)
`GET/POST /api/db/data` (shared-state pipeline) · `GET /api/db/status` · `POST /api/sync`, `/api/sync-cancelled` · `GET /api/discover`, `/api/history`, `/api/auto-sync-status`, `/api/server-config` · `GET/POST /api/session` (auth) · proofs: `POST/GET/DELETE /api/proofs`, `GET /api/proofs/:id` (table `proof_files`, auto-created) · Viva: `GET /api/viva/status`, `GET /api/viva/probe`, `POST /api/viva/check-now` (90 s cap) · email: `GET /api/email/status`, `POST /api/email/send`, `GET /api/email/probe` (diagnostics) · fe: `GET /api/fe-info` (auth-exempt release check) · Oxygen (**live in production**, 5–7 Aug): `POST /api/oxygen/issue` (+ `/issue-preview` dry-run) · `GET /api/oxygen/documents` (exactly-once ledger) · `/status` · `/lookups` (full contact pagination) · `/invoice-pdf/:id` · temporary read-only `/invoice-raw/:id` probe (remove once the PDF mechanism is settled) · `GET /health` · debug: `POST /api/debug-cancelled`, `/api/debug-checkin`. **Server-side anti-wipe** protects `monthlyTasks` and `payChk`.

### Oxygen invoicing (live in production, 5–7 Aug 2026)
Engine: PR #7 (merged 5 Aug) + FE Send-hook & fiscal-contact combobox (5–6 Aug); first real close run 7 Aug. Document by profile: **private → ΑΠΥ receipt (`rs`, myDATA 11.2) · b2b → ΤΠΥ invoice (`s`, myDATA 2.1) · leased → no document** (rental income; the lease is the paperwork). Payment method **Επί Πιστώσει (on credit, myDATA 5)**, resolved by code first so it survives an id change (`OXYGEN_PM_ID` overrides); documents are marked paid. The **myDATA MARK** is polled until Oxygen assigns it rather than storing null. Guards: invoice total must equal the report total; exactly-once per apartment+period via the self-healing `oxygen_documents` Postgres ledger; production refuses without `confirmLive:true`; a missing contact is an error, never a guess. Invoice lines: management fee, cleaning, software, Διάφορα Έξοδα / Various Expenses — all net figures at 24% (**`totExp`, never `totExpIncl`** — VAT applies once and the invoice VAT reproduces the report's). Contacts: the account holds ~3,080, of which ~322 have an ΑΦΜ (the real owners; Booking.com guest contacts have none) — `/lookups` paginates fully (a one-page read used to silently cap at 500 and hide newer owners, fixed `20c208ef`); the per-apartment link is stored as `apt.oxyContactId` via the searchable name/ΑΦΜ combobox. Full detail: `claude/monthly-close-and-oxygen.md` + `claude/oxygen-integration-spec.md`.

### Railway env (names from code)
`APP_PASSWORD` · `AUTO_SYNC_HOUR` · `HOSTHUB_API_KEY` · `DATABASE_URL` / `DATABASE_PRIVATE_URL` / `POSTGRES_URL` / `POSTGRES_PRIVATE_URL` / `PG*` family · `PORT` · `VIVA_TX_USER` · `VIVA_TX_PASS` · `VIVA_ENV` · `VIVA_BASE_URL` · `VIVA_ACCOUNTS_URL` · email: `SMTP_HOST` / `SMTP_PORT` (default 587) / `SMTP_SECURE` (`true` for :465) / `SMTP_USER` / `SMTP_PASS` + `EMAIL_FROM` / `EMAIL_REPLY_TO` / `EMAIL_BCC` (⚠ SMTP requires the **Pro plan** — see "Railway Pro & outbound SMTP" below) · Oxygen: `OXYGEN_API_KEY` / `OXYGEN_API_BASE` (defaults to sandbox in code; engine live in production since 6–7 Aug, production issuance gated by `confirmLive:true`) / `OXYGEN_PM_ID` (payment-method override) · v11: `USERS_JSON`. **Postgres backup status: unverified** (Railway navigation was declined in-browser) — open loop: check Railway → Postgres service → Backups; if absent, enable or schedule `pg_dump`.

**Railway Pro & outbound SMTP (resolved 5 Aug 2026).** First report-emails failed with *Connection timeout* despite correct SMTP variables. Diagnosed with `GET /api/email/probe` (srv-boot patch, PR #3): TCP probes of ports **25 / 465 / 587 / 2525** from inside Railway's own network plus `transporter.verify()` — every host was rejected, **even smtp.gmail.com in 255 ms**, proving the block was Railway's, not the mail server's. Verdict: **Railway firewalls ALL outbound SMTP on Free/Trial/Hobby plans; only Pro allows it** (Railway's docs steer users toward HTTPS email APIs instead). **Fix: Pro upgrade (5 Aug 2026) + exactly one redeploy** — plan-level network rules attach only to deployments created *after* the plan change, so a post-upgrade timeout means "redeploy once", never "rewrite the config". Live config: `mail.elysianproperties.eu:465` SSL (`SMTP_SECURE=true`); the mailbox lives on `atlas.cityconsulting.gr` (City Consulting shared cPanel), MX = the domain itself (IP 31.22.112.34). Standing consequences: **downgrading below Pro silently re-blocks email**, and any future Railway service that must send mail needs Pro too. Dormant fallback if SMTP ever breaks again: **PR #4 — Resend HTTPS transport** (api.resend.com; full feature parity incl. attachments + inline `cid:` images), intentionally left unmerged — setting `RESEND_API_KEY` switches transport with zero frontend changes. Full narrative: `claude/email-report-feature.md` (5 Aug addendum).

### Global `S` object (primary data interface in the browser)
`S.apts` · `S.bks` · `S.revenue.mgmt` / `S.revenue.cleaning` · `S.payChk` (+ `payChk.bank.lastResult`) · `monthlyTasks` / `monthlyTaskDefs` · `rptLocks`.

---

## 4. Data model & conventions — hard rules

1. **Months are 0-indexed** — booking `mo`/`yr` come from `new Date(checkOut).getMonth()`, attributing revenue to the **checkout month**.
2. **Revenue tracker keys**: `aptId::year::month` — month **1-indexed in the key**, **0-indexed `mo`** in the value object.
3. **Occupancy** uses true calendar overlap — `getOverlapNights()` — never checkout-date filtering.
4. **Expenses**: use `e.net` and `geaVat()`. **Never recompute 24% on an already-VAT-inclusive total** (the historical double-VAT bug). Contractor/technician invoices with `net+VAT ≠ total` (~3%) are **παρακράτηση — the total is still the chargeable amount** (see §2; auto-tag change pending).
5. **`parseFloat(amount) > 0` filters are a trap** — they hide negatives from display while calculations still include them.
6. **Booking ids regenerate on every Hosthub sync** — anything sync-surviving keys on **natural keys** (Payments Check: `bdc|<thursday>|<property>`, `abb|<property>|<check-in>|<guest>`).
7. **Never mutate `S.apts`** — sort local copies with `localeCompare('el', {numeric:true})`.
8. **Revenue attribution** is checkout-month (spikes on straddling stays); calendar-overlap alternative designed, not implemented (horizon).
9. **Report-lock keys and `toISOString`**: UTC conversion shifts an Athens 1st-of-month back a day — match months by the **midpoint of the range** and store dates as local `YYYY-MM-DD`. (Build-week trap, 5–9 Aug 2026.)
10. **`saveToDb` whitelists keys** — any new store on `S` must be added to **both** the save payload and the load side or it silently never persists.
11. **Completing a stage ≠ toggling it** — primary buttons must never reopen an already-satisfied stage; and re-uploading a proof *adds* a second file (every proof on a line is emailed) — remove the superseded one first.

### Data-safety matrix — removing a property from Hosthub

| Data | What happens |
|---|---|
| Revenue snapshots | **Survive** sync, carried forward untouched |
| Bookings | **Wholesale-replaced within ~2 h** — anti-wipe will NOT catch one property vanishing |
| Apartment config | Never deleted by sync |
| Deleting the apartment inside the app | **Orphans** its revenue data (stored but invisible) |

---

## 5. Payments — what should land in Viva

### Booking.com
- `payout(Thursday T) = Σ reservations with checkout ∈ [T−7, T−1]` — every checkout pays on the **first Thursday strictly after it** (Wed → next-day Thu; Thu → +7). **One credit per property per Thursday.**
- Expected = **gross − commission − payment charges** (Hosthub "Total Payout") **− `trChan`**. Validated: Birdhouse, Thu 23 Jul 2026.
- **1-cent quirk**: Hosthub rounds the 1.6% payment charge down, BDC to nearest → ~1 cent high per reservation; harmless, absorbed by ±€1.
- **Guest-pays-at-property** reservations carry no per-booking fees — BDC invoices that commission **monthly** (the Joël Ollivier / Art House pattern, pending Hosthub verification). Fee-integrity flags mark batches with missing fees.

### Airbnb
- Released **~24 h after check-in**, **one credit per reservation**, bank in ~1–3 business days. Expected = gross − host service fee.

### Mechanics
- Excluded: direct (incl. Elysian's own websites — cash/owner-guest money never hits Viva), cancellations, owner blocks. Lifecycle: Upcoming → Expected → Received ✓ / ⚠ Overdue (grace BDC 3 d / ABB 5 d; tolerance ±€1; check-from 1 Jan 2026). Drift detection re-flags ticked lines a later sync changed. **Chase protocol (confirmed)**: once grace expires — fee-integrity check first, then chase the channel citing property, window, count, amount, days overdue.

### Viva bank bridge — **blocked on Viva, code done (build v6)**
Auto-reconciliation Saturday 08:00 Europe/Athens + "✓ Check now". Blocked on OAuth scope **`urn:viva:payments:biservices:datafileapi`** — pending: Lefteris asks the Viva account manager to enable it for the existing Account Transactions Credentials; **no code change needed after**. Manual tick mode until then; parked fallback: statement CSV/XLSX upload. Details: accountant skill → `references/viva-api-notes.md`.

---

## 6. Monthly accounting cycle (deadlines confirmed 27 Jul 2026)

| Wave | Deadline | Task | Scope | Recipient |
|---|---|---|---|---|
| 1 | **10th** | Monthly Clearing Report | All apartments | Owner/partner per apartment (PDF, emailed from the app) |
| 2 | **20th** | TAKK Issuance + TAKK Payment | Private | Elysian issues **and** pays |
| 2 | **20th** | Elysian's platform invoices (Airbnb + BDC) | **Leased** (Elysian is host) | **E-New Generation** |
| 3 | **25th** | Platform invoices for B2B units | **B2B** | **The B2B partners** (their cross-European declarations) |
| — | monthly | VAT return | — | Filed by E-New Generation — **out of scope, never tracked** |

Private owners receive **no** platform invoices. The **B2B (25th)** leg is modelled in Monthly Close (the b2b flow ends in an Invoice stage; Email issues the ΤΠΥ); whether the **leased platform-invoices → E-New Generation (20th)** leg is modelled in the pipeline is an open question — see §8 ④.

Monthly Close mechanics (replaced the proof-checklist Monthly Tasks, Aug 2026): most stages derive from evidence the app already holds (report locks, the Oxygen stamp, the send timestamp) and close as the work is done. **Report must be explicitly confirmed on the Reports tab ("Report checked →")** — the confirmation freezes payout, B2B remittance, tax split, the period used, and who confirmed; an apartment cannot reach Payment without it, so the amount paid is always a figure someone signed off on rather than a recomputation that could drift from adjustments (cleaning stay-count, months override, channel pills, custom period). Proof-backed stages (**ΤΑΚΚ issue, ΤΑΚΚ pay, remittance Payment**) require an uploaded file, list attachments with a remove button, and cannot be bulk-cleared. **Payment** shows the amount owed: owner remittance for private and leased, B2B partner remittance including taxes for b2b. **Email is the final action**: it issues the ΑΠΥ/ΤΠΥ at that moment, attaches the invoice PDF plus the ΤΑΚΚ and payment proofs alongside the report, sends to **all owner emails**, then writes cleaning/management fees to Elysian Revenue and the payout to Owner Remittance **exactly once** (per property in the Annual Tracker). Nothing blocks the send; missing pieces produce a warning naming them. **Receipt/Invoice** after Email is confirmation-only — it staying open means the email went out but the document did not issue. A close-card comments box prints on the PDF and email as a Notes section. Apartments in a **clearing group** clear as one unit. The **ΤΑΚΚ step counts nights booked, not checkouts** (maintenance blocks currently count toward those nights — open decision, §8).

---

## 7. Engineering practice & safety rails

- **Change workflow**: Claude edits locally under `/mnt/user-data/outputs/elysian-clearing/`, presents; **Lefteris reviews and pushes** — or, for small server/spec releases, **Claude pushes a side branch via the GitHub connector and opens a PR; Lefteris's merge is the approval** (direct `main` writes stay blocked for the connector). Release mechanics: **frontend** via `fe/patches.json` (sha-gated exact-string patches applied at boot; consolidation = full `index.html` web-upload + reset to `{"patches":[]}` — the base-drift gate makes a missed reset harmless; verify via `/api/fe-info`) · **server** via `srv/patches.json` applied at boot by **`srv-boot.js`** (same sha gates, all-or-nothing; local dry-run: `SRVBOOT_DRYRUN=1 node srv-boot.js` → `server.gen.js`). Shipped this way: email probe (PR #3), Resend transport (PR #4, dormant), Oxygen diagnostics (PR #5), Oxygen engine (PR #7), the Monthly Close series (PRs #8–#17 via the reused side branch `monthly-close-test-gate`). **Consolidations to date**: `server.js` 6 Aug (`072df4c7`) · full `index.html` re-upload 7 Aug with **both patch lists reset** (`654d3a94`, `4549f7ad`). The patch file is the main source of breakage as it grows — consolidate when large; **never write a hash or a patch file from memory** — copy the verified artifact verbatim and compare full digests, not prefixes.
- **Permission model (set 27 Jul 2026)**: read-only by default; **on Lefteris's explicit request for a specific action** ("tick Birdhouse", "mark TAKK done for X") Claude executes it in the live app via the browser. Claude never *initiates* money-moving changes — expense attribution, tax flags, sign corrections, overrides are proposed with € impact and await explicit confirmation.
- **Live-app write protocol** (60 s poll can overwrite saves): **pause poll → fetch fresh snapshot → mutate → save → re-fetch to confirm.**
- **Test suites** (Imports → Run Tests): invariants **P1–P15** (P4 = leased ⇒ businessTax) · months-aware charges **Mm1–Mm4** · Payments Check **Pc1–Pc13** · email pagination **Em1–Em5** · server `node server.js --viva-selftest` / `--viva-fetch-test` / `--oxygen-selftest`. **`npm test` runs the monthly-close patch test harness** (added 8 Aug, `d8d9b510`) — the gate the PR #8–#17 series shipped through. **Golden locked financials — one per profile (deliberate coverage)**: *Elysian Lycabettus – Horizon* 🏢 · *Cozy Corner Zografou* 🤝 · *Acropolis Skyline Sunset* 🏠.
- **Claude-in-Chrome playbook**: `select_browser` needs the full device UUID; JS returns truncate ~900–1,000 chars → compact strings/slices, stash arrays on `window.__aptRows`; `reduce` over `S.bks` (never spread into `Math.min/max`); re-establish tab context after bridge drops. Unattended scheduled runs **cannot** drive the browser → no live `S` without Lefteris's session. Site permissions are per-domain and remembered — a denied prompt (railway.com, docs.oxygen.gr) blocks that domain until re-allowed from the extension.
- **Excel outputs** with formulas: run `/mnt/skills/public/xlsx/scripts/recalc.py` after saving.

---

## 8. Current state — refreshed 10 Aug 2026 (weekly review)

**Built & verified, NOT yet pushed:** ① Previous-Balance display patch (credit label, PDF double-negative, subtotal). ② Revenue-tracker Greek-locale sorting + sequential row numbers. *Both possibly absorbed by the 7 Aug consolidation — verify before re-authoring (EA ledger loop 6).*

**Approved app changes, pending draft & review:** ③ Παρακράτηση handling — auto-tag contractor/technician invoices where `net+VAT ≠ total`, charge the **recorded total** (replaces flag-only) — no movement this week. ④ Invoice-task split (20th E-New Generation / 25th B2B) — **likely superseded by Monthly Close**: the b2b flow ends in an Invoice stage and Email issues the ΤΠΥ, but the **leased → E-New Generation (20th)** leg is not visibly modelled in the pipeline. Confirm whether ④ is done, absorbed, or still needed for the E-New Generation leg.

**Decisions pending (Lefteris):** Art Island Previous Balance −602.69 → **+602.69** · **67 unassigned chargeable expenses** · **Votsala 2–8** same-address exemption verification (→ relax P4 or enable flag) · **Joël Ollivier (Art House)** guest-pays-at-property verification in Hosthub · **Pixie Studio Athens** is profile `leased` but carries the B2B flag → the app computes two different remittance figures; confirm which is actually transferred · **Invoice #145** (Acropolis Skyline Sunset, July) — the first test document, issued as Μετρητά and unpaid before those defaults were corrected; correct or void in Oxygen · **maintenance blocks count toward ΤΑΚΚ nights** — confirm correct (or exclude) before the 20 Aug ΤΑΚΚ wave.

**Data gaps (27 Jul live pull — as of last data, not re-pulled since):** `b2bPartner` empty on **all 16 B2B units** (more urgent now — the b2b close flow computes partner remittance) · `language` unset on 4 units (A modern & Peaceful · Elysian Agon · The Skarlatos residence · Vista Acropolis).

**External / infra:** Viva `biservices:datafileapi` scope (ask account manager — no movement since 27 Jul) · **Railway Postgres backup status unverified** · P & G Apartment (Lesbos) dormant since 14 Jul — verify in Hosthub before any removal (see §4 matrix) · v11 post-deploy checks still open: `USERS_JSON` accounts set on Railway? `APP_PASSWORD` rotated (it remains a full-access master fallback)?

**Tech debt (new, 5–9 Aug build):** `rptChanSel` (channel-pill selection) lives only in memory — lost on page reload, persisted nowhere · remove the temporary `GET /api/oxygen/invoice-raw/:id` probe once the invoice-PDF mechanism is settled.

**Horizon:** calendar-overlap attribution · zero-value direct-booking footnote rows · scheduled remote brief (one-toggle upgrade) · optional server-side daily digest fed by live data.

### 5–9 Aug 2026 — build week (shipped)

- **Monthly Close** replaced the Monthly Tasks tab (§3/§6); first real close run 7 Aug — three bugs found and fixed same day (`c6ff4bfd`). Shipped via PRs #8–#17 (8–9 Aug) on the `monthly-close-test-gate` branch.
- **Oxygen invoicing live in production** (§3): engine PR #7 (5 Aug), FE Send-hook + fiscal-contact combobox (5–6 Aug), contact pagination fix (`20c208ef`, 7 Aug).
- **Consolidations**: `server.js` 6 Aug, full `index.html` 7 Aug, both patch lists reset (§7).
- **Email/report upgrades**: up to three owner emails (PR #12) · 20 MB attachment guard (PR #10) · cross-month proofs lookup (PR #9) · close comments as a Notes section on email + PDF (PRs #16/#17) · Annual Tracker cleared-remittance column (PR #13) · owner name/surname value-attribute escaping fix (`124fbbcc`).
- v11 (4 Aug) and v12 (4–5 Aug email report; SMTP saga → §3 "Railway Pro & outbound SMTP") shipped just before this window — provenance in the v1.3/v1.4 changelog entries.

---

## 9. Property directory (live pull 27 Jul 2026 — profile/language/BT from `S.apts`)

ᵀ = Thessaloniki operation (8) · ★ = golden test property · BT = businessTax flag · Lang — = unset.

| # | Apartment | City | Profile | Lang | BT |
|---|---|---|---|---|---|
| 1 | A modern & Peaceful apartment • Near metro station | Piraeus | 🏠 private | — | |
| 2 | Acropolis Skyline Sunset ★ | Athens | 🏠 private | GR | |
| 3 | ARITI 7 ᵀ | Chaniotis (Halkidiki) | 🤝 b2b | EN | |
| 4 | Art House | Athens | 🏠 private | EN | |
| 5 | Art Island Apartment | Athens | 🏢 leased | EN | BT |
| 6 | Athens Riviera Escape | Argyroupoli | 🏠 private | EN | |
| 7 | Athens Unity Apartment | Cholargos | 🏢 leased | EN | BT |
| 8 | Avenue of Gods: Irakli's Retreat | Athens | 🏠 private | EN | |
| 9 | Birdhouse Apartment | Cholargos | 🏢 leased | EN | BT |
| 10 | City Nexus Family apt, Kolonos | Athens | 🏠 private | EN | |
| 11 | Coloneum | Athens | 🏢 leased | EN | BT |
| 12 | Cozy Acropolis backyard haven | Athens | 🏠 private | EN | |
| 13 | Cozy Corner Zografou ★ | Zografou | 🤝 b2b | EN | |
| 14 | Eclectic Apartment with Stunning Seaview | Porto Rafti | 🏢 leased | EN | BT |
| 15 | Elysian Agon | Cholargos | 🏢 leased | — | BT |
| 16 | Elysian Cornerstone ᵀ | Thessaloniki | 🏢 leased | EN | BT |
| 17 | Elysian Hightower ᵀ | Thessaloniki | 🏢 leased | EN | BT |
| 18 | Elysian Ithaki | Athens | 🏠 private | EN | |
| 19 | Elysian Lycabettus - Horizon ★ | Athens | 🏢 leased | EN | BT |
| 20 | Elysian Lycabettus - Panorama | Athens | 🏢 leased | EN | BT |
| 21 | Elysian Lycabettus Resilience | Athens | 🏢 leased | EN | BT |
| 22 | Elysian Smyrni \| Marble Elegance Retreat | Nea Smyrni | 🏠 private | EN | |
| 23 | Filonexia Apartment Athens | Cholargos | 🏢 leased | EN | BT |
| 24 | Le Alex, Bright & Modern Escape near CityCenter ᵀ | Neapoli | 🤝 b2b | EN | |
| 25 | Le Floor, Urban Escape near Thessaloniki center ᵀ | Neapoli | 🤝 b2b | EN | |
| 26 | Le Grace, Urban Retreat Near CityCenter & Sea ᵀ | Thessaloniki | 🤝 b2b | EN | |
| 27 | Le Plaza, Modern Escape near Thessaloniki Center ᵀ | Thessaloniki | 🤝 b2b | EN | |
| 28 | Navarino Athenian Nest | Athens | 🏢 leased | EN | BT |
| 29 | P & G Apartment ⚠ dormant | Pamfila (Lesbos) | 🏠 private | EN | |
| 30 | Pixie Studio Athens ⚠ dual-flag (§8) | Psychiko | 🏢 leased | EN | BT |
| 31 | Seaside Lavrio Beach House | Lavrio (E. Attica) | 🤝 b2b | EN | |
| 32 | Stylish Downtown Apartment | Athens | 🏢 leased | EN | BT |
| 33 | Sunset Nest in Fiskardo | Fiskardo (Kefalonia) | 🏠 private | EN | |
| 34 | Svorex Apartment 1 | Athens | 🏢 leased | GR | BT |
| 35 | The Athenian Atelier \| Kolonaki Sqr | Athens | 🤝 b2b | EN | |
| 36 | The Athenian Cedar | Athens | 🤝 b2b | EN | |
| 37 | The Athenian Veranda | Athens | 🤝 b2b | EN | |
| 38 | The Athenian Veranda 2 | Athens | 🤝 b2b | EN | |
| 39 | The Athenian Veranda 3 | Athens | 🤝 b2b | EN | |
| 40 | The Athenian Veranda 4 | Athens | 🤝 b2b | EN | |
| 41 | The Athenian Vintage | Athens | 🏢 leased | EN | BT |
| 42 | The Brightline Apartment Athens | Athens | 🏢 leased | EN | BT |
| 43 | The Monograph | Athens | 🤝 b2b | EN | |
| 44 | The Olive & Cedar Apartment | Athens | 🤝 b2b | EN | |
| 45 | The Skarlatos residence ᵀ | Sykies | 🏠 private | — | |
| 46 | The Tauros Metro Residence | Tavros | 🏠 private | EN | |
| 47 | Urban Cedar Apartment | Athens | 🤝 b2b | EN | |
| 48 | Villa Liberty | Isthmia (Corinthia) | 🏠 private | EN | |
| 49 | Vista Acropolis | Athens | 🏢 leased | — | BT |
| 50 | Votsala 1 Luxury Stay with Patio | Piraeus | 🏢 leased | EN | BT |
| 51 | Votsala 2 Luxury Stay with Patio | Piraeus | 🏢 leased | EN | *pending decision* |
| 52 | Votsala 3 Deluxe & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending decision* |
| 53 | Votsala 4 Small & Elegant Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending decision* |
| 54 | Votsala 5 Luxury Studio with Balcony in Piraeus | Piraeus | 🏢 leased | EN | *pending decision* |
| 55 | Votsala 6 Deluxe & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending decision* |
| 56 | Votsala 7 Small & Elegant Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending decision* |
| 57 | Votsala 8 Elegant & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending decision* |

Owner names/emails and per-unit rates live in `S.apts` / Configuration — read live when needed (fine to use; only the ΑΦΜ is excluded from docs).

---

## 10. Operating decisions record (locked 27 Jul 2026)

- **Skills home**: claude.ai profile (cloud) via Save skill; `.skill` packaging. Scheduled remote tasks are the documented "non-stop" upgrade — noting unattended runs can't reach live `S`.
- **Permission model**: read-only default; **act on explicit request** (see §7).
- **Language**: docs/skills/briefs in English; Claude mirrors Greek when addressed in Greek.
- **EA brief**: **on-demand** for now. KPIs when asked: occupancy, ADR, revenue, payout totals — vs prior month and same month last year (no fixed targets yet).
- **EA scope**: Elysian ops **and** personal admin when raised. **Ops coordination (cleaners/maintenance, Daily Ops, Checkout Tracker) is out of the EA's lane** — George & John's territory, touched only on explicit ask.
- **Drafting channels**: all — email plus WhatsApp/Viber-style short messages, register matched to medium.
- **Confidentiality**: ΑΦΜ never in docs; everything else acceptable within this private project.

---

## 11. Related documents

- `claude/monthly-tasks-feature.md` (20 Jul 2026 — historical; tab replaced by Monthly Close, Aug 2026) · `claude/payments-check-feature.md` (24 Jul 2026) · `claude/email-report-feature.md` (4–5 Aug 2026) · `claude/oxygen-integration-spec.md` (5 Aug 2026) · `claude/monthly-close-and-oxygen.md` (7 Aug 2026 — Monthly Close + Oxygen state, traps, open items)
- Skills: **elysian-accountant** (+ `references/viva-api-notes.md`) · **elysian-executive-assistant**
- Brain repo: **`lete13/elysian-brain`** (private) — canonical home of this document, the feature docs, and the skill sources; Claude writes via pull requests

---

## 12. Memory maintenance protocol — the weekly loop (est. 27 Jul 2026)

**Control by construction:** Claude writes to the brain only through pull requests on the private **`lete13/elysian-brain`** repo — nothing lands without Lefteris's merge. The loop:

1. **Trigger** — once a week Lefteris says **"memory review"** (any consistent day; pairs naturally with the weekly review).
2. **Gather** — Claude sweeps the week: conversations and decisions in this project, the repo diff since the last review, portfolio/data worth re-pulling from `S`, ledger movements (loops closed/opened) — and asks one catch-all: *"anything from this week I missed?"*
3. **Propose** — a numbered **Memory Change Proposal**: each item tagged **ADD / UPDATE / REMOVE / ARCHIVE**, with the exact new text, the reason, and the source (decision date, commit, live pull dd mmm). Nothing is applied at this stage.
4. **Approve** — Lefteris accepts/rejects per item (or "all"). Rejected items die or return to the ledger.
5. **Apply** — approved items go into a fresh copy; version bumps (v1.x); the changelog names what changed, why, and its provenance; Claude opens a **pull request on `elysian-brain`** with the changes. When a change touches a skill's rules, the proposal flags it and the skill source is updated in the same PR.
6. **Merge** — Lefteris reviews the PR diff and merges; then refreshes this project's GitHub source so sessions load the new version, and re-saves any updated `.skill` package.

**Rules that keep it controlled:**
- **Single door** — outside this loop the doc is never edited, with one exception: an outright factual error may be corrected immediately, still with a changelog line.
- **Durable vs transient** — §8 Current state and the EA ledger hold transient truth and are refreshed each loop (closed items move into the changelog rather than vanishing); the rest of the doc holds only durable facts.
- **Assumptions register** — marked working assumptions (currently: TAKK = climate-crisis resilience fee) are revisited each loop until confirmed or corrected.
- **Newer confirmed info wins** — conflicts are surfaced in the proposal, never silently overwritten.
- **Anti-bloat** — a section that outgrows quick reference splits into its own `claude/*.md` and is referenced; this doc must stay readable in minutes.

---

## Changelog
- **v1.5 (10 Aug 2026)** — weekly review of 2–9 Aug applied, all 16 items approved ("all", 10 Aug). Durable: Monthly Close replaces Monthly Tasks (§3 tab map + §6 mechanics — confirmation gate, proof-backed stages, Email-as-final-action, clearing groups, ΤΑΚΚ by nights); Oxygen invoicing live in production (§3 block: document rules incl. leased → no document, Επί Πιστώσει/myDATA 5, MARK polling, equality + exactly-once + confirmLive guards, contact stats & pagination fix); consolidations + patch hygiene (§3/§7); hard rules 9–11 (§4: toISOString lock-key shift, saveToDb whitelist, complete≠toggle / proof re-upload); Configuration schema multi-email + oxyContact link (§2); send safeguards, Notes section, Annual Tracker cleared-remittance, myDATA Excel import (§3); npm-test monthly-close harness (§7); new doc referenced (§11). Transient: §8 refreshed — new decisions (Pixie Studio dual-flag, Invoice #145 Μετρητά/unpaid, ΤΑΚΚ maintenance-nights), new tech debt (rptChanSel not persisted, remove invoice-raw probe), ④ marked likely-superseded pending the E-New Generation leg, ① ② flagged possibly-absorbed-by-consolidation. Assumptions: TAKK stays a working assumption with supporting nights-based evidence. EA skill ledger updated in the same PR (rows 12–16; loops 1–10 flagged stagnant at 14 days). Sources: elysian-clearing commits 5–9 Aug (70) + PRs #2, #6–#17; elysian-brain commit `358e032` (`claude/monthly-close-and-oxygen.md`); proposal delivered by the scheduled weekly review, 9 Aug 2026.
- **v1.4 (10 Aug 2026)** — expanded the Railway-Pro / outbound-SMTP record into a dedicated §3 block ("Railway Pro & outbound SMTP"): probe evidence via `/api/email/probe` (ports 25/465/587/2525 all firewalled below Pro; even smtp.gmail.com rejected in 255 ms), Pro-upgrade + redeploy-once rule (network rules attach per-deployment), live mail chain (`mail.elysianproperties.eu:465` SSL → `atlas.cityconsulting.gr`, MX = domain, IP 31.22.112.34), downgrade-re-blocks warning, and the Resend PR #4 dormant-fallback switch (`RESEND_API_KEY`); §3 env line and §8 SMTP bullet now point to it. Requested by Lefteris, 10 Aug weekly-review follow-up. Sources: `claude/email-report-feature.md` (5 Aug addendum); elysian-clearing PRs #3/#4.
- **v1.3 (5 Aug 2026)** — session 4–5 Aug applied (5 items approved "all"): v12 email-report shipped + §3 delivery line updated; Railway-blocks-SMTP-below-Pro fact + email/Oxygen env vars (§3); connector branch→PR write path + fe/srv-boot patch release mechanics + Em tests + per-domain Chrome permissions (§7); "5 Aug additions" block in §8 (v11 status, v12, SMTP resolution, Oxygen kickoff); new docs referenced (§11): `claude/email-report-feature.md`, `claude/oxygen-integration-spec.md`. Source: session 4–5 Aug 2026; elysian-clearing PRs #3/#4/#5.
- **v1.2 (27 Jul 2026)** — canonical home moved to the private `lete13/elysian-brain` repo; §12 write path is now branch → pull request → merge (Lefteris's merge = the approval); project copy refreshed from GitHub after merge. Source: setup session 27 Jul.
- **v1.1 (27 Jul 2026)** — added §12: weekly memory maintenance loop (proposal → per-item approval → versioned apply; single door, durable-vs-transient, assumptions register, anti-bloat). Source: Lefteris's request, 27 Jul.
- **v1.0 (27 Jul 2026)** — questionnaire complete (33/33). Folded in: full money-model answers under the Configuration principle; team & accountant (E-New Generation); three-wave close (10th/20th/25th) incl. B2B-partner invoice flow; παρακράτηση reframe; ΙΚΕ + ΑΦΜ rule; live `S.apts` enrichment (profiles/language/BT for all 57, golden-trio coverage, Votsala P4 evidence, b2bPartner + language gaps); code-derived tab map, endpoints, env vars, sizes, manual report delivery; operating decisions (permission model, cloud skills, on-demand brief, EA scope/lane, KPIs, channels); Railway-backup open loop.
- **v0.2 (27 Jul 2026)** — cadence answers (Q16–Q19).
- **v0.1 (26 Jul 2026)** — initial draft.