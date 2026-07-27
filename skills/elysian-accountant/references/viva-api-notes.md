# Viva bank bridge — API notes & matching rules (build v6, 24 Jul 2026)

Read this before touching any Viva-related code in `server.js`, or when debugging the Saturday reconciliation. Everything below was learned the hard way; re-deriving it costs hours.

## Status

- ✅ Our side works end-to-end: credentials valid, OAuth token minted, `GET api.vivapayments.com/merchants/v1/wallets` succeeds (wallets + IBANs listed).
- ⛔ Blocked by Viva: the transactions endpoints (`/dataservices/v1|v2/accounttransactions/Search`) require OAuth scope **`urn:viva:payments:biservices:datafileapi`** (or biservices internalapi/publicapi). The identity server returns `invalid_scope` for our credentials; Viva's docs say the Account Transactions API "requires specific access credentials — speak to your sales representative".
- **Pending (Lefteris)**: ask the Viva account manager to enable that scope for the existing Account Transactions Credentials. **No code change afterwards** — the server retries the scoped token every run and locks in automatically.
- Interim: manual tick mode. Parked option: Viva statement export (CSV/XLSX) upload feeding the same auto-matcher.

## Hard-won API facts

- The self-serve **Account Transactions Credentials** are an OAuth client with scopes `core:api:banktransfers`, `core:api:merchants`, `core:api:merchants:wallets`, audience `core_api` — they list wallets/balances and can make transfers, but **cannot read account movements** without the sales-rep-granted biservices scope, despite the credential name.
- Correct hosts: token → `accounts.vivapayments.com/connect/token` (client_credentials, Basic auth). API → `api.vivapayments.com`.
- **`www.vivapayments.com` is a trap**: it's the website gateway; its `/dataservices` paths answer 406 to JSON or hang at the WAF. Cost several debugging rounds.
- The **v1** Search additionally wants a `PersonId` header; the person id lives in the token claim `urn:viva:payments:client_person_id`.
- Viva's doc pages are JS-rendered SPAs — plain fetch returns empty; read them through a real browser.

## Server implementation (build v6)

- **Strategy chain**, self-healing, logged as `[viva]` lines in Railway deploy logs:
  ① `GET /merchants/v1/wallets` (bearer) → per-wallet `POST /dataservices/v2/accounttransactions/Search?PageSize=500&Page=N`, paging until HTTP 204; tried with unscoped then datafileapi-scoped tokens.
  ② Fallback: v1 Search candidate matrix (hosts × auth styles × scopes × PersonId header).
  First working combination is locked in for the session.
- Per-request timeout 20 s; every request logged with status + latency. `/api/viva/check-now` capped at 90 s so the UI never hangs. Env creds are `.trim()`ed. `VIVA_TX_USER` + `VIVA_TX_PASS` in Railway variables (set); `VIVA_BASE_URL` / `VIVA_ACCOUNTS_URL` overrides available. `/api/viva/status` reports the build tag; check-now errors embed diagnostics (token scope, audience, attempt-by-attempt failures with Viva's response bodies).
- **Cron**: Saturday 08:00 Europe/Athens; `lastCronDate` is claimed in the DB before running so a crash can't double-fire. Plus the on-demand "✓ Check now" button.

## Matching rules (auto-reconciliation)

- Only **credits from the last 35 days** are considered.
- Counterparty classification: `/booking/i` → Booking.com, `/airbnb/i` → Airbnb; **unknown counterparties are never touched**.
- A credit auto-ticks a payout only when **exactly one** unmatched same-channel unit fits both the date window (**−1 … +10 days**) and the amount (**exact first, then shared ±tolerance**). Any ambiguity goes to the report instead of guessing.
- Used bank transaction ids are stored on the marks (`txId`) — a credit is never matched twice.
- Auto-ticks display as 🤖 "Viva auto-check". The Saturday report lands in `payChk.bank.lastResult` (synced): auto-ticked list, unmatched channel credits, expected-but-not-found payouts.

## Self-tests

- `node server.js --viva-selftest` — 14 fixtures: classification, client-identical mark keys, tolerance vs exact matching, the single-candidate rule, date windows, no-double-use.
- `node server.js --viva-fetch-test` — connectivity against a real or mock endpoint.

Run the selftest after any change to matching logic, and check `/api/viva/status` + Railway `[viva]` logs when reconciliation behaves oddly.
