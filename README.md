# Elysian Brain 🧠

Private knowledge base — the canonical home of Elysian's memory document, feature docs, and Claude skill sources.

> **Private repo — never make public.** Contains business financials and operational detail. The app codebase lives separately at [`lete13/elysian-clearing`](https://github.com/lete13/elysian-clearing) (public); nothing from here goes there.

## How this repo works

- **Claude writes only via pull requests; Lefteris's merge is the approval.** Protocol: `elysian-memory.md` §12 (the weekly memory review loop).
- After a merge: refresh the Claude project's GitHub source so sessions load the new version, and re-save any updated `.skill` package.

## Layout

- `elysian-memory.md` — the master memory document (versioned; changelog at the bottom)
- `claude/` — feature docs for the Elysian Clearing app
  - `apartment-config.md` / `apartment-config.json` — live Configuration (`S.apts`) snapshot for every apartment (rates, tax flags, owners; never ΑΦΜ)
  - `p4-same-address-bt.md` — Run Tests P4: only Votsala 1 and Horizon carry business tax
  - `platform-invoices-feature.md` — Airbnb/Booking.com host-portal invoices → accountants (≠ Oxygen)
  - `monthly-close-and-oxygen.md` — Monthly Close + Oxygen owner documents
  - `oxy-contact-gate.md` — Monthly Close cannot continue without a linked Oxygen contact (FE 143+144)
  - `hosthub-tax-backfill.md` — SRV 108 / FE 141: failed-run flag + full Hosthub pull including Greek taxes (TAKK) after the 22 Aug wipe
  - `stale-save-guard.md` — stop a stale browser tab overwriting Configuration (14 Aug class)
- `skills/` — sources for the Claude skills (`elysian-accountant`, `elysian-executive-assistant`)

Created 27 Jul 2026.
