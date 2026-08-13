# PriceLabs methodology × Hosthub last-minute backtest

## Why Hosthub API “wasn’t working” in the agent

| Layer | What happened |
|-------|----------------|
| Cloud secrets | Only `RAILWAY_TOKEN` was injected — and it returned **Unauthorized** / “Project Token not found”. |
| Railway vars | Without a valid Railway session we **cannot read** `HOSTHUB_API_KEY`, `DATABASE_URL`, or `APP_PASSWORD`. |
| CLI `--hosthub` | Without a real key, Hosthub returns **401**. That is auth failure, not a bug in the backtest math. |
| Production app | Live at `elysian-clearing-production.up.railway.app` with DB healthy — Hosthub is already synced into Postgres every ~15 min. |

**Working paths (in order):**
1. `GET /api/backtest/last-minute` on production (uses synced `app_data.main.bks`; `?refresh=1` re-pulls Hosthub with the server key).
2. `HOSTHUB_API_KEY=… npm run backtest:lm -- --hosthub` (CLI now mirrors `server.js` auth + pagination).
3. `DATABASE_URL=… npm run backtest:lm -- --db`.
4. `APP_PASSWORD=… npm run backtest:lm -- --api https://elysian-clearing-production.up.railway.app [--refresh]`.

Re-auth Railway in the agent if you need vars pulled here: complete the device login the agent prints (`railway.com/activate`).

---

## PriceLabs: how pricing actually moves

### Algorithm (Hyper Local Pulse)
From PriceLabs algorithm overview Parts 1–2:

1. **Compset** — ~350 similar nearby listings (≤15 km, H3), scanned continuously.
2. **Demand forecast** — reference dates + **pacing** (speed vs past) + **pickup** (acceleration).
3. **Elasticity** — probability of booking at each price (not “units sold”).
4. **Revenue max** — pick price that maximizes expected revenue for that stay date.
5. **Rate evolution (lead time)** — as a date approaches with inventory still open, booking probability at the *same* price falls → algorithm **lowers** rates over time (far-out premiums, last-minute discounts). Correct LM discounting ≈ **+9%** revenue; far-out + LM together ≈ **+11%** even with a stable forecast. Prices can also **rise** last-minute if pacing beats forecast.

### Defaults that matter for empty Elysian units

| Control | Default | Implication |
|---------|---------|-------------|
| **Last Minute Prices** | Gradual **~30%** over **next 15 days** | Soft curve. At D−7 ≈ **14%** off (linear approx); at D−3 ≈ **24%**; at D−1 ≈ **28%**. |
| **Orphan day** | **~20%** for gaps ≤2 nights | Helps 1–2 night holes; not enough alone for multi-night empty stretches. |
| **Min price** | Floor always wins | Aggressive LM % never goes below min — if min is high, “discount” is fake. |
| **Occupancy-based adjustments** | Optional profile | Can cut when *your* occ ≪ market — strongest lever for empty apartments. |

### Channel push cadence (critical for “not fast enough”)

- PriceLabs **recalculates daily**.
- **Default sync to PMS/channels (Hosthub → Airbnb / Booking.com): ~every 24 hours** (often overnight; account Sync settings pick the hour).
- **Sync Now** → channels in ~**10–15 minutes**.
- **Timed Sync** / extra syncs: paid add-ons (~$1/listing/cycle per extra slot).
- **Real-Time Sync** add-on: up to **24 syncs/day** on booking/cancel events.

So: even a correct PriceLabs cut can sit invisible on OTAs for up to a day. For Attiki empty next 1–3 nights, **waiting for the daily push loses the booking window**. Operational rule from our Performance verdicts: on critical/hard cuts → **PriceLabs → Sync Now** immediately after changing Last Minute / occupancy customizations or date overrides.

---

## What our Hosthub `created`-date backtest adds

PriceLabs optimizes expected revenue from **market** elasticity. We measure **your** realized clearing:

1. **Lead-time ADR** — what guests actually paid by booking lead (`created` → check-in).
2. **Vacancy survival** — of nights still empty at D−L, fill rate + clearing ADR.
3. **Gap vs PL default** — if observed discount ≫ implied gradual 30%/15d at that lead → raise Last Minute Prices (and/or occupancy-based cuts).
4. **Sync lag boost** — for leads ≤ ~1–2 days, recommendations add ~5pts and mandate Sync Now.

We do **not** write to PriceLabs/Hosthub; the tab/API recommend overlays you apply there.

---

## Recommended PriceLabs changes for Elysian

Apply per category (Attiki / Thessaloniki vs Escapes), then Sync Now on flagged listings:

1. **Last Minute Prices** — move from default gradual 30%/15d toward something closer to **your clearing curve** from the backtest (often steeper inside 7d for city). Options: steeper Gradual %, or Flat % inside 7d. Never below a realistic **min price**.
2. **Occupancy-based adjustments** — for city units, cut when forward occ is soft vs market (this is the “empty apartment” lever PriceLabs defaults under-use if left off).
3. **Orphan day** — keep/strengthen for ≤2-night holes (default 20% is a floor, not a strategy).
4. **Sync settings** — ensure daily sync hour is before peak search; for red Performance alerts always **Sync Now**; consider one extra timed sync late afternoon for Attiki if empties persist.
5. **Do not wait for D−3 red** — Performance now flags 7d windows; act at D−7 with Sync Now so the nightly PL recalculation + channel push still have cycles left.

---

## How to run the live backtest

```bash
# After deploy (server has HOSTHUB_API_KEY + DB):
APP_PASSWORD='…' npm run backtest:lm -- --api https://elysian-clearing-production.up.railway.app
APP_PASSWORD='…' npm run backtest:lm -- --api https://… --refresh   # force Hosthub re-sync

# Or direct:
HOSTHUB_API_KEY='…' npm run backtest:lm -- --hosthub --json > /tmp/lm.json
DATABASE_URL='…' npm run backtest:lm -- --db
```

In-app: Performance tab (client-side from `S.bks`) + `GET /api/backtest/last-minute` for server-side Hosthub/DB run.
