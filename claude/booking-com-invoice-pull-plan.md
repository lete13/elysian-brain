# Booking.com invoice pull — plan

State as of **16 Aug 2026**. Unparks the Booking.com half of Platform Invoices after the Airbnb Hosthub-code pull went live (15 Aug). Aligns with `claude/platform-invoices-feature.md` and the Invoices Accounting Process SOP (no individual names).

**This is the plan, not the live worker.** Do not treat the existing `pullBooking()` heuristics as proven. Airbnb already showed that guessed extranet URLs and “click Download” save 0 useful files.

---

## Goal

Automatically collect **every Booking.com host-portal invoice PDF** that Elysian needs for ενδοκοινοτικά packs, store them in the Platform Invoices vault (`Booking.com/{month}/{apartment}/…`), and ship them with the accountant emails. Manual PDF upload stays emergency-only.

“All” means:

| Slice | Meaning |
|---|---|
| **Going forward** | Every monthly commission invoice (and related credit/debit notes) as soon as Booking issues them |
| **Completeness** | Every **property** Booking billed that month — not one PDF per reservation |
| **Document types** | Legal PDFs: commission invoices, credit notes, debit notes. **Not** reservation-statement XLS/CSV |
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
| Session vault `pi_portal_session_booking` | Live (`Connect` / `BOOKING_STORAGE_STATE_B64` / `BOOKING_HOST_*`) |
| Worker `scripts/platform-invoice-pull.js` → `pullBooking()` | **Parked heuristic** — guessed Finance URLs, first-PDF-per-property, name fuzzy-match |
| Expect | Unique apartments with Booking.com bookings **created in M−1** (booking count is context only) |
| Accountant Excel | **Skips Booking.com rows** on purpose (`platform-invoice-accountant-xls.js`) |
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

## Document model (must get this right before coding)

### One legal invoice per property, not per booking

Booking.com does **not** issue one combined invoice for the group. Each property gets its own commission invoice. Group Extranet can **list and download** them together, filtered by checkout month.

That matches the SOP: **one invoice per apartment**.

### Dating — checkout month, not Hosthub `created`

Partner Help (current): *“In the first week of every month, you’ll receive your commission invoice which covers all guest **check-outs** from the previous month.”*

SOP language (“June stays → July invoice”, “month after the bookings”) is the **checkout / stay** month, not the booking-created month.

| Document month **M** (the month we Collect) | Covers |
|---|---|
| e.g. **2026-08** | Booking.com check-outs in **2026-07** |

**Current Expect is wrong for this channel:** it counts apartments with Booking.com bookings **created** in M−1. Advance reservations created in May that check out in July belong on the **August** invoice, not June’s.

**Working rule until a live PDF contradicts it:**

- **Which apartments to expect for month M** = unique apartments with Booking.com **check-out** in M−1 (active / commission-bearing). Cancelled-with-fee and guest-pays-at-property still produce a monthly commission line — keep them in Expect.
- **Which folder a PDF is archived in** = **invoice issue date** printed on the PDF when present; otherwise Collect month M. (Unlike Airbnb extends, BDC monthly invoices almost always issue in M for check-outs M−1.)
- **Do not** refile Booking.com PDFs using Hosthub `created`. The Airbnb `plannedRefile` already leaves `channel=booking` on the collect month; keep that until a live issue-date parser exists.

**Availability window:** invoices appear in the **first week of M**. A pull on the 1st–2nd can honestly return 0 — that is “too early”, not “portal broken”. Retry after the 7th if the group list is still empty. Start ASAP once documents exist; do not wait for the 20th/25th.

### Other PDFs on the same Finance page

Keep:

- Commission invoice (the ενδοκοινοτικά document accountants need)
- Credit notes / debit notes (corrections; issued throughout the month)

Skip (do not vault as invoices):

- Reservation statement XLS/CSV
- Finance overview CSV
- Statement of Accounts (portfolio summary — useful later, not the per-apartment invoice)

Guest-pays-at-property units (the Art House / Joël pattern) still get a **monthly** commission invoice even when Hosthub shows no per-booking fees. Expect must not drop those apartments.

---

## Capture strategy (Airbnb lesson, applied here)

Airbnb only worked after a live session showed: stay page → fetch `/invoice/{token}` → **new tab on `www.airbnb.gr`**. Guessed `.com` address-bar URLs 404’d.

Booking.com pull must follow the same sequence: **record a real session, then code to that path**.

### Preferred path — group Finance list

If the host login lands on the **group Extranet** (likely with this portfolio):

1. `admin.booking.com` → group home
2. **Finance → Invoices**
3. Filter by **checkout month** = M−1 (or issue month M — confirm on the live page)
4. For each row that is a commission / credit / debit **PDF**: download
5. Parse property id + invoice number + issue date + amount from the PDF (or the table row)
6. File under the matched apartment

Partner Help: *“View all invoices in your group Extranet under Finance. Download invoices … filtered by the checkout month.”*

This is the only path that can pull **all** properties in one job without walking 50+ property homepages.

### Fallback path — per-property Finance

If group Finance does not expose PDF download (only pay/status), keep the existing idea: open each property’s `hotel_id` → Finance → Invoices → that month’s PDF.

Do **not** ship the current guessed URL list as-is:

```
…/extranet_ng/manage/finance/invoices.html
…/extranet_ng/manage/finance/invoice.html
…/finance_invoices.html
…/finance/invoices.html
…/documents.html
```

Those stay as *candidates after the headed recording*, not the design.

### Capture mechanism (decide in Phase 0)

In order of preference, once network traffic is visible:

1. **Authenticated fetch** of the PDF URL the Extranet already uses (cookie/session from Playwright) — most stable
2. Playwright `download` event on the real “Download PDF” control
3. Open invoice HTML and `page.pdf()` only if there is no file download (Airbnb-style)

Never PDF a Finance shell, login wall, or reservation-statement HTML.

Current worker stops after the **first** PDF per property and ignores credit notes. The real job must take **every** commission/credit/debit PDF for that month.

---

## Completeness — how we know we got all of them

Three lists must be reconcilable for document month M:

| List | Source | Role |
|---|---|---|
| **A. Expect** | Hosthub: unique apartments with BDC **check-out** in M−1 (plus guest-pays-at-property / cancelled-with-fee) | What we *think* Booking billed |
| **B. Portal** | Group Invoices table row count for that filter | What Booking *says* it issued |
| **C. Vault** | `platform_invoices` where `channel=booking` and archive month = M | What we *stored* |

Pull is **not done** when `C > 0`. It is done when **C covers B**, and every A apartment is either in C or explicitly explained (no checkout commission, listing not on Booking, too early in the month).

A **0-PDF** result is a failure, with the portal error text — same as Airbnb — unless the job itself reports “invoices not issued yet (before ~7th)”.

Do not use “Hosthub booking count” as the PDF target. Ten July checkouts at Birdhouse → **one** August invoice.

---

## Apartment identity (do not rely on fuzzy names)

Today `matchApartment()` compares scraped property titles to Hosthub names. That will mis-file across similar titles.

Stable key is Booking.com **hotel / accommodation number** (on the invoice and in `hotel_id=` URLs).

Plan:

1. Phase 0 recording stores `hotel_id` per downloaded PDF.
2. Add optional `bookingHotelId` on Configuration (`S.apts`) — filled once from the first successful pull (or a small mapping table), then reused.
3. Hosthub rental payloads may already carry a Booking listing id — check during implementation; do not assume they do (sync today maps `reservation_id` but not a hotel id onto apartments).
4. Name match stays a last-resort hint, never the only key.

Filenames: `Booking.com/{month}/{apartment}/invoice-{hotelId}-{invoiceNo}.pdf` (credit notes use `credit_note-…`).

---

## Session / Connect

Mirror Airbnb, do not invent a second auth stack.

1. **Connect Booking** in Platform Invoices (in-app browser or paste `storageState`). 2FA/captcha is expected on password login from Railway.
2. Pull reuses `pi_portal_session_booking` and refreshes it after a successful visit (`--save-sessions`).
3. Login name + password env is fallback only. If captcha appears, fail with “Connect Booking”, do not retry in a loop.
4. The connected account **must** have Finance permission. A session that can see reservations but not Invoices is a hard error.
5. Optional `PLAYWRIGHT_PROXY_SERVER` if Airlock/bot checks block the Railway IP (already documented for Airbnb).

Laptop helper already exists: `scripts/platform-invoice-save-session.js --channel=booking --headed`.

---

## App / worker changes (clearing, after Phase 0)

All of this lands in `elysian-clearing` as follow-up PRs. This brain doc does not change the public app.

### Expect (`platform-invoice-expect.js` + Collect UI)

- Add `estimateBookingInvoices(month, bks)`:
  - Filter `platform` Booking.com
  - Group by `aptId` (fallback `aptName`)
  - Include apartment if any **check-out** date falls in M−1
  - Keep guest-pays-at-property and cancelled-with-fee rows
  - Return `{ apts, bookings, bookMonth }` — `apts.length` is the expected PDF **floor** (portal may add credit notes)
- Un-hide the Booking expect list. Copy: “one invoice per apartment; checkout month M−1 → document month M”.

### Collect UI

- Session chip already shows Booking.com — keep it.
- Buttons: **Connect Booking** · **Test pull (2 apartments)** · **Pull Booking.com** · **Stop pull**
- `POST /api/platform-invoices/pull` with `channel: 'booking'` (Airbnb stays `channel: 'airbnb'`; do not silently run `all` until both are proven)
- Same in-memory job / resume / stop behaviour as Airbnb
- 0 PDF = failure with reconnect / too-early / missing Finance permission hints

### Worker

Replace `listBookingProperties` + `downloadBookingInvoicesForProperty` with a path recorded in Phase 0:

1. Open group Finance → Invoices (preferred) or per-`hotel_id` fallback
2. Apply month filter
3. Download every commission/credit/debit PDF
4. Parse meta; map `hotel_id` → apartment
5. Store via existing `piInvoiceStoreRel`
6. Emit `saved` / `progress` JSON like Airbnb so the job poller works
7. If portal rows > saved PDFs, push per-row errors (do not swallow)

### Parser + Excel

- Parse invoice number, issue date, total, sign, hotel id from PDF text (pdftotext or existing HTML-print path)
- Decide with Lefteris whether Ship Excel grows a **Booking.com sheet** (accountants currently get Airbnb `Airbnb-VAT-YYYY-MM.xls` only). Until then, Ship still **attaches the PDFs**.

### Backfill

Separate job flag `backfill=true` (or month=`all` with a year filter): walk Extranet year filter, skip vault duplicates (`month+channel+filename+size` already dedupes). Run once, not on every Collect.

---

## Phased delivery

### Phase 0 — headed discovery (blocks coding)

Needs Lefteris: **Connect Booking** once (Finance-capable login). Then one headed Playwright session (laptop or in-app) against a **known month that already has invoices** (not the 1st–2nd of a new month).

Record:

1. Group vs single-property landing page
2. Exact Invoices URL(s) and the month-filter control
3. Network: PDF hrefs vs blob vs HTML viewer
4. How many PDFs per property (commission only vs + credit notes)
5. Where `hotel_id` / property name / invoice number appear
6. Whether “too early” has a distinct empty state

Output: a short addendum in this file (URLs, selectors, one redacted example row) plus 1–2 fixture HTML/PDF snippets in clearing `tests/` (no live credentials).

### Phase 1 — Test pull (2 apartments, one month)

Worker + Collect **Test pull**. Success = two real commission PDFs in the vault, tagged to the right apartments, invoice numbers visible. Same bar as Airbnb’s `HM9DCDMEXT` / `HMWRNAWHBA` proof.

### Phase 2 — Full month vs Expect

Pull all properties for that month. Completeness: vault apartments ⊇ Expect, and portal row count = saved PDFs (or explained misses). Then un-hide Collect **Pull Booking.com**.

### Phase 3 — Ship + backfill

Elysian pack includes BDC PDFs (Excel sheet if accountants want it). Optional historical backfill. Monthly cadence: run as soon as the first-week invoices exist.

---

## Tests (clearing, with the implementation PRs)

| Test | Asserts |
|---|---|
| `estimateBookingInvoices` | Checkout in M−1 → apartment listed; created-only in M−1 with later checkout → **not** listed; two bookings same apt → one expect row |
| Fixture invoices page | Worker finds N PDF targets from recorded HTML; skips XLS/CSV |
| Parser | Invoice number, issue date, total, hotel id from a redacted text fixture |
| Vault path | `piInvoiceStoreRel` for booking stays `Booking.com/YYYY-MM/Apt/…` |
| Completeness helper | Missing Expect apartments flagged; 0 PDF is failure unless `tooEarly` |
| Excel | Still skips BDC until a Booking sheet is explicitly added |

No live `admin.booking.com` in CI. Live proof is a Collect job id, like Airbnb `ppmsuw193wm05or`.

---

## Risks

| Risk | Mitigation |
|---|---|
| Captcha / 2FA on Railway | Connect once; session vault; proxy env if needed |
| Extranet UI churn | Prefer fetch of recorded PDF URLs over brittle clicks |
| Pull on the 1st–6th | Explicit too-early error; retry after the 7th |
| Wrong Expect (created vs checkout) | Fix Expect in the same PR as the worker |
| Mis-filed apartments | `hotel_id` mapping; name match last |
| Credit notes missed | Download all PDF rows, not first-per-property |
| In-memory pull jobs die on deploy | Same Airbnb limitation; Stop + resume by month+channel |
| Public clearing repo | No credentials, no ΑΦΜ, no live invoice dumps in git |

---

## Out of scope

- Booking.com **payout** matching (already Payments Check)
- Guest-facing invoices / reservation confirmations
- Oxygen documents
- Combining many properties into one PDF (Booking does not issue that)
- Treating reservation statements as the accountant pack

---

## Lefteris gates (before Phase 1 is “done”)

1. Confirm Expect uses **checkout month** (this plan’s default) vs created month
2. Connect a Finance-capable Booking session
3. Confirm whether Ship Excel needs a Booking.com sheet or PDFs-only is enough
4. Pick the first live test month (one that already has invoices on the Extranet)

---

## Related

- Feature SOP: `claude/platform-invoices-feature.md`
- Clearing worker notes: `scripts/platform-invoice-pull.md` in `lete13/elysian-clearing`
- Airbnb live proof (pattern to copy): job `ppmsuw193wm05or`, 15 Aug 2026
