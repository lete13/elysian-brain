# Monthly Accounting Tasks tab — added 20 Jul 2026

New tab in the Elysian Clearing app (`elysian-clearing` folder on Lefteris's Desktop, deployed on Railway) for the recurring monthly accounting checklist, plus a **🧰 Tools** dropdown that groups Hosthub API, Imports and Checkout Tracker to declutter the top bar.

## What the tab does
- Month-by-month checklist (defaults to the previous month — the month the accounting refers to). Each month starts fresh; history is kept per month.
- Built-in recurring tasks, one line per apartment, scoped live by the profile set in Configuration:
  - **Monthly Clearing Report** — all apartments
  - **TAKK Issuance** — private apartments
  - **TAKK Payment** — private apartments
  - **Airbnb & Booking.com Invoices to Accountants** — B2B + Elysian-leased apartments
- **Proof required**: a line can only be marked ✓ Completed once a file (PDF/image, up to 15 MB, multiple allowed) is attached — uploading a proof completes the line automatically. Deleting the last proof reverts it to Pending. Lines that don't apply can be marked **N/A** with a reason.
- **Completed lines move to the bottom**: task sections only show what's still to be done; finished and N/A lines collect in a green "Completed" list at the bottom of the page with a big "left to do" counter. Clicking a status pill there sends the line back up to pending.
- Completions record **who** did it (name asked once per browser, changeable via the 👤 chip) and **when** — visible to the manager, who clicks any 📎 chip to open the stored proof.
- Custom recurring tasks can be added (company-level single line, or per apartment by profile), e.g. VAT return submission.
- Per-task progress bars, KPI cards and an overall monthly progress banner.

## Where data lives
- Completion status syncs through the existing shared-state pipeline (`app_data` key `main` → `monthlyTasks`, `monthlyTaskDefs`) so the whole team sees the same checklist within the usual 60 s poll.
- Proof files are stored in a new PostgreSQL table `proof_files` (auto-created, self-healing if the DB starts after the server) via new endpoints: `POST/GET/DELETE /api/proofs`, `GET /api/proofs/:id` to view.
- Server-side anti-wipe protects the task history from "Clear data" and stale clients.

## Reports: months-aware fixed charges (fixed 20 Jul 2026)
Fixed **monthly** amounts — Business Tax (Επιτηδεύματος) and per-apartment fixed charges (e.g. Software) — are now billed once per calendar month a report period touches. A custom range crossing two months (e.g. 15 Jun – 15 Jul) charges them ×2, and the report line items show the multiplier ("Monthly charge × 2 months", "45,00 € × 2 months"). Monthly-mode reports and custom ranges within one month are unchanged (×1). Applies to screen, PDF, remittance math and the mgmt-fee base (business tax reduces the base once per month). A **▲▼ stepper** on those rows (single-property reports, same control as the cleaning stay counter) lets the team manually override the month count — e.g. charge 2 months of Software on one report to catch up a skipped month — with a "reset" link back to automatic; the override is stored per property + period (`moOverride`) and syncs like everything else. Covered by self-tests Mm1–Mm4 in the built-in suite (Imports → Run Tests).

## Deploying
Push the updated `index.html` and `server.js` to GitHub as usual — Railway auto-redeploys (~60 s). The `proof_files` table is created automatically on first use. Apartments missing a Private/B2B/Leased profile are flagged in the tab; set profiles in Configuration so they appear in the TAKK/invoice checklists.
