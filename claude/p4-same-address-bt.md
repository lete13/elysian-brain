# P4 same-address business tax — Votsala 1 and Horizon only

Lefteris, 28 Aug 2026: **only Horizon and Votsala 1 carry τέλος επιτηδεύματος**. The other units at those registered addresses are exempt. This is a Run Tests (P4) change, not a payout-formula change — each apartment still only deducts business tax when *its own* `businessTax` flag is on.

## Groups

| Building | Designated carrier (must have `businessTax`) | Exempt |
|---|---|---|
| Votsala, Piraeus | **Votsala 1** Luxury Stay with Patio | Votsala 2–8 |
| Michalakopoulou / Lycabettus | **Elysian Lycabettus - Horizon** | Panorama, Resilience |

If Votsala 2 (or Panorama) has the flag and the designated carrier does not, P4 **fails**. Coverage is not “any unit in the building”.

## What shipped

- **FE 142** — `sameAddressBtGroup` / `sameAddressBtCarrier` / `sameAddressBtCovered` in Imports → Run Tests. Grouped units skip the per-apartment P4; Votsala 1 and Horizon get an explicit carrier assertion.
- **SRV 109** — FE bootstrap `cn <= 142`.

Apply on top of FE 141 / SRV 108 (Hosthub tax recovery). Copy:

- `fe/patches-142.json`
- `srv/patches-109.json`

Live config note (28 Aug): Panorama still has `businessTax` on in production. Reports will keep deducting ~€50/month there until that flag is turned off. Run Tests will already pass with Horizon + Votsala 1 as carriers even if Panorama’s flag stays on.
