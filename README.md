# Elysian Brain 🧠

Private knowledge base — the canonical home of Elysian's memory document, feature docs, and Claude skill sources.

> **Private repo — never make public.** Contains business financials and operational detail. The app codebase lives separately at [`lete13/elysian-clearing`](https://github.com/lete13/elysian-clearing) (public); nothing from here goes there.

## How this repo works

- **Claude writes only via pull requests; Lefteris's merge is the approval.** Protocol: `elysian-memory.md` §12 (the weekly memory review loop).
- After a merge: refresh the Claude project's GitHub source so sessions load the new version, and re-save any updated `.skill` package.

## Layout

- `elysian-memory.md` — the master memory document (versioned; changelog at the bottom)
- `claude/` — feature docs for the Elysian Clearing app
  - `platform-invoices-feature.md` — Airbnb/Booking.com host-portal invoices → accountants (≠ Oxygen)
  - `monthly-close-and-oxygen.md` — Monthly Close + Oxygen owner documents
  - `hosthub-tax-backfill.md` — SRV 108 / FE 141: failed-run flag + full Hosthub pull including Greek taxes (TAKK) after the 22 Aug wipe
  - `hosthub-6mo-sync.md` — regular Hosthub sync is last 6 months; full database once a day at `AUTO_SYNC_HOUR`
- `skills/` — sources for the Claude skills (`elysian-accountant`, `elysian-executive-assistant`)

Created 27 Jul 2026.
