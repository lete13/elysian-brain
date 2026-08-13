# Platform invoices (Airbnb / Booking.com)

State as of 13 Aug 2026. Aligns the app with the internal **Invoices Accounting Process** SOP (no individual names in this doc).

## What these are (and are not)

| | **Platform invoices / credit notes** | **Oxygen ΑΠΥ / ΤΠΥ** |
|---|---|---|
| Issued by | **Airbnb** or **Booking.com** | **Elysian** (via Oxygen) |
| Issued to | Elysian / the host of record | Owner / B2B partner |
| Purpose | Platform fees / commissions (and credit notes on cancel) | Management fee, cleaning, etc. |
| Greek system | **Ενδοκοινοτικά** — do **not** appear in Greek expense / myDATA imports | Sent to myDATA through Oxygen |
| Source | **Host portals** (Airbnb hosting + Booking.com extranet) | Monthly Close → Email |

**Never conflate the two.**

---

## Cadence — as soon as possible

Start the pull **as soon as the month’s portal documents are available**. Do not wait for mid-month close deadlines.

---

## How each channel dates documents (critical)

### Booking.com
- Summarises reservations and cuts **one invoice per apartment** the **month after** the stays.
- Example: all **June** bookings for apartment X → **one** July invoice for apartment X (not one PDF per booking).
- Hosthub expect for document month **M** lists **unique apartments** with Booking.com bookings **created in M−1** (active). Booking count is shown only as context.

### Airbnb — VAT invoice
- Airbnb generates the VAT invoice when the booking is **confirmed**.
- On Hosthub, that is the booking’s **`created` / `createdOnChannel`** timestamp — **that month/year is the invoice issue month**.
- Stay month is irrelevant for filing. A booking made today for next summer still belongs in **this** month’s invoice pack.

### Airbnb — credit note (cancellations)
- When a booking is cancelled, Airbnb issues a **credit note** that must also be downloaded.
- Credit-note issue date follows the **cancellation date** (Hosthub **`cancelledAt`**).
- So a booking confirmed in March and cancelled in July needs:
  - the **March** VAT invoice, and
  - the **July** credit note.

---

## Automated pull (no monthly PDF upload)

### Airbnb (primary — VAT Invoicer workflow, internal)

Same idea as VAT Invoicer: while logged into Airbnb hosting, use **reservation confirmation codes** and open each reservation to capture VAT invoice / credit note PDFs.

1. Hosthub sync maps calendar-event **`reservation_id`** → booking **`reservationId`** (Airbnb confirmation code).  
2. Platform Invoices → **Expect** lists codes for the document month (invoice = `created` / `createdOnChannel`; credit note = `cancelledAt`).  
3. **Collect → Pull Airbnb (Hosthub codes)** sends those codes to `scripts/platform-invoice-pull.js`.  
4. Worker opens `https://www.airbnb.com/hosting/reservations/details/{CODE}` per code and stores PDFs (`source=portal`).

No manual pasting of codes. Re-sync Hosthub if Expect shows “missing code”.

**One-time Connect** (only when captcha/OTP blocks password login): run `platform-invoice-save-session.js --headed` on a laptop, then **Connect Airbnb** in the app (session vault). This is *not* uploading invoice PDFs.

**Emergency only:** manual PDF upload under Collect → “Emergency manual tools”.

### Booking.com (parked for now)

Booking.com pull (admin.booking.com, one invoice per apartment, month-after dating) remains in the worker but is **not** the Collect focus while Airbnb Hosthub-code pull is hardened. Manual fallback if needed:

1. admin.booking.com → Finance → Invoices  
2. Select month → download outstanding documents  
3. File under apartment / month / Booking  
4. Remember: invoice month = month after the bookings month

---

## Completion reporting (no personal names)

| Group | Delivery | Recipients |
|---|---|---|
| **Elysian’s own units** | Notification + internal folders | `info@e-newgeneration.gr` and `info@elysianproperties.eu` |
| **External / partner groups** | Email attachments + internal folders | That group’s accountant / owner emails (private process table / Configuration) |

When Elysian’s own packs for month X are filed, send one completion notification (subject like `PLATFORM INVOICES MONTH/YEAR`).

---

## App — Platform Invoices (accounting tab)

Primary nav tab for Accounting (also Admin). Guided pipeline in one place:

1. **Start** — pick document month  
2. **Expect** — Hosthub Airbnb confirmation codes (`reservationId`) for created / cancelledAt; Booking expect dimmed while parked  
3. **Collect** — Airbnb code checklist; **Pull Airbnb (Hosthub codes)**; Connect Airbnb once if needed; upload is emergency-only  
4. **Review** — vault vs Airbnb expect  
5. **Ship** — email finished Elysian pack to accountants (`info@e-newgeneration.gr`, `info@elysianproperties.eu`)  

A **0 PDF** pull is a failure with portal error text — **Connect** Airbnb and confirm Hosthub codes, then Pull again (do not treat monthly PDF upload as the process).  

### Hosthub fields
- `platform` · **`reservationId`** (channel `reservation_id` — Airbnb confirmation code) · `created` / `createdOnChannel` · `cancelled` / `cancelledAt` · `aptId` / `aptName`

### Env
`PLATFORM_INVOICE_ACCOUNTANT_EMAIL` · `AIRBNB_HOST_EMAIL` / `AIRBNB_HOST_PASSWORD` · `BOOKING_HOST_EMAIL` / `BOOKING_HOST_PASSWORD` — see clearing `scripts/platform-invoice-pull.md`.

---

## Related
- Oxygen: `claude/monthly-close-and-oxygen.md`  
- Old checklist line `ota_inv`: `claude/monthly-tasks-feature.md`
