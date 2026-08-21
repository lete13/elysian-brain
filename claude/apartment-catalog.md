# Apartment catalog

**As of 21 Aug 2026.** Canonical per-apartment store for Elysian Brain. Live `S.apts` in Postgres is still the operational source of truth for flags that change in Configuration; this file is everything we can freeze from the clearing tool **without logging into production**.

> Unattended weekly runs cannot open Lefteris’s browser. **Not in this dump:** Hosthub `id` / `lat`/`lng`, live `bookingHotelId`, owner emails, Oxygen contact links, Property Info (`rental_info`), Keys Hubs maps. Those stay in the live app until a session with access re-pulls them.

## Provenance

| Layer | What it is | Count |
|---|---|---|
| Live directory | `S.apts` pull **27 Jul 2026** — city, profile, language, businessTax | **57** |
| Seed sheet | `index.html` `DEFAULT_APT_CONFIG` — owner, mgmt/cleaning fees, software charge, raw flags | **52** |
| Missing from seed | A modern & Peaceful · Elysian Agon · Elysian Ithaki · The Skarlatos residence · Vista Acropolis | **5** |

`applyDefaults()` **fills blanks only** and never overwrites a live `profile`. Seed often sets `isLeased` and `b2b` together (legacy dual-flag). **Operational profile = the 27 Jul live column.**

Machine-readable copy: [`apartment-catalog.json`](apartment-catalog.json).

## `S.apts` schema (live app, 21 Aug 2026)

`id · name · aliases · city · lat/lng · profile · isLeased · b2b · b2bPartner · b2bRemitRate · mgmtFee · cleaningFee · fixedCharges[] · businessTax · businessTaxAmt · chargeVat · deductVAT · vatLiable · vatOnFees · municipalityTax · deductCT · deductCleaning · language · ownerName · ownerSurname · ownerEmail · ownerEmail2 · ownerEmail3 · ownerPhone · postReportReminders[] · clearGroup · bookingHotelId · oxyContactId · oxyContactName`

Related maps keyed by `aptId` (not copied here): `S.keyHubs` · `S.keyLabels` · `S.keyLockbox`. Property Info lives in Postgres table `rental_info` (amenities, FAQs, house rules, Law 5170).

## Clearing groups

- **`clearGroup`** is for **owner reports**. Several Lycabettus units may share a report group (e.g. Michalakopoulou) without sharing a bank credit.
- **Payments Check / Viva** only collapse **Votsala** (`clearGroup` matching `/^votsala$/i`). Every other apartment is one Booking.com credit per Thursday.
- **Booking.com invoices:** one PDF per Booking property; **Votsala 1–8 share one `bookingHotelId` / one PDF** filed under folder `Votsala`. Airbnb VAT PDFs stay per apartment.

## Portfolio snapshot (live 27 Jul 2026)

| Profile | Count |
|---|---|
| 🏢 leased | 27 |
| 🤝 b2b | 16 |
| 🏠 private | 14 |
| **Total** | **57** |

Thessaloniki operation (8): Cornerstone, Hightower, Le Alex, Le Floor, Le Grace, Le Plaza, The Skarlatos residence, ARITI 7 (Halkidiki).

## Directory

Lang — = unset on the 27 Jul pull. BT = businessTax. Seed flags that disagree with live profile are noted.

| # | Apartment | City | Profile | Lang | BT | Owner (seed) | Mgmt % | Clean € | Software € |
|---|---|---|---|---|---|---|---|---|---|
| 1 | A modern & Peaceful apartment • Near metro station | Piraeus | 🏠 private | — |  | — (not in seed) | — | — | — |
| 2 | Acropolis Skyline Sunset ★ | Athens | 🏠 private | GR |  | MR EMMANOUIL PAPADOGEORGAKIS | 15.0 | 35.0 | 45.0 |
| 3 | ARITI 7 ᵀ | Chaniotis (Halkidiki) | 🤝 b2b | EN |  | MR STILIANOS ALEXANDRIS | 17.5 | 65.0 | 45.0 |
| 4 | Art House | Athens | 🏠 private | EN |  | MR NEKTARIOS MARIOLAKIS | 17.5 | 30.0 | 45.0 |
| 5 | Art Island Apartment | Athens | 🏢 leased | EN | BT | MR NEKTARIOS MARIOLAKIS | 17.5 | 30.0 | 45.0 |
| 6 | Athens Riviera Escape | Argyroupoli | 🏠 private | EN |  | MR GIANNIS MANOUSAKIS | 17.5 | 50.0 | 50.0 |
| 7 | Athens Unity Apartment | Cholargos | 🏢 leased | EN | BT | ELYSIAN PROPERTIES MANAGEMENT | 15.0 | 30.0 | 45.0 |
| 8 | Avenue of Gods: Irakli's Retreat | Athens | 🏠 private | EN |  | Martin Coates & Sophie Avgoulis | 15.0 | 55.0 | 50.0 |
| 9 | Birdhouse Apartment | Cholargos | 🏢 leased | EN | BT | ELYSIAN PROPERTIES MANAGEMENT | 15.0 | 0 | 45.0 |
| 10 | City Nexus Family apt, Kolonos | Athens | 🏠 private | EN |  | MR LOUKAS KOLOVATAS | 16.5 | 38.0 | 45.0 |
| 11 | Coloneum | Athens | 🏢 leased | EN | BT | MR CHRISTOS DOULIGERIS | 17.0 | 25.0 | 45.0 |
| 12 | Cozy Acropolis backyard haven | Athens | 🏠 private | EN |  | GIANNIS MANOUSAKIS | 15.0 | 35.0 | 50.0 |
| 13 | Cozy Corner Zografou ★ | Zografou | 🤝 b2b | EN |  | ARGYROUS MARIAS VENIOU | 17.5 | 25.0 | 45.0 |
| 14 | Eclectic Apartment with Stunning Seaview | Porto Rafti | 🏢 leased | EN | BT | ELYSIAN PROPERTIES MANAGEMENT | 15.0 | 15.0 | 45.0 |
| 15 | Elysian Agon | Cholargos | 🏢 leased | — | BT | — (not in seed) | — | — | — |
| 16 | Elysian Cornerstone ᵀ | Thessaloniki | 🏢 leased | EN | BT | MR TSITLAKIDIS IRAKLIS | 17.5 | 25.0 | 45.0 |
| 17 | Elysian Hightower ᵀ | Thessaloniki | 🏢 leased | EN | BT | MRS EFTHYMIA TSILIGKERIDOU | 17.5 | 30.0 | 45.0 |
| 18 | Elysian Ithaki | Athens | 🏠 private | EN |  | — (not in seed) | — | — | — |
| 19 | Elysian Lycabettus - Horizon ★ | Athens | 🏢 leased | EN | BT | MR KOUTSOUMPAS ASIMAKIS | 15.0 | 30.0 | 45.0 |
| 20 | Elysian Lycabettus - Panorama | Athens | 🏢 leased | EN | BT | MR KOUTSOUMPAS ASIMAKIS | 15.0 | 30.0 | 45.0 |
| 21 | Elysian Lycabettus Resilience | Athens | 🏢 leased | EN | BT | MR KOUTSOUMPAS ASIMAKIS | 15.0 | 30.0 | 45.0 |
| 22 | Elysian Smyrni | Marble Elegance Retreat | Nea Smyrni | 🏠 private | EN |  | MRS CHRISTINA MORNTOU | 15.0 | 35.0 | 50.0 |
| 23 | Filonexia Apartment Athens | Cholargos | 🏢 leased | EN | BT | ELYSIAN PROPERTIES MANAGEMENT | 15.0 | 30.0 | 45.0 |
| 24 | Le Alex, Bright & Modern Escape near CityCenter ᵀ | Neapoli | 🤝 b2b | EN |  | ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ | 17.5 | 15.0 | 45.0 |
| 25 | Le Floor, Urban Escape near Thessaloniki center ᵀ | Neapoli | 🤝 b2b | EN |  | ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ | 17.5 | 15.0 | 45.0 |
| 26 | Le Grace, Urban Retreat Near CityCenter & Sea ᵀ | Thessaloniki | 🤝 b2b | EN |  | ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ | 17.5 | 15.0 | 45.0 |
| 27 | Le Plaza, Modern Escape near Thessaloniki Center ᵀ | Thessaloniki | 🤝 b2b | EN |  | ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ | 17.5 | 15.0 | 45.0 |
| 28 | Navarino Athenian Nest | Athens | 🏢 leased | EN | BT | Katerina Bafa | 15.0 | 15.0 | 45.0 |
| 29 | P & G Apartment ⚠ dormant | Pamfila (Lesbos) | 🏠 private | EN |  | MR PANAGIOTIS KAMENOS | 15.0 | 0 | 45.0 |
| 30 | Pixie Studio Athens | Psychiko | 🏢 leased | EN | BT | ELYSIAN PROPERTIES MANAGEMENT | 15.0 | 15.0 | 45.0 |
| 31 | Seaside Lavrio Beach House | Lavrio (E. Attica) | 🤝 b2b | EN |  | MR KOSTAS CHATZAKIS | 15.0 | 45.0 | 54.0 |
| 32 | Stylish Downtown Apartment | Athens | 🏢 leased | EN | BT | MR CHRISTOS DOULIGERIS | 17.0 | 37.0 | 45.0 |
| 33 | Sunset Nest in Fiskardo | Fiskardo (Kefalonia) | 🏠 private | EN |  | MR TSELENTIS GERASIMOS | 15.0 | 20.0 | 50.0 |
| 34 | Svorex Apartment 1 | Athens | 🏢 leased | GR | BT | MR IKAROS MANTOUVALOS | 17.5 | 30.0 | 45.0 |
| 35 | The Athenian Atelier | Kolonaki Sqr | Athens | 🤝 b2b | EN |  | MRS CHRISTOPOULOU ALEXANDRA | 17.5 | 40.0 | 54.0 |
| 36 | The Athenian Cedar | Athens | 🤝 b2b | EN |  | Mr Georgios Fanis | 17.5 | 30.0 | 45.0 |
| 37 | The Athenian Veranda | Athens | 🤝 b2b | EN |  | MR DIMITRIS KOMIS | 15.0 | 0 | 31.25 |
| 38 | The Athenian Veranda 2 | Athens | 🤝 b2b | EN |  | MR DIMITRIS KOMIS | 15.0 | 0 | 31.25 |
| 39 | The Athenian Veranda 3 | Athens | 🤝 b2b | EN |  | MR DIMITRIS KOMIS | 15.0 | 0 | 31.25 |
| 40 | The Athenian Veranda 4 | Athens | 🤝 b2b | EN |  | MR DIMITRIS KOMIS | 15.0 | 0 | 31.25 |
| 41 | The Athenian Vintage | Athens | 🏢 leased | EN | BT | MR PANAGIOTIS KAMENOS | 15.0 | 25.0 | 45.0 |
| 42 | The Brightline Apartment Athens | Athens | 🏢 leased | EN | BT | MR TZANIKIAN ARA | 15.0 | 25.0 | 54.0 |
| 43 | The Monograph | Athens | 🤝 b2b | EN |  | MR DIMITRIS CHRONIS | 15.0 | 55.0 | 54.0 |
| 44 | The Olive & Cedar Apartment | Athens | 🤝 b2b | EN |  | Mr Georgios Fanis | 17.5 | 30.0 | 45.0 |
| 45 | The Skarlatos residence ᵀ | Sykies | 🏠 private | — |  | — (not in seed) | — | — | — |
| 46 | The Tauros Metro Residence | Tavros | 🏠 private | EN |  | MR KUJTIM LULAJ | 17.5 | 0 | 45.0 |
| 47 | Urban Cedar Apartment | Athens | 🤝 b2b | EN |  | Mr Georgios Fanis | 17.5 | 30.0 | 45.0 |
| 48 | Villa Liberty | Isthmia (Corinthia) | 🏠 private | EN |  | MR PANAGIOTIS KAMENOS | 15.0 | 100.0 | 45.0 |
| 49 | Vista Acropolis | Athens | 🏢 leased | — | BT | — (not in seed) | — | — | — |
| 50 | Votsala 1 Luxury Stay with Patio | Piraeus | 🏢 leased | EN | BT | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |
| 51 | Votsala 2 Luxury Stay with Patio | Piraeus | 🏢 leased | EN | *pending* | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |
| 52 | Votsala 3 Deluxe & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending* | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |
| 53 | Votsala 4 Small & Elegant Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending* | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |
| 54 | Votsala 5 Luxury Studio with Balcony in Piraeus | Piraeus | 🏢 leased | EN | *pending* | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |
| 55 | Votsala 6 Deluxe & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending* | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |
| 56 | Votsala 7 Small & Elegant Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending* | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |
| 57 | Votsala 8 Elegant & Modern Apartment in Piraeus | Piraeus | 🏢 leased | EN | *pending* | MRS MARIA IOANNIDOU | 15.0 | 20.0 | 45.0 |

## Per-apartment detail (seed financials + live profile)

### 1. A modern & Peaceful apartment • Near metro station

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** unset
- **businessTax (live):** off
- **Seed sheet:** not in `DEFAULT_APT_CONFIG`. Owner, fees, and software charge exist only in live Configuration.

### 2. Acropolis Skyline Sunset

*golden test*

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** GR
- **businessTax (live):** off
- **Owner (seed):** MR EMMANOUIL PAPADOGEORGAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €35.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 3. ARITI 7

*Thessaloniki operation*

- **City:** Chaniotis (Halkidiki)
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR STILIANOS ALEXANDRIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €65.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN

### 4. Art House

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR NEKTARIOS MARIOLAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 5. Art Island Apartment

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR NEKTARIOS MARIOLAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 6. Athens Riviera Escape

- **City:** Argyroupoli
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR GIANNIS MANOUSAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €50.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €50.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 7. Athens Unity Apartment

- **City:** Cholargos
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** ELYSIAN PROPERTIES MANAGEMENT
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 8. Avenue of Gods: Irakli's Retreat

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** Martin Coates & Sophie Avgoulis
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €55.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €50.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 9. Birdhouse Apartment

- **City:** Cholargos
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** ELYSIAN PROPERTIES MANAGEMENT
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 10. City Nexus Family apt, Kolonos

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR LOUKAS KOLOVATAS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 16.5%
- **Cleaning fee:** €38.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 11. Coloneum

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR CHRISTOS DOULIGERIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.0%
- **Cleaning fee:** €25.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 12. Cozy Acropolis backyard haven

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** GIANNIS MANOUSAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €35.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €50.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 13. Cozy Corner Zografou

*golden test*

- **City:** Zografou
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** ARGYROUS MARIAS VENIOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €25.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN

### 14. Eclectic Apartment with Stunning Seaview

- **City:** Porto Rafti
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** ELYSIAN PROPERTIES MANAGEMENT
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €15.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 15. Elysian Agon

- **City:** Cholargos
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** unset
- **businessTax (live):** on
- **Seed sheet:** not in `DEFAULT_APT_CONFIG`. Owner, fees, and software charge exist only in live Configuration.

### 16. Elysian Cornerstone

*Thessaloniki operation*

- **City:** Thessaloniki
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR TSITLAKIDIS IRAKLIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €25.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 17. Elysian Hightower

*Thessaloniki operation*

- **City:** Thessaloniki
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MRS EFTHYMIA TSILIGKERIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 18. Elysian Ithaki

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Seed sheet:** not in `DEFAULT_APT_CONFIG`. Owner, fees, and software charge exist only in live Configuration.

### 19. Elysian Lycabettus - Horizon

*golden test*

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR KOUTSOUMPAS ASIMAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 20. Elysian Lycabettus - Panorama

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR KOUTSOUMPAS ASIMAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 21. Elysian Lycabettus Resilience

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR KOUTSOUMPAS ASIMAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 22. Elysian Smyrni | Marble Elegance Retreat

- **City:** Nea Smyrni
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MRS CHRISTINA MORNTOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €35.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €50.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 23. Filonexia Apartment Athens

- **City:** Cholargos
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** ELYSIAN PROPERTIES MANAGEMENT
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 24. Le Alex, Bright & Modern Escape near CityCenter

*Thessaloniki operation*

- **City:** Neapoli
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €15.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 25. Le Floor, Urban Escape near Thessaloniki center

*Thessaloniki operation*

- **City:** Neapoli
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €15.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 26. Le Grace, Urban Retreat Near CityCenter & Sea

*Thessaloniki operation*

- **City:** Thessaloniki
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €15.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 27. Le Plaza, Modern Escape near Thessaloniki Center

*Thessaloniki operation*

- **City:** Thessaloniki
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** ΥΜΟΥΔΟΥΜΙΔΟΥ ΗΛΩΝΑ
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €15.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 28. Navarino Athenian Nest

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** Katerina Bafa
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €15.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 29. P & G Apartment

*dormant since 14 Jul 2026 — verify in Hosthub before removal*

- **City:** Pamfila (Lesbos)
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR PANAGIOTIS KAMENOS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 30. Pixie Studio Athens

- **City:** Psychiko
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** ELYSIAN PROPERTIES MANAGEMENT
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €15.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 31. Seaside Lavrio Beach House

- **City:** Lavrio (E. Attica)
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR KOSTAS CHATZAKIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €45.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €54.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 32. Stylish Downtown Apartment

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR CHRISTOS DOULIGERIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.0%
- **Cleaning fee:** €37.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 33. Sunset Nest in Fiskardo

- **City:** Fiskardo (Kefalonia)
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR TSELENTIS GERASIMOS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €50.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 34. Svorex Apartment 1

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** GR
- **businessTax (live):** on
- **Owner (seed):** MR IKAROS MANTOUVALOS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 35. The Athenian Atelier | Kolonaki Sqr

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MRS CHRISTOPOULOU ALEXANDRA
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €40.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €54.0
- **Seed raw flags:** isLeased=False · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN

### 36. The Athenian Cedar

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** Mr Georgios Fanis
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN

### 37. The Athenian Veranda

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR DIMITRIS KOMIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €31.25
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 38. The Athenian Veranda 2

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR DIMITRIS KOMIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €31.25
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 39. The Athenian Veranda 3

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR DIMITRIS KOMIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €31.25
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 40. The Athenian Veranda 4

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR DIMITRIS KOMIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €31.25
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `b2b`. Trust live.

### 41. The Athenian Vintage

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR PANAGIOTIS KAMENOS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €25.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 42. The Brightline Apartment Athens

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MR TZANIKIAN ARA
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €25.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €54.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=True · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 43. The Monograph

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR DIMITRIS CHRONIS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €55.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €54.0
- **Seed raw flags:** isLeased=False · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN

### 44. The Olive & Cedar Apartment

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** Mr Georgios Fanis
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN

### 45. The Skarlatos residence

*Thessaloniki operation*

- **City:** Sykies
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** unset
- **businessTax (live):** off
- **Seed sheet:** not in `DEFAULT_APT_CONFIG`. Owner, fees, and software charge exist only in live Configuration.

### 46. The Tauros Metro Residence

- **City:** Tavros
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR KUJTIM LULAJ
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 47. Urban Cedar Apartment

- **City:** Athens
- **Live profile (27 Jul 2026):** 🤝 b2b
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** Mr Georgios Fanis
- **Owner email (seed):** (empty in seed)
- **Management fee:** 17.5%
- **Cleaning fee:** €30.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN

### 48. Villa Liberty

- **City:** Isthmia (Corinthia)
- **Live profile (27 Jul 2026):** 🏠 private
- **Report language (live):** EN
- **businessTax (live):** off
- **Owner (seed):** MR PANAGIOTIS KAMENOS
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €100.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=False · b2b=False · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=False · businessTax=False · language=EN

### 49. Vista Acropolis

- **City:** Athens
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** unset
- **businessTax (live):** on
- **Seed sheet:** not in `DEFAULT_APT_CONFIG`. Owner, fees, and software charge exist only in live Configuration.

### 50. Votsala 1 Luxury Stay with Patio

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** on
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 51. Votsala 2 Luxury Stay with Patio

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** pending_same_address_exemption
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 52. Votsala 3 Deluxe & Modern Apartment in Piraeus

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** pending_same_address_exemption
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 53. Votsala 4 Small & Elegant Apartment in Piraeus

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** pending_same_address_exemption
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 54. Votsala 5 Luxury Studio with Balcony in Piraeus

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** pending_same_address_exemption
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 55. Votsala 6 Deluxe & Modern Apartment in Piraeus

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** pending_same_address_exemption
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 56. Votsala 7 Small & Elegant Apartment in Piraeus

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** pending_same_address_exemption
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

### 57. Votsala 8 Elegant & Modern Apartment in Piraeus

*clearGroup `Votsala`*

- **City:** Piraeus
- **Live profile (27 Jul 2026):** 🏢 leased
- **Report language (live):** EN
- **businessTax (live):** pending_same_address_exemption
- **Owner (seed):** MRS MARIA IOANNIDOU
- **Owner email (seed):** (empty in seed)
- **Management fee:** 15.0%
- **Cleaning fee:** €20.0 / stay · deductCleaning=True
- **Fixed charges (seed):** Software €45.0
- **Seed raw flags:** isLeased=True · b2b=True · b2bPartner=`∅` · b2bRemitRate=0 · vatOnFees=True · vatLiable=False · municipalityTax=True · businessTax=False · language=EN
- **⚠ Seed vs live:** seed implies `dual_leased_and_b2b`; live profile is `leased`. Trust live.

## Gaps to re-pull from live `S` (next attended session)

1. Hosthub `id`, `city`, `lat`/`lng` for every unit (Keys Hubs nearest-key needs coords).
2. `bookingHotelId` map (Configuration field as of 16 Aug) — required to file Booking.com mass-extract PDFs.
3. `clearGroup` on non-Votsala units (report groups such as Michalakopoulou).
4. Owner emails (`ownerEmail` / `2` / `3`) — all empty in the seed sheet.
5. `b2bPartner` — still empty on all 16 B2B units in seed and in the 27 Jul pull.
6. Language on the four unset units.
7. Property Info (`rental_info`) and Keys Hubs assignments.
8. Confirm whether the five units missing from seed were added only in live Configuration.

## Changelog

- **21 Aug 2026** — first freeze: 57-unit live directory + 52-unit seed financials from `lete13/elysian-clearing` `main` (`9d46016`).

