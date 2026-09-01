# Elysian Clearing — Oxygen invoicing + Monthly Close

State as of 1 September 2026 (Oxygen-contact gate). Repo: `lete13/elysian-clearing`, deployed on Railway at
`https://elysian-clearing-production.up.railway.app/`.

## How code ships

Neither the frontend nor the server is edited in place.

- **Frontend**: `feBootstrap()` in `server.js` applies `fe/patches.json` (ordered exact-string
  patches) to `index.html` at boot. Gated on `baseSha256` of index.html, a per-patch match
  count, and the `expectedSha256` of the result. Any mismatch → the whole set is rejected and
  the repo `index.html` is served unpatched. `GET /api/fe-info` reports the live state
  (`patches`, `error`, `builtAt`).
- **Server**: `npm start` runs `srv-boot.js`, which applies `srv/patches.json` to `server.js`,
  writes `server.gen.js` and runs it. Same all-or-nothing gate; failure falls back to the
  unpatched `server.js`. `SRVBOOT_DRYRUN=1 node srv-boot.js` verifies locally.

**Consolidation.** The patch file grows with every change and hand-editing it is the main
source of breakage. When it gets large, assemble the full patched file, upload it via the
GitHub web UI (replacing `index.html` or `server.js`) and reset the patch file to
`{"patches":[]}`. The base-drift gate makes a missed reset safe.

## Oxygen invoicing (live, production)

> **Not platform invoices.** Oxygen issues Elysian's ΑΠΥ/ΤΠΥ to owners/partners.
> Airbnb/Booking.com **host-portal** PDFs (ενδοκοινοτικά → accountants/partners) are a
> separate flow — Tools → Platform Invoices; see `claude/platform-invoices-feature.md`.

Endpoints on the server: `POST /api/oxygen/issue`, `/issue-preview` (dry run),
`GET /api/oxygen/documents` (ledger), `/status`, `/lookups`, `/invoice-pdf/:id`.

- **Document by profile**: private → ΑΠΥ receipt (`rs`, myDATA 11.2); b2b → ΤΠΥ invoice
  (`s`, myDATA 2.1); leased → no document (rental income; the lease is the paperwork).
- **Payment method**: Επί Πιστώσει (on credit, myDATA code 5), resolved by code first so it
  survives an id change. `OXYGEN_PM_ID` overrides. Documents are marked paid.
- **myDATA MARK**: Oxygen assigns it shortly after creation, so the engine polls the invoice
  until it appears rather than storing null.
- **Invoice lines**: management fee, cleaning, software, and Διάφορα Έξοδα / Various Expenses.
  All net figures at 24% — expenses use `totExp` (net), never `totExpIncl`, so VAT is applied
  once and the invoice VAT reproduces the report's.
- **Guards**: invoice total must equal the report total; a Postgres ledger enforces
  exactly-once per apartment+period; production refuses without `confirmLive:true`; a missing
  contact is an error rather than a guess.
- **Contacts**: `/lookups` paginates `/contacts` — the account holds ~3,080, of which ~322 have
  an ΑΦΜ (the real owners; Booking.com guest contacts have none). Reading one page silently
  capped this at 500 and hid newer owners.

## Monthly Close (replaces the Monthly Tasks tab)

A per-apartment pipeline with Focus / Batch by stage / List views, a progress meter and a
stage funnel. Flows by profile:

- **private**: Report → ΤΑΚΚ → Pay → Payment → Email → Receipt
- **b2b**: Report → Payment → Email → Invoice
- **leased**: Report → Payment → Email

Most stages derive from evidence the app already holds — report locks, the Oxygen stamp, the
send timestamp — so they close as the work is done. Proof-backed stages (ΤΑΚΚ issue, ΤΑΚΚ
pay, remittance Payment) require an uploaded file, list attachments with a remove button, and
cannot be bulk-cleared.

- **Report** must be explicitly confirmed on the real Reports tab ("Report checked →"). That
  confirmation freezes payout, B2B remittance and the tax split, plus the period used and who
  confirmed it. An apartment cannot reach Payment without it, so the amount paid is always the
  figure someone signed off on rather than a recomputation that could drift from adjustments
  (cleaning stay-count, months override, channel pills, custom period).
- **Payment** shows the amount owed: owner remittance for private and leased, B2B partner
  remittance including taxes for b2b.
- **Email** is the last action: it issues the ΑΠΥ/ΤΠΥ at that moment, attaches the invoice PDF
  plus the ΤΑΚΚ and payment proofs alongside the report, sends, then writes cleaning and
  management fees to Elysian Revenue and the payout to Owner Remittance (shown per property in
  the Annual Tracker). A private or B2B apartment with no linked Oxygen contact (`oxyContactId`)
  **cannot continue**: Send email aborts (the invoice is not issued, so the email is not sent).
  The Email pill / Mark done do not open compose. Other missing pieces still warn. Link the Fiscal contact in Configuration and retry.
  Doc: `claude/oxy-contact-gate.md` (FE 143+144, 1 Sep 2026).
- **Receipt/Invoice** follows Email and is confirmation only — it staying open means the email
  went out but the document did not issue. A stored tick is not enough: the stage completes only
  when `lock.oxygen.invoiceId` is present. The UI will not let you tick Receipt/Invoice or
  Finish when the invoice was never issued (including when there is no linked Oxygen contact).
  Leased apartments skip this stage.

## Traps worth remembering

- Report lock keys use `toISOString`, which shifts an Athens 1st-of-month back a day. Match
  months by the midpoint of the range, and store dates as local `YYYY-MM-DD`.
- `saveToDb` sends an explicit whitelist of keys. A new store on `S` must be added to both the
  save payload and the load side or it silently never persists.
- Completing a stage and toggling one are different operations. Primary buttons must never
  reopen an already-satisfied stage.
- Re-uploading a proof adds a second file rather than replacing it, and every proof on a line
  is emailed — remove the superseded one first.
- Never write a hash or a patch file from memory. Copy the verified artifact verbatim, and
  compare full digests, not prefixes.

## Open items

- Pixie Studio Athens is profile `leased` but carries the B2B flag, so it computes two
  different remittance figures. Confirm which is actually transferred.
- Invoice #145 (Acropolis Skyline Sunset, July) was the first test document, issued as Μετρητά
  and unpaid before those defaults were corrected.
- Channel pill selection lives in a single in-memory `rptChanSel` and is lost on page reload;
  it is not persisted anywhere.
- Maintenance blocks count toward the nights shown on the ΤΑΚΚ step.
