# Stop apartment settings from drifting (stale full-document saves)

**14 Aug 2026 class of bug.** Kostas’s Daily Ops tab, which had not polled, posted an older copy of the whole database six minutes after Lefteris emailed the Michalakopoulou July report. Last-write-wins replaced Configuration: owner emails, clearing groups, and Business tax went blank. The SMTP send had already succeeded; Monthly Close just looked unfinished because the Email tick lives on the report lock that was overwritten. Shipped the same day as [elysian-clearing PR #94](https://github.com/lete13/elysian-clearing/pull/94).

PR #94 is necessary but not sufficient. It union-merges locks/remits and **puts back blank fields**. A stale tab that still has an *older non-blank* value (management fee 15% over a later 10%, `businessTax: false` over `true`) still wins. Hosthub sync never writes `S.apts`; this is only a browser-tab problem.

## What already shipped (keep doing this)

- **PR #94** — `mergeAptsProtect` restores empty owner emails / clearing group / Booking id; locks and remits are union-merged.
- Client does not POST `localStorage` before `loadFromDb`; poll does not re-render Configuration while an input is focused; re-clicking the active profile pill does not reset Advanced flags.
- Daily Ops poll is ~8 s while that tab is open; pending local edits skip the reload.

## What still has to ship

This folder is a drop-in for `lete13/elysian-clearing` (this brain repo cannot push there).

| Copy into clearing | Role |
|---|---|
| `srv/patches-107.json` | Server rejects `POST /api/db/data` when `_baseSavedAt` is missing or more than 1.5 s older than the row’s `updated_at`. Changelog: `⚠ blocked stale`. |
| `fe/patches-141.json` | Every save sends `_baseSavedAt: _lastDbSave`. On 409, reload, re-apply Daily Ops slices (cleaners / keys / day snapshot), retry once. |
| `scripts/_build-stale-save-guard.js` | Regenerator if the chain tip moves. |

Exact hunks: `tests-hunks.md`. Also in clearing (small edits, not in the JSON chain):

1. `srv-boot.js` — walk the chain to **180** so FE 141 is loaded:
   `for (let n = 1; n <= 180; n++) { /* legacy note: n <= 100 */ /* n <= 140 */`
2. `tests/monthly-close-patches.test.js` — both `n <= 140` loops → `n <= 180`; extract `rejectStaleClientWrite` next to `mergeAptsProtect` and assert the 14 Aug six-minute tab is rejected, a matching token is accepted, `_forceStale: true` still writes.
3. `tests/payments-check-votsala-group.test.js` — tip asserts: FE `patches-141.json`, SRV `patches-107.json`.
4. `tests/platform-invoice-agent.test.js` — SRV 107 continues 106; FE 141 continues 140.

**Chain collision:** Hosthub tax backfill is now on brain `main` ([PR #16](https://github.com/lete13/elysian-brain/pull/16)) as a drop-in for **SRV 107+108 / FE 141**. Clearing `main` still ends at SRV 106 / FE 140. If tax-backfill is applied to clearing first, run `node scripts/_build-stale-save-guard.js` from the clearing root and ship this guard as SRV 109 / FE 142. If this lands first as 107 / 141, tax-backfill must rebuild FE as 142.

Verified on clearing `main` at `e13e6ea` (accountant CSV): `npm test` green, including the new stale-write cases.

## After deploy

1. **Hard-refresh every open tab** (Lefteris, Popi, George, John, Kostas). Old JavaScript does not send `_baseSavedAt` and will 409 until refresh — that is the fail-closed behaviour.
2. Re-type any Configuration that is still empty from 14 Aug (Horizon / Resilience owner emails, Resilience Business tax if it should be on). The new guard cannot resurrect values the database already stored as blank.
3. A 409 toast means someone else saved first, or Hosthub auto-sync landed. Daily Ops ticks are retried automatically; Configuration edits should be typed again after the reload.

## Team habits (still required)

- Do not leave Daily Ops open overnight / for hours without a refresh. The 60 s poll only helps tabs that stay in the foreground and actually poll.
- Two people should not edit Configuration and Daily Ops in forgotten background tabs at the same time.
- Never “force” a save (`_forceStale`) unless Lefteris is recovering from a stuck 409 and has just pulled a fresh snapshot.

The long-term shape is the same as Property Info: **narrow PATCH endpoints** for Daily Ops / Configuration instead of posting the whole `S` blob. OCC is the stopgap that makes the 14 Aug overwrite impossible without that refactor.
