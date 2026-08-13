# Platform invoices (Airbnb / Booking.com) — started 13 Aug 2026

## What these are (and are not)

| | **Platform invoices** | **Oxygen ΑΠΥ / ΤΠΥ** |
|---|---|---|
| Issued by | **Airbnb** or **Booking.com** | **Elysian** (via Oxygen) |
| Issued to | Elysian (as host) | Owner / B2B partner |
| Purpose | Platform fees / commissions | Management fee, cleaning, etc. |
| Greek system | **Ενδοκοινοτικά** — do **not** appear in Greek expense / myDATA imports | Sent to myDATA through Oxygen |
| Source today | **Host portals** (Airbnb + Booking.com extranet) | Monthly Close → Email |

**Never conflate the two.** Oxygen is live for owner documents. Platform invoices are a separate monthly handoff.

## Monthly process

| Wave | Deadline | Scope | Recipient |
|---|---|---|---|
| 2 | **20th** | **Leased** apartments (Elysian is host) | **E-New Generation** |
| 3 | **25th** | **B2B** apartments | Each **B2B partner** (cross-European declarations) |
| — | — | Private | **None** — private owners never receive platform invoices |

## App (elysian-clearing)

**Tools → Platform Invoices** (`platinv`):

1. Pick the month (defaults to previous month).
2. **Upload** PDFs downloaded from the Airbnb / Booking.com host portals (or wait for portal pull).
3. Tag scope: **leased** or **b2b** (+ partner name for B2B).
4. **Email pack** — leased uses `PLATFORM_INVOICE_ACCOUNTANT_EMAIL`; B2B asks for the partner email.
5. **Pull from portals** — credentials gate is live; browser download is the next build (`scripts/platform-invoice-pull.md`).

### API

- `GET /api/platform-invoices/status`
- `GET /api/platform-invoices?month=YYYY-MM`
- `POST /api/platform-invoices` (base64 upload)
- `DELETE /api/platform-invoices/:id`
- `POST /api/platform-invoices/send` `{ month, scope, partner?, to? }`
- `POST /api/platform-invoices/pull` `{ month }`

### Railway env

`PLATFORM_INVOICE_ACCOUNTANT_EMAIL` · `AIRBNB_HOST_EMAIL` · `AIRBNB_HOST_PASSWORD` · `BOOKING_HOST_EMAIL` · `BOOKING_HOST_PASSWORD`

## Related brain docs

- Oxygen / Monthly Close owner documents: `claude/monthly-close-and-oxygen.md`, `claude/oxygen-integration-spec.md`
- Checklist history (old Monthly Tasks line `ota_inv`): `claude/monthly-tasks-feature.md`
