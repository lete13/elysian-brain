# Apartment configuration (live snapshot)

Canonical copy of every apartment in Elysian Clearing **Configuration** (`S.apts`). Pulled from production. **Do not store ΑΦΜ.** Refresh this file from `/api/db/data` when Configuration changes.

- Pulled: `2026-08-28T10:02:40Z`
- Source: `https://elysian-clearing-production.up.railway.app/api/db/data`
- Rows in Configuration: **62** (operating **61** + dummy **1**)
- Operating profiles: leased 31 · b2b 16 · private 14
- Dummy row (not an operating unit): **ZZ-TEST-DONOTUSE**
- `businessTax` on: 22 · off: 40
- Designated P4 carriers (same-address groups): **Votsala 1 Luxury Stay with Patio**, **Elysian Lycabettus - Horizon** — Votsala 2–8 and Lycabettus Panorama / Resilience are exempt

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

## Directory

| Apartment | City | Profile | Lang | BT | BT note | Mgmt % | Cleaning | deductCT | deductVAT | Mun. tax | vatOnFees | clearGroup | b2bPartner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
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
| The Athenian Atelier · Kolonaki Sqr | Athens | b2b | EN | no |  | 17.5 | 40 | yes | yes | yes | yes |  |  |
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
| Elysian Smyrni · Marble Elegance Retreat | Nea Smyrni | private | EN | no |  | 15 | 35 | yes | no | no | yes |  |  |
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
| ZZ-TEST-DONOTUSE |  | private | EN | no |  | 20 | 0.01 | yes | no | no | yes |  |  |

## Fixed charges

| Apartment | Charge | Amount | VAT | Notes |
|---|---|---|---|---|
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
| The Athenian Atelier · Kolonaki Sqr | Software | 45 | no |  |
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
| Elysian Smyrni · Marble Elegance Retreat | Software | 50 | no |  |
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
| ZZ-TEST-DONOTUSE | Software | 0.02 | no |  |

## Owners (private repo — never copy to a public place)

| Apartment | Owner | Email | Email 2 | Phone |
|---|---|---|---|---|
| Seaside Lavrio Beach House | MR KOSTAS CHATZAKIS |  |  |  |
| Athens Riviera Escape | MR CHRISTOS DOULIGERIS | cdoulig@unipi.gr |  |  |
| Art House | MR NEKTARIOS MARIOLAKIS | nmcantinetta@gmail.com |  |  |
| Art Island Apartment | MR NEKTARIOS MARIOLAKIS | nmcantinetta@gmail.com |  |  |
| Avenue of Gods: Irakli's Retreat | Martin & Sophie Avgoulis | Martin.Coates@ontoit.com | savvygee@hotmail.com | +61400888441 |
| Cozy Acropolis backyard haven | GIANNIS MANOUSAKIS | celticgiannis@gmail.com |  |  |
| Elysian Ithaki | Fady & Martine | fady.khalife@gmail.com | Martine.jabbour@gmail.com |  |
| Elysian Lycabettus - Horizon | MR KOUTSOUMPAS ASIMAKIS |  |  |  |
| Elysian Lycabettus - Panorama | Chrysa Dandoulaki |  |  |  |
| Elysian Lycabettus Resilience | MRS CHRYSA DANDOULAKI |  |  |  |
| Navarino Athenian Nest | Katerina Bafa | katerinabafa@yahoo.com |  |  |
| Svorex Apartment 1 | MR IKAROS MANTOUVALOS | maduvalosikaros@yahoo.gr |  |  |
| The Athenian Atelier · Kolonaki Sqr | MRS CHRISTOPOULOU ALEXANDRA | a.christopouloubluehome@gmail.com |  |  |
| The Athenian Cedar | Mr Georgios Fanis | fanis.georgios@gmail.com | info@elysiumrealty.gr |  |
| The Athenian Vintage | MR PANAGIOTIS KAMENOS |  |  |  |
| The Brightline Apartment Athens | MR TZANIKIAN ARA | ara.tzanikian@gmail.com |  |  |
| The Monograph | MR DIMITRIS CHRONIS | demis76@hotmail.com | k.zelilidis@ilagosconsulting.gr |  |
| The Olive & Cedar Apartment | Mr Georgios Fanis | fanis.georgios@gmail.com | info@elysiumrealty.gr |  |
| Urban Cedar Apartment | Mr Georgios Fanis | fanis.georgios@gmail.com | info@elysiumrealty.gr |  |
| Vista Acropolis |  |  |  |  |
| Acropolis Skyline Sunset | Manoli Papadogeorgakis | karakampana@yahoo.gr |  |  |
| City Nexus Family apt, Kolonos | MR LOUKAS KOLOVATAS | loukaszak@gmail.com |  |  |
| Coloneum | MR CHRISTOS DOULIGERIS | cdoulig@unipi.gr |  |  |
| Stylish Downtown Apartment | MR CHRISTOS DOULIGERIS | cdoulig@unipi.gr |  |  |
| The Athenian Veranda | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |
| The Athenian Veranda 2 | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |
| The Athenian Veranda 3 | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |
| The Athenian Veranda 4 | MR DIMITRIS KOMIS | dimitriskomis@avaxdeco.gr |  |  |
| ARITI 7 | MR STILIANOS ALEXANDRIS |  |  | +30 697 449 4684 |
| Athens Unity Apartment | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com |  |
| Birdhouse Apartment | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com |  |
| Elysian Agon | Lefteris | LETESARRIS@GMAIL.COM | sarri.george58@gmail.com |  |
| Elysian Ariadne | Sarris Family | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com |  |
| Elysian Mary | Sarris Family | LETESARRIS@GMAIL.COM | volanakimaria65@gmail.com |  |
| Filoxenia Apartment Athens | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | sarri.george58@gmail.com |  |
| Sunset Nest in Fiskardo | MR TSELENTIS GERASIMOS |  |  |  |
| Amarysia Residence | Marina Chrysanthou | mmchrysanthou@gmail.com |  | +30 694 644 9505 |
| Pallantides Residence | Marina Chrysanthou | mmchrysanthou@gmail.com |  |  |
| Elysian Smyrni · Marble Elegance Retreat | Vasili & Christina MORNTOU | v.mornto@gmail.com |  |  |
| Le Alex, Bright & Modern Escape near CityCenter | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |
| Le Floor, Urban Escape near Thessaloniki center | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |
| Villa Liberty | MR PANAGIOTIS KAMENOS |  |  |  |
| P & G Apartment | MR PANAGIOTIS KAMENOS |  |  |  |
| A modern & Peaceful apartment • Near metro station | Panagioti Choli | panosl839@gmail.com |  | +30 690 609 2454 |
| Votsala 1 Luxury Stay with Patio | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Votsala 2 Luxury Stay with Patio | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Votsala 3 Deluxe & Modern Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Votsala 4 Small & Elegant Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Votsala 5 Luxury Studio with Balcony in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Votsala 6 Deluxe & Modern Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Votsala 7 Small & Elegant Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Votsala 8 Elegant & Modern Apartment in Piraeus | MRS MARIA IOANNIDOU | mariaioannidou85@gmail.com | kfk@karampatsos.com |  |
| Eclectic Apartment with Stunning Seaview | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | sarri.george58@gmail.com |  |
| Pixie Studio Athens | ELYSIAN PROPERTIES MANAGEMENT | LETESARRIS@GMAIL.COM | ehazapis@hotmail.com |  |
| The Skarlatos residence | Kostas Skarlatos | skarlatos.kostas@gmail.com |  |  |
| The Tauros Metro Residence | MR KUJTIM LULAJ | lulajsweden@gmail.com |  |  |
| Elysian Cornerstone | MR TSITLAKIDIS IRAKLIS |  |  |  |
| Elysian Hightower | MRS EFTHYMIA TSILIGKERIDOU | Rodoulaxatziemmanouil@gmail.com |  |  |
| Le Grace, Urban Retreat Near CityCenter & Sea | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |
| Le Plaza, Modern Escape near Thessaloniki Center | ΗΛΩΝΑ ΟΥΜΟΥΔΟΥΜΙΔΟΥ | ilona.info@yahoo.com |  |  |
| Cozy Corner Zografou | ARGYRO MARIA VENIOU | kynyparxis@gmail.com |  |  |
| ZZ-TEST-DONOTUSE | Lefteris Sarris | letesarris@gmail.com |  |  |

## JSON

Machine-readable copy: [`apartment-config.json`](apartment-config.json). Same fields, no ΑΦΜ.

