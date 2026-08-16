# Platform invoices (Airbnb / Booking.com)

State as of **15 Aug 2026**. Aligns the app with the internal **Invoices Accounting Process** SOP (no individual names in this doc).

## What these are (and are not)

| | **Platform invoices / credit notes** | **Oxygen ΑΠΥ / ΤΠΥ** |
|---|---|---|
| Issued by | **Airbnb** or **Booking.com** | **Elysian** (via Oxygen) |
| Issued to | Elysian / the host of record | Owner / B2B partner |
| Purpose | Platform fees / commissions (and credit notes on cancel / extend) | Management fee, cleaning, etc. |
| Greek system | **Ενδοκοινοτικά** — do **not** appear in Greek expense / myDATA imports | Sent to myDATA through Oxygen |
| Source | **Host portals** (Airbnb hosting + Booking.com extranet) | Monthly Close → Email |

**Never conflate the two.**

---

## Cadence — as soon as possible

Start the pull **as soon as the month’s portal documents are available**. Do not wait for the 20th/25th.

---

## How each channel dates documents (critical)

### Booking.com
- **One invoice per apartment**, except **Votsala 1–8 share one Booking.com invoice** (same as their Viva payout). File under `Booking.com/2026-07/Votsala/`. Airbnb stays per unit.
- Vault: `Booking.com/2026-07/{apartment}/` holds **exactly one** PDF — that PDF’s reservation list is June. Votsala’s folder is the group name, not eight copies.
- Hosthub expect for document month **July** = unique **BDC billing units** with reservations in June (Votsala 1–8 count as **one**). Booking count is context only.
- **No Excel** for Booking.com. Ship the PDFs only (`Airbnb-VAT-YYYY-MM.xls` stays Airbnb).
- **Finance session is logged.** Pull is a **mass extract of all apartments for the month** (group Finance → Invoices), not one property at a time.
- Invoices print the **Booking apartment id only**. Filing needs `bookingHotelId` on Configuration (`S.apts`) → Elysian name. Unmapped ids stay in `unmapped-{id}` until mapped. Do not guess from names.
- Pull remains **parked** until `claude/booking-com-invoice-pull-plan.md` is executed (map + mass extract). Manual fallback: admin.booking.com → Finance → Invoices → mass extract for the month.

### Airbnb — two different date jobs

**Which stay to open** (Hosthub):

| Hosthub field | Use |
|---|---|
| `reservationId` | Airbnb confirmation code (`HM…`) — the stay to open |
| `created` / `createdOnChannel` | Month **M** Expect lists stays confirmed in M |
| extra Hosthub event ids on the same code | Count **extends** (n) |
| `cancelled` / `cancelledAt` | Stay is a cancel (Expect still opens it in the confirm month and/or cancel month as implemented) |

**Which folder a PDF is archived in** (VAT HTML, not Hosthub):

- **File month = the issue date printed on the VAT document** (`13/7/2026` → `Airbnb/2026-07/…`).
- Hosthub `created` / `cancelledAt` are **not** the archive month.
- A stay opened because it was created in July can still drop an **August-dated** extend debit into `Airbnb/2026-08/`.

### Airbnb — one stay, several documents

Pull always captures **every** VAT debit and credit on the stay (`kind: both`).

| Stay | Estimated PDFs |
|---|---|
| Normal reservation | **1** (VAT debit) |
| Cancelled | **2** (debit + credit note) |
| 1 extend | **3** (original debit + credit of that debit + new debit) |
| n extends | **1 + 2n** |

Confirm in month A and cancel in month B → keep **both** documents, each under **its own VAT issue month**.  
Extend in month B → original debit stays in its issue month; the credit of that debit and the new debit archive in the later issue month.

---

## Automated pull (no monthly PDF upload)

### Airbnb (primary — live 15 Aug 2026)

Same idea as [VAT Invoicer](https://vatinvoicer.com/privacy/): while logged into Airbnb hosting, take **reservation confirmation codes**, open each stay, capture every VAT invoice / credit note HTML, print PDF.

1. Hosthub sync stores channel **`reservation_id`** as booking **`reservationId`** (Airbnb confirmation code).
2. Platform Invoices → **Expect** lists stays to open **and** estimates how many invoices Pull should save.
3. **Collect → Test pull (`HM9DCDMEXT` · `HMWRNAWHBA`)** re-opens two stays that previously missed, or **Pull Airbnb (Hosthub codes)** for the full month. **Stop pull** kills a running job. Same month + channel while a job is `starting`/`running` **resumes** that job (does not start a second full-month pull).
4. Worker (`scripts/platform-invoice-pull.js`):
   - Opens `https://www.airbnb.com/hosting/stay/{CODE}`. A hosting 200 that says the reservation is missing is **not** treated as opened — it then tries `/hosting/reservations/details/{CODE}` and reservations search.
   - Clicks **total price** (Airbnb Help 438), then every **VAT invoice / credit note** on that stay.
   - Stay-page links are `/invoice/{token}` (example tokens: `23k6jHjbbk9`, `23a2NdTYpDo`). Address-bar `goto` of `/invoice/{token}` **and** `/reservation/vat_invoice/{token}` 404s or soft-404s on `airbnb.com`.
   - Capture path that works: **fetch** `/invoice/{token}` and `/vat_invoices/{token}` with the host session, then open them in a **new tab on `www.airbnb.gr`** (VAT Invoicer). Wait for invoice HTML (`AIUC-…`, invoice number). Never PDF a stay shell or a “can’t find that page” body.
5. PDFs store as `Airbnb/{issue-month}/{apartment}/{kind}-{code}-{vatId}.pdf`, `source=portal`.

No manual pasting of codes. Re-sync Hosthub if Expect shows “missing code”.

**Connect Airbnb** in the app (email OTP) writes the session vault. That is the normal path when password login hits captcha. Laptop `platform-invoice-save-session.js --headed` is fallback. This is *not* uploading invoice PDFs.

**Emergency only:** manual PDF upload under Collect → “Emergency manual tools”.

**Live proof (15 Aug 2026), job `ppmsuw193wm05or`, month 2026-07:**

| Code | File | Invoice number | Issue date | Amount on PDF |
|---|---|---|---|---|
| `HM9DCDMEXT` | `Airbnb/2026-07/Requests/invoice-HM9DCDMEXT-23k6jHjbbk9.pdf` | `AIUC-105901827-GR-1574404` | 13/7/2026 | €19.53 |
| `HMWRNAWHBA` | `Airbnb/2026-07/Requests/invoice-HMWRNAWHBA-23a2NdTYpDo.pdf` | `AIUC-104540400-GR-1548707` | 10/7/2026 | €9.46 |

Both are Airbnb Ireland UC reverse-charge invoices to Elysian. Vault `total` on those two rows was stored as **0** (parser matched VAT rate `0.0%`); parser on `main` now takes **Subtotal €**. Folder `Requests` is the stay-page heading when Hosthub apt name was not posted with the test pull.

### Booking.com (parked — unpark plan ready)

Booking.com pull (admin.booking.com, one invoice per apartment, month-after dating) remains in the worker but is **not** the Collect focus. The parked `pullBooking()` guesses Finance URLs and stops after the first PDF per property — **do not treat that as the design**. Plan: `claude/booking-com-invoice-pull-plan.md`.

Manual fallback if needed:

1. admin.booking.com → Finance → Invoices (group Extranet)
2. **Mass extract** the **July** invoices (each PDF lists **June** reservations)
3. File **one PDF** under `Booking.com/2026-07/{apartment}/` using the Booking apartment id map
4. No Booking.com Excel — PDFs only

---

## Completion reporting (no personal names)

| Group | Delivery | Recipients |
|---|---|---|
| **Elysian’s own units** | Notification + internal folders + Airbnb Excel + Booking.com PDFs | `info@e-newgeneration.gr` and `info@elysianproperties.eu` |
| **External / partner groups** | Email attachments + internal folders | That group’s accountant / owner emails (private process table / Configuration) |

When Elysian’s own packs for month X are filed, send one completion notification (subject like `PLATFORM INVOICES MONTH/YEAR`).

Ship email attaches the PDFs **plus**, for Airbnb only, `Airbnb-VAT-YYYY-MM.xls`: Ημερομηνία = issue date, Αιτιολογία = invoice number (`AIUC-…`), Ποσό = total €, Πρόσημο ποσού = empty if positive / `-` if credit. Extra columns: reservation id, listing name, check-in, check-out. **Booking.com: PDFs only — no Excel.**

---

## App — Platform Invoices (accounting / admin tab)

Primary nav tab for Accounting and Admin (sidebar icon as of 15 Aug 2026). Guided pipeline:

1. **Start** — pick document month
2. **Expect** — which Hosthub stays to open **and** estimated invoice count (not “PDF count = stay count”)
3. **Collect** — **Test pull** (the two codes above) · **Pull Airbnb (Hosthub codes)** · **Stop pull** · Connect Airbnb if the session expired · upload is emergency-only
4. **Review** — vault by apartment; **Open** serves the PDF
5. **Ship** — email finished Elysian pack (Airbnb PDFs + Excel; Booking.com PDFs only)

A **0 PDF** pull is a failure with portal error text — **Connect** Airbnb and confirm Hosthub codes, then Pull again (do not treat monthly PDF upload as the process).

### Hosthub fields
- `platform` · **`reservationId`** (channel `reservation_id` — Airbnb confirmation code) · `created` / `createdOnChannel` · extra event ids (extends) · `cancelled` / `cancelledAt` · `aptId` / `aptName` · `checkIn` / `checkOut`

### Env
`PLATFORM_INVOICE_ACCOUNTANT_EMAIL` · `AIRBNB_HOST_EMAIL` / `AIRBNB_HOST_PASSWORD` · `BOOKING_HOST_EMAIL` / `BOOKING_HOST_PASSWORD` · optional `AIRBNB_STORAGE_STATE_B64` / `BOOKING_STORAGE_STATE_B64` — prefer **Connect** in the app. See clearing `scripts/platform-invoice-pull.md`.

### APIs (auth cookie)
`POST /api/platform-invoices/pull` · `GET /api/platform-invoices/pull/:jobId` · `POST /api/platform-invoices/pull-stop` · `GET /api/platform-invoices/:id/file`. Pull jobs are **in-memory** on the web process (a redeploy drops a running job).

---

## Related
- Oxygen: `claude/monthly-close-and-oxygen.md`
- Old checklist line `ota_inv`: `claude/monthly-tasks-feature.md`
- Booking.com unpark plan: `claude/booking-com-invoice-pull-plan.md`
- Clearing worker: `scripts/platform-invoice-pull.md` in `lete13/elysian-clearing`
