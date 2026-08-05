# Email report to owner — reworked (4 Aug 2026, release v12)

The Reports-tab button "Email key metrics to owner" (plain-text `mailto:`) is now **"Email report to owner"**: it renders the exact Export-PDF document into a real PDF file, opens a compose modal with a bilingual message (per-apartment `language` EN/GR), a **page-1 preview embedded in the email**, and the **PDF attached**, then sends through the server.

## Flow
1. `buildPdfDoc(_mode)` — the old `exportPDF()` body, now shared: returns the report HTML **plus all the figures** (gross, taxes & platform subtotal, Elysian charges, net earnings, management fee incl. VAT, B2B remittance, payout) computed the same per-apartment-packet way as the PDF. `exportPDF()` is a thin wrapper around it (print flow unchanged, byte-identical document).
2. `_emailRenderPdf(d)` — hidden 688 px iframe (182 mm @96 dpi) → html2canvas (scale 2) → jsPDF A4 pages. Page breaks are chosen at safe element bottoms (`.section`, `.frow`, `tr`, tax cards, payout box) by the pure helper `_emailPageBreaks()`; trailing slivers ≤ 40 px are absorbed into the last page instead of printing a near-empty page. Output ~0.5–1.5 MB JPEG-page PDF + a 720 px page-1 preview.
3. **Compose modal** — To (unique `ownerEmail`s of the report's packets), Cc, Subject, an editable intro paragraph, a live WYSIWYG preview of the email (figures table mirrors the PDF Summary section exactly, payout in the navy/gold box, page-1 image, Elysian logo reused from the PDF header), attachment chip with size/pages, and an **"Already emailed …"** warning if this exact report (same lock key) was sent before.
4. **Send** → `POST /api/email/send` (PDF attachment + preview & logo as inline `cid:` images). On success: `_lockCurrentReport('email')`, the sent record is stored **inside the lock entry** (`S.rptLocks[key].email = {at, to, by}` — `by` from the browser's `elysian_user_name`, same as Monthly Tasks), toast, and the post-report reminders open. No new top-level state key → zero new save/load/anti-wipe plumbing, immune to the DB-poll race.
5. **Fallback** when unconfigured: the same modal offers ⬇ Download PDF + ✉ Open mail app (pre-filled plain-text body) — nothing is blocked while credentials are pending.

## Server (`server.js`) — 📧 section before the Viva bridge
- `GET /api/email/status` → `{configured, from, host}`; `POST /api/email/send` → `{ok, messageId}`.
- nodemailer over SMTP. Validation: recipient/address/subject/body checks (400), total decoded attachments ≤ 20 MB (413), 503 when unconfigured, `[email]` Railway log line per send. Both routes sit behind the existing app-password middleware.
- **Railway → Variables**: `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_SECURE` (`true` for :465), `SMTP_USER`, `SMTP_PASS`, and optionally `EMAIL_FROM` (display name form, defaults to SMTP_USER), `EMAIL_REPLY_TO`, `EMAIL_BCC` (auto-copy every send — set to the office mailbox for records).
- `package.json`: + `nodemailer ^6.9.14` (must deploy together with server.js so Railway installs it — missing this was the first deploy's "not configured" root cause).

## Tests
- New additive **Em group** (Em1–Em5) in the built-in suite covers `_emailPageBreaks` (single page, row-bottom breaks, hard cuts, sliver absorption, fuzz tolerance). Empty-browser expected score moves 78/81 → **83/86** (the 3 golden "apt not found" failures unchanged).
- Verified pre-ship in a full sandbox: server boot applying all 44 patches (`/api/fe-info` → 746,739 B, sha256 `5cdd8af19776…`), and a live send through a local SMTP sink delivering the PDF attachment, both inline cids, To/Cc headers and envelope-only BCC; all error paths (400/400/400/413/503) exercised.

## Deployed (4 Aug 2026, consolidation path)
Full `index.html` uploaded via GitHub web + `fe/patches.json` reset to `{"patches":[]}`; `server.js` + `package.json` pushed alongside (package.json landed in a follow-up commit — see root cause above). Verify any fe release via `GET /api/fe-info` (auth-exempt).

## Addendum (5 Aug 2026) — the SMTP saga & its resolution
First sends failed with *Connection timeout* despite correct variables. Diagnosed via a new **`GET /api/email/probe`** (shipped as an `srv-boot.js` patch, PR #3): TCP tests of ports 25/465/587/2525 from Railway's own network + `transporter.verify()`. Verdict: **Railway firewalls ALL outbound SMTP on Free/Trial/Hobby plans** — even smtp.gmail.com was rejected in 255 ms; only **Pro** allows SMTP (Railway's docs recommend HTTPS email APIs instead).

**Resolution: Railway Pro upgrade + one redeploy** — the new network rules apply only to deployments created after the upgrade. Email now sends via `mail.elysianproperties.eu:465` SSL (the mailbox's server is `atlas.cityconsulting.gr`, City Consulting shared cPanel; MX = the domain itself, IP 31.22.112.34).

A complete **Resend HTTPS transport** (api.resend.com, attachments + inline `content_id` images = full feature parity) was also built, sandbox-tested, and staged as **PR #4 on elysian-clearing — intentionally left unmerged** as a dormant fallback: with no `RESEND_API_KEY` it changes nothing; setting the key would switch transport without touching the frontend.
