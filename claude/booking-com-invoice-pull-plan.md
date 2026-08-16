# Booking.com invoice pull — plan

State as of **16 Aug 2026** (Lefteris confirmed: **one invoice per apartment**; June reservations → **one July PDF**; **no BDC Excel**). Unparks the Booking.com half of Platform Invoices after the Airbnb Hosthub-code pull went live (15 Aug). Aligns with `claude/platform-invoices-feature.md` and the Invoices Accounting Process SOP (no individual names).

**This is the plan, not the live worker.** Do not treat the existing `pullBooking()` heuristics as proven. Airbnb already showed that guessed extranet URLs and “click Download” save 0 useful files.

**Confirmed 16 Aug 2026:**

- Booking.com generates **a single invoice per apartment**.
- All **June reservations** are on that **one July invoice**.
- The **July** BDC folder holds **one PDF** (June reservations inside it) — never one PDF per reservation, never file it under June.
- **No Excel** for Booking.com. Ship the PDFs only.

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
| Session vault `pi_portal_session_booking` | Live (`Connect` / `BOOKING_STORAGE_STATE_B64` / `BOOKING_HOST_*`) |
| Worker `scripts/platform-invoice-pull.js` → `pullBooking()` | **Parked heuristic** — guessed Finance URLs, first-PDF-per-property, name fuzzy-match |
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

## Capture strategy (Airbnb lesson, applied here)

Airbnb only worked after a live session showed: stay page → fetch `/invoice/{token}` → **new tab on `www.airbnb.gr`**. Guessed `.com` address-bar URLs 404’d.

Booking.com pull must follow the same sequence: **record a real session, then code to that path**.

### Preferred path — group Finance list

If the host login lands on the **group Extranet** (likely with this portfolio):

1. `admin.booking.com` → group home
2. **Finance → Invoices**
3. Filter so we get the invoices **issued in month M** (July invoices = June reservations). Confirm the Extranet control in Phase 0 — it may be labelled issue month or reservation month.
4. Download **one commission invoice PDF per apartment**
5. Parse property id + invoice number + issue date + amount from the PDF (or the table row)
6. File under `Booking.com/{M}/{apartment}/` — July folder for the June-reservations invoice

Partner Help mentions filtering group downloads by checkout month — treat that as Extranet UI labelling. The filing rule is Lefteris’s: **July folder = one invoice of June reservations.**

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

Current worker stops after the first PDF per property — that part of the heuristic matches the **one invoice** rule. What it does **not** do is land on the real Invoices page or file into `Booking.com/2026-07/{apt}/` with June reservations. Phase 0 still has to record the real URL.

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

## Apartment identity (do not rely on fuzzy names)

Today `matchApartment()` compares scraped property titles to Hosthub names. That will mis-file across similar titles.

Stable key is Booking.com **hotel / accommodation number** (on the invoice and in `hotel_id=` URLs).

Plan:

1. Phase 0 recording stores `hotel_id` per downloaded PDF.
2. Add optional `bookingHotelId` on Configuration (`S.apts`) — filled once from the first successful pull (or a small mapping table), then reused.
3. Hosthub rental payloads may already carry a Booking listing id — check during implementation; do not assume they do (sync today maps `reservation_id` but not a hotel id onto apartments).
4. Name match stays a last-resort hint, never the only key.

Filenames: `Booking.com/{month}/{apartment}/invoice-{hotelId}-{invoiceNo}.pdf`. One file per apartment per month.

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
  - Include apartment if it had **reservations in M−1** (June reservations → July expect)
  - Keep guest-pays-at-property rows
  - Return `{ apts, bookings, bookMonth }` — `apts.length` is the expected PDF count (**one per apartment**)
- Un-hide the Booking expect list. Copy: “one invoice per apartment; June reservations → July folder”.

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
3. Download **one** commission invoice PDF per apartment (the June-reservations invoice into the July folder)
4. Parse meta; map `hotel_id` → apartment
5. Store via existing `piInvoiceStoreRel` as `Booking.com/{M}/{apt}/…`
6. Emit `saved` / `progress` JSON like Airbnb so the job poller works
7. Flag Expect apartments with 0 PDFs; flag apartments with **more than one** PDF in that month’s folder

### Parser (no Excel)

- Parse invoice number, issue date, total, hotel id from PDF text (for Review chips and completeness).
- **Do not** add a Booking.com sheet to `Airbnb-VAT-YYYY-MM.xls`. Confirmed: accountants get BDC **PDFs only**. The existing Excel skip for `channel=booking` stays.

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
4. Confirm one PDF per property (not per reservation)
5. Where `hotel_id` / property name / invoice number appear
6. Whether “too early” has a distinct empty state
7. That the July invoice’s reservation list is June reservations

Output: a short addendum in this file (URLs, selectors, one redacted example row) plus 1–2 fixture HTML/PDF snippets in clearing `tests/` (no live credentials).

### Phase 1 — Test pull (2 apartments, one month)

Worker + Collect **Test pull**. Success = **two** apartments, **one** July invoice PDF each, filed under `Booking.com/2026-07/{apt}/`, reservation list is June. Same bar as Airbnb’s two-code proof.

### Phase 2 — Full month vs Expect

Pull all properties for that month. Completeness: each Expect apartment has **exactly one** PDF in the July folder. Then un-hide Collect **Pull Booking.com**.

### Phase 3 — Ship + backfill

Elysian pack **attaches the BDC PDFs**. No Booking.com Excel. Optional historical backfill. Monthly cadence: run as soon as the first-week invoices exist.

---

## Tests (clearing, with the implementation PRs)

| Test | Asserts |
|---|---|
| `estimateBookingInvoices` | Two June reservations, same apt → **one** July expect row; apartment with no June reservations → not listed |
| Fixture invoices page | Worker finds **one** PDF target per property; skips XLS/CSV |
| Parser | Invoice number, issue date, total, hotel id from a redacted text fixture |
| Vault path | July collect → `Booking.com/2026-07/Apt/invoice-….pdf` (June reservations stay in the July folder) |
| Completeness helper | Missing Expect apartments flagged; **two PDFs in one apt/month folder** flagged; 0 PDF is failure unless `tooEarly` |
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
| Mis-filed apartments | `hotel_id` mapping; name match last |
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

Still needed:

1. Connect a Finance-capable Booking session
2. Pick the first live test month (one that already has invoices on the Extranet)

---

## Related

- Feature SOP: `claude/platform-invoices-feature.md`
- Clearing worker notes: `scripts/platform-invoice-pull.md` in `lete13/elysian-clearing`
- Airbnb live proof (pattern to copy): job `ppmsuw193wm05or`, 15 Aug 2026
