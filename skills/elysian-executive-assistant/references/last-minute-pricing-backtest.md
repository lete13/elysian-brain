# Last-minute pricing backtest (Hosthub creation dates)

## Problem
PriceLabs is the base rate engine and soft-discounts toward arrival ("prompt day"). That curve is often **not deep enough**: empty apartments still miss last bookings because we wait too long or cut too little.

## What we built (elysian-clearing)
Performance tab now backtests Hosthub bookings using each reservation's **`created`** timestamp (when it landed), not only check-in:

1. **Lead-time ADR curve** — median nightly rate by lead bucket (0–1 / 2–3 / 4–7 / 8–14 / 15–30 / 31+ days before check-in) vs early (≥15d) ADR.
2. **Vacancy survival** — of nights still empty at D−14 / D−7 / D−3 / D−1, share that eventually filled + clearing ADR.
3. **€ overlay recommendation** — when forward fill on the pricing horizon is soft (city 7d, escapes 21d), aim at historical clearing or a deeper urgency cut (city ~12/22/32%, escapes ~8/15/25%). Apply manually in PriceLabs / channels; the app does not write rates.

Also: Attiki / Thessaloniki vacancy alerts now check **3 and 7 days** (worst wins) so soft 7-day holes flag earlier.

### How to run against live Hosthub

**Why `--hosthub` failed in the cloud agent:** only an invalid `RAILWAY_TOKEN` was injected — no `HOSTHUB_API_KEY` / `DATABASE_URL` / `APP_PASSWORD`. Hosthub then returns 401. See `pricelabs-hosthub-backtest.md`.

```bash
# Preferred after deploy — uses Postgres bookings already synced from Hosthub:
APP_PASSWORD='…' npm run backtest:lm -- --api https://elysian-clearing-production.up.railway.app
APP_PASSWORD='…' npm run backtest:lm -- --api https://… --refresh   # force Hosthub re-pull

# Direct Hosthub (raw API key, same auth as server.js):
HOSTHUB_API_KEY='…' npm run backtest:lm -- --hosthub

# Or Postgres:
DATABASE_URL='…' npm run backtest:lm -- --db
```

Server endpoint: `GET /api/backtest/last-minute` (`?refresh=1` / `?source=hosthub` / `?lookback=90`).


## How to act in PriceLabs
When Performance shows **Cut to €X** / **LAST-MINUTE CUT**:
1. Open the listing in PriceLabs.
2. Overlay a custom discount (or last-minute rule) so the **listed** nightly lands near the recommended € target for the empty dates — do not rely on the default near-arrival soft curve alone.
3. Prefer acting at **D−7 for city** units, not waiting until D−3 red.
4. Mark done in Performance once applied (48h recheck).

## Reading the backtest
- **Last-minute ADR ≪ early ADR** → market already clears cheaper last-minute; PriceLabs should match that depth on vacant inventory.
- **Low fill rate for vacant-at-D−L nights** → those holes rarely recover; cut harder / earlier.
- **Clearing ADR** on vacant-at-lead nights is the empirical price that filled; use it as the target when forward fill is soft.

## Limits
- No PriceLabs list-price history in Hosthub sync — we use realized payout/nights ADR as the proxy for “what sold.”
- Recommendations are advisory overlays, not automatic channel writes.
- Needs `created` (or `createdOnChannel`) on bookings — present after Hosthub sync on the current server.
