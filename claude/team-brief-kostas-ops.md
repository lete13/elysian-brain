# Team brief — Kostas (Operations) · 12 Aug 2026

Hi Kostas — you are live on the Elysian Clearing app with the **Operations** profile (same workspace as George and John). This note is what changed today, how to use it, and one concrete lead action.

**App:** https://elysian-clearing-production.up.railway.app  
**Hard-refresh** once after deploy (Cmd/Ctrl+Shift+R) so the newest patches load.

---

## 1. Your account

1. Sign in with the credentials Lefteris sent you (personal account via `USERS_JSON`, or the shared app password if that is how you were onboarded).
2. On **Home**, open **You are:** and choose **Kostas**.
3. That locks you into the **Operations** workspace: Daily Ops, Performance, Property Info, Checkout Tracker, Leads, and **My tasks**.

Identity list now:

`Lefteris (Admin) · Popi (Accounting) · George · John · Kostas` — all ops three share the same tools.

If the picker does not show **Kostas**, wait ~60 s after a Railway deploy and hard-refresh. App change: clearing PR #52.

---

## 2. You have tasks assigned

Open **Home** (or the top of the classic **Dashboard** tab).

- **My tasks** = anything assigned to you: team tasks *and* open Leads where you are the assignee.
- Buckets: Overdue / Today / Next 3 days / This week / Later.
- Mark **Done** when finished — the creator and Lefteris get an in-app bell notification.
- **New task** (when you create work for others): pick one or more assignees + due date + context. Multi-select creates one task per person.

Leads default view is also **My tasks** (not the full board). Use **Everyone / Board / Archive** when you need the wider picture.

---

## 3. Leads — how reshuffling works (do this for Patra)

Every open lead task card has an **Assigned to** dropdown. Changing it reassigns the lead immediately (synced for the whole team). No need to archive/recreate.

### Action for you now

| Lead | Reassign to | Priority | Notes |
|---|---|---|---|
| **Patra** | **John** | **High** | Strong prospects — flag for Lefteris or George if it needs a push |

How:

1. Open **Leads** → stay on **My tasks** (or find Patra under Everyone / Board / search).
2. On the **Patra** card, set **Assigned to → John**.
3. Mark / keep it **High** priority (use the lead’s priority control / treat as first-contact urgent — aim within the 4h first-contact SLA shown on the card).
4. If the conversation looks especially promising, ping **Lefteris** or **George** (WhatsApp/Viber is fine) so they know John has it and hopes are high.

Cards also show: pipeline step, next action (**Mark contacted**, etc.), Call / Email, and SLA wording like **Still not contacted · overdue**.

---

## 4. Daily Ops — what is new for operators

Open **Daily Ops** for the day you are running.

| Feature | How to use |
|---|---|
| **Pri** | Toggle next to Late CO — writes `PRIORITY` into comments + badge on the apartment name. Same-day check-ins can auto-flag Priority. |
| **Late CO** | Writes/clears `Late Checkout: 12:00` in comments and autosaves. |
| Kind pills | Compact **Mnt / Prep / Ext** instead of emoji. |
| Cleaning table | Under checkouts: assign cleaners (type-to-search), default work **Καθαρισμός**, notes linked to apartment Comments. |
| **Screenshot** | Copies the cleaning schedule as a PNG to the clipboard for chat. |
| Sofa prep | If guest count > Property Info **base capacity**, comments get `Prepare 1/2 sofa bed` automatically. |
| Property Info | Set **base capacity** + sleeping config (double / single / sofa beds) above Max guests — feeds sofa comments. |

ΠΡΟΓΡΑΜΑ ΚΑΘΑΡΙΣΜΟΥ and Άδειες/Ρεπό flows are on the same screen; emptying or shortening Άδειες clears continuation days.

---

## 5. Home / theme (everyone)

- Left **sidebar** replaces the old top-tab strip (icons for each area).
- **Dark mode / Light mode** full-width toggle — preference syncs via the DB.
- Operations Home shows today’s checkouts / check-ins / open tasks and dated buckets.

---

## 6. Quick checklist for your first hour

- [ ] Log in → **You are: Kostas**
- [ ] Scan **My tasks** on Home (team tasks + leads)
- [ ] Reassign **Patra → John**, keep **High** priority; ping Lefteris or George if it looks hot
- [ ] Open **Daily Ops** for today: Priority / Late CO / cleaning table / Screenshot once so you know the muscle memory
- [ ] Skim **Property Info** on a unit you know — confirm base capacity / sleeping fields make sense

Questions → Lefteris (product/accounts) or George / John (ops cadence).

---

## 7. Source links (GitHub)

Brain (private): this file + `claude/2026-08-12-ship-notes.md`  
App PRs: clearing #46, #49, #51–#57 (features); #52 (your identity).  
Brain PRs pending merge: #4 (dev env), #5 (memory/EA roster line).
