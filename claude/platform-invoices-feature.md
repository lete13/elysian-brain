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
- Summarises **all reservations of a calendar month** and cuts **one invoice the month after**.
- Example: all **June** bookings → invoice issued in **July**.
- Hosthub health-check for invoice month **M** counts Booking.com bookings **created in M−1**.

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

## Manual portal steps (until auto-pull lands)

### Airbnb
1. Hosting → reservations → All  
2. Filter to listings where tax responsibility falls to Elysian  
3. Open reservation → **VAT Invoice** → save PDF  
4. If cancelled → also download the **credit note**  
5. File in Accounting Dropbox by month; name by apartment + sequence  
6. Verify counts with Hosthub health check (created month vs cancel month)

### Booking.com
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

## App — Tools → Platform Invoices

1. Pick the **document month**  
2. **Hosthub health check** — Airbnb invoices (created that month), Airbnb credit notes (cancelledAt that month), Booking.com bookings (created in previous month)  
3. Upload PDFs (invoices + credit notes) or portal pull when live  
4. Email packs — default Elysian recipients as above  

### Hosthub fields
- `platform` · `created` / `createdOnChannel` · `cancelled` / `cancelledAt`

### Env
`PLATFORM_INVOICE_ACCOUNTANT_EMAIL` · `AIRBNB_HOST_*` · `BOOKING_HOST_*` — see clearing `scripts/platform-invoice-pull.md`.

---

## Related
- Oxygen: `claude/monthly-close-and-oxygen.md`  
- Old checklist line `ota_inv`: `claude/monthly-tasks-feature.md`
