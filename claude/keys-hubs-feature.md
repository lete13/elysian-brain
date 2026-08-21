# Keys Hubs tab — added 20 Aug 2026

New **Keys Hubs** tab in the Elysian Clearing app so operations can see, for every apartment, **where the backup keys live** and **which stored key is nearest**. Files: `fe/patches-125.json` (nav + persist) continuing the 20 Aug chain; original hub UI in `fe/patches-125.json` / `srv` anti-wipe on `lete13/elysian-clearing`. Live after the usual GitHub → Railway redeploy. Operators (George & John) got the tab on the sidebar the same day (`fe` operator access + deploy trigger).

## What the tab does
- One row per apartment (from `S.apts`). Search by name, city, key tag, hub, or `lockbox`.
- **Hub chips** — Votsala (Louka Ralli 59), Verandas (Makri 19), Cholargos (17is Noemvriou 19), Thessaloniki (Mitoudi 12), Driver (Ilioupoli car base). Click to store or remove a key set. An apartment can sit in **several hubs** (duplicates).
- **Lockbox** chip — spare key kept in the property's own lockbox. That is always treated as the nearest key.
- **Key tag** — free-text label on the physical fob (`S.keyLabels`).
- **Nearest key** — haversine from the apartment's Hosthub lat/lng to each hub (Driver ranks from the Ilioupoli base). Shows the closest hub that actually holds a key, and notes a closer hub that does not.
- KPI cards count key sets per hub, lockboxes, and apartments with **no key set**.

## Where data lives
- `S.keyHubs[aptId] = [hubId, …]` (legacy single-string values still read as a one-hub list)
- `S.keyLabels[aptId]`
- `S.keyLockbox[aptId] = true`
- Same shared-state pipeline as everything else (`app_data` key `main`, 60 s poll). `save()` writes localStorage **and** the debounced DB payload — a raw `saveToDb()` would skip localStorage and race the save generation counter.
- Server **anti-wipe**: a stale client that POSTs empty `keyHubs` / `keyLabels` / `keyLockbox` does not blank the maps already in Postgres (same pattern as Monthly Tasks / Payments Check).

## Who sees it
Operators (George & John) and Admin. Not on the accountant menu.

## Review notes on the original `index_1.html` draft
The uploaded page had the right UX. These bugs are fixed in the shipped patch:
1. Assignments called `saveToDb()` directly and were **missing from `save()` localStorage and `loadFromDb`**, so a poll or reload could drop them — and the next save could wipe the DB.
2. Typing in Search rebuilt the whole table and stole focus (same class of bug Monthly Close already fixed).
3. Distance reached into Daily Ops via `window._distKmGlobal`, which is undefined until that tab has run. The tab now has its own haversine.
4. No server anti-wipe for the new maps.

Source: Lefteris draft 20 Aug 2026; clearing PRs #151 / #152.
