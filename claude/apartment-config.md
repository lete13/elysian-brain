# Apartment configuration (live snapshot + catalog)

Canonical copy of every apartment in Elysian Clearing **Configuration** (`S.apts`), plus every listing / grouping field we can derive from the tool without a live login. **Do not store ΑΦΜ.** Refresh `apartment-config.json` from `/api/db/data` when Configuration changes, then run `python3 scripts/build-apartment-catalog.py`.

- Pulled (live `S.apts`): `2026-08-28T10:02:40Z`
- Catalog built: `2026-08-30T02:04:23Z`
- Source: `https://elysian-clearing-production.up.railway.app/api/db/data`
- Rows in Configuration: **62** (operating **61** + dummy **1**)
- Operating profiles: leased 31 · b2b 16 · private 14
- Dummy row (not an operating unit): **ZZ-TEST-DONOTUSE**
- `businessTax` on: 22 · off: 40
- Designated P4 carriers (same-address groups): **Votsala 1 Luxury Stay with Patio**, **Elysian Lycabettus - Horizon** — Votsala 2–8 and Lycabettus Panorama / Resilience are exempt
- Machine-readable full catalog: [`apartment-catalog.json`](apartment-catalog.json) · raw snapshot: [`apartment-config.json`](apartment-config.json)
- Live **Property Info** (`/api/rental-info`) and **Keys Hubs assignments** (`S.keyHubs`) need an attended login — schema in [`property-info.md`](property-info.md) and [`keys-hubs.md`](keys-hubs.md)

## How to read the flags

| Field | Meaning |
|---|---|
| `profile` | `leased` / `b2b` / `private` |
| `mgmtFee` | Management fee % of net (after platform fees, TAKK, optional VAT/mun.tax, cleaning, business tax) |
| `cleaningFee` | Cleaning amount charged to the owner on checkout |
| `businessTax` | Leased-profile τέλος επιτηδεύματος. Reduces the mgmt-fee base once per month when the flag is on. Same-address buildings share one levy — only the designated carrier should have this on. |
| `vatLiable` / `chargeVat` / `vatOnFees` / `deductVAT` | Owner VAT treatment vs Elysian 24% on fees |
| `deductCT` | Climate tax (TAKK) deducted from owner payout |
| `municipalityTax` | Municipal accommodation tax deducted when on |
| `deductCleaning` | Cleaning deducted from payout |
| `fixedCharges` | Monthly extras (software, electricity, water, …) on the owner report |
| `b2bPartner` / `b2bRemitRate` | B2B partner name and remittance rate (often empty — grouping may live in `clearGroup`) |
| `clearGroup` | Shared clearing group (Votsala, Michalakopoulou, Cedar Apt, Veranda, Le Apartments, Sarris, …) |
| `bookingHotelId` | Booking.com hotel / apartment id used to file platform invoices. Votsala 1–8 share `13180441`. |
| `airbnbRoomId` | Numeric Airbnb listing id parsed from `airbnbUrl` |
| `oxyContactId` / `oxyContactName` | Linked Oxygen Pelatologio contact for ΑΠΥ/ΤΠΥ |
| `nearestKeyHub` | Closest physical Keys Hub by lat/lng (assignment of actual key sets is live `S.keyHubs`) |

## Directory

| Apartment | City | Profile | Lang | BT | BT note | Mgmt % | Cleaning | deductCT | deductVAT | Mun. tax | vatOnFees | clearGroup | b2bPartner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ZZ-TEST-DONOTUSE |  | private | EN | no |  | 20 | 0.01 | yes | no | no | yes |  |  |
| Seaside Lavrio Beach House | Anatoliki Attiki | b2b | EN | no |  | 15 | 45 | yes | yes | yes | yes |  |  |
| Athens Riviera Escape | Argyroupoli | private | EN | no |  | 17.5 | 70 | yes | no | no | yes |  |  |
| Art House | Athens | private | EN | no |  | 17.5 | 45 | yes | no | no | yes |  |  |
| Art Island Apartment | Athens | leased | EN | yes |  | 17.5 | 35 | yes | yes | yes | no |  |  |
| Avenue of Gods: Irakli's Retreat | Athens | private | EN | no |  | 15 | 55 | yes | no | no | yes |  |  |
| Cozy Acropolis backyard haven | Athens | private | EN | no |  | 15 | 35 | yes | no | no | yes |  |  |
| Elysian Ithaki | Athens | private | EN | no |  | 17.5 | 45 | yes | no | no | yes |  |  |
| Elysian Lycabettus - Horizon | Athens | leased | EN | yes | carrier | 15 | 30 | yes | yes | yes | no | Michalakopoulou |  |
| Elysian Lycabettus - Panorama | Athens | leased | EN | no | same-address: Horizon | 15 | 30 | yes | yes | yes | no |  |  |
| Elysian Lycabettus Resilience | Athens | leased | EN | no | same-address: Horizon | 15 | 30 | yes | yes | yes | no | Michalakopoulou |  |
| Navarino Athenian Nest | Athens | leased | EN | yes |  | 15 | 40 | yes | yes | yes | no |  |  |
| Svorex Apartment 1 | Athens | leased | GR | yes |  | 17.5 | 10 | yes | yes | yes | no |  |  |
| The Athenian Atelier / Kolonaki Sqr | Athens | b2b | EN | no |  | 17.5 | 40 | yes | yes | yes | yes |  |  |
| The Athenian Cedar | Athens | b2b | EN | no |  | 17.5 | 50 | yes | yes | yes | yes | Cedar Apt |  |
| The Athenian Vintage | Athens | leased | EN | yes |  | 15 | 35 | yes | yes | yes | no |  |  |
| The Brightline Apartment Athens | Athens | leased | EN | yes |  | 15 | 25 | yes | yes | yes | no |  |  |
| The Monograph | Athens | b2b | EN | no |  | 15 | 55 | yes | yes | yes | yes |  |  |
| The Olive & Cedar Apartment | Athens | b2b | EN | no |  | 17.5 | 65 | yes | yes | yes | yes | Cedar Apt |  |
| Urban Cedar Apartment | Athens | b2b | EN | no |  | 17.5 | 50 | yes | yes | yes | yes | Cedar Apt |  |
| Vista Acropolis | Athens | leased |  | yes |  |  |  | yes | yes | yes | no |  |  |
| Acropolis Skyline Sunset | Athina | private | GR | no |  | 15 | 35 | yes | no | no | yes |  |  |
| City Nexus Family apt, Kolonos | Athina | private | EN | no |  | 16.5 | 38 | yes | no | no | yes |  |  |
| Coloneum | Athina | leased | EN | yes |  | 17 | 25 | yes | yes | yes | no |  |  |
| Stylish Downtown Apartment | Athina | leased | EN | yes |  | 17 | 37 | yes | yes | yes | no |  |  |
| The Athenian Veranda | Athina | b2b | EN | no |  | 15 | 0 | yes | yes | yes | yes | Veranda |  |
| The Athenian Veranda 2 | Athina | b2b | EN | no |  | 15 | 0 | yes | yes | yes | yes | Veranda |  |
| The Athenian Veranda 3 | Athina | b2b | EN | no |  | 15 | 0 | yes | yes | yes | yes | Veranda |  |
| The Athenian Veranda 4 | Athina | b2b | EN | no |  | 15 | 0 | yes | yes | yes | yes | Veranda |  |
| ARITI 7 | Chaniotis | b2b | EN | no |  | 17.5 | 65 | yes | yes | yes | yes |  |  |
| Athens Unity Apartment | Cholargos | leased | EN | yes |  | 15 | 30 | yes | yes | yes | no | Sarris |  |
| Birdhouse Apartment | Cholargos | leased | GR | yes |  | 15 | 10 | yes | yes | yes | no | Sarris |  |
| Elysian Agon | Cholargos | leased | GR | yes |  | 15 | 40 | yes | yes | yes | no | Sarris |  |
| Elysian Ariadne | Cholargos | leased | GR | yes |  | 15 | 40 | yes | yes | yes | no | Sarris |  |
| Elysian Mary | Cholargos | leased | GR | yes |  | 15 | 40 | yes | yes | yes | no | Sarris |  |
| Filoxenia Apartment Athens | Cholargos | leased | GR | yes |  | 15 | 30 | yes | yes | yes | no | Sarris |  |
| Sunset Nest in Fiskardo | Fiskardo | private | EN | no |  | 17.5 | 20 | yes | no | no | yes |  |  |
| Amarysia Residence | Marousi | leased |  | yes |  | 17.5 | 40 | yes | yes | yes | no |  |  |
| Pallantides Residence | Municipality of Pallini | leased |  | yes |  | 17.5 |  | yes | yes | yes | no |  |  |
| Elysian Smyrni / Marble Elegance Retreat | Nea Smyrni | private | EN | no |  | 15 | 35 | yes | no | no | yes |  |  |
| Le Alex, Bright & Modern Escape near CityCenter | Neapoli | b2b | EN | no |  | 17.5 | 25 | yes | yes | yes | yes | Le Apartments |  |
| Le Floor, Urban Escape near Thessaloniki center | Neapoli | b2b | EN | no |  | 17.5 | 25 | yes | yes | yes | yes | Le Apartments |  |
| Villa Liberty | Paleo Kalamaki, Isthmia | private | EN | no |  | 8.5 | 0 | yes | no | no | yes |  |  |
| P & G Apartment | Pamfila | private | EN | no |  | 10 | 0 | yes | no | no | yes |  |  |
| A modern & Peaceful apartment • Near metro station | Piraeus | private |  | no |  | 17.5 | 35 | yes | no | no | yes |  |  |
| Votsala 1 Luxury Stay with Patio | Pireas | leased | EN | yes | carrier | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Votsala 2 Luxury Stay with Patio | Pireas | leased | EN | no | same-address: Votsala 1 | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Votsala 3 Deluxe & Modern Apartment in Piraeus | Pireas | leased | EN | no | same-address: Votsala 1 | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Votsala 4 Small & Elegant Apartment in Piraeus | Pireas | leased | EN | no | same-address: Votsala 1 | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Votsala 5 Luxury Studio with Balcony in Piraeus | Pireas | leased | EN | no | same-address: Votsala 1 | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Votsala 6 Deluxe & Modern Apartment in Piraeus | Pireas | leased | EN | no | same-address: Votsala 1 | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Votsala 7 Small & Elegant Apartment in Piraeus | Pireas | leased | EN | no | same-address: Votsala 1 | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Votsala 8 Elegant & Modern Apartment in Piraeus | Pireas | leased | EN | no | same-address: Votsala 1 | 15 | 20 | yes | yes | yes | no | Votsala |  |
| Eclectic Apartment with Stunning Seaview | Porto Rafti | leased | GR | yes |  | 15 | 15 | yes | yes | yes | no | Sarris |  |
| Pixie Studio Athens | Psichiko | leased | EN | yes |  | 15 | 30 | yes | yes | yes | no |  |  |
| The Skarlatos residence | Sykies | private |  | no |  | 17.5 | 35 | yes | no | no | yes |  |  |
| The Tauros Metro Residence | Tavros | private | EN | no |  | 17.5 | 0 | yes | no | no | yes |  |  |
| Elysian Cornerstone | Thessaloniki | leased | EN | yes |  | 17.5 | 25 | yes | yes | yes | no |  |  |
| Elysian Hightower | Thessaloniki | leased | EN | yes |  | 17.5 | 30 | yes | yes | yes | no |  |  |
| Le Grace, Urban Retreat Near CityCenter & Sea | Thessaloniki | b2b | EN | no |  | 17.5 | 15 | yes | yes | yes | yes | Le Apartments |  |
| Le Plaza, Modern Escape near Thessaloniki Center | Thessaloniki | b2b | EN | no |  | 17.5 | 15 | yes | yes | yes | yes | Le Apartments |  |
| Cozy Corner Zografou | Zografou | b2b | EN | no |  | 17.5 | 25 | yes | yes | yes | yes |  |  |

## Listings (Airbnb + Booking.com)

Every channel id the clearing tool stores or can derive. Sunset Nest in Fiskardo has Airbnb but no Booking.com hotel id.

| Apartment | Airbnb room | Booking hotel id | Airbnb URL | Booking URL |
|---|---|---|---|---|
| A modern & Peaceful apartment • Near metro station |  | 16790678 |  | https://www.booking.com/hotel/gr/a-modern-amp-peaceful-apartment-near-metro-station.html |
| ARITI 7 | 1409351248807153469 | 16179987 | https://www.airbnb.com/rooms/1409351248807153469 | https://www.booking.com/hotel/gr/ariti-7.html |
| Acropolis Skyline Sunset | 1345614215404704287 | 13530943 | https://www.airbnb.com/rooms/1345614215404704287 | https://www.booking.com/hotel/gr/acropolis-skyline-sunset-2-person-loft-exarchia.html |
| Amarysia Residence | 1739745422831880491 | 16970823 | https://www.airbnb.com/rooms/1739745422831880491 | https://www.booking.com/hotel/gr/amarysia-residence.html |
| Art House | 1648583621827143016 | 2694511 | https://www.airbnb.com/rooms/1648583621827143016 | https://www.booking.com/hotel/gr/art-house-athina.html |
| Art Island Apartment | 1648577160749167781 | 3691249 | https://www.airbnb.com/rooms/1648577160749167781 | https://www.booking.com/hotel/gr/art-island-house.html |
| Athens Riviera Escape | 1654990553887317253 | 16095913 | https://www.airbnb.com/rooms/1654990553887317253 | https://www.booking.com/hotel/gr/athens-riviera-escape.html |
| Athens Unity Apartment | 1575271336855648500 | 15446308 | https://www.airbnb.com/rooms/1575271336855648500 | https://www.booking.com/hotel/gr/athens-unity-apartment.html |
| Avenue of Gods: Irakli's Retreat | 1428439480051414717 | 14229780 | https://www.airbnb.com/rooms/1428439480051414717 | https://www.booking.com/hotel/gr/avenue-of-gods-iraklis-retreat.html |
| Birdhouse Apartment | 1113850623465381797 | 11820968 | https://www.airbnb.com/rooms/1113850623465381797 | https://www.booking.com/hotel/gr/birdhouse-apartment-athens.html |
| City Nexus Family apt, Kolonos | 1110029648002585663 | 11697418 | https://www.airbnb.com/rooms/1110029648002585663 | https://www.booking.com/hotel/gr/diamerisma-sto-peristeri.html |
| Coloneum | 1176023305997447213 | 12240693 | https://www.airbnb.com/rooms/1176023305997447213 | https://www.booking.com/hotel/gr/coloneum.html |
| Cozy Acropolis backyard haven | 1415945565296655264 | 14526412 | https://www.airbnb.com/rooms/1415945565296655264 | https://www.booking.com/hotel/gr/cozy-acropolis-backyard-haven.html |
| Cozy Corner Zografou | 1695503430210223974 | 16563803 | https://www.airbnb.com/rooms/1695503430210223974 | https://www.booking.com/hotel/gr/cozy-corner-zografou.html |
| Eclectic Apartment with Stunning Seaview | 53962204 | 8061808 | https://www.airbnb.com/rooms/53962204 | https://www.booking.com/hotel/gr/eclectic-apartment-with-stunning-seaview.html |
| Elysian Agon | 1720372086559195548 | 16782880 | https://www.airbnb.com/rooms/1720372086559195548 | https://www.booking.com/hotel/gr/elysian-agon.html |
| Elysian Ariadne | 1743333295420205914 | 17003695 | https://www.airbnb.com/rooms/1743333295420205914 | https://www.booking.com/hotel/gr/elysian-ariadne.html |
| Elysian Cornerstone | 1660947682248740323 | 16142352 | https://www.airbnb.com/rooms/1660947682248740323 | https://www.booking.com/hotel/gr/city-pulse-tsimiski.html |
| Elysian Hightower | 1673944940528932729 | 16264920 | https://www.airbnb.com/rooms/1673944940528932729 | https://www.booking.com/hotel/gr/elysian-hightower.html |
| Elysian Ithaki | 1707847743400132355 | 16681558 | https://www.airbnb.com/rooms/1707847743400132355 | https://www.booking.com/hotel/gr/ithakis.html |
| Elysian Lycabettus - Horizon | 1533101363587646076 | 15109307 | https://www.airbnb.com/rooms/1533101363587646076 | https://www.booking.com/hotel/gr/elysian-lycabettus-horizon.html |
| Elysian Lycabettus - Panorama | 1536963082218109215 | 15139682 | https://www.airbnb.com/rooms/1536963082218109215 | https://www.booking.com/hotel/gr/elysian-lycabettus-panorama.html |
| Elysian Lycabettus Resilience | 1628378411209014073 | 15863661 | https://www.airbnb.com/rooms/1628378411209014073 | https://www.booking.com/hotel/gr/elysian-lycabettus-resilience.html |
| Elysian Mary | 1743379100217492903 | 17003916 | https://www.airbnb.com/rooms/1743379100217492903 | https://www.booking.com/hotel/gr/elysian-mary.html |
| Elysian Smyrni / Marble Elegance Retreat | 1550793670705726321 | 15244054 | https://www.airbnb.com/rooms/1550793670705726321 | https://www.booking.com/hotel/gr/elysian-smyrni-marble-elegance-retreat.html |
| Filoxenia Apartment Athens | 626569261600703200 | 8519226 | https://www.airbnb.com/rooms/626569261600703200 | https://www.booking.com/hotel/gr/filoxenia-apartment-athens.html |
| Le Alex, Bright & Modern Escape near CityCenter | 1675270306916665389 | 9889560 | https://www.airbnb.com/rooms/1675270306916665389 | https://www.booking.com/hotel/gr/le-alex.html |
| Le Floor, Urban Escape near Thessaloniki center | 1678086314695437509 | 10301287 | https://www.airbnb.com/rooms/1678086314695437509 | https://www.booking.com/hotel/gr/le-floor.html |
| Le Grace, Urban Retreat Near CityCenter & Sea | 1675233244645429602 | 15616835 | https://www.airbnb.com/rooms/1675233244645429602 | https://www.booking.com/hotel/gr/le-grace.html |
| Le Plaza, Modern Escape near Thessaloniki Center | 1678100706235909715 | 8856583 | https://www.airbnb.com/rooms/1678100706235909715 | https://www.booking.com/hotel/gr/le-plaza.html |
| Navarino Athenian Nest | 1551451617376547953 | 15253339 | https://www.airbnb.com/rooms/1551451617376547953 | https://www.booking.com/hotel/gr/navarino-athenian-nest.html |
| P & G Apartment | 25485404 | 3576367 | https://www.airbnb.com/rooms/25485404 | https://www.booking.com/hotel/gr/p-amp-g-apartment.html |
| Pallantides Residence | 1739100076917342136 | 16965040 | https://www.airbnb.com/rooms/1739100076917342136 | https://www.booking.com/hotel/gr/pallantides-residence.html |
| Pixie Studio Athens | 1359971231382097609 | 13787615 | https://www.airbnb.com/rooms/1359971231382097609 | https://www.booking.com/hotel/gr/pixie-studio-athens.html |
| Seaside Lavrio Beach House | 1157736679272964647 | 12589775 | https://www.airbnb.com/rooms/1157736679272964647 | https://www.booking.com/hotel/gr/seaside-lavrio-beach-house.html |
| Stylish Downtown Apartment | 1156972702086530080 | 12088477 | https://www.airbnb.com/rooms/1156972702086530080 | https://www.booking.com/hotel/gr/downtown-urban-retreat.html |
| Sunset Nest in Fiskardo | 1453479845896974154 |  | https://www.airbnb.com/rooms/1453479845896974154 |  |
| Svorex Apartment 1 | 1648451152001700142 | 16037747 | https://www.airbnb.com/rooms/1648451152001700142 | https://www.booking.com/hotel/gr/svorex-apartment-1.html |
| The Athenian Atelier / Kolonaki Sqr | 1648443585619767153 | 16042781 | https://www.airbnb.com/rooms/1648443585619767153 | https://www.booking.com/hotel/gr/the-athenian-atelier-kolonaki-sqr.html |
| The Athenian Cedar | 1683881551182146125 | 16401227 | https://www.airbnb.com/rooms/1683881551182146125 | https://www.booking.com/hotel/gr/the-athenian-cedar.html |
| The Athenian Veranda | 1387761460037163844 | 13869983 | https://www.airbnb.com/rooms/1387761460037163844 | https://www.booking.com/hotel/gr/the-athenian-veranda.html |
| The Athenian Veranda 2 | 1387542381103795154 | 13870030 | https://www.airbnb.com/rooms/1387542381103795154 | https://www.booking.com/hotel/gr/the-athenian-veranda-2.html |
| The Athenian Veranda 3 |  | 13870130 |  | https://www.booking.com/hotel/gr/the-athenian-veranda-3.html |
| The Athenian Veranda 4 |  | 13870170 |  | https://www.booking.com/hotel/gr/the-athenian-veranda-4.html |
| The Athenian Vintage | 1430380729328581463 | 14519003 | https://www.airbnb.com/rooms/1430380729328581463 | https://www.booking.com/hotel/gr/the-athenian-vintage.html |
| The Brightline Apartment Athens | 1476592548087926911 | 14678384 | https://www.airbnb.com/rooms/1476592548087926911 | https://www.booking.com/hotel/gr/the-brighline-apartment-athens.html |
| The Monograph | 1457478077298446936 | 14511943 | https://www.airbnb.com/rooms/1457478077298446936 | https://www.booking.com/hotel/gr/monograph-athens-design-story.html |
| The Olive & Cedar Apartment | 1684618662006333780 | 16413046 | https://www.airbnb.com/rooms/1684618662006333780 | https://www.booking.com/hotel/gr/the-olive-amp-cedar-apartment.html |
| The Skarlatos residence | 1715113306604953951 | 16752461 | https://www.airbnb.com/rooms/1715113306604953951 | https://www.booking.com/hotel/gr/the-skarlatos-residence.html |
| The Tauros Metro Residence | 1661666585458299013 | 16147899 | https://www.airbnb.com/rooms/1661666585458299013 | https://www.booking.com/hotel/gr/the-cozy-tribe-house-in-tavros.html |
| Urban Cedar Apartment | 1684911138034072059 | 16418733 | https://www.airbnb.com/rooms/1684911138034072059 | https://www.booking.com/hotel/gr/urban-cedar-apartment.html |
| Villa Liberty | 25486921 | 3575720 | https://www.airbnb.com/rooms/25486921 |  |
| Vista Acropolis | 1715060633436431742 | 16750800 | https://www.airbnb.com/rooms/1715060633436431742 | https://www.booking.com/hotel/gr/vista-acropolis.html |
| Votsala 1 Luxury Stay with Patio | 1300551802927577969 | 13180441 | https://www.airbnb.com/rooms/1300551802927577969 | https://www.booking.com/hotel/gr/votsalo-6.html |
| Votsala 2 Luxury Stay with Patio | 1300566616615348916 | 13180441 | https://www.airbnb.com/rooms/1300566616615348916 | https://www.booking.com/hotel/gr/votsalo-6.html |
| Votsala 3 Deluxe & Modern Apartment in Piraeus | 1300580624323834408 | 13180441 | https://www.airbnb.com/rooms/1300580624323834408 | https://www.booking.com/hotel/gr/votsalo-6.html |
| Votsala 4 Small & Elegant Apartment in Piraeus | 1300507417060524315 | 13180441 | https://www.airbnb.com/rooms/1300507417060524315 | https://www.booking.com/hotel/gr/votsalo-6.html |
| Votsala 5 Luxury Studio with Balcony in Piraeus | 1300584121460319767 | 13180441 | https://www.airbnb.com/rooms/1300584121460319767 | https://www.booking.com/hotel/gr/votsalo-6.html |
| Votsala 6 Deluxe & Modern Apartment in Piraeus | 1300589083323606529 | 13180441 | https://www.airbnb.com/rooms/1300589083323606529 | https://www.booking.com/hotel/gr/votsalo-6.html |
| Votsala 7 Small & Elegant Apartment in Piraeus | 1243552526060378890 | 13180441 | https://www.airbnb.com/rooms/1243552526060378890 | https://www.booking.com/hotel/gr/votsalo-6.html |
| Votsala 8 Elegant & Modern Apartment in Piraeus | 1300593459517785165 | 13180441 | https://www.airbnb.com/rooms/1300593459517785165 | https://www.booking.com/hotel/gr/votsalo-6.html |

## Addresses, coordinates, nearest Keys Hub

Nearest hub is **distance only**. Actual backup-key assignments live in `S.keyHubs` (not in this snapshot).

| Apartment | Address | Lat | Lng | Nearest hub | km |
|---|---|---|---|---|---|
| A modern & Peaceful apartment • Near metro station | Koritsas 46, Nikaia | 37.9613793 | 23.6530636 | Votsala | 0.7 |
| ARITI 7 |  | 40.01008532982 | 23.550286858678 | Thessaloniki | 83.23 |
| Acropolis Skyline Sunset | Asimaki Fotila 1, Eksarchia | 37.9902029 | 23.7356426 | Verandas | 2.48 |
| Amarysia Residence | P.Tsaldari 13, Marousi | 38.0556714 | 23.8023625 | Cholargos | 5.89 |
| Art House | Plapouta 33, Eksarchia | 37.9901539 | 23.7379251 | Verandas | 2.54 |
| Art Island Apartment | Plapouta 28, Eksarchia | 37.9899948 | 23.7379738 | Verandas | 2.52 |
| Athens Riviera Escape | Militou 98,Argyroupoli | 37.9104965 | 23.7577886 | Driver | 2.5 |
| Athens Unity Apartment | 17is Noemvriou 19 | 38.0057391 | 23.8029094 | Cholargos | 0.76 |
| Avenue of Gods: Irakli's Retreat | Iraklidon 36 | 37.9758197 | 23.7171522 | Verandas | 1.28 |
| Birdhouse Apartment | 17is Noemvriou 19 | 38.0057587 | 23.8029627 | Cholargos | 0.76 |
| City Nexus Family apt, Kolonos | Onata 11 | 38.0013985 | 23.7064877 | Verandas | 4.13 |
| Coloneum | Tripoleos 12 | 37.9947189 | 23.7131811 | Verandas | 3.2 |
| Cozy Acropolis backyard haven | Roumelis 50 | 37.965151250145 | 23.71315800318 | Verandas | 1.4 |
| Cozy Corner Zografou | Silistrias 23 | 37.9727414 | 23.7684193 | Verandas | 3.53 |
| Eclectic Apartment with Stunning Seaview |  | 37.893379 | 24.018793 | Driver | 22.42 |
| Elysian Agon | 17is Noemvriou 19 | 38.0057391 | 23.8029094 | Cholargos | 0.76 |
| Elysian Ariadne | 17is Noemvriou 19 | 38.0057391 | 23.8029094 | Cholargos | 0.76 |
| Elysian Cornerstone | Tsimiski 107 | 40.6295285 | 22.9483828 | Thessaloniki | 2.63 |
| Elysian Hightower | Proxenou Koromila 3 | 40.6317634 | 22.9420909 | Thessaloniki | 3.06 |
| Elysian Ithaki | Ithakis 54 | 37.9984691 | 23.7306433 | Verandas | 3.33 |
| Elysian Lycabettus - Horizon | Michalakopoulou 100 | 37.9808793 | 23.7579983 | Verandas | 2.92 |
| Elysian Lycabettus - Panorama | Michalakopoulou 100 | 37.9808793 | 23.7579983 | Verandas | 2.92 |
| Elysian Lycabettus Resilience | Michalakopoulou 100 | 37.9808793 | 23.7579983 | Verandas | 2.92 |
| Elysian Mary | 17is Noemvriou 19 | 38.0057391 | 23.8029094 | Cholargos | 0.76 |
| Elysian Smyrni / Marble Elegance Retreat | Amisou 85 | 37.9423499 | 23.7188815 | Verandas | 3.04 |
| Filoxenia Apartment Athens | 17is Noemvriou 19 | 38.005680084229 | 23.802783966064 | Cholargos | 0.74 |
| Le Alex, Bright & Modern Escape near CityCenter | Vasileos Kwn/nou 5 | 40.6502426 | 22.9407658 | Thessaloniki | 5.02 |
| Le Floor, Urban Escape near Thessaloniki center | Vasileos Kwn/nou 5 | 40.6502426 | 22.9407658 | Thessaloniki | 5.02 |
| Le Grace, Urban Retreat Near CityCenter & Sea | Evelpidou 18 | 40.5763265 | 22.9500636 | Thessaloniki | 3.48 |
| Le Plaza, Modern Escape near Thessaloniki Center | Evelpidou 18 | 40.5763265 | 22.9500636 | Thessaloniki | 3.48 |
| Navarino Athenian Nest | Derigni 24 | 37.9949201 | 23.7308911 | Verandas | 2.93 |
| P & G Apartment |  | 39.156776428223 | 26.521476745605 | Cholargos | 269.48 |
| Pallantides Residence | Αndroutsou 6 | 38.0017743 | 23.8785167 | Cholargos | 7.32 |
| Pixie Studio Athens | Smolika 2 | 38.0075149 | 23.7665466 | Cholargos | 2.54 |
| Seaside Lavrio Beach House |  | 37.676938439413 | 24.067168571714 | Driver | 38.64 |
| Stylish Downtown Apartment | Acharnwn kai Olimpias | 38.0062299 | 23.7289989 | Verandas | 4.18 |
| Sunset Nest in Fiskardo |  | 38.459279435631 | 20.576663687825 | Votsala | 273.88 |
| Svorex Apartment 1 | Miron 1-3 | 37.995761 | 23.7286991 | Verandas | 3.02 |
| The Athenian Atelier / Kolonaki Sqr | Kapsali 7B | 37.9770761 | 23.7419824 | Verandas | 1.51 |
| The Athenian Cedar | Michail Voda 118-124 | 37.9981453 | 23.7259361 | Verandas | 3.29 |
| The Athenian Veranda | Makri 19 | 37.9681584 | 23.7305603 | Verandas | 0.19 |
| The Athenian Veranda 2 | Makri 19 | 37.968158461016 | 23.730560280383 | Verandas | 0.19 |
| The Athenian Veranda 3 | Makri 19 | 37.9681584 | 23.7305603 | Verandas | 0.19 |
| The Athenian Veranda 4 | Makri 19 | 37.9681584 | 23.7305603 | Verandas | 0.19 |
| The Athenian Vintage | Maiandroupoleos 40 | 37.9932944 | 23.7614632 | Cholargos | 3.13 |
| The Brightline Apartment Athens | Sikelias 26 | 37.9615378 | 23.7212435 | Verandas | 1.01 |
| The Monograph | Makrigianni 33 | 37.9678513 | 23.7293419 | Verandas | 0.11 |
| The Olive & Cedar Apartment | Feron 32-34 | 37.9926731 | 23.727932 | Verandas | 2.68 |
| The Skarlatos residence | Odiseos kai apostolou Foka 6 | 40.647662 | 22.9604933 | Thessaloniki | 4.53 |
| The Tauros Metro Residence | Omirou 5 | 37.9621325 | 23.7009289 | Verandas | 2.52 |
| Urban Cedar Apartment | Timoksenous 34 | 37.9599237 | 23.733692 | Verandas | 1.07 |
| Villa Liberty |  | 37.898104 | 23.011299 | Votsala | 56.07 |
| Vista Acropolis | Agias Irinis 13 | 37.9769269 | 23.7269337 | Verandas | 0.94 |
| Votsala 1 Luxury Stay with Patio | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |
| Votsala 2 Luxury Stay with Patio | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |
| Votsala 3 Deluxe & Modern Apartment in Piraeus | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |
| Votsala 4 Small & Elegant Apartment in Piraeus | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |
| Votsala 5 Luxury Studio with Balcony in Piraeus | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |
| Votsala 6 Deluxe & Modern Apartment in Piraeus | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |
| Votsala 7 Small & Elegant Apartment in Piraeus | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |
| Votsala 8 Elegant & Modern Apartment in Piraeus | Louka Ralli 59 | 37.9438398 | 23.653089 | Votsala | 1.74 |

## Oxygen contacts

| Apartment | Oxygen contact | Linked |
|---|---|---|
| A modern & Peaceful apartment • Near metro station | Panagiotis Cholis | yes |
| ARITI 7 |  | no |
| Acropolis Skyline Sunset | Manos Papadogeorgakis | yes |
| Amarysia Residence |  | no |
| Art House | NEKTARIOS MARIOLAKIS | yes |
| Art Island Apartment |  | no |
| Athens Riviera Escape | Maria Antonia Douligeri | yes |
| Athens Unity Apartment |  | no |
| Avenue of Gods: Irakli's Retreat | Martin & Sophie Coates | yes |
| Birdhouse Apartment |  | no |
| City Nexus Family apt, Kolonos | Loukas Kolovatas | yes |
| Coloneum |  | no |
| Cozy Acropolis backyard haven | Giannis Manousakis | yes |
| Cozy Corner Zografou | ΒΕΝΙΟΥ ΑΡΓΥΡΩ ΜΑΡΙΑ ΓΕΩΡΓΙΟΣ | yes |
| Eclectic Apartment with Stunning Seaview |  | no |
| Elysian Agon |  | no |
| Elysian Ariadne |  | no |
| Elysian Cornerstone |  | no |
| Elysian Hightower |  | no |
| Elysian Ithaki | Φάντη Χαλιφέ | yes |
| Elysian Lycabettus - Horizon |  | no |
| Elysian Lycabettus - Panorama |  | no |
| Elysian Lycabettus Resilience |  | no |
| Elysian Mary |  | no |
| Elysian Smyrni / Marble Elegance Retreat | Vasilis Mordos | yes |
| Filoxenia Apartment Athens |  | no |
| Le Alex, Bright & Modern Escape near CityCenter | HARVAL Ε Ε | yes |
| Le Floor, Urban Escape near Thessaloniki center | HARVAL Ε Ε | yes |
| Le Grace, Urban Retreat Near CityCenter & Sea | HARVAL Ε Ε | yes |
| Le Plaza, Modern Escape near Thessaloniki Center | HARVAL Ε Ε | yes |
| Navarino Athenian Nest |  | no |
| P & G Apartment |  | no |
| Pallantides Residence |  | no |
| Pixie Studio Athens |  | no |
| Seaside Lavrio Beach House |  | no |
| Stylish Downtown Apartment |  | no |
| Sunset Nest in Fiskardo |  | no |
| Svorex Apartment 1 |  | no |
| The Athenian Atelier / Kolonaki Sqr | ΧΡΙΣΤΟΠΟΥΛΟΥ ΑΛΕΞΑΝΔΡΑ ΣΙΑ ΟΕ | yes |
| The Athenian Cedar |  | no |
| The Athenian Veranda | DIMITRIOS KOMIS SINGLE MEMBER P.C. | yes |
| The Athenian Veranda 2 | DIMITRIOS KOMIS SINGLE MEMBER P.C. | yes |
| The Athenian Veranda 3 | DIMITRIOS KOMIS SINGLE MEMBER P.C. | yes |
| The Athenian Veranda 4 | DIMITRIOS KOMIS SINGLE MEMBER P.C. | yes |
| The Athenian Vintage |  | no |
| The Brightline Apartment Athens |  | no |
| The Monograph | DEMIS INTERNATIONAL IKE | yes |
| The Olive & Cedar Apartment |  | no |
| The Skarlatos residence | Kostas Skarlatos | yes |
| The Tauros Metro Residence | KUJTIM LULAJ | yes |
| Urban Cedar Apartment |  | no |
| Villa Liberty |  | no |
| Vista Acropolis |  | no |
| Votsala 1 Luxury Stay with Patio |  | no |
| Votsala 2 Luxury Stay with Patio |  | no |
| Votsala 3 Deluxe & Modern Apartment in Piraeus |  | no |
| Votsala 4 Small & Elegant Apartment in Piraeus |  | no |
| Votsala 5 Luxury Studio with Balcony in Piraeus |  | no |
| Votsala 6 Deluxe & Modern Apartment in Piraeus |  | no |
| Votsala 7 Small & Elegant Apartment in Piraeus |  | no |
| Votsala 8 Elegant & Modern Apartment in Piraeus |  | no |

## Clearing groups

- **Cedar Apt** (3): The Athenian Cedar, The Olive & Cedar Apartment, Urban Cedar Apartment
- **Le Apartments** (4): Le Alex, Bright & Modern Escape near CityCenter, Le Floor, Urban Escape near Thessaloniki center, Le Grace, Urban Retreat Near CityCenter & Sea, Le Plaza, Modern Escape near Thessaloniki Center
- **Michalakopoulou** (2): Elysian Lycabettus - Horizon, Elysian Lycabettus Resilience
- **Sarris** (7): Athens Unity Apartment, Birdhouse Apartment, Elysian Agon, Elysian Ariadne, Elysian Mary, Filoxenia Apartment Athens, Eclectic Apartment with Stunning Seaview
- **Veranda** (4): The Athenian Veranda, The Athenian Veranda 2, The Athenian Veranda 3, The Athenian Veranda 4
- **Votsala** (8): Votsala 1 Luxury Stay with Patio, Votsala 2 Luxury Stay with Patio, Votsala 3 Deluxe & Modern Apartment in Piraeus, Votsala 4 Small & Elegant Apartment in Piraeus, Votsala 5 Luxury Studio with Balcony in Piraeus, Votsala 6 Deluxe & Modern Apartment in Piraeus, Votsala 7 Small & Elegant Apartment in Piraeus, Votsala 8 Elegant & Modern Apartment in Piraeus

## Completeness gaps (operating units)

- Language unset (**5**): Vista Acropolis, Amarysia Residence, Pallantides Residence, A modern & Peaceful apartment • Near metro station, The Skarlatos residence
- `b2bPartner` empty on all B2B units (**16**): grouping often lives in `clearGroup`
- No Airbnb URL (**3**): The Athenian Veranda 3, The Athenian Veranda 4, A modern & Peaceful apartment • Near metro station
- No Booking.com hotel id (**1**): Sunset Nest in Fiskardo
- No address (**6**): Seaside Lavrio Beach House, ARITI 7, Sunset Nest in Fiskardo, Villa Liberty, P & G Apartment, Eclectic Apartment with Stunning Seaview
- No lat/lng (**0**): —
- No owner email (**11**): Seaside Lavrio Beach House, Elysian Lycabettus - Horizon, Elysian Lycabettus - Panorama, Elysian Lycabettus Resilience, The Athenian Vintage, Vista Acropolis, ARITI 7, Sunset Nest in Fiskardo, Villa Liberty, P & G Apartment, Elysian Cornerstone
- No Oxygen contact (**39**): 39 units — needed before ΑΠΥ/ΤΠΥ send

## Fixed charges

| Apartment | Charge | Amount | VAT | Notes |
|---|---|---|---|---|
| ZZ-TEST-DONOTUSE | Software | 0.02 | no |  |
| Seaside Lavrio Beach House | Software | 54 | no |  |
| Athens Riviera Escape | Software | 45 | no |  |
| Art House | Software | 45 | no |  |
| Art House |  |  | no |  |
| Art Island Apartment | Software | 45 | no |  |
| Avenue of Gods: Irakli's Retreat | Software | 50 | no |  |
| Cozy Acropolis backyard haven | Software | 50 | no |  |
| Elysian Ithaki | Software | 45 | no |  |
| Elysian Ithaki | Internet | 50 | no |  |
| Elysian Ithaki | Opening works | 100 | no |  |
| Elysian Lycabettus - Horizon | Software | 45 | no |  |
| Elysian Lycabettus - Panorama | Software | 45 | no |  |
| Elysian Lycabettus Resilience | Software | 45 | no |  |
| Navarino Athenian Nest | Software | 45 | no |  |
| Svorex Apartment 1 | Software | 45 | no |  |
| The Athenian Atelier / Kolonaki Sqr | Software | 45 | no |  |
| The Athenian Cedar | Software | 45 | no |  |
| The Athenian Vintage | Software | 45 | no |  |
| The Brightline Apartment Athens | Software | 54 | no |  |
| The Monograph | Software | 54 | no |  |
| The Olive & Cedar Apartment | Software | 45 | no |  |
| Urban Cedar Apartment | Software | 45 | no |  |
| Acropolis Skyline Sunset | Software | 45 | no |  |
| City Nexus Family apt, Kolonos | Software | 45 | no |  |
| Coloneum | Software | 45 | no |  |
| Stylish Downtown Apartment | Software | 45 | no |  |
| The Athenian Veranda | Software | 31.25 | no |  |
| The Athenian Veranda | Cleaning | 900 | no |  |
| The Athenian Veranda 2 | Software | 31.25 | no |  |
| The Athenian Veranda 3 | Software | 31.25 | no |  |
| The Athenian Veranda 4 | Software | 31.25 | no |  |
| ARITI 7 | Software | 45 | no |  |
| Athens Unity Apartment | Software | 45 | no |  |
| Athens Unity Apartment | Rent | 600 | no |  |
| Athens Unity Apartment | Bills | 120 | no |  |
| Birdhouse Apartment | Software | 45 | no |  |
| Birdhouse Apartment | Rent | 100 | no |  |
| Elysian Agon | Software | 45 | no |  |
| Elysian Agon | Rent | 600 | no |  |
| Elysian Agon | Bills | 120 | no |  |
| Elysian Ariadne | Rent | 400 | no |  |
| Elysian Ariadne | Bills | 120 | no |  |
| Elysian Ariadne | Software | 45 | no |  |
| Elysian Mary | Software | 45 | no |  |
| Elysian Mary | Rent | 400 | no |  |
| Elysian Mary | Bills | 120 | no |  |
| Filoxenia Apartment Athens | Software | 45 | no |  |
| Filoxenia Apartment Athens | Rent | 600 | no |  |
| Filoxenia Apartment Athens | Bills | 120 | no |  |
| Sunset Nest in Fiskardo | Software | 50 | no |  |
| Sunset Nest in Fiskardo | Internet | 45 | no |  |
| Elysian Smyrni / Marble Elegance Retreat | Software | 50 | no |  |
| Le Alex, Bright & Modern Escape near CityCenter | Software | 45 | no |  |
| Le Floor, Urban Escape near Thessaloniki center | Software | 45 | no |  |
| Villa Liberty | Software | 45 | no |  |
| P & G Apartment | Software | 45 | no |  |
| Votsala 1 Luxury Stay with Patio | Software | 45 | no |  |
| Votsala 2 Luxury Stay with Patio | Software | 45 | no |  |
| Votsala 3 Deluxe & Modern Apartment in Piraeus | Software | 45 | no |  |
| Votsala 4 Small & Elegant Apartment in Piraeus | Software | 45 | no |  |
| Votsala 5 Luxury Studio with Balcony in Piraeus | Software | 45 | no |  |
| Votsala 6 Deluxe & Modern Apartment in Piraeus | Software | 45 | no |  |
| Votsala 7 Small & Elegant Apartment in Piraeus | Software | 45 | no |  |
| Votsala 8 Elegant & Modern Apartment in Piraeus | Software | 45 | no |  |
| Eclectic Apartment with Stunning Seaview | Software | 45 | no |  |
| Eclectic Apartment with Stunning Seaview | Rent | 250 | no |  |
| Eclectic Apartment with Stunning Seaview | Bills | 120 | no |  |
| Pixie Studio Athens | Software | 45 | no |  |
| The Skarlatos residence | Software | 45 | no |  |
| The Tauros Metro Residence | Software | 45 | no |  |
| Elysian Cornerstone | Software | 45 | no |  |
| Elysian Hightower | Software | 45 | no |  |
| Le Grace, Urban Retreat Near CityCenter & Sea | Software | 45 | no |  |
| Le Plaza, Modern Escape near Thessaloniki Center | Software | 45 | no |  |
| Cozy Corner Zografou | Software | 45 | no |  |

## Owners (private repo — never copy to a public place)

| Apartment | Owner | Email | Email 2 | Email 3 | Phone |
|---|---|---|---|---|---|
| ZZ-TEST-DONOTUSE | Lefteris Sarris | letesarris@gmail.com |  |  |  |
| Seaside Lavrio Beach House | MR KOSTAS CHATZAKIS |  |  |  |  |
| Athens Riviera Escape | MR CHRISTOS DOULIGERIS | cdoulig@unipi.gr |  |  |  |
| Art House | MR NEKTARIOS MARIOLAKIS | nmcantinetta@gmail.com |  |  |  |
| Art Island Apartment | MR NEKTARIOS MARIOLAKIS | nmcantinetta@gmail.com |  |  |  |
| Avenue of Gods: Irakli's Retreat | Martin & Sophie Avgoulis | Martin.Coates@ontoit.com | savvygee@hotmail.com |  | +61400888441 |
| Cozy Acropolis backyard haven | GIANNIS MANOUSAKIS | celticgiannis@gmail.com |  |  |  |
| Elysian Ithaki | Fady & Martine | fady.khalife@gmail.com | Martine.jabbour@gmail.com |  |  |
| Elysian Lycabettus - Horizon | MR KOUTSOUMPAS ASIMAKIS |  |  |  |  |
| Elysian Lycabettus - Panorama | Chrysa Dandoulaki |  |  |  |  |
| Elysian Lycabettus Resilience | MRS CHRYSA DANDOULAKI |  |  |  |  |
| Navarino Athenian Nest | Katerina Bafa | katerinabafa@yahoo.com |  |  |  |
| Svorex Apartment 1 | MR IKAROS MANTOUVALOS | maduvalosikaros@yahoo.gr |  |  |  |
| The Athenian Atelier / Kolonaki Sqr | MRS CHRISTOPOULOU ALEXANDRA | a.christopouloubluehome@gmail.com |  |  |  |
| The Athenian Cedar | Mr Georgios Fanis | fanis.georgios@gmail.com | info@elysiumrealty.gr |  |  |
| The Athenian Vintage | MR PANAGIOTIS KAMENOS |  |  |  |  |
| The Brightline Apartment Athens | MR TZANIKIAN ARA | ara.tzanikian@gmail.com |  |  |  |
| The Monograph | MR DIMITRIS CHRONIS | demis76@hotmail.com | k.zelilidis@ilagosconsulting.gr |  |  |
| The Olive & Cedar Apartment | Mr Georgios Fanis | fanis.georgios@gmail.com | info@elysiumrealty.gr |  |  |
| Urban Cedar Apartment | Mr Georgios Fanis | fanis.georgios@gmail.com | info@elysiumrealty.gr |  |  |
| Vista Acropolis |  |  |  |  |  |
| Acropolis Skyline Sunset | Manoli Papadogeorgakis | karakampana@yahoo.gr |  |  |  |
| City Nexus Family apt, Kolonos | MR LOUKAS KOLOVATAS | loukaszak@gmail.com |  |  |  |
| Coloneum | MR CHRISTOS DOULIGERIS | cdoulig@unipi.gr |  |  |  |
| Stylish Downtown Apartment | MR CHRISTOS DOULIGERIS | cdoulig@unipi.gr |  |  |  |
| The Athenian Veranda | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |  |
| The Athenian Veranda 2 | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |  |
| The Athenian Veranda 3 | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |  |
| The Athenian Veranda 4 | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |  |
| ARITI 7 | MR STILIANOS ALEXANDRIS |  |  |  | +30 697 449 4684 |
| Athens Unity Apartment | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com | sarri.george58@gmail.com |  |
| Birdhouse Apartment | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com | sarri.george58@gmail.com |  |
| Elysian Agon | Lefteris | LETESARRIS@GMAIL.COM | sarri.george58@gmail.com | volanakimaria65@gmail.com |  |
| Elysian Ariadne | Sarris Family | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com | sarri.george58@gmail.com |  |
| Elysian Mary | Sarris Family | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com | sarri.george58@gmail.com |  |
| Filoxenia Apartment Athens | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | sarri.george58@gmail.com | volanakimaria65@gmail.com |  |
| Sunset Nest in Fiskardo | MR TSELENTIS GERASIMOS |  |  |  |  |
| Amarysia Residence | Marina Chrysanthou | mmchrysanthou@gmail.com |  |  | +30 694 644 9505 |
| Pallantides Residence | Marina Chrysanthou | mmchrysanthou@gmail.com |  |  |  |
| Elysian Smyrni / Marble Elegance Retreat | Vasili & Christina MORNTOU | v.mornto@gmail.com |  |  |  |
| Le Alex, Bright & Modern Escape near CityCenter | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |  |
| Le Floor, Urban Escape near Thessaloniki center | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |  |
| Villa Liberty | MR PANAGIOTIS KAMENOS |  |  |  |  |
| P & G Apartment | MR PANAGIOTIS KAMENOS |  |  |  |  |
| A modern & Peaceful apartment • Near metro station | Panagioti Choli | panosl839@gmail.com |  |  | +30 690 609 2454 |
| Votsala 1 Luxury Stay with Patio | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Votsala 2 Luxury Stay with Patio | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Votsala 3 Deluxe & Modern Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Votsala 4 Small & Elegant Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Votsala 5 Luxury Studio with Balcony in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Votsala 6 Deluxe & Modern Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Votsala 7 Small & Elegant Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Votsala 8 Elegant & Modern Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com | info@migly.gr |  |
| Eclectic Apartment with Stunning Seaview | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | sarri.george58@gmail.com | volanakimaria65@gmail.com |  |
| Pixie Studio Athens | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | ehazapis@hotmail.com |  |  |
| The Skarlatos residence | Kostas Skarlatos | skarlatos.kostas@gmail.com |  |  |  |
| The Tauros Metro Residence | MR KUJTIM LULAJ | lulajsweden@gmail.com |  |  |  |
| Elysian Cornerstone | MR TSITLAKIDIS IRAKLIS |  |  |  |  |
| Elysian Hightower | MRS EFTHYMIA TSILIGKERIDOU | Rodoulaxatziemmanouil@gmail.com |  |  |  |
| Le Grace, Urban Retreat Near CityCenter & Sea | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |  |
| Le Plaza, Modern Escape near Thessaloniki Center | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |  |
| Cozy Corner Zografou | ARGYRO MARIA VENIOU | kynyparxis@gmail.com |  |  |  |

## JSON

Raw live snapshot: [`apartment-config.json`](apartment-config.json). Enriched catalog (listings, hubs, gaps): [`apartment-catalog.json`](apartment-catalog.json). Same fields, no ΑΦΜ.
