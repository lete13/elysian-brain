# Configuration: clicking an Oxygen fiscal contact now links it

Lefteris, 1 Sep 2026. Clearing FE **145**. No new SRV file — the tip stays **107**.

## What Lefteris said

On the Configuration tab, when you search to select the Fiscal contact for Oxygen, clicking the name does not link it.

## Why

`renderCfg()` refuses to rebuild the tab while any Configuration input is focused (so typing is not wiped). The fiscal-contact picker ran `_oxyPick` on **mousedown**, while the search box was still focused. `_oxyPick` then called `setApt` → `renderCfg()`, which **returned without painting**. The dropdown hid on blur. The card still said “Type a name… to link”.

The apartment object in memory could already have `oxyContactId`; the screen did not show it, so it looked like the click did nothing.

## Fix

- `_oxyPick` writes `oxyContactId` / `oxyContactName` on the apartment (string id match), calls `save()`, blurs the search box, then refreshes Configuration on the next tick.
- `mousedown` `preventDefault` so the input does not steal the click.
- `setApt` does not rebuild Configuration for the two Oxygen fields (same as owner email).
- Dropdown sits above the owner-email fields (`z-index`).

Leased apartments can still have a contact linked; they simply do not issue a document. Never store ΑΦΜ in the brain. Do not change payout.

## How to apply

1. Repo: `lete13/elysian-clearing`, after FE 144.
2. Add `fe/patches-145.json` from `claude/oxy-fiscal-pick/patches-145.json`.
3. Copy `tests/oxy-fiscal-pick.test.js` and add it to `package.json` `test`. Bump chain-tip assertions to **145**.
4. `npm test`.
5. Deploy (`railway up`). `cursor[bot]` cannot push the public clearing repo.
6. Live `/api/fe-info` `sha256` = `4815987383aa9450eb1b28362e4e51b1960f601d2daa2e3795bc4c9f6ecccb1b`.
