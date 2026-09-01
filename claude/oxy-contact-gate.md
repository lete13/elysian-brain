# Monthly Close: no Oxygen contact → cannot continue

Lefteris, 1 Sep 2026. Clearing FE **143**. No new SRV file — the live tip is already **107**.

## What Lefteris said

On monthly tasks, when there is no linked Oxygen contact, the invoice is not issued. The user should not be allowed to continue.

## What that means

Monthly Close (`mt`) issues an Oxygen document on `Send email` for **private** (ΑΠΥ) and **B2B** (ΤΠΥ) apartments. The server refuses to issue without `oxyContactId` (`never guessed`). Before this change the UI still sent the owner email and still let Receipt / Invoice / Finish be ticked, so the pipeline could look done with no invoice.

## Rule

If a private or B2B apartment (or any member of a grouped close unit) has no `oxyContactId`:

- `Send email` **aborts**. Status: link a Fiscal contact in Configuration; the invoice is not issued, so the email was not sent.
- Receipt / Invoice cannot be ticked done. `isDone` ignores a stored `done.receipt` / `done.invoice` unless `lock.oxygen.invoiceId` is present.
- The focus-card primary button becomes **Link Oxygen contact** (opens Configuration). It is not Finish.
- Leased apartments are unchanged — they do not issue an Oxygen document.

## How to apply on the live app

1. Repo: `lete13/elysian-clearing`.
2. After FE 142 is on the chain, add `fe/patches-143.json` from `claude/oxy-contact-gate/patches-143.json`.
3. Copy `scripts/_build-oxy-contact-gate.js` and `tests/oxy-contact-gate.test.js`. Add that test to `package.json` `test`.
4. Bump chain-tip assertions from 142 → 143 in `monthly-close-ready-badge`, `payments-check-votsala-group`, `pinfo-compliance-dates`.
5. `npm test` (includes `oxy-contact-gate.test.js` plus the other FE-chain tests).
6. Deploy (`railway up` from the clearing checkout). `cursor[bot]` cannot push `lete13/elysian-clearing`.
7. Confirm `/api/fe-info`: `builtAt` mentions this change; `sha256` is `c40ac2881f3f8b7e02021af2e3d69ff9d0fd58451324a946b13f6e6e11726f7f`.

Do not change payout (`calcAptPacket`). Do not store ΑΦΜ.
