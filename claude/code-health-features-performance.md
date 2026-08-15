# Elysian Clearing — code health, features, performance

Review date: **15 Aug 2026**. Scope: live app at `lete13/elysian-clearing` (base `index.html` / `server.js` plus the applied `fe/` and `srv/` patch chains) read against this brain. No app code was changed.

Patch-chain evidence from this session: **622 FE patches in 104 files**, **249 server patches in 70 files**. `npm test`, `npm run test:platform-invoices`, and `tests/daily-ops-clean-persist.test.js` all passed.

> **Do not copy this file into the public clearing repo.** It names operational gaps, money-impacting bugs, and security notes.

---

## How to read this

The app is healthy enough to run a 57-unit close, but it is a **single 800 KB SPA + one JSON blob + a 871-patch overlay**. Most of the product (session auth, Leads, Platform Invoices, Cash Flow, Monthly Close, Personnel) lives only in patches. Reading `server.js` / `index.html` alone misses the live system.

Three independent conclusions:

1. **Code health** — the patch machine works; the real risks are silent fallback, UI-only roles, and last-write-wins state.
2. **Features** — finish money work already designed (Viva, παρακράτηση, Previous Balance, expense attribution) before adding new tabs.
3. **Performance** — the Hosthub tax N+1 and the full-`S` round-trip will dominate as bookings grow; UI polling is secondary.

Suggested order of work is at the bottom.

---

## Architecture (what actually ships)

```
npm start
  → srv-boot.js applies srv/patches.json … srv/patches-70.json to server.js
  → writes server.gen.js and requires it
  → on any patch failure: starts unpatched server.js (app stays up, features disappear)

Patched server then:
  → feBootstrap() applies fe/patches.json … fe/patches-104.json to index.html
  → keeps FE_HTML / FE_HTML_GZ in memory (srv/patches-23.json)
  → still also writes the patched HTML back to disk
```

Shared operational state is one Postgres row: `app_data` key `'main'` (the browser `S` object). Proofs, leads, platform invoices, rental_info, Oxygen docs, and portal sessions sit in other tables.

This design is why GitHub-connector releases stay small. It is also why a single bad patch, or a restart on a mutated `index.html`, can silently serve last month's product.

---

## 1. Code health

### What is in good shape

- Parameterized SQL (`$1` / `$2`) on the paths inspected; no obvious injection in the base server.
- Payments Check keys on **natural keys** (`bdc|…`, `abb|…`) so Hosthub id regeneration does not wipe ticks.
- Server anti-wipe for `monthlyTasks` and `payChk`; `mergeKeepMap` (`srv/patches-52.json`) unions `rptLocks` / `ownerRemit` / revenue so a stale Daily Ops save is less likely to erase email stamps.
- Session-cookie auth replaced Basic Auth (`srv/patches-21.json`) so Chrome logout actually works.
- Patch chains are sha-gated and all-or-nothing; `GET /api/fe-info` reports what is live.
- Existing tests are a real safety net for the patch chain itself (1,018 declared checks in the monthly-close suite).

### Critical / high — fix these

| # | Finding | Where | Why it matters | Suggested fix |
|---|---|---|---|---|
| H1 | **FE bootstrap mutates `index.html` on disk** | `server.js` ~61; still present after `srv/patches-23.json` | After a successful boot, the file on disk is the *patched* HTML. A later restart can fail `baseSha256` and serve that snapshot **without new patches**. Local/container restarts are the usual victims; Railway from a fresh checkout is safer. | Stop writing patched HTML to disk. Serve only `FE_HTML` / `FE_HTML_GZ`. Treat `index.html` as immutable. |
| H2 | **Roles are UI-only** | `req.acctAccess` via `/api/whoami`; no API middleware | Any signed-in user can hit Oxygen issue, email send, `POST /api/db/data`, leads erase, platform-invoice pull, proofs. The nav hide is cosmetic. | Gate mutating routes by `req.acctAccess` / profile. At minimum: Oxygen, email, db write, invoice pull, proofs delete, leads admin. |
| H3 | **Monthly Close skip password is in the client** | `fe/patches-2.json` — `MC_SKIP_PW = '2026'` (asserted in tests) | Anyone who can open DevTools can skip a real close. | Move skip to `POST /api/monthly-close/skip` with a server secret (or manager-only account). |
| H4 | **Session signing secret can be the team password** | `srv/patches-21.json`: `SESSION_SECRET \|\| APP_PASSWORD \|\| 'elysian-dev-session'` | Predictable HMAC key. Anyone who knows the login password can forge a 14-day `elysian_sess` cookie as `access: 'all'`. | Require a dedicated `SESSION_SECRET`. Refuse to boot in production without it. |
| H5 | **`APP_PASSWORD` is still a full-access master** | session `lookupAccount` | Memory already flags this as unverified post-v11. Any username + master password → management. | Keep a break-glass account, but log it, rotate it, and do not treat it as the daily login. |
| H6 | **Hosthub API key accepted on the query string** | `server.js` `/api/discover`, `/api/hosthub/*` | Keys land in access logs, Railway logs, browser history. | Accept header / body / `HOSTHUB_API_KEY` only. |
| H7 | **Debug Hosthub endpoints still live** | `POST /api/debug-checkin`, `/api/debug-cancelled` | Authenticated but powerful introspection. Combined with H2, any login can use them. | Remove in production, or restrict to management + `DEBUG_HOSTHUB=1`. |
| H8 | **Default apartment config with owner names ships in public `index.html`** | `DEFAULT_APT_CONFIG` in `index.html` | The clearing repo is public. Seed data includes owner names/fees. | Move defaults to env/DB, or strip PII from the public tree. Brain stays the place for the directory. |

### Medium — correctness and fragility

| # | Finding | Notes |
|---|---|---|
| M1 | **`/api/auto-sync-status` lies** | Scheduler is every **15 minutes**; the status endpoint still computes next run from `AUTO_SYNC_HOUR` (daily 04:00 model). Dashboard “next sync” is wrong. Memory §1 still says “~every 2 hours” / daily cron — both stale vs code. |
| M2 | **`getStoredApiKey()` is gone in patches, still in unpatched `server.js` ~912** | `srv/patches-8.json` removed the crash. If boot falls back (H1 / bad chain), auto-sync throws and never reschedules correctly. |
| M3 | **`POST /api/sync-cancelled` is a deprecated no-op** | Dead API surface. Remove or 410 it. |
| M4 | **Root `patches.json` is unused** | Old FE chain (`builtAt: 2026-08-04`, 44 patches). Not applied by boot. Confusing for the next consolidator. Delete or archive. |
| M5 | **`showTab` is a monkey-patch stack** | Checkout Tracker, Monthly Close, Payments, Cash Flow, Home, Personnel each wrap `window.showTab`. Order-dependent; one missed `return _prevShowTab.apply(...)` breaks navigation. Prefer a single registry (`showTab.hooks.co = renderCo`). |
| M6 | **Payments expectation logic is duplicated** | Client vs `vivaExpectedUnits` in `server.js`. Comments already warn they must stay in sync. Extract one shared module the FE can also load, or generate the client copy in tests. |
| M7 | **`toast()` uses `innerHTML`** | `index.html` ~2370. Many tabs rebuild large `innerHTML` trees; escaping is inconsistent (`esc()` exists in some IIFEs only). Prefer `textContent` for toasts; one shared `esc()` at the top of the SPA. |
| M8 | **`express.json({ limit: '50mb' })`** | Needed for proofs/PDF, but any authenticated client can POST 50 MB into memory. Tighten per-route (proofs/invoices 30 MB, `/api/db/data` much smaller). |
| M9 | **Postgres `rejectUnauthorized: false`** | `server.js` ~94. Normal on Railway; worth a comment + `PGSSLMODE` so local/prod intent is explicit. |
| M10 | **Hardcoded special-case user `john`** | `srv/patches-28.json` grants accountant / Platform Invoices by username. Encode this in `USERS_JSON` access lists instead. |
| M11 | **`.env.example` is incomplete** | Missing `USERS_JSON`, `SESSION_SECRET`, SMTP, Oxygen, Meta, Anthropic, `AIRBNB_HOST_*` / `BOOKING_HOST_*`. New deploys guess. |
| M12 | **`DEPLOY.md` describes Basic Auth + 60 s sync as the product** | Auth is session cookies; Hosthub auto-sync is 15 min. README is one line. |
| M13 | **`package-lock.json` is gitignored** | `Dockerfile` installs from `package.json` only. Playwright/pg/express versions can drift between deploys. Commit the lockfile (or `npm ci` from a generated lock in CI). |
| M14 | **Playwright pull is selector-fragile** | `scripts/platform-invoice-pull.js` is large; tests are **source-contract** asserts, not a live browser. Expected, but 0-PDF failure path is still the operational risk (platform-invoices doc). |
| M15 | **Report lock keys use `toISOString`** | Already documented in `monthly-close-and-oxygen.md`: Athens 1st-of-month can shift back a day. Store local `YYYY-MM-DD`; match on range midpoint. |
| M16 | **Anti-wipe does not catch a single property vanishing from Hosthub** | Memory §4. Sync wholesale-replaces `S.bks`. One Hosthub glitch drops a unit’s bookings until someone notices. Compare previous vs new rental set and refuse/alert on shrink. |

### Dead ends and doc drift (brain vs app)

These are not runtime bugs; they make the next Claude session do the wrong work.

| Topic | Stale | Current |
|---|---|---|
| Monthly Tasks vs Monthly Close | Memory tab map, accountant & EA skills | Monthly Close **replaces** Monthly Tasks (`monthly-close-and-oxygen.md`, 7 Aug) |
| Oxygen | Spec + memory §8: sandbox, PR #5 pending | Close doc: **live, production** |
| Wave 1 report delivery | “PDF, **manual** email” in §6 table & EA skill | v12 **Email report to owner** shipped |
| Hosthub cadence | Memory: ~2 h + daily `AUTO_SYNC_HOUR` | Code: **15 min**, chained after each run |
| Frontend size | Accountant skill ~628 KB; memory 747 KB | Repo `index.html` **800,137 B** before patches |
| TAKK | Memory assumptions register still “presumed” | Accountant skill (31 Jul): confirmed Law 5162/2024 |
| Brain README `claude/` listing | Only platform-invoices + monthly-close | Also payments-check, monthly-tasks, oxygen-spec, email-report |
| Memory path in skills | `claude/elysian-memory.md` | Repo root `elysian-memory.md` |

`elysian-memory.md` §12 says these wait for a **memory review** loop — flag them there; do not silently rewrite the master doc from this review.

### Tests — coverage vs reality

**Pass (this session):** monthly-close chain, Airbnb auth-flow contracts, Daily Ops check-in schedule, Daily Ops clean persist, four platform-invoice contract tests.

**Gaps:** `npm test` does **not** run `daily-ops-clean-persist` or `test:platform-invoices`. Fold them in.

Almost no automated coverage for: Oxygen issue/preview/PDF, email send, Viva match / cash-flow math, leads ingest, Property Info, session/role enforcement, Hosthub `runSync` mapping, myDATA import, Annual Tracker, Change Log, concurrent save races beyond the light `mergeKeepMap` asserts, live Playwright against real portals.

The in-app **P1–P15 / Mm1–Mm4 / Pc1–Pc13 / Em1–Em5** suite (Imports → Run Tests) is the financial safety net. Keep the golden trio (Horizon 🏢, Cozy Corner 🤝, Acropolis Skyline 🏠) as the merge bar for any report/Oxygen/Payments change.

---

## 2. Features and improvements

Grounded in the brain (close cycle, Popi’s Thursday run, 57 units) and what the app already almost does. Ranked by money and hours saved, not novelty.

### A. Finish what is already designed (highest leverage)

1. **Unblock Viva auto-reconciliation** — code is done (v6); blocked on OAuth scope `biservices:datafileapi`. Until then Popi ticks every payout by hand. Parallel parked path: statement CSV/XLSX upload so a missed Viva ticket does not freeze the week.
2. **Push the Previous-Balance display patch** — credits are in the payout math but hidden on screen (`parseFloat > 0` trap, memory §4.5). Remittance mistakes (Art Island sign) follow from that.
3. **Παρακράτηση auto-tag** — approved: contractor invoices where `net+VAT ≠ total` still charge the **recorded total**. Pending build. Stops under-charging owners on technician invoices.
4. **Expense attribution workspace** — **67 unassigned chargeable expenses** are invisible in reports. A triage queue (clear-cut → Popi; ambiguous → Lefteris; multi-apt split rules) is more valuable than a new dashboard widget.
5. **Expense due-list / Thursday payment run** — Runbook C is not in the app. A “pay these this Thursday” list that then feeds allocation (Runbook D) is the missing link before Wave 1 close.
6. **Owner remittance helper** — Monthly Close Payment stage already has the signed-off amount. Emit Viva descriptor `ELYSIAN CLEARING MM/YYYY {CODES}`, a copy-paste pack, and attach the paid proof. Still a manual transfer; fewer wrong amounts.
7. **Fill `b2bPartner` + languages** — all 16 B2B units have empty `b2bPartner` (blocks 25th partner packs); 4 units have unset `language` (bilingual email). Config work, not a new feature, but it unblocks Wave 3.

### B. Improve what is live

| Feature | Improvement |
|---|---|
| **Monthly Close** | Persist channel pills (`rptChanSel` lost on reload). Fix Pixie Studio dual remittance (leased + B2B flag). Clarify ΤΑΚΚ nights vs maintenance blocks. Surface skip-month as a manager action (see H3). |
| **Platform Invoices** | Harden Airbnb **0-PDF** failure (show which codes failed and why). Then unpark **Booking.com** pull (one invoice per apartment, month-after). Credit notes across months already specified — keep that in the Expect list. |
| **Email report** | Attach TAKK + payment proofs on the Email stage (Monthly Close already wants this). Keep the warning-not-block behaviour. |
| **Oxygen** | Contact-completeness gate before live issue; confirm VAT on expense-recharge lines with Popi; golden test: invoice line-sum ≡ locked report. TAKK via `/hotel-tax` is the Wave 2 automator. |
| **Payments Check** | Chase UI from the Overdue KPI (fee-integrity first, then a draft chase message with property / window / count / amount / days). |
| **Reports** | Zero-value direct-booking footnote (“owner’s own guests / cash at check-in”). Calendar-overlap attribution as a **KPI toggle**, not a change to owner payout month. |
| **Daily Ops** | Already the ops home for George & John. Next: cleaner-load vs same-day check-in heat, and a “schedule photo check missed X checkouts” that writes a task instead of only a toast. |
| **Leads** | Convert-to-apartment should pre-fill Configuration from extracted Meta fields (address, sqm, rooms) — extractor already exists (`srv/patches-8.json`). |
| **Home / My tasks** | Server-side “close health” digest (left-to-do by wave) so an unattended EA brief does not need a live browser `S`. |
| **Configuration** | Bulk edit for `b2bPartner`, `language`, `businessTax`. Votsala 2–8 same-address exemption is an accountant decision, then either relax P4 or enable the flag. |

### C. New features worth building (after A–B)

1. **B2B partner pack automation** — once partners are named: expect → collect platform invoices → email the pack. Wave 3 is still mostly manual.
2. **Direct online-payment watch** — memory already flags that a direct site taking *card* payments would fall outside Payments Check. Design the expected-credit rule before that channel exists.
3. **Hosthub vanish alert** — if rental count drops by ≥1 vs last sync, freeze the bookings write and ping (see M16).
4. **Postgres backup + restore drill** — proofs, close history, and payment marks live only on Railway Postgres; backup status is **unverified**. This is infra, not a tab, and it is overdue at this data criticality.
5. **Patch consolidation** — 104 FE + 70 srv files is past the “small release” sweet spot. Assemble patched `index.html` / `server.js`, upload, reset chains to `{"patches":[]}`. Do this **before** a large feature, not during close week. The disk-write bug (H1) should be fixed in the same consolidation so the new base cannot poison itself.

### D. Explicitly do not build yet

- A second frontend framework / rewrite. The SPA is large because the business is large; splitting tabs without a consolidation plan doubles the patch problem.
- Automatic Viva *payouts* (money leaving the account). Remittance helper only; Lefteris/Popi still press send.
- Tracking E-New Generation’s VAT return. Out of scope by decision.

---

## 3. Performance

### Highest impact (do these)

**P1 — Hosthub sync: stop the double calendar crawl + tax N+1**

`runSync` in `server.js`:

1. Fetches **global** `/calendar-events?is_visible=all`, then **again per rental** for all ~57 properties. Dedupes in memory. That is roughly 58 paginated crawls per 15-minute tick.
2. Then `GET /calendar-events/{id}/calendar-event-gr-taxes` in batches of 20 for **every** booking (thousands of HTTP calls). Empty `catch` swallows failures, so taxes silently go missing.

Suggestions, in order:

- Trust the global calendar (or per-rental, not both). Log a sample diff for one week before deleting the second path.
- Cache gr-taxes by event id; only fetch bookings whose Hosthub `updated_at` / id is new since last sync.
- Persist bookings in a real table (or jsonb keyed by id) instead of replacing the entire `S.bks` array every time. Sync then becomes a delta merge; the 15-minute cadence stops rewriting the whole blob.

**P2 — `/api/db/status` should not load the blob**

```sql
SELECT updated_at, data FROM app_data WHERE key = 'main'
```

Every open tab, every 60 s, deserializes the full JSON only to count `bks` / `exps` / `apts`. Change to `SELECT updated_at, jsonb_array_length(data->'bks') …` or store counts on write. This is the cheapest win in the file.

**P3 — Stop round-tripping all of `S` on every save**

`saveToDb` POSTs apts + bookings + expenses + daily ops + locks + close + remit + payChk as one 50 MB-capable JSON body. A Daily Ops tick rewrites the entire booking history.

Split the row (or use jsonb patch / per-key documents): `apts`, `bks`, `exps`, `ops`, `close`. Keep `mergeKeepMap` per document. The 60 s poll then fetches only `updated_at` per key.

**P4 — Proofs and platform PDFs as bytea / object storage, not TEXT base64**

`proof_files.data` is base64 TEXT; email send base64s again. Platform invoice PDFs live in Postgres too; pull jobs can run for hours. Move blobs to Railway volume / S3-compatible storage; keep metadata + checksum in SQL. Add indexes on `(platform, month)` / `(apt_id, month)` as the vault grows.

### Medium

| Issue | Detail | Suggestion |
|---|---|---|
| **Active-tab full re-render every 60 s** | Checkout Tracker, Monthly Tasks/Close, Payments (`index.html` ~9434, ~9800, ~10525) | Re-render only when `/api/db/status` says `updated_at` changed, or debounce to 2–5 min for heavy tabs. |
| **Airbnb connect/pull poll every 2 s** | Fine during a job; make sure intervals clear on tab hide / job done | `document.hidden` → 10 s; stop on terminal status. |
| **Gzip of large JSON is sync** | `gzipSync` on `res.json` (`srv/patches-23.json`) | Keep it for `/api/db/data`; skip for tiny payloads (already &lt; 2 KB). Consider `zlib.createGzip` streaming if the blob stays huge. |
| **SPA parse cost** | ~800 KB HTML + 622 patches at boot, then gzipped to the browser | Consolidation + stop disk rewrite (H1). Code-split is a later step (separate JS files per tab) and fights the current patch model — do it only after a frozen base. |
| **Viva Search up to 200 pages, 240 s refresh** | Cash Flow / Payments | Persist fetched txs; incremental `since` watermark. |
| **Meta Graph every 5 min** | Always-on when `META_PAGE_TOKEN` is set | Back off to 15 min when the last poll was empty. |
| **In-memory maps + Playwright in one process** | Proofs fallback, platInv jobs, Chromium | Keep pull jobs on a worker (already a child script) and cap concurrent browsers at 1. |

Polling that is already reasonable: DB 60 s, Viva cron tick 10 min, perf refresh 2 h, Hosthub 15 min *if* P1 lands.

### Frontend notes (felt slowness)

The SPA is one document: switching tabs is cheap, **first paint after login** is not (login overlay in `srv/patches-23.json` already admits this). Biggest client costs:

- `loadFromDb` then `renderDash(); renderCfg(); renderBk(); renderExp();` even if those tabs are hidden.
- `localStorage.setItem('e_v3', JSON.stringify(entire S))` — quota failures are swallowed; the 2 s debounce still serializes everything.

Lazy-render: only paint the active tab; fill `S` without calling every `render*`. Guard `localStorage` with a size check; it is a cache, not the source of truth.

---

## Suggested sequence

Work that is **app patches** vs **ops/config** vs **brain docs**:

| Order | Item | Kind | Closes |
|---|---|---|---|
| 1 | Require `SESSION_SECRET`; stop disk-write of patched HTML; fold extra tests into `npm test` | App | H1, H4, test gap |
| 2 | Server-side role checks on mutating APIs; remove query-string API keys; drop or lock debug routes | App | H2, H6, H7 |
| 3 | `/api/db/status` counts without loading `data`; drop duplicate Hosthub calendar crawl | App | P2, P1 (part) |
| 4 | Push Previous-Balance display; παρακράτηση auto-tag; skip-month off the client | App | Money accuracy |
| 5 | Chase Viva scope (or ship CSV upload); expense attribution queue + Thursday due-list | App + Viva | Popi’s week |
| 6 | Fill `b2bPartner` / languages; Votsala / Pixie / Art Island decisions | Config | Wave 3 + P4 |
| 7 | Airbnb 0-PDF hardening, then Booking.com pull | App | Platform packs |
| 8 | Blob storage for proofs/PDFs; split `app_data` keys | App | P3, P4 |
| 9 | Patch consolidation (full `index.html` + `server.js` upload, reset chains) | Release | Maintainability |
| 10 | Memory review: Monthly Close, Oxygen production, email v12, sync cadence, sizes, TAKK | Brain | Doc drift |

Items 1–3 are small, low-risk patches and should happen before the next close week. Items 4–6 move money. Item 9 is a dedicated quiet-week release, not a drive-by.

---

## Out of scope for this review

- Live Railway metrics / Postgres size (not queried from this session).
- Changing `elysian-memory.md` (needs the §12 memory-review loop).
- Implementing the patches listed above (this document is the proposal).
