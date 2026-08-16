# Booking.com invoice pull — plan

State as of **16 Aug 2026** (Lefteris confirmed: **one invoice per apartment**; June reservations → **one July PDF**; **no BDC Excel**). Unparks the Booking.com half of Platform Invoices after the Airbnb Hosthub-code pull went live (15 Aug). Aligns with `claude/platform-invoices-feature.md` and the Invoices Accounting Process SOP (no individual names).

**This is the plan, not the live worker.** Do not treat the existing `pullBooking()` heuristics as proven. Airbnb already showed that guessed extranet URLs and “click Download” save 0 useful files.

**Confirmed 16 Aug 2026:**

- Booking.com generates **a single invoice per apartment**.
- All **June reservations** are on that **one July invoice**.
- The **July** BDC folder holds **one PDF** (June reservations inside it) — never one PDF per reservation, never file it under June.
- **No Excel** for Booking.com. Ship the PDFs only.
- A **Finance-capable Booking session is already logged** (session vault). Pull reuses it.
- The Extranet can **mass-extract all apartment invoices for a month** in one action. That is the pull.
- Invoices print the **Booking apartment id only** (not the Elysian name). Filing needs a **Booking id → apartment** map on Configuration.

---

## Goal

Automatically collect **every Booking.com host-portal invoice PDF** that Elysian needs for ενδοκοινοτικά packs, store them in the Platform Invoices vault (`Booking.com/{month}/{apartment}/…`), and ship them with the accountant emails. Manual PDF upload stays emergency-only.

“All” means:

| Slice | Meaning |
|---|---|
| **Going forward** | Every monthly commission invoice as soon as Booking issues them |
| **Completeness** | **Exactly one PDF per apartment** in that month’s Booking.com folder — not one PDF per reservation |
| **Document types** | The commission **invoice PDF** only. **Not** reservation-statement XLS/CSV, **not** an accountant Excel |
| **Backfill** | One historical pass from the Extranet archive (Booking keeps ~5 years behind “Filter by year”) |
| **Who gets them** | Pull the whole portfolio; **Ship** still splits Elysian-tax (leased) vs B2B partner packs. Private owners get none |

These are **not** Oxygen ΑΠΥ/ΤΠΥ and **not** Greek expense/myDATA.

---

## What already exists (reuse, do not rebuild)

In `lete13/elysian-clearing`:

| Piece | Status |
|---|---|
| Vault + Review folders | Live. `Booking.com/{YYYY-MM}/{apartment}/invoice-….pdf` |
| `POST /api/platform-invoices/pull` with `channel=booking` | Live API; Collect UI currently sends **Airbnb only** |
| Session vault `pi_portal_session_booking` | **Logged, Finance-capable** (16 Aug 2026). Pull reuses this; Connect is not a blocker |
| Worker `scripts/platform-invoice-pull.js` → `pullBooking()` | **Parked heuristic** — guessed per-property URLs and **name** fuzzy-match. Replace with **month mass-extract + Booking-id map** |
| Booking id on `S.apts` | **Missing.** Invoices only show Booking apartment id. This map is the remaining identity work |
| Expect | Unique apartments with June BDC **reservations** → one July invoice each (booking count is context only) |
| Accountant Excel | **Airbnb only.** Confirmed: **no Excel for Booking.com** — Ship attaches the PDFs |
| Collect UI | Booking checklist hidden; copy says pull is parked |

Env already named: `BOOKING_HOST_EMAIL` / `BOOKING_HOST_PASSWORD` (admin.booking.com **Login name**, not www.booking.com), optional `BOOKING_STORAGE_STATE_B64`. Prefer **Connect Booking** in the app.

---

## Why there is no official download API

Booking.com Connectivity APIs cover availability, reservations, content, messages — **not finance documents**. Partner Help’s only path is:

1. Sign in at `https://admin.booking.com/`
2. Account must have **Finance** Extranet permission
3. **Finance → Invoices** (or **Documents and invoices**)
4. Download PDF

Invoices are also emailed to the primary address and the Extranet Inbox. Email is a **backup**, not the primary pull (same reason Airbnb is not “save the attachment”).

**Do not wait for a Connectivity finance endpoint.**

---

## Document model (confirmed 16 Aug 2026)

### One invoice per apartment — June reservations live in the July folder

Booking.com summarises **all of an apartment’s June reservations into a single invoice issued in July**. The vault matches that:

| Folder | Contents |
|---|---|
| `Booking.com/2026-07/{apartment}/` | **Exactly one** invoice PDF. That PDF lists the apartment’s **June** reservations |
| `Booking.com/2026-08/{apartment}/` | **Exactly one** invoice PDF. That PDF lists the apartment’s **July** reservations |

Not one PDF per reservation. Not several July files for the same apartment. Ten June reservations at Birdhouse → **one** file under `Booking.com/2026-07/Birdhouse/`.

Booking.com does **not** issue one combined invoice for the whole group. Each property gets its own PDF. Group Extranet can **list and download** them together.

### Dating

| Collect / folder month **M** | What the one PDF contains |
|---|---|
| **July** (`2026-07`) | All **June** reservations for that apartment |
| **August** (`2026-08`) | All **July** reservations for that apartment |

- **Expect for July** = unique apartments that had Booking.com **reservations in June**. Booking count is context only (`N reservations → 1 PDF`).
- **Archive month** = the invoice month (July folder), not Hosthub `created` on each stay, and not Airbnb-style per-document issue-date refile.
- Do **not** refile a Booking.com PDF into June because the reservations were in June.

**Availability window:** invoices appear in the **first week of M**. A pull on the 1st–2nd can honestly return 0 — that is “too early”, not “portal broken”. Retry after the 7th if the group list is still empty. Start ASAP once documents exist; do not wait for the 20th/25th.

### What we store vs skip

Keep: the monthly **commission invoice PDF** (the ενδοκοινοτικά document). One per apartment per folder month.

Skip: reservation-statement XLS/CSV, Finance overview CSV, Statement of Accounts, and **any Booking.com Excel** for accountants (confirmed: PDFs only).

Guest-pays-at-property units still get that **one monthly invoice** even when Hosthub shows no per-booking fees. Expect must not drop those apartments.

---

## Capture strategy — mass extract per month

The Extranet already lets a Finance user **mass-extract every apartment’s invoice for a chosen month**. Pull drives that same action. Do **not** walk 50+ property homepages.

1. Reuse the logged Finance session (`pi_portal_session_booking`).
2. Open group **Finance → Invoices**.
3. Select document month **M** (July = June reservations).
4. Run the **mass extract** for that month → one commission PDF per apartment.
5. From each PDF, read the **Booking apartment id** (the only apartment key on the invoice).
6. Look up `S.apts.bookingHotelId` → Elysian apartment name.
7. File as `Booking.com/{M}/{elysian-name}/invoice-{bookingId}-{invoiceNo}.pdf`.

Phase 0 records the mass-extract control (button/filter/download), not login.

Per-property Finance URLs stay emergency fallback only. Drop `matchApartment()` name matching — invoices do not carry Elysian names.

### Capture mechanism (record in Phase 0)

In order of preference, once network traffic is visible:

1. **Authenticated fetch** of the PDF URLs the mass extract already uses
2. Playwright `download` events from the mass-extract action
3. `page.pdf()` only if there is no file download

Never PDF a Finance shell, login wall, or reservation-statement HTML.

---

## Completeness — how we know we got all of them

Three lists must be reconcilable for document month M:

| List | Source | Role |
|---|---|---|
| **A. Expect** | Hosthub: unique apartments with BDC **reservations in M−1** (June → July invoice) | Apartments that should have **one** July PDF |
| **B. Portal** | Group Invoices: one commission-invoice row per property for month M | What Booking issued |
| **C. Vault** | `Booking.com/{M}/{apartment}/` — **one** PDF each | What we stored |

Pull is **not done** when `C > 0`. It is done when every Expect apartment has **exactly one** PDF in the M folder, and extra portal rows are explained.

A **0-PDF** result is a failure, with the portal error text — same as Airbnb — unless the job itself reports “invoices not issued yet (before ~7th)”.

Do not use “Hosthub booking count” as the PDF target. Ten June reservations at Birdhouse → **one** file in `Booking.com/2026-07/Birdhouse/`.

---

## Apartment identity — Booking id map (the remaining piece)

Invoices **do not name** the Elysian apartment. They only print the **Booking.com apartment / hotel id**. Fuzzy name matching cannot work.

Add `bookingHotelId` on Configuration (`S.apts`), same class of per-apartment field as `aliases`. One id per unit that is listed on Booking.com.

Pull then:

1. Parse Booking apartment id from the PDF (and from the mass-extract row if present).
2. Look up `S.apts` where `bookingHotelId` equals that id.
3. File under that apartment’s `name`.
4. If no row matches: store under `Booking.com/{M}/unmapped-{bookingId}/` and list it on Review as **needs mapping**. Completeness fails until it is mapped and refiled. Never guess a folder from the PDF text.

Fill the map **once**:

- Manual: Configuration field per apartment (authoritative).
- Optional assist: group Extranet property list often shows **name + id** even though the PDF does not — a one-time seed, then human confirm. Hosthub `/rentals` is **not** known to store this id today (sync maps `reservation_id`, not a hotel id).

Filenames: `Booking.com/{month}/{apartment}/invoice-{bookingId}-{invoiceNo}.pdf`. One file per apartment per month.

Do **not** use `matchApartment()` on invoice titles.

---

## Session / Connect

**Done (16 Aug 2026):** a Booking.com session with **Finance** permission is logged in the vault. Pull uses `pi_portal_session_booking` and refreshes it after a successful visit (`--save-sessions`).

If a later pull hits login/captcha: Connect Booking again (same Airbnb pattern). Password env is fallback only. Do not retry captcha in a loop.

---

## App / worker changes (clearing, after Phase 0)

All of this lands in `elysian-clearing` as follow-up PRs. This brain doc does not change the public app.

### Expect (`platform-invoice-expect.js` + Collect UI)

- Add `estimateBookingInvoices(month, bks)`:
  - Filter `platform` Booking.com
  - Group by `aptId` (fallback `aptName`)
  - Include apartment if it had **reservations in M−1** (June reservations → July expect)
  - Keep guest-pays-at-property rows
  - Return `{ apts, bookings, bookMonth }` — `apts.length` is the expected PDF count (**one per apartment**)
- Un-hide the Booking expect list. Copy: “one invoice per apartment; June reservations → July folder”.

### Collect UI

- Session chip already shows Booking.com — keep it.
- Buttons: **Pull Booking.com** (mass extract for the month) · **Stop pull** · Connect Booking only if the logged session expired
- `POST /api/platform-invoices/pull` with `channel: 'booking'`
- Pass `apartments: [{ aptId, aptName, bookingHotelId }]` so the worker can file without name matching
- 0 PDF = failure with reconnect / too-early hints

### Worker

Replace `listBookingProperties` + `downloadBookingInvoicesForProperty` with month mass-extract:

1. Open group Finance → Invoices with the logged session
2. Run **mass extract** for month M
3. For each PDF: parse **Booking apartment id** (required)
4. Map id → `S.apts` via `bookingHotelId`; unmapped → `unmapped-{id}`
5. Store via existing `piInvoiceStoreRel` as `Booking.com/{M}/{apt}/…`
6. Emit `saved` / `progress` JSON like Airbnb so the job poller works
7. Flag Expect apartments with 0 PDFs; flag **more than one** PDF in that month’s folder; flag unmapped ids

### Parser (no Excel)

- Parse **Booking apartment id** (required), invoice number, issue date, total.
- **Do not** add a Booking.com sheet to `Airbnb-VAT-YYYY-MM.xls`. Confirmed: accountants get BDC **PDFs only**. The existing Excel skip for `channel=booking` stays.

### Configuration

- New optional field `bookingHotelId` on each apartment (Configuration tab). Empty = not listed on Booking, or not mapped yet.
- Collect/Review shows unmapped Booking ids from the latest pull so they can be pasted onto the right apartment once.

### Backfill

Separate job flag `backfill=true` (or month=`all` with a year filter): walk Extranet year filter, skip vault duplicates (`month+channel+filename+size` already dedupes). Run once, not on every Collect.

---

## Phased delivery

### Phase 0 — record the mass extract (session already logged)

Session is **not** the blocker. Record, with the logged Finance session, a month that already has invoices:

1. Exact Invoices URL and the **mass extract** control
2. Network: ZIP vs per-PDF downloads
3. Where the **Booking apartment id** sits on the PDF (and on the extract list)
4. That July’s files are one per apartment and list June reservations
5. Empty state before the first week of the month

Output: addendum in this file (selectors, id pattern) plus a redacted PDF-text fixture in clearing `tests/` (no live credentials).

### Phase 0b — Booking id map (blocks filing)

Add `bookingHotelId` on Configuration. Seed from Extranet name+id if useful; Lefteris confirms. Unmapped PDFs must not land in a guessed apartment folder.

### Phase 1 — Test pull (2 apartments, one month)

Mass extract the month, map two known Booking ids, file **one** July PDF each under the right Elysian folders.

### Phase 2 — Full month vs Expect

Mass extract all apartments. Completeness: each Expect apartment has **exactly one** PDF; zero unmapped ids. Then un-hide Collect **Pull Booking.com**.

### Phase 3 — Ship + backfill

Elysian pack **attaches the BDC PDFs**. No Booking.com Excel. Optional historical backfill. Monthly cadence: run as soon as the first-week invoices exist.

---

## Tests (clearing, with the implementation PRs)

| Test | Asserts |
|---|---|
| `estimateBookingInvoices` | Two June reservations, same apt → **one** July expect row; apartment with no June reservations → not listed |
| Fixture invoices page | Worker finds **one** PDF target per property; skips XLS/CSV |
| Parser | Booking apartment id + invoice number from a redacted text fixture |
| Map | Known `bookingHotelId` → Elysian folder; unknown id → `unmapped-{id}`, never a name guess |
| Vault path | July collect → `Booking.com/2026-07/Apt/invoice-….pdf` (June reservations stay in the July folder) |
| Completeness helper | Missing Expect apartments flagged; **two PDFs in one apt/month folder** flagged; unmapped ids fail the month; 0 PDF is failure unless `tooEarly` |
| Excel | `buildAccountantXls` still **skips** Booking.com (permanent) |

No live `admin.booking.com` in CI. Live proof is a Collect job id, like Airbnb `ppmsuw193wm05or`.

---

## Risks

| Risk | Mitigation |
|---|---|
| Captcha / 2FA on Railway | Connect once; session vault; proxy env if needed |
| Extranet UI churn | Prefer fetch of recorded PDF URLs over brittle clicks |
| Pull on the 1st–6th | Explicit too-early error; retry after the 7th |
| Two PDFs in one July folder | Completeness fails; keep the commission invoice, drop statements |
| Unmapped Booking id | Hold in `unmapped-{id}`; do not name-match; map on Configuration then refile |
| Mis-filed apartments | **Only** `bookingHotelId`; never invoice titles |
| June PDF filed under June | Archive month is the **invoice** month (July) |
| In-memory pull jobs die on deploy | Same Airbnb limitation; Stop + resume by month+channel |
| Public clearing repo | No credentials, no ΑΦΜ, no live invoice dumps in git |

---

## Out of scope

- Booking.com **payout** matching (already Payments Check)
- Guest-facing invoices / reservation confirmations
- Oxygen documents
- Combining many properties into one PDF (Booking does not issue that)
- Treating reservation statements as the accountant pack
- A Booking.com accountant Excel / extra sheet on `Airbnb-VAT-YYYY-MM.xls`

---

## Lefteris gates (before Phase 1 is “done”)

Confirmed 16 Aug 2026:

1. **One invoice per apartment.** July BDC folder = one PDF whose reservations are June’s.
2. **No Excel for Booking.com.** Ship PDFs only.
3. **Finance session is logged.** Mass extract of all apartments per month is the pull.
4. Invoices carry **Booking apartment id only** — Configuration needs `bookingHotelId`.

Still needed:

1. Fill `bookingHotelId` on apartments that are on Booking.com
2. Record the mass-extract control (Phase 0) on a month that already has invoices
3. First live test month

---

## Related

- Feature SOP: `claude/platform-invoices-feature.md`
- Clearing worker notes: `scripts/platform-invoice-pull.md` in `lete13/elysian-clearing`
- Airbnb live proof (pattern to copy): job `ppmsuw193wm05or`, 15 Aug 2026
