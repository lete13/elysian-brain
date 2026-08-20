# Daily Ops EXTENDED false positive — Resilience 21 Aug 2026

Lefteris asked why **Elysian Lycabettus Resilience** showed as **EXTENDED** / **NO CLEAN** on Daily Ops for Friday 21 Aug 2026 when it was a real turnover.

## What the list was doing

Daily Ops marks a row **EXTENDED** when it thinks the same guest is checking out and straight back in, so the crew can skip the clean. Detection used to fire if **either** the departing or the arriving Hosthub guest name matched:

`extend` / `extended` / `extends` / `extending` / `extension` / `παράταση`

Hosthub’s own extra-nights blocks are titled that way — `extend Evangelia`, `extend Aik Kougioufa`. When that block **ends** and a **different** guest arrives, the checkout name still contains `extend`, so the whole day was treated as a continuation.

## Live Hosthub pair (Resilience, 21 Aug 2026)

| Side | Guest name | Dates | Channel |
|---|---|---|---|
| Checkout | `extend Evangelia ` | 19→21 Aug (2 nights) | manual Hosthub block |
| Arrival | Tasos Syrmalis, 2 pax | 21→22 Aug (1 night) | Booking.com |

That is a turnover. The listing name **Resilience** is unrelated (it does not match the extend regex). Other “residence” rows (Skarlatos, Tauros Metro) were fine because their guest names did not contain `extend`.

## Fix (elysian-clearing `fe/patches-127.json`)

- Incoming `extend …` / `παράταση` still means **no turnover** (same guest continuing).
- Same guest after stripping the Hosthub keyword still means **EXTENDED** (`extend Maria` vs `Maria`).
- A departing `extend …` plus a **different** incoming guest is a normal checkout (needs a clean).
- Check-in-only extend blocks stay EXTENDED.

Until the Railway deploy of that patch, operators can click **Ext** on the row to undo the badge.

Source: Lefteris Daily Ops screenshot 21 Aug 2026; Hosthub calendar-events for rental `Elysian Lycabettus Resilience`.
