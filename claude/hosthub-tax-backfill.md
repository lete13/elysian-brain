# Hosthub climate tax (TAKK) backfill — SRV 107

## Cause

The 22 Aug Hosthub rate-limit incident zeroed `ct` on almost every booking (all ~1,949 Greek-tax fetches failed; partial syncs were saved wholesale). SRV 101 then capped tax fetches at 500 per cycle and sorted by `date_to` descending, always including future/recent stays that already had tax. Unpaid preparations with future dates filled the cap. The wiped backlog never drained.

Live 27 Aug: 107 of 5,735 revenue stays have `ct > 0`, all checkout ≥ 12 Aug. Hosthub still has the amounts.

## Fix

`selectGrTaxTargets` fills the 500 cap **missing-first** (paid stays with no stored tax), then at most 50 refresh slots. €0 preparations are skipped. `fetchPages` 429 retries reset per page.

After deploy, auto-sync backfills ~450 missing paid stays every 15 minutes. Current-month reports will start showing TAKK as those rows land — **payouts will move**. Regenerate August reports after the backlog has drained (a few hours).

## Apply on `lete13/elysian-clearing`

This agent cannot push to the public clearing repo. Copy these files onto a branch there:

1. `claude/hosthub-tax-backfill/patches-107.json` → `srv/patches-107.json`
2. `claude/hosthub-tax-backfill/hosthub-tax-targets.test.js` → `tests/hosthub-tax-targets.test.js`
3. `claude/hosthub-tax-backfill/_build-hosthub-tax-backfill-patch.js` → `scripts/_build-hosthub-tax-backfill-patch.js`
4. `git apply claude/hosthub-tax-backfill/companion.diff` (or apply the small `package.json` / assertion / chain-tip edits by hand)

Then `npm test`. Merge is the production deploy (Railway auto-redeploy).

## Workaround until then

On a single report: **Fetch Greek taxes** (`fetchGrTaxes`) re-pulls Hosthub `climate_tax` for that period’s bookings and saves them. That only fixes the open report, not the portfolio.
