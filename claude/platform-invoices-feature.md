# Platform invoices (Airbnb / Booking.com)

State as of 13 Aug 2026. Aligns the app with the internal **Invoices Accounting Process** SOP (no individual names in this doc).

## What these are (and are not)

| | **Platform invoices** | **Oxygen ΑΠΥ / ΤΠΥ** |
|---|---|---|
| Issued by | **Airbnb** or **Booking.com** | **Elysian** (via Oxygen) |
| Issued to | Elysian / the host of record | Owner / B2B partner |
| Purpose | Platform fees / commissions | Management fee, cleaning, etc. |
| Greek system | **Ενδοκοινοτικά** — do **not** appear in Greek expense / myDATA imports | Sent to myDATA through Oxygen |
| Source | **Host portals** (Airbnb hosting + Booking.com extranet) | Monthly Close → Email |

**Never conflate the two.**

---

## Cadence — as soon as possible

These are **previous-period** portal documents. Start the pull **as soon as the month’s invoices are available** after month-end. Do **not** wait for mid-month close deadlines.

Historical SOP backstop was “by the 15th after clearings”; preferred rule now: **ASAP**. The 20th/25th close waves are unrelated Oxygen/TAKK/report deadlines — platform packs should already be done by then.

---

## How each channel dates an invoice (critical)

### Booking.com
- Booking.com **summarises all reservations of a calendar month** and cuts **one invoice the month after**.
- Example: all **June** bookings → invoice issued in **July** (a **July** invoice covering June activity).
- When working month **M** in the app, Hosthub health-check for Booking.com looks at bookings **created in month M−1**.

### Airbnb
- Airbnb generates an invoice **when the booking is confirmed**, not when the guest stays.
- Book today for next summer → invoice date is **today**. A booking can be **cancelled months later**, so the invoice month and the stay month often diverge — hard to track from check-in alone.
- Hosthub health-check for Airbnb uses the booking’s **created / confirmed** timestamp month/year (same month/year as the invoice), and separately flags confirmations that month which later cancelled.

---

## Manual portal steps (source of truth until auto-pull lands)

### Airbnb
1. https://www.airbnb.com/hosting/reservations → All  
2. Filter to listings where **tax responsibility falls to Elysian** (property-details / Configuration).  
3. Open reservation → **VAT Invoice** → Print → Save as PDF.  
4. Save to the Accounting Dropbox Airbnb folder for that month.  
5. Name by apartment name + sequence number.  
6. Verify count against Hosthub (booked/confirmed in that invoice month).

### Booking.com
1. admin.booking.com → Finance → Invoices  
2. Select month → generate / download outstanding documents PDF.  
3. File under apartment / platform invoices / month / Booking.  
4. Split into apartment folders by number.  
5. Remember: invoice month = **month after** the bookings month.

---

## Completion reporting (no personal names)

| Group | Delivery | Recipients |
|---|---|---|
| **Elysian’s own units** (tax responsibility Elysian) | Notification + internal folders | `info@e-newgeneration.gr` and `info@elysianproperties.eu` |
| **External / partner groups** (e.g. Verandas, Monograph, Cedar cluster, Le* Thessaloniki set) | Email attachments + internal folders | That group’s accountant / owner emails (kept in the private process table / Configuration — not listed as people here) |

When Elysian’s own packs for month X are uploaded and filed, send one **completion notification** (subject like `PLATFORM INVOICES MONTH/YEAR`) to the Elysian + E-New Generation addresses above.

---

## App — Tools → Platform Invoices

1. Pick the **invoice month** (defaults to previous calendar month).  
2. Run **Hosthub health check** (expected Airbnb confirmations that month; Booking.com bookings from the prior month).  
3. Upload PDFs from the portals (or portal pull when live).  
4. Email packs — leased/Elysian default → accountant env / E-New Generation; other groups → their addresses.  

### API / env
See clearing `scripts/platform-invoice-pull.md`.  
`PLATFORM_INVOICE_ACCOUNTANT_EMAIL` · Airbnb/Booking host credentials for pull.

### Hosthub fields used for the check
- `platform` (Airbnb / Booking.com)  
- `created` / `createdOnChannel` (unix seconds — confirmation / booked-on-channel time)  
- `cancelled` / `cancelledAt` (Airbnb late-cancel warning)  
- Apartment profile / tax-responsibility filter when available (`leased` ≈ Elysian host)

---

## Related
- Oxygen owner documents: `claude/monthly-close-and-oxygen.md`  
- Old checklist line `ota_inv`: `claude/monthly-tasks-feature.md`
