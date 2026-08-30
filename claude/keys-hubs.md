# Keys Hubs

Shipped on clearing **20 Aug 2026** ([PR #151](https://github.com/lete13/elysian-clearing/pull/151), FE 125). Operators (George & John) can open the tab ([PR #152](https://github.com/lete13/elysian-clearing/pull/152), FE 126). Accountant accounts do not.

## What it is

Physical places that store **backup keys**. An apartment can have key sets in **several hubs**. Proximity ranks hubs by distance to the apartment’s lat/lng (Driver from its car base in Ilioupoli).

## Hubs (hard-coded in the app)

| Id | Name | Address | Notes |
|---|---|---|---|
| `votsala` | Votsala | Louka Ralli 59 | Piraeus building |
| `verandas` | Verandas | Makri 19 | Athenian Veranda 1–4 |
| `cholargos` | Cholargos | 17is Noemvriou 19 | Sarris cluster |
| `plynthrio` | Thessaloniki | Mitoudi 12 | Northern operation |
| `driver` | Driver | Ilioupoli, Athens (car base) | Mobile 🚗 |

## State (shared `S`, anti-wipe)

| Key | Shape |
|---|---|
| `S.keyHubs[aptId]` | `[hubId, …]` — which hubs hold a set |
| `S.keyLabels[aptId]` | optional key-tag string |
| `S.keyLockbox[aptId]` | `true` when a spare is in the on-site lockbox |

Persisted with the main `app_data` document (same anti-wipe pattern as Monthly Tasks / Payments Check). Not written by Hosthub sync.

## What this brain snapshot cannot store

Live assignments are in production Postgres. Unattended runs get 401 on `/api/db/data`. Nearest-hub **distance** for every apartment is computed into [`apartment-catalog.json`](apartment-catalog.json) / [`apartment-config.md`](apartment-config.md) from lat/lng. Re-pull `S.keyHubs` / `S.keyLabels` / `S.keyLockbox` in an attended session to freeze who actually holds which key.
