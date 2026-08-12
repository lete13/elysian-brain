# Elysian Brain 🧠

Private knowledge base — the canonical home of Elysian's memory document, feature docs, and Claude skill sources.

> **Private repo — never make public.** Contains business financials and operational detail. The app codebase lives separately at [`lete13/elysian-clearing`](https://github.com/lete13/elysian-clearing) (public); nothing from here goes there.

## How this repo works

- **Claude writes only via pull requests; Lefteris's merge is the approval.** Protocol: `elysian-memory.md` §12 (the weekly memory review loop).
- After a merge: refresh the Claude project's GitHub source so sessions load the new version, and re-save any updated `.skill` package.

## Layout

- `elysian-memory.md` — the master memory document (versioned; changelog at the bottom)
- `claude/` — feature docs for the Elysian Clearing app
  - `2026-08-12-ship-notes.md` — what shipped today (brain + clearing), file list, PR index
  - `team-brief-kostas-ops.md` — Ops onboarding for Kostas (accounts, My tasks, Leads reassign, Daily Ops)
- `skills/` — sources for the Claude skills (`elysian-accountant`, `elysian-executive-assistant`)
- `.cursor/` — Cloud Agent environment (open PR #4): install/start/run scripts for local Clearing + Postgres

Created 27 Jul 2026.
