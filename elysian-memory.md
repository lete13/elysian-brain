# Elysian — Master Memory Document

**v1.5 · 28 Aug 2026 · maintained by Lefteris + Claude**

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

**Every rate is per-apartment data in the Configuration tab, never a constant.** Management fee %, cleaning fee, all VAT/tax behaviour, business tax, fixed charges, report language — all live in `S.apts` and vary by property/profile. **Never hard-code a rate; read it live.** Schema (from the live app, 27 Jul 2026):

`id · name · aliases · city · lat/lng · profile · isLeased · b2b · b2bPartner · b2bRemitRate · mgmtFee · cleaningFee · fixedCharges[] · businessTax · chargeVat · deductVAT · vatLiable · vatOnFees · municipalityTax · deductCT · deductCleaning · language · ownerName · ownerSurname · ownerEmail · postReportReminders[]`

### Property profiles

| Profile | Count | Meaning | Accommodation VAT + municipality tax |
|---|---|---|---|
| **Leased 🏢** | 27 | Elysian leases the unit | Elysian deducts **and remits** |
| **Private 🏠** | 14 | Owner's unit, Elysian manages | **Owner** handles taxes independently |
| **B2B 🤝** | 16 | Managed for a B2B partner | Elysian deducts and remits **to the B2B partner** |

Unprofiled apartments are flagged in Monthly Tasks and break checklist scoping (none currently).

### Revenue streams
- **Management fees** — per-apartment `mgmtFee`, charged by the tool per Configuration.
- **Cleaning fees** — **Elysian revenue, kept in full** (per-apartment `cleaningFee`; tracked in `S.revenue.cleaning`).

### Taxes & levies
- **VAT / municipality tax behaviour** — profile-driven via the Configuration flags above; the tool computes it. VAT returns themselves: monthly, by E-New Generation, out of scope.
- **TAKK** — **Elysian issues it and pays it** for private apartments (the two monthly task lines), due by the **20th**. Presumed = ΤΑΚΚ, Τέλος Ανθεκτικότητας στην Κλιματική Κρίση (climate-crisis resilience fee) — working assumption, unobjected.
- **Business tax (τέλος επιτηδεύματος)** — a **leased-profile** fixed monthly charge (`businessTax` flag; reduces the mgmt-fee base once per month). Same-address buildings share **one** levy. **Designated carriers (Lefteris, 28 Aug 2026): Votsala 1 and Elysian Lycabettus – Horizon.** Votsala 2–8, Panorama and Resilience are exempt. Run Tests **P4** requires those two flags and does not require the rest of each building. Other leased units still need their own flag. Payout math is unchanged — a unit is only charged if *its* flag is on.
- **Παρακράτηση (contractor withholding, ~3%)** — applies to **contractor/technician invoices**. Reframed 27 Jul 2026: the VAT is unchanged; only the *payment* splits in two (part paid by the vendor, part by Elysian) — **the recorded invoice total remains the full chargeable amount**. Desired behaviour: **auto-tag these invoices as παρακράτηση and charge the total** (replaces the old "flag, don't auto-correct" convention → approved app change, pending build, §8).

### Fixed monthly charges (months-aware, fixed 20 Jul 2026)
Catalogue: **Software**, **Business Tax**, and **utilities — electricity / internet / water — depending on profile**; amounts per apartment in `fixedCharges`. Each bills **once per calendar month the report period touches** (custom 15 Jun–15 Jul range → ×2, multiplier shown on the line). The ▲▼ stepper on single-property reports overrides the month count (`moOverride` per property+period, "reset" → automatic). Business tax reduces the mgmt-fee base once per month.

### Balances, credits, direct bookings, payouts
- **Previous Balance** can be negative = credit owed to the owner. Display patch (credit label, PDF double-negative, subtotal fix) is built but **not yet pushed** — until then negatives are hidden on screen while still in payout math.
- **Direct bookings** — zero-value entries are usually the **owner's own guests**; when charged, payment is usually **cash at check-in** (hence rightly excluded from Payments Check). Planned footnote row will say exactly that.
- **Owner remittances** — **one manual transfer per owner, from Viva**, after the report goes out.

---

## 3. The Elysian Clearing app

- **Repo**: `lete13/elysian-clearing` (GitHub, **public** — mind what gets committed). **Deploy**: push → Railway auto-redeploys (~60 s) → `elysian-clearing-production.up.railway.app`.
- **Stack**: `index.html` frontend (**747 KB** as of 5 Aug 2026) + `server.js` (**~105 KB**, Node/Express; boot-patched by **`srv-boot.js`**, §7) + PostgreSQL. Clients poll shared state (`app_data` key `main`) every **60 s**. **Auth (15 Aug 2026):** cookie login `POST /api/login` (`user` + `pass`). **`USERS_JSON` is set on Railway** (Lefteris login used for the live Airbnb pull). `APP_PASSWORD` + `/api/session` remain the shared-password fallback when `USERS_JSON` is unset. Also: `GET /api/me`, `/api/logout`.

### Tab map (from code, 27 Jul 2026; Accounting/Admin nav 15 Aug 2026)

**Top bar (10):** Dashboard (`dash`) · Bookings (`bk`) · Expenses (`exp`) · Configuration (`cfg`) · Reports (`rpt`) · Annual Tracker (`ann`) · 📋 Monthly Tasks (`mt`) · 💰 Elysian Revenue (`rev`) · 🗓 Daily Ops (`ops`) · 📊 Performance (`perf`)
**🧰 Tools dropdown (4):** Checkout Tracker (`co`) · Hosthub API (`hhapi`) · Imports incl. Run Tests (`imports`) · 💳 Payments Check (`pay`)

**Accounting / Admin (15 Aug 2026):** **Platform Invoices** is a **primary tab** (sidebar icon) — not only a Tools item. **Property Info** is reachable from the Admin sidebar. **Personnel** is Admin-only (operators may open it). Daily Ops Beta UI is the operator-facing `/daily-ops` (Admin).

Key behaviours: Reports has **report locking** (`rptLocks`) with the intentional **amber drift banner** when locked figures later change; report delivery: **📧 Email report to owner** (v12, 4–5 Aug 2026) — real PDF attachment, bilingual compose modal with embedded page-1 preview, sent via `/api/email/send`; sent-record in `S.rptLocks[key].email`; manual PDF download still available (see `claude/email-report-feature.md`). Report language per apartment (`language`).

### Server API surface (from code)
`GET/POST /api/db/data` (shared-state pipeline) · `GET /api/db/status` · `POST /api/sync`, `/api/sync-cancelled` · `GET /api/discover`, `/api/history`, `/api/auto-sync-status`, `/api/server-config` · `GET/POST /api/session` (auth) · `POST /api/login` · `GET /api/me` · `/api/logout` · proofs: `POST/GET/DELETE /api/proofs`, `GET /api/proofs/:id` (table `proof_files`, auto-created) · Viva: `GET /api/viva/status`, `GET /api/viva/probe`, `POST /api/viva/check-now` (90 s cap) · email: `GET /api/email/status`, `POST /api/email/send`, `GET /api/email/probe` (diagnostics) · fe: `GET /api/fe-info` (auth-exempt release check) · Oxygen diag: `GET /api/oxygen/status`, `GET /api/oxygen/test-issue` (**sandbox-only**, PR #5) · Platform Invoices: `/api/platform-invoices`, `/api/platform-invoices/collect`, `/api/platform-invoices/expect`, `POST /api/platform-invoices/pull`, `GET /api/platform-invoices/pull/:id`, `POST /api/platform-invoices/pull-stop`, `GET /api/platform-invoices/:id/file`, `/api/platform-invoices/ship`. Pull jobs live **in memory** on the worker (lost on restart). Same month+channel POST **resumes** a running job. · `GET /health` · debug: `POST /api/debug-cancelled`, `/api/debug-checkin`. **Server-side anti-wipe** protects `monthlyTasks` and `payChk`.

### Railway env (names from code)
`APP_PASSWORD` (fallback) · `USERS_JSON` (**set on Railway**, 15 Aug 2026) · `AUTO_SYNC_HOUR` · `HOSTHUB_API_KEY` · `DATABASE_URL` / `DATABASE_PRIVATE_URL` / `POSTGRES_URL` / `POSTGRES_PRIVATE_URL` / `PG*` family · `PORT` · `VIVA_TX_USER` · `VIVA_TX_PASS` · `VIVA_ENV` · `VIVA_BASE_URL` · `VIVA_ACCOUNTS_URL` · email: `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` + `EMAIL_FROM` / `EMAIL_REPLY_TO` / `EMAIL_BCC` (⚠ **Railway firewalls all outbound SMTP below the Pro plan** — plan upgraded to Pro 5 Aug 2026; new network rules apply only to fresh deploys, so redeploy once after any plan change) · Oxygen: `OXYGEN_API_KEY` (sandbox key set 5 Aug) / `OXYGEN_API_BASE` (defaults to sandbox in code) · Platform Invoices: `AIRBNB_HOST_EMAIL` / `AIRBNB_HOST_PASSWORD` · optional `AIRBNB_STORAGE_STATE_B64` · `PLATFORM_INVOICE_ACCOUNTANT_EMAIL` · `BOOKING_HOST_*` (pull parked). **Postgres backup status: unverified** (Railway navigation was declined in-browser) — open loop: check Railway → Postgres service → Backups; if absent, enable or schedule `pg_dump`.

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
| 1 | **10th** | Monthly Clearing Report | All apartments | Owner/partner per apartment (PDF, manual email) |
| 2 | **20th** | TAKK Issuance + TAKK Payment | Private | Elysian issues **and** pays |
| 2 | **20th** | Elysian's **platform invoices** (Airbnb + BDC PDFs) | **Leased** (Elysian is host) | **E-New Generation** |
| 3 | **25th** | **Platform invoices** for B2B units | **B2B** | **The B2B partners** (their cross-European declarations) |
| — | monthly | VAT return | — | Filed by E-New Generation — **out of scope, never tracked** |

**Platform invoices ≠ Oxygen.** Airbnb/Booking.com **host-portal** PDFs (ενδοκοινοτικά) — not Greek expense/myDATA, not Oxygen ΑΠΥ/ΤΠΥ. **Platform Invoices** tab (Accounting/Admin). Doc: `claude/platform-invoices-feature.md`.

**Dating (15 Aug 2026, Lefteris):** The **month** of a document is the **VAT HTML invoice issue date** (the date printed on the invoice), **not** Hosthub `created` / `cancelledAt`. Hosthub dates only tell you **which stay to open**. One stay can produce several documents in different months (normal, cancel, extend). Pull `kind: 'both'` for every code. Expected counts: 1 stay → 1 document; 1 cancel → 2; 1 extend → 3; n extends → `(1 + 2n)`. Store each PDF under the month of **its own** issue date. **Do not** use Hosthub created/cancel dates as the archive month. **Do not** dump a stay's documents into one month just because Hosthub listed the stay there.

Airbnb pull = **Hosthub reservation codes** (`reservationId` / channel `reservation_id`), not a calendar scrape. Booking.com pull is parked. Ship is PDFs + `Airbnb-VAT-YYYY-MM.xls` to **E-New Generation** (`info@e-newgeneration.gr`) and `info@elysianproperties.eu`. Lefteris wants this **ASAP**. Private owners: none (no `?owners=`).

⚠ The app long modelled this as **one** Monthly Tasks line (`ota_inv`); Monthly Close + the Platform Invoices tab are the current home — keep the 20th/25th split when working the packs.

Checklist mechanics: month-by-month, defaults to previous month; **proof-required completion** (file ≤15 MB; upload auto-completes; deleting last proof reverts; N/A needs a reason); records who (👤 per-browser name — expect Popi and others) and when; manager (Lefteris) opens proofs via 📎; completed lines pool in the green bottom list with the "left to do" counter; custom recurring tasks supported.

---

## 7. Engineering practice & safety rails

- **Change workflow**: Claude edits locally under `/mnt/user-data/outputs/elysian-clearing/`, presents; **Lefteris reviews and pushes** — or, for small server/spec releases, **Claude pushes a side branch via the GitHub connector and opens a PR; Lefteris's merge is the approval** (direct `main` writes stay blocked for the connector). Release mechanics: **frontend** via `fe/patches.json` (sha-gated exact-string patches applied at boot; consolidation = full `index.html` web-upload + reset to `{"patches":[]}` — the base-drift gate makes a missed reset harmless; verify via `/api/fe-info`) · **server** via `srv/patches.json` applied at boot by **`srv-boot.js`** (same sha gates, all-or-nothing; local dry-run: `SRVBOOT_DRYRUN=1 node srv-boot.js` → `server.gen.js`). Shipped this way: email probe (PR #3), Resend transport (PR #4, dormant), Oxygen diagnostics (PR #5).
- **Permission model (set 27 Jul 2026)**: read-only by default; **on Lefteris's explicit request for a specific action** ("tick Birdhouse", "mark TAKK done for X") Claude executes it in the live app via the browser. Claude never *initiates* money-moving changes — expense attribution, tax flags, sign corrections, overrides are proposed with € impact and await explicit confirmation.
- **Live-app write protocol** (60 s poll can overwrite saves): **pause poll → fetch fresh snapshot → mutate → save → re-fetch to confirm.**
- **Test suites** (Imports → Run Tests): invariants **P1–P15** (P4 = leased ⇒ businessTax, with same-address carriers **Votsala 1** and **Horizon** covering their buildings) · months-aware charges **Mm1–Mm4** · Payments Check **Pc1–Pc13** · email pagination **Em1–Em5** · server `node server.js --viva-selftest` / `--viva-fetch-test`. **Golden locked financials — one per profile (deliberate coverage)**: *Elysian Lycabettus – Horizon* 🏢 · *Cozy Corner Zografou* 🤝 · *Acropolis Skyline Sunset* 🏠.
- **Claude-in-Chrome playbook**: `select_browser` needs the full device UUID; JS returns truncate ~900–1,000 chars → compact strings/slices, stash arrays on `window.__aptRows`; `reduce` over `S.bks` (never spread into `Math.min/max`); re-establish tab context after bridge drops. Unattended scheduled runs **cannot** drive the browser → no live `S` without Lefteris's session. Site permissions are per-domain and remembered — a denied prompt (railway.com, docs.oxygen.gr) blocks that domain until re-allowed from the extension.
- **Excel outputs** with formulas: run `/mnt/skills/public/xlsx/scripts/recalc.py` after saving.

---

## 8. Current state — 27 Jul 2026

**Built & verified, NOT yet pushed:** ① Previous-Balance display patch (credit label, PDF double-negative, subtotal). ② Revenue-tracker Greek-locale sorting + sequential row numbers.

**Approved app changes, pending draft & review:** ③ Παρακράτηση handling — auto-tag contractor/technician invoices where `net+VAT ≠ total`, charge the **recorded total** (replaces flag-only). ④ Split the invoices task into two lines: *Elysian invoices → E-New Generation* (leased, 20th) and *B2B partner invoices* (B2B, 25th).

**Decisions pending (Lefteris):** Art Island Previous Balance −602.69 → **+602.69** · **67 unassigned chargeable expenses** · **Joël Ollivier (Art House)** guest-pays-at-property verification in Hosthub.

**Closed 28 Aug 2026:** Votsala / Lycabettus business tax — **only Votsala 1 and Horizon carry the flag**; same-address exemption for Votsala 2–8, Panorama and Resilience (Run Tests P4, FE 142).

**Data gaps (from the 27 Jul live pull):** `b2bPartner` empty on **all 16 B2B units** (needed for the 25th flow) · `language` unset on 4 units (A modern & Peaceful · Elysian Agon · The Skarlatos residence · Vista Acropolis).

**External / infra:** Viva `biservices:datafileapi` scope (ask account manager) · **Railway Postgres backup status unverified** · P & G Apartment (Lesbos) dormant since 14 Jul — verify in Hosthub before any removal (see §4 matrix).

**Horizon:** calendar-overlap attribution · zero-value direct-booking footnote rows · scheduled remote brief (one-toggle upgrade) · optional server-side daily digest fed by live data.

### 5 Aug 2026 — session additions

- **v11 shipped (4 Aug)** — Property Info tab, per-user account access (`USERS_JSON`), Change Log audit trail. **`USERS_JSON` is set on Railway** (Lefteris login used for the 15 Aug live Airbnb pull). `APP_PASSWORD` remains a full-access master fallback.
- **v12 shipped (4–5 Aug)** — *Email report to owner* live end-to-end after a test send (doc: `claude/email-report-feature.md`). Frontend consolidated: full `index.html` (sha `5cdd8af1…`, 746,739 B) uploaded, `fe/patches.json` reset — patch base for future connector releases.
- **Railway SMTP saga resolved (5 Aug)** — Railway firewalls **all outbound SMTP below Pro** (probe evidence: even smtp.gmail.com rejected in 255 ms). Fix: **Pro upgrade + one redeploy** (network rules apply per-deployment). Sends via `mail.elysianproperties.eu:465` SSL (host = atlas.cityconsulting.gr, City Consulting cPanel). **PR #4 (Resend HTTPS transport) left open, unmerged — dormant fallback.**
- **Oxygen Pelatologio integration agreed & keyed (5 Aug)** — full spec in `claude/oxygen-integration-spec.md` (profiles → ΑΠΥ `rs`/ΤΠΥ `s`/skip; `category1_3` + `E3_561_001/003`; 24% VAT; one line per charge honoring the cleaning toggle; owners as Oxygen contacts; email-send also writes Revenue + Annual trackers exactly once). Sandbox `OXYGEN_API_KEY` on Railway; diagnostics staged as **PR #5** (`/api/oxygen/status` + sandbox-only `/api/oxygen/test-issue`); first test issuance pending merge. Full build = a fresh session. Pending inputs: Popi's confirmation of owner contacts in Oxygen + VAT on expense-recharge lines.

### 15 Aug 2026 — session additions

- **Airbnb platform-invoice pull is live.** Two-code test (`HM9DCDMEXT`, `HMWRNAWHBA`, month `2026-07`) saved real AIUC PDFs from `www.airbnb.gr` (job `ppmsuw193wm05or`). Capture path: stay page → total price → fetch `/invoice/{token}` + `/vat_invoices/{token}` → **new tab on `www.airbnb.gr`** (address-bar `goto` of `/invoice/` or `/reservation/vat_invoice/` on `.com` is a soft 404). File month = **VAT HTML issue date**. Parser takes **Subtotal €**, not VAT rate `0.0%`. Vault `total` on those two test rows is still **0** until re-ingest. Booking.com pull is **parked**. Collect is Admin-only. Keep UI strings: `Pull Airbnb (Hosthub codes)`, `channel: 'airbnb'`. See `claude/platform-invoices-feature.md`.
- **Daily Ops Beta UI** and **Personnel** remain as of 8 Aug (operator-facing `/daily-ops`; Admin `/personnel`).

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
| 20 | Elysian Lycabettus - Panorama | Athens | 🏢 leased | EN | *same address as Horizon* |
| 21 | Elysian Lycabettus Resilience | Athens | 🏢 leased | EN | *same address as Horizon* |
| 22 | Elysian Smyrni \| Marble Elegance Retreat | Nea Smyrni | 🏠 private | EN | |
| 23 | Filonexia Apartment Athens | Cholargos | 🏢 leased | EN | BT |
| 24 | Le Alex, Bright & Modern Escape near CityCenter ᵀ | Neapoli | 🤝 b2b | EN | |
| 25 | Le Floor, Urban Escape near Thessaloniki center ᵀ | Neapoli | 🤝 b2b | EN | |
| 26 | Le Grace, Urban Retreat Near CityCenter & Sea ᵀ | Thessaloniki | 🤝 b2b | EN | |
| 27 | Le Plaza, Modern Escape near Thessaloniki Center ᵀ | Thessaloniki | 🤝 b2b | EN | |
| 28 | Navarino Athenian Nest | Athens | 🏢 leased | EN | BT |
| 29 | P & G Apartment ⚠ dormant | Pamfila (Lesbos) | 🏠 private | EN | |
| 30 | Pixie Studio Athens | Psychiko | 🏢 leased | EN | BT |
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
| 51 | Votsala 2 Luxury Stay with Patio | Piraeus | 🏢 leased | EN | *same address as Votsala 1* |
| 52 | Votsala 3 Deluxe & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *same address as Votsala 1* |
| 53 | Votsala 4 Small & Elegant Apartment in Piraeus | Piraeus | 🏢 leased | EN | *same address as Votsala 1* |
| 54 | Votsala 5 Luxury Studio with Balcony in Piraeus | Piraeus | 🏢 leased | EN | *same address as Votsala 1* |
| 55 | Votsala 6 Deluxe & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *same address as Votsala 1* |
| 56 | Votsala 7 Small & Elegant Apartment in Piraeus | Piraeus | 🏢 leased | EN | *same address as Votsala 1* |
| 57 | Votsala 8 Elegant & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *same address as Votsala 1* |

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

- `claude/monthly-tasks-feature.md` (20 Jul 2026) · `claude/payments-check-feature.md` (24 Jul 2026) · `claude/email-report-feature.md` (4–5 Aug 2026) · `claude/oxygen-integration-spec.md` (5 Aug 2026) · `claude/monthly-close-and-oxygen.md` (7 Aug 2026) · `claude/platform-invoices-feature.md` (15 Aug 2026 — Airbnb pull live; file by VAT issue date; Booking parked) · `claude/p4-same-address-bt.md` (28 Aug 2026 — P4 carriers Votsala 1 and Horizon)
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
- **v1.5 (28 Aug 2026)** — Business tax same-address rule: **only Votsala 1 and Horizon carry the flag**; Votsala 2–8, Panorama and Resilience are exempt. Run Tests P4 (FE 142 / SRV 109). Doc: `claude/p4-same-address-bt.md`.
- **v1.4 (15 Aug 2026)** — Platform Invoices Airbnb pull **live** (new-tab `www.airbnb.gr` capture; archive by **VAT issue date**, not Hosthub `created`/`cancelledAt`; Hosthub codes; Excel ship). Two-code test saved real AIUC PDFs (job `ppmsuw193wm05or`). Booking.com parked. `USERS_JSON` confirmed on Railway. Platform Invoices is a primary Accounting/Admin tab. Daily Ops Beta UI and Personnel remain as of 8 Aug. Doc: `claude/platform-invoices-feature.md`. Source: live Collect 15 Aug 2026; Lefteris dating rule; clearing `main` `db13617` / `5eff0da`.
- **13 Aug 2026** — Platform invoices: **Airbnb = Hosthub `reservationId` → confirmation-code pull** (VAT Invoicer-style); Booking.com pull parked for now. Doc: `claude/platform-invoices-feature.md`.
- **13 Aug 2026** — Platform invoices: **pull-first automation** (DB portal sessions, multi-property Booking pull, upload emergency-only). Doc: `claude/platform-invoices-feature.md`.
- **13 Aug 2026** — Platform invoices: Booking.com = **one invoice per apartment** (Expect/Collect checklist + apartment tagging); 0-PDF portal pull shown as failure. Doc: `claude/platform-invoices-feature.md`.
- **13 Aug 2026** — Platform invoices SOP: ASAP; Booking.com month-after; Airbnb VAT invoice = Hosthub `created`; Airbnb **credit note** = `cancelledAt` (download both across months if needed); Elysian-own → E-New Generation + info@; no personal names. Tools → Platform Invoices + Hosthub health check + **Playwright portal pull** (`AIRBNB_HOST_*` / `BOOKING_HOST_*`). Doc: `claude/platform-invoices-feature.md`.
- **v1.3 (5 Aug 2026)** — session 4–5 Aug applied (5 items approved "all"): v12 email-report shipped + §3 delivery line updated; Railway-blocks-SMTP-below-Pro fact + email/Oxygen env vars (§3); connector branch→PR write path + fe/srv-boot patch release mechanics + Em tests + per-domain Chrome permissions (§7); "5 Aug additions" block in §8 (v11 status, v12, SMTP resolution, Oxygen kickoff); new docs referenced (§11): `claude/email-report-feature.md`, `claude/oxygen-integration-spec.md`. Source: session 4–5 Aug 2026; elysian-clearing PRs #3/#4/#5.
- **v1.2 (27 Jul 2026)** — canonical home moved to the private `lete13/elysian-brain` repo; §12 write path is now branch → pull request → merge (Lefteris's merge = the approval); project copy refreshed from GitHub after merge. Source: setup session 27 Jul.
- **v1.1 (27 Jul 2026)** — added §12: weekly memory maintenance loop (proposal → per-item approval → versioned apply; single door, durable-vs-transient, assumptions register, anti-bloat). Source: Lefteris's request, 27 Jul.
- **v1.0 (27 Jul 2026)** — questionnaire complete (33/33). Folded in: full money-model answers under the Configuration principle; team & accountant (E-New Generation); three-wave close (10th/20th/25th) incl. B2B-partner invoice flow; παρακράτηση reframe; ΙΚΕ + ΑΦΜ rule; live `S.apts` enrichment (profiles/language/BT for all 57, golden-trio coverage, Votsala P4 evidence, b2bPartner + language gaps); code-derived tab map, endpoints, env vars, sizes, manual report delivery; operating decisions (permission model, cloud skills, on-demand brief, EA scope/lane, KPIs, channels); Railway-backup open loop.
- **v0.2 (27 Jul 2026)** — cadence answers (Q16–Q19).
- **v0.1 (26 Jul 2026)** — initial draft.
