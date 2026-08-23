# Daily Ops EXTENDED false positive — Resilience 21 Aug 2026

Lefteris asked why **Elysian Lycabettus Resilience** showed as **EXTENDED** / **NO CLEAN** on Daily Ops for Friday 21 Aug 2026 when it was a real turnover.

## What the list was doing

Daily Ops marks a row **EXTENDED** when it thinks the same guest is checking out and straight back in, so the crew can skip the clean. Detection used to fire if **either** the departing or the arriving Hosthub guest name matched:

`extend` / `extended` / `extends` / `extending` / `extension` / `παράταση`

Hosthub’s own extra-nights blocks are titled that way — `extend Evangelia`, `extend Aik Kougioufa`. That title describes the guest **currently in** the apartment (extra nights of an earlier stay). When that block **ends**, whoever arrives next needs a clean. The old rule still saw `extend` on the checkout name and skipped the clean.

## Live Hosthub pair (Resilience, 21 Aug 2026)

| Side | Guest name | Dates | Channel |
|---|---|---|---|
| Currently hosting (checkout) | `extend Evangelia ` | 19→21 Aug (2 nights) | manual Hosthub block |
| Upcoming arrival | Tasos Syrmalis, 2 pax | 21→22 Aug (1 night) | Booking.com |

That is a turnover. The listing name **Resilience** is unrelated (it does not match the extend regex). Other “residence” rows (Skarlatos, Tauros Metro) were fine because their guest names did not contain `extend`.

## Rule (intended; clearing PR #153 still open on 21 Aug)

- **Currently hosting** named `extend …` / `παράταση` never marks the **upcoming arrival** EXTENDED — even if the next name looks like the same person.
- **Arrival** named `extend …` / `παράταση` after a normal checkout still means **no turnover** (same guest continuing).
- Same guest names without those keywords still mean EXTENDED.
- Check-in-only extend blocks (no checkout that day) stay EXTENDED.

Until that patch is merged and deployed, operators can click **Ext** on the row to undo the badge.

Source: Lefteris Daily Ops screenshot 21 Aug 2026; follow-up “currently hosting says extend shouldn’t trigger an extend for the upcoming arrival”; Hosthub calendar-events for rental `Elysian Lycabettus Resilience`. Clearing PR: https://github.com/lete13/elysian-clearing/pull/153
