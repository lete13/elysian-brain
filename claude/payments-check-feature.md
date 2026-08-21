# Payments Check tab — added 24 Jul 2026

New tab in the Elysian Clearing app (🧰 Tools dropdown → 💳 Payments Check) that shows exactly what should be landing in the **Viva bank account** from Booking.com and Airbnb, and lets the team tick payouts off as they arrive. Files changed: `index.html` + `server.js` in the `elysian-clearing` folder (deploy by pushing to GitHub as usual — Railway auto-redeploys). Live at elysian-clearing-production.up.railway.app.

## Payment rules implemented
- **Booking.com** — `payout(Thursday T) = Σ reservations with checkout ∈ [T−7, T−1]`, i.e. every checkout is paid on the **first Thursday strictly after it** (Wed checkout → next-day Thu; Thu checkout → +7 days). One bank credit **per property per Thursday** (per Lefteris's account setup). Expected amount = **gross − commission − payment charges** (Hosthub "Total Payout"), minus any channel-remitted taxes (`trChan`). *Rule validated against a real Booking.com payout statement (Birdhouse, Thu 23 Jul 2026, window 16–22 Jul).*
- **Clearing groups (21 Aug 2026):** `clearGroup` on Configuration is for **owner reports**. Payments Check / Viva **only** collapse **Votsala** (`/^votsala$/i`) into one Thursday line (one Booking.com property, one Viva credit). Other groups (e.g. Michalakopoulou) stay **per apartment** — those payouts arrive one by one. Tests: client Pc16/Pc17, server `pcvPayGroup`. Clearing PR #154.
- **Airbnb** — payout released **~24 h after check-in**, one credit **per reservation**, lands in the bank ~1–3 business days later. Amount = gross − host service fee (Airbnb never bills a separate payment charge).
- Direct/other channels, cancelled bookings and owner blocks are excluded.

## What the tab shows
- KPI cards: Expected this week · Awaiting arrival · **Overdue (chase these)** · Received this month.
- **Booking.com section**: weekly Thursday batches (newest first) showing the checkout window covered, reservation count and expected € — expandable to per-property lines (each individually tickable, matching the one-credit-per-property reality) and down to reservation detail (guest, dates, payout).
- **Airbnb section**: per-reservation payouts grouped by release week, each tickable.
- Status lifecycle per payout: **Upcoming → Expected → Received ✓ / ⚠ Overdue** (grace: 3 days Booking.com, 5 days Airbnb, configurable).
- Ticking records **who** (same name mechanism as Monthly Tasks) and **when**. Optionally type the **actual Viva credit** — difference vs expected is auto-checked (default tolerance ±€1 → "✓ matches", otherwise a red Δ with drill-down to hunt refund adjustments).
- ⚙ Settings (shared, synced): check-from date (default 1 Jan 2026), grace days, tolerance, look-ahead horizon. View filters All / Booking.com / Airbnb, hide-received toggle, Excel export (2 sheets), ↻ Refresh (runs the Hosthub sync).

## Robustness design
- **Marks survive Hosthub re-syncs**: booking ids are regenerated on every sync, so ticks are keyed on natural keys instead — `bdc|<thursday>|<property>` and `abb|<property>|<check-in>|<guest>`.
- **Drift detection**: the expected amount is stored at tick time; if a later sync changes the batch (refund/modification), the line is re-flagged "⚠ changed since ticked (was €X)".
- **Fee-integrity flags**: Booking.com reservations missing commission/payment charge (Hosthub sync gaps) flag their batch — expected amount probably overstated; banner says fix in Hosthub and re-sync.
- **Team-shared state**: ticks live in `S.payChk` and sync through the existing `app_data` (key `main`) pipeline with the 60 s poll; **server-side anti-wipe** in `server.js` restores marks if a stale client or "Clear data" would erase them (same pattern as Monthly Tasks).
- **Self-tests Pc1–Pc13** added to the built-in suite (Imports → Run Tests): Thursday-window mapping (incl. all 7 window days), Airbnb +24 h, payout amount basis & fallbacks, channel-remitted tax deduction, status boundaries, channel detection. Verified 44 additional engine checks headlessly.

## Known reconciliation quirk (verified 24 Jul 2026, Birdhouse)
Hosthub **rounds the 1.6% Booking.com payment charge down** to the cent; Booking.com rounds it to the nearest cent → the app's expectation runs ~1 cent high per reservation (e.g. Birdhouse Thu 23 Jul: app 337,11 € vs bank 337,07 € across 6 reservations). Systematic, harmless, absorbed by the ±€1 tolerance. Commissions match to the cent.

## 🏦 Viva bank bridge — added 24 Jul 2026 · STATUS: waiting on Viva to enable API access
Automatic reconciliation against the real Viva business account, every **Saturday 08:00 Europe/Athens** plus an on-demand **"✓ Check now"** button in the tab. Server code is at **build v6** and fully verified — see status below.

### Current status (24 Jul 2026, end of day)
- ✅ **Everything on our side works**: credentials valid, OAuth token minted from accounts.vivapayments.com, `GET api.vivapayments.com/merchants/v1/wallets` **succeeds** (wallets + IBANs listed).
- ⛔ **Blocked by Viva**: the transactions endpoints (`/dataservices/v1|v2/accounttransactions/Search`) require OAuth scope `urn:viva:payments:biservices:datafileapi` (or biservices internalapi/publicapi). Viva's identity server returns **invalid_scope** for these credentials, and the official reference states the Account Transactions API "requires specific access credentials — speak to your sales representative".
- **Action pending (Lefteris)**: ask the Viva account manager to *"enable the Account Transactions API (scope urn:viva:payments:biservices:datafileapi) for my Account Transactions Credentials"*. **No code change needed afterwards** — the server retries the scoped token on every run and locks in automatically once granted.
- Until then the tab works fully in **manual tick** mode. Parked interim option: Viva statement export (CSV/XLSX) upload with the same auto-matcher.

### What was learned the hard way (for future reference)
- The self-serve **Account Transactions Credentials** are an OAuth client with scopes `core:api:banktransfers`, `core:api:merchants`, `core:api:merchants:wallets`, audience `core_api` — they can list wallets/balances and make transfers, but **cannot** read account movements without the sales-rep-granted biservices scope (despite the credential name).
- Correct hosts: token `accounts.vivapayments.com/connect/token` (client_credentials Basic); API `api.vivapayments.com`. `www.vivapayments.com` is the website gateway — its `/dataservices` paths answer 406 to JSON or hang (WAF), a red herring that cost several debugging rounds.
- The v1 Search additionally wants a `PersonId` header with access tokens; the person id is in the token claim `urn:viva:payments:client_person_id`.
- Viva doc reference pages are JS-rendered SPAs — WebFetch returns empty; read them through a real browser.

### Implementation (server.js, build v6)
- **Strategy chain** (self-healing, logged as `[viva]` lines in Railway deploy logs): ① `GET /merchants/v1/wallets` (bearer) → per-wallet `POST /dataservices/v2/accounttransactions/Search?PageSize=500&Page=N` (pages until HTTP 204), tried with unscoped then datafileapi-scoped tokens; ② fallback: v1 Search candidate matrix (hosts × auth styles × scopes × PersonId header). First working combination is locked in for the session.
- Per-request 20 s timeouts, every request logged with status+latency, `/api/viva/check-now` capped at 90 s (never hangs the UI), env creds `.trim()`ed, `VIVA_BASE_URL`/`VIVA_ACCOUNTS_URL` env overrides available. `/api/viva/status` reports the build tag; check-now errors embed diagnostics (token scope, audience, attempt-by-attempt failures with Viva's response bodies).
- **Setup**: `VIVA_TX_USER` + `VIVA_TX_PASS` in Railway → Variables (already done). Saturday cron self-activates; `lastCronDate` claimed in DB before running so a crash can't double-fire.
- **Matching rules**: last-35-days credits only; counterparty /booking/i → Booking.com, /airbnb/i → Airbnb; unknown counterparties never touched. A credit auto-ticks a payout only when **exactly one** unmatched same-channel unit fits the date window (−1…+10 days) and amount (exact first, then shared ±tolerance); ambiguity goes to the report. Used bank tx ids stored in marks (`txId`) — never matched twice. Auto-ticks show as 🤖 "Viva auto-check".
- **Saturday report** in `payChk.bank.lastResult` (synced): auto-ticked list, unmatched channel credits, expected-but-not-found payouts.
- **Server self-tests**: `node server.js --viva-selftest` (14 fixtures — classification, client-identical mark keys, tolerance vs exact, single-candidate rule, windows, no-double-use). `--viva-fetch-test` for connectivity against a real or mock endpoint.
