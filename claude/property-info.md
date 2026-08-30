# Property Info (amenities, FAQs, Law 5170/2025)

Primary Admin / operator tab (`pinfo`). Storage is **not** on `S.apts` — one Postgres row per apartment so two people editing different units cannot clobber each other.

## API / table

- `GET /api/rental-info` — whole portfolio
- `GET /api/rental-info/:id` · `POST /api/rental-info/:id`
- Table `rental_info` (`rental_id`, `data` JSONB, `updated_by`, `updated_at`) — self-healing DDL (SRV 3)
- Compliance file blobs stay in `proof_files` (`month='law5170'`); the JSON only stores file ids

Auth required. Unattended weekly runs cannot dump live amenity / ΑΜΑ / FAQ values. Schema below is everything the clearing tool stores per apartment.

## Record shape (`riShape`)

```
{
  amenities:  { [amenityId]: { on, note } },
  faqs:       [ { q, a } ],
  houseRules: { maximum_guests, minimum_length_of_stay, base_capacity, … },
  compliance: { [itemId]: { issuedOn, due, number?, files: [proofId] } }
}
```

`houseRules.base_capacity` is mirrored onto `S.apts[].baseCapacity` so Daily Ops can tag sofa-bed prep without waiting for another rental-info fetch.

## Amenities the UI knows

**Essentials:** `wifi_free` (SSID/password prefix) · `aircon` · `iron` · `hairdryer` · `pet_friendly`

**Bedroom & laundry:** `linen` · `clothes_rack` · `drying_rack` · `washing_machine` · `iron_board` · `vacuum` · `mop` · `sofa_bed` (1 / 2)

**Building & access:** `elevator` · `luggage_storage` · `key_lockbox` · `backup_keys` · `doorbell`

## Compliance (Law 5170/2025)

| Id | Label | Notes |
|---|---|---|
| `ama` | ΑΜΑ (registry number) | number + copy button |
| `liability_insurance` | Liability insurance | default renewal 12 months |
| `disinfection` | Disinfection / rodent control | 12 months |
| `smoke_detector` | Fire alarm / smoke detector | 12 months |
| `fire_extinguisher` | Fire extinguisher | 12 months |
| `first_aid` | First aid kit | |
| `emergency_phones` | Emergency phones | optional |
| `electrical_cert` | Electrical safety certificate | |
| `exit_signage` | Emergency exit signage & lighting | |

Inspection pack ZIP downloads every attached proof for that apartment.

## Related

- Keys (physical backup sets, not lockbox copy): [`keys-hubs.md`](keys-hubs.md)
- Per-apartment Configuration: [`apartment-config.md`](apartment-config.md)
