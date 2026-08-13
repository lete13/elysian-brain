# Oxygen Pelatologio integration — agreed spec (5 Aug 2026)

Goal: issuing the owner's legal document (and closing the month's trackers) becomes part of the report-email flow in the Elysian Clearing app. Agreed with Lefteris 5 Aug 2026; accountant mapping from Popi's screenshot same day. **Build pending — sandbox stage.**

> Out of scope here: **Airbnb / Booking.com platform invoices** (PDFs from the host portals, ενδοκοινοτικά, forwarded to E-New Generation / B2B partners). Those are not Oxygen documents — see `claude/platform-invoices-feature.md`.

## Platform & API
- **Oxygen Pelatologio** (pelatologio.gr) — Greek cloud invoicing with myDATA transmission. API: OpenAPI 3.1 spec at **docs.oxygen.gr** (Swagger UI, spec file `oxygen-api.json`).
- **Sandbox** `https://sandbox-api.oxygen.gr/v1` · **Production** `https://api.oxygen.gr/v1` · Bearer token (`Authorization: Bearer <key>` + `Accept: application/json`). Keys from Oxygen support (ERP Pro+ package; Hosthub-partner offer exists).
- Key endpoints: `POST /contacts` · `POST /invoices` (→ 201 incl. `mydata: {status, mark, uid, qrUrl, authentication_code, errors}`) · `GET /invoices/{id}/pdf` (application/pdf) · `/credit-notes` · `/hotel-tax` (**TAKK documents** — future automation of the monthly TAKK lines) · lookups: `/taxes`, `/numbering-sequences`, `/payment-methods`, `/vat-check`, `/vies`.
- Env on Railway: `OXYGEN_API_KEY` (sandbox key set 5 Aug) · `OXYGEN_API_BASE` (**defaults to sandbox in code; switching to production is a deliberate, later change**).

## Issuing rules (per apartment profile)
| Profile | Document | `document_type` | myDATA type |
|---|---|---|---|
| 🏠 Private | **Receipt (ΑΠΥ)** | `rs` | `E3_561_003` |
| 🤝 B2B | **Invoice (ΤΠΥ)** | `s` | `E3_561_001` |
| 🏢 Leased | **No document** — the rental agreement is the paperwork | — | — |

- **Every line: `mydata_classification_category: category1_3`** (Έσοδα από Παροχή Υπηρεσιών) and **24% VAT** (Popi to re-confirm VAT on expense-recharge lines specifically).
- **One line per charge**: management fee · cleaning fee · software · each assigned expense individually. **Cleaning line only when the report actually charges cleaning** — the existing per-apartment toggle (cleaning uncharged but still in the mgmt-fee base) must suppress the line; figures come from `buildPdfDoc` so invoice ≡ report by construction.
- `language el|en` from the apartment's `language` field. `issue_date` = issue day.

## Contacts
Owner records live **in Oxygen, not the app** (per Oxygen support: create contact via `POST /contacts`, then reference its ID in `POST /invoices`). Each Private/B2B apartment gets an **Oxygen contact link** field in Configuration (dropdown from `GET /contacts`); apartments without a link are flagged, never guessed. Owners are created in Oxygen's UI by Lefteris/Popi.

## Trigger chain (on "Send email" in Reports)
send owner email → lock report → **issue Oxygen document** (per table above; skip Leased) → store `{invoiceId, number, mark, at, by}` in `S.rptLocks[key].oxygen` → **write Revenue Tracker** (management fee + cleaning fee) → **write Annual Tracker** (owner remittance) → post-report reminders. Multi-property reports: one document/tracker row **per apartment** from its own packet. **Every step exactly-once per apartment+period** (keyed on the report lock — resending an email can never double-issue or double-count).

Rollout ramp: sandbox first → one live monthly cycle with a one-click confirm modal → flip config switch to fully automatic (same code path).

## Status (5 Aug 2026)
- Diagnostics shipped as srv-boot patch (**PR #5** on elysian-clearing): `GET /api/oxygen/status` (key + contacts/sequences/taxes/payment-methods lookups) and `GET /api/oxygen/test-issue` — issues one test ΑΠΥ on the **sandbox only** (403 on any non-sandbox base) with the exact agreed mapping; query overrides `?contact_id= &tax_id= &seq= &doc=rs|s &ctype=` for iteration.
- Pending: PR #5 merge + first sandbox test issuance · Popi's confirmation of all owners existing as Oxygen contacts + expense-recharge VAT · then the full build (fresh session: config fields, issuing engine, tracker writes, Ox golden tests asserting line sums ≡ report's Elysian-charges block).
