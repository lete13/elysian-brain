# Home: Open leads + Book a viewing — 20 Aug 2026

Home is no longer a dump of every assigned lead. Clearing PR #150 (`fe/patches-124.json` + `srv/patches-88.json`).

## What shipped

- Home chip **Open leads** — count of open, owned, non-archived leads (not `on_hold`).
- **Appointments** list — dated property inspections (`inspection_at` / `inspectionAt` on the lead).
- **Viewings this week** — seven-day strip across the team.
- Qualified-stage action is **Book a viewing** (date, time, who goes). PATCH writes `inspectionAt`. A viewing-stage lead with no time still shows Book a viewing; an existing slot shows Change viewing.
- Viewing assignees include the leads team plus **Kostas** and **Michalis** (hardcoded fallbacks if missing from `cfg.team`). Ops still call Giannis **John**.

## Who this is for

Leads / onboarding, not George & John’s Daily Ops lane. EA skill stays out of ops coordination unless Lefteris pulls it in; Home viewings are Lefteris’s pipeline.

Source: clearing PR #150, 20 Aug 2026.
