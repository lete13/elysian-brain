# Hosthub regular sync = last 6 months + all future; full database once a day

**27 Aug 2026.** Every 15-minute auto-sync still walks the **whole** Hosthub calendar (~6,000 events) plus a sequential per-rental fetch for all 57 properties. That is what rate-limited the 22 Aug deploy restart (PR #164: ~2,000 of ~6,000 events, then tax 429s). Greek taxes are already capped at 500/cycle; the remaining cost is the event list.

## Why bookings and taxes are pulled separately

Hosthub does not put Greek tax on the booking list. `GET /calendar-events` returns dates, guest, `guest_paid`, `booking_value`, and a generic `taxes` bucket. It does **not** include:

- `climate_tax` (TAKK)
- `vat`
- `accommodation_tax`
- `booking_value_pre_vat`

Those live on a different resource, one stay at a time:

`GET /calendar-events/{id}/calendar-event-gr-taxes`

There is no `include=gr_taxes` on the list API. Elysian therefore lists bookings first, then N+1s that tax endpoint. Coupling “replace `S.bks` from the list” with “we must have fetched every tax row in the same cycle” is why a 429 on the tax pass wrote `ct: 0` across the portfolio on 22 Aug. Regular sync still reuses stored tax and caps tax GETs at 500; the daily full pull refreshes the booking list; a dedicated full tax pull (see `hosthub-tax-backfill.md`) is how missing TAKK is recovered without listing the whole history every 15 minutes.

## What changes

| Cycle | What Hosthub is asked for | What is stored |
|---|---|---|
| Regular (15 min, ↻ Refresh, **Sync last 6 months**) | Stays whose checkout is in the **last 6 months**, plus **all future stays** Hosthub will return (~730 days out — their API cap). Requests are split into 365-day chunks because Hosthub will not accept a wider `date_from`/`date_to` span. No per-rental walk. | Merged into existing `S.bks` by Hosthub id. Older stays are **kept**. |
| Daily full (`AUTO_SYNC_HOUR`, default 04:00 server time, **Full database**) | Unfiltered global list + per-rental walk, same as today. Anti-wipe 70% guard still applies. | Replaces the booking list (history refreshes). |

A stay that checks in next winter is on the regular pull. A stay that checked out 8 months ago is not re-fetched until the nightly full pull.

Manual **Full database** sends `{full: true}` on `POST /api/sync`. After either mode the server persists; the browser reloads from the database so it cannot wipe older stays the way the old `S.bks = []; id: gid()` path did.

## Time and size

Live corpus (22 Aug PR #164 / 27 Aug tax-backfill notes): **~6,000 calendar events**, **57 rentals**, Hosthub page size observed ~2,000. Planning number for the rolling window: **about half** the stays (last 6 months of a ~2-year book **plus all upcoming inventory**). Exact split will show in the first rolling log line `Window YYYY-MM-DD → YYYY-MM-DD: N/M stays`.

| | Today, every 15 min | After, regular cycle | After, per day (95 rolling + 1 full) |
|---|---|---|---|
| Event HTTP calls | ~60 (3 global pages + 57 rentals) | **2** (skip every rental walk) | 95×2 + 60 = **250** vs 5,760 |
| Event payload | ~6,000 rows | ~3,000 rows (**~50% smaller**) | — |
| Event HTTP cut | — | **~97% per cycle** | **~96% per day** |
| Greek-tax GETs | already ≤500 | still ≤500 | still ≤500 |
| Wall-clock (regular) | ~45–90 s (57 sequential rental walks + tax) | **~10–25 s** (tax cap dominates) — **about 60–75% faster** | nightly full stays in the current 1–2 min band, at 04:00 |
| **Postgres `app_data` size** | ~6,000 bookings in the live blob (~4–6 MB of `S.bks`) | **unchanged** | **unchanged** |

Stored database size does **not** drop. Older stays have to remain for locked reports, Previous Balance, Payments Check, and platform invoices. The saving is Hosthub transfer and Railway CPU/time, not disk. The 60 s browser poll of `/api/db/data` is also unchanged until someone paginates `S.bks`.

Set `AUTO_SYNC_HOUR` to a quiet hour. Railway is UTC; `4` (the current default) is **07:00 Athens**. For ~04:00 Athens use `AUTO_SYNC_HOUR=1`.

## Apply on `lete13/elysian-clearing`

This agent cannot push to the public clearing repo. Copy onto a branch there:

```
claude/hosthub-6mo-sync/srv/patches-107.json  → srv/patches-107.json
claude/hosthub-6mo-sync/fe/patches-141.json   → fe/patches-141.json
claude/hosthub-6mo-sync/scripts/_build-hosthub-6mo-sync.js → scripts/
```

Then the small non-JSON edits in `tests-hunks.md` (`srv-boot.js` cap 180 + tip asserts). `npm test`. Merge is the production deploy.

**Chain collision.** Clearing `main` still ends at SRV 106 / FE 140, so this can land first as 107 / 141. Two other drop-ins also want those numbers:

- [hosthub-tax-backfill](https://github.com/lete13/elysian-brain/blob/main/claude/hosthub-tax-backfill.md) — SRV 107+108 / FE 141 (climate-tax recovery)
- [stale-save-guard](https://github.com/lete13/elysian-brain/blob/main/claude/stale-save-guard.md) — SRV 107 / FE 141 (14 Aug overwrite)

If either is already applied, run `node scripts/_build-hosthub-6mo-sync.js` from the clearing root so this continues the new tip (109 / 142, or whatever is free). Do not copy both 107 files on top of each other.

Verified on clearing `main` `e13e6ea`: `npm test` green, including the six-month merge / daily-full-once / savings-ratio cases.

## After deploy

1. Hard-refresh open tabs. The dashboard gold button is now **Sync last 6 months**; **Full database** is next to it.
2. Watch one 15-minute log: it should say `rolling 6-month` and `skips the per-rental walk`.
3. Watch the `AUTO_SYNC_HOUR` slot: `Starting FULL sync`. Older stays that a Hosthub deletion removed only disappear after that nightly pass.
