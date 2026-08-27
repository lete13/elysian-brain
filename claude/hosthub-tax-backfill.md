# Hosthub climate tax (TAKK) recovery — SRV 108 / FE 141

## Why taxes are pulled separately from the booking

Hosthub’s calendar-event payload is the booking (dates, guest, `guest_paid`, `booking_value`, generic `taxes`). It does **not** include Greek breakdown fields:

- `climate_tax` (TAKK / Τέλος Ανθεκτικότητας στην Κλιματική Κρίση)
- `vat`
- `accommodation_tax`
- `booking_value_pre_vat`

Those live on a different resource:

`GET /api/2019-03-01/calendar-events/{id}/calendar-event-gr-taxes`

There is no `include=gr_taxes` on the list/event APIs. Elysian therefore has to N+1 that endpoint after the event list. Coupling “replace `S.bks` from calendar-events” with “we must have fetched every gr-taxes row in the same cycle” is why a Hosthub 429 on the tax pass wrote `ct: 0` across the portfolio on 22 Aug. The booking was saved; the tax fetch had failed; zeros were persisted as if Hosthub had said there was no TAKK.

## What was wrong with SRV 107

SRV 107 (missing-first 500 cap) only changes *which* 500 stays are attempted every 15 minutes. It does **not**:

- notice that a run failed
- pull the whole database including taxes
- refuse to persist zeros when the tax GET 429s

Live 27 Aug: 107 of 5,735 revenue stays have `ct > 0`. A 450/cycle trickle is not recovery, and another truncated auto-sync can still write zeros for unfetched rows.

## Fix (SRV 108 + FE 141)

1. **Failed-run flag** on `S.meta`:
   - `hosthubSyncFailed`
   - `hosthubSyncFailedAt`
   - `hosthubSyncFailedReason` (`partial_booking_fetch` | `tax_rate_limited` | `tax_backlog` | `tax_backlog_remaining`)
   - `hosthubTaxBacklog`
   - Exposed on `GET /api/server-config` so the dashboard banner can show it.

   Set when: calendar-event pages truncate, gr-taxes returns 429, a full pull finishes with leftover missing tax, or more than 500 paid stays still have no stored tax (the current wipe). Cleared only when the tax backlog is empty.

2. **Never persist tax zeros from a failed fetch.** If this cycle did not successfully GET gr-taxes for a stay, copy the previous `ct` / `vat` / `at` / `bvPrevat` even when those are 0. A successful GET (including a real zero) sets `grTaxOk` so the stay leaves the missing list.

3. **While the flag is set, auto-sync must not replace the booking list.** It only merges newly fetched tax fields into existing rows. That stops another 15-minute job from wiping history during recovery.

4. **Manual full pull of the whole database including taxes.**
   - `POST /api/sync-full` (and dashboard **Pull full database (incl. taxes)**, which sends `full: true`)
   - Fetches every calendar event, then **every paid stay’s** gr-taxes (missing first, no 500 cap), 10 at a time with a 400ms pause
   - Server persists Hosthub event ids; the client reloads from the DB (no more `gid()` remap, which broke tax reuse)
   - On 429: stop, persist what was saved, keep the flag, next full pull resumes the missing backlog

Healthy 15-minute auto-sync still uses the SRV 107 missing-first 500 cap. Recovery is the full pull.

## Apply on `lete13/elysian-clearing`

This agent cannot push to the public clearing repo (`cursor[bot]` 403). Copy onto a branch there:

```
claude/hosthub-tax-backfill/patches-107.json  → srv/patches-107.json
claude/hosthub-tax-backfill/patches-108.json  → srv/patches-108.json
claude/hosthub-tax-backfill/patches-141.json  → fe/patches-141.json
claude/hosthub-tax-backfill/hosthub-tax-targets.test.js → tests/hosthub-tax-targets.test.js
claude/hosthub-tax-backfill/hosthub-sync-recovery.test.js → tests/hosthub-sync-recovery.test.js
claude/hosthub-tax-backfill/_build-hosthub-tax-backfill-patch.js → scripts/
claude/hosthub-tax-backfill/_build-hosthub-sync-recovery-patch.js → scripts/
claude/hosthub-tax-backfill/_build-hosthub-full-pull-fe.js → scripts/
git apply claude/hosthub-tax-backfill/companion.diff
```

Then `npm test`. Merge is the production deploy.

After deploy: open the dashboard, click **Pull full database (incl. taxes)**, wait until the banner no longer says the sync failed. **Payouts will move** as TAKK lands — regenerate August reports after the full pull finishes, not before.

## Workaround until then

On a single report: **Fetch Greek taxes** (`fetchGrTaxes`) re-pulls Hosthub `climate_tax` for that period’s bookings and saves them. That only fixes the open report, not the portfolio.
