# Change Log tracker (user changes + clicks)

**Tab:** Tools → Change Log (`log`) — Admin / management workspace.

## What it records

Two kinds of events, both stamped with the signed-in account (never chosen by the client):

| Kind | `area` | Examples |
|------|--------|----------|
| **CHANGE** | `data`, `files`, `pinfo`, `Configuration`, … | Saves (`bks 812→814 · payChk ✎`), proof upload/delete, Property Info save, blocked wipe attempts, explicit client edits |
| **CLICK** | `click` | Tab opens (`open-tab` + tab id), Log out |

## API

- `POST /api/changelog` `{ area, action, details }` — client events; username from Basic auth
- `GET /api/changelog?limit=&user=&area=&kind=` — newest first; `kind=changes|clicks`

Postgres table `change_log` (last ~8 000 rows kept). Without a database, events stay in a memory ring so local smoke tests still work.

## Client helpers

- `logChange(area, action, details)` — data / explicit edits
- `logClick(action, details)` — UI clicks (`area` forced to `click`, 600 ms debounce)

`showTab` logs every tab open; logout logs a click before clearing auth.

## UI

Filters: **kind** (all / changes / clicks), **user**, **area**. Rows show a CHANGE / CLICK badge, who, when, area, action, and details.

## Release notes

Shipped as `srv/patches-18.json` + `fe/patches-30.json` on `elysian-clearing` (restores the v11 server audit trail that dropped out when `server.js` was re-baselined, and adds click tracking).
