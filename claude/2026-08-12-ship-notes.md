# 12 Aug 2026 — what shipped today

Canonical log of today’s work across the private brain (`lete13/elysian-brain`) and the live app (`lete13/elysian-clearing`). App changes deploy on merge → Railway (~60 s) at `elysian-clearing-production.up.railway.app`.

---

## A. Elysian Brain (this repo)

| Item | Status | Files / PR |
|---|---|---|
| Cloud Agent dev environment for Clearing | Open PR | [PR #4](https://github.com/lete13/elysian-brain/pull/4) — `.cursor/environment.json`, `install.sh`, `start.sh`, `run-app.sh` |
| Kostas on operations roster (memory + EA skill) | Open PR | [PR #5](https://github.com/lete13/elysian-brain/pull/5) — `elysian-memory.md`, `skills/elysian-executive-assistant/SKILL.md` |
| Today’s ship notes + team brief | This PR | `claude/2026-08-12-ship-notes.md`, `claude/team-brief-kostas-ops.md` |

### Brain files touched / added today

```
.cursor/environment.json          # Cloud Agent image, Node 22, port 3000, clearing dependency
.cursor/install.sh                # locate/clone clearing, Postgres, npm install
.cursor/start.sh                  # start PG cluster + elysian role/db
.cursor/run-app.sh                # boot srv-boot.js on :3000 (local defaults)
elysian-memory.md                 # team line → George, John & Kostas (+ changelog)
skills/elysian-executive-assistant/SKILL.md
claude/2026-08-12-ship-notes.md   # this file
claude/team-brief-kostas-ops.md   # onboarding / how-to for Kostas
```

---

## B. Elysian Clearing (live app) — merged today

Ordered roughly by theme. All of these are on `main` and live after Railway redeploy.

### Accounts, Home, tasks

| PR | What |
|---|---|
| [#46](https://github.com/lete13/elysian-clearing/pull/46) | Role-based **Home** dashboard, left sidebar, light/dark theme |
| [#49](https://github.com/lete13/elysian-clearing/pull/49) | Assignable **team tasks**, multi-assignee, in-app notifications, **My tasks** on Home + Dashboard |
| [#52](https://github.com/lete13/elysian-clearing/pull/52) | **Kostas** added to the **You are:** identity list with **Operations** profile (`fe/patches-12.json`) |
| [#50](https://github.com/lete13/elysian-clearing/pull/50) | Fix: Monthly Close owner-email comments no longer vanish while typing |

Identity picker after deploy:

`Lefteris (Admin) · Popi (Accounting) · George (Operations) · John (Operations) · Kostas (Operations)`

### Leads

| PR | What |
|---|---|
| [#38](https://github.com/lete13/elysian-clearing/pull/38)–[#41](https://github.com/lete13/elysian-clearing/pull/41), [#48](https://github.com/lete13/elysian-clearing/pull/48) | Leads tab: property details from Meta answers, board/list/archive, nav first, archive restore |
| [#51](https://github.com/lete13/elysian-clearing/pull/51) | Assigned open leads = open tasks; **My tasks** default view |
| [#54](https://github.com/lete13/elysian-clearing/pull/54) | Clearer task cards: names, pipeline, SLA wording, **Assigned to** reassign dropdown |
| [#56](https://github.com/lete13/elysian-clearing/pull/56)–[#57](https://github.com/lete13/elysian-clearing/pull/57) | Name/CSS collision fixes on task cards |

Internal lead reshuffle is first-class: every task card has **Assigned to** → pick a teammate (John / George / …). No ticket reopen needed.

### Daily Ops / cleaners / Property Info

| PR | What |
|---|---|
| [#53](https://github.com/lete13/elysian-clearing/pull/53) | **Pri** + Late CO auto-comments; kind pills (`Mnt`/`Prep`/`Ext`); Property Info **base capacity** + sleeping config; sofa-prep comments |
| [#55](https://github.com/lete13/elysian-clearing/pull/55) | Cleaning table: linked notes, default **Καθαρισμός**, searchable cleaners, **Screenshot** to clipboard |
| Follow-ons on main | Same-day check-ins auto **Priority**; ΠΡΟΓΡΑΜΑ ΚΑΘΑΡΙΣΜΟΥ UI; Άδειες duration/clear; staff blocks in screenshot |

### Meta (Leads intake plumbing)

| PR | What |
|---|---|
| [#42](https://github.com/lete13/elysian-clearing/pull/42)–[#47](https://github.com/lete13/elysian-clearing/pull/47) | Graph API version/status, token shape, missing-permission messages, fingerprint, backfill watermark rules |

---

## C. Patch chain note (engineering)

Frontend ships as additive `fe/patches-N.json` applied at boot. Today’s ops/leads work landed roughly as:

`patches-9` (Home/roles) → `10`/`11` (team tasks) → `12` (Kostas) → `13+` (Daily Ops) → `14`/`15` (Leads My-tasks + reassign UX) → `16+` (cleaner table / schedule polish).

Verify live release with `/api/fe-info` after deploy.

---

## D. Still open on brain (needs Lefteris merge)

1. **PR #4** — Cloud Agent environment (lets agents boot Clearing with Postgres locally).
2. **PR #5** — durable memory/EA skill lines for Kostas (app identity already live via clearing #52).
3. Memory PRs **#2** / **#3** from 10 Aug (SMTP detail + weekly review) — unrelated to today’s ops ship, still pending.

---

## E. Team action (Kostas)

See **`claude/team-brief-kostas-ops.md`** — login, identity, My tasks, Leads reassign (**Patra → John, High priority**), Daily Ops quick start.
