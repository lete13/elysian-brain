#!/usr/bin/env python3
"""Build the enriched apartment catalog from the last live S.apts snapshot.

Unattended runs cannot log into production. This script takes every field we
already have in claude/apartment-config.json and adds derived listings,
same-address / P4 notes, nearest Keys Hub, and a completeness matrix.
Never writes ΑΦΜ.
"""
from __future__ import annotations

import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "claude" / "apartment-config.json"
OUT_JSON = ROOT / "claude" / "apartment-catalog.json"
OUT_MD = ROOT / "claude" / "apartment-config.md"

KEY_HUBS = [
    {"id": "votsala", "name": "Votsala", "addr": "Louka Ralli 59", "lat": 37.9585, "lng": 23.6460},
    {"id": "verandas", "name": "Verandas", "addr": "Makri 19", "lat": 37.9686, "lng": 23.7285},
    {"id": "cholargos", "name": "Cholargos", "addr": "17is Noemvriou 19", "lat": 38.0030, "lng": 23.7950},
    {"id": "plynthrio", "name": "Thessaloniki", "addr": "Mitoudi 12", "lat": 40.6070, "lng": 22.9580},
    {"id": "driver", "name": "Driver", "addr": "Ilioupoli, Athens (car base)", "lat": 37.9315, "lng": 23.7678, "mobile": True},
]

P4_CARRIERS = {
    "Votsala 1 Luxury Stay with Patio": "carrier",
    "Elysian Lycabettus - Horizon": "carrier",
}
P4_EXEMPT = {
    "Votsala 2 Luxury Stay with Patio": "same-address: Votsala 1",
    "Votsala 3 Deluxe & Modern Apartment in Piraeus": "same-address: Votsala 1",
    "Votsala 4 Small & Elegant Apartment in Piraeus": "same-address: Votsala 1",
    "Votsala 5 Luxury Studio with Balcony in Piraeus": "same-address: Votsala 1",
    "Votsala 6 Deluxe & Modern Apartment in Piraeus": "same-address: Votsala 1",
    "Votsala 7 Small & Elegant Apartment in Piraeus": "same-address: Votsala 1",
    "Votsala 8 Elegant & Modern Apartment in Piraeus": "same-address: Votsala 1",
    "Elysian Lycabettus - Panorama": "same-address: Horizon",
    "Elysian Lycabettus Resilience": "same-address: Horizon",
}

THESSALONIKI_OP = {
    "Elysian Cornerstone",
    "Elysian Hightower",
    "Le Alex, Bright & Modern Escape near CityCenter",
    "Le Floor, Urban Escape near Thessaloniki center",
    "Le Grace, Urban Retreat Near CityCenter & Sea",
    "Le Plaza, Modern Escape near Thessaloniki Center",
    "The Skarlatos residence",
    "ARITI 7",
}

DUMMY = "ZZ-TEST-DONOTUSE"

# Every Configuration field the clearing tool stores on S.apts (never ΑΦΜ).
SCHEMA_FIELDS = [
    "id", "name", "aliases", "city", "address", "lat", "lng",
    "profile", "isLeased", "language",
    "ownerName", "ownerSurname", "ownerEmail", "ownerEmail2", "ownerEmail3", "ownerPhone",
    "mgmtFee", "cleaningFee", "fixedCharges",
    "businessTax", "businessTaxAmt",
    "vatLiable", "chargeVat", "vatOnFees", "deductVAT", "deductCT", "deductCleaning", "municipalityTax",
    "b2b", "b2bPartner", "b2bRemitRate", "clearGroup",
    "postReportReminders",
    "airbnbUrl", "bookingUrl", "bookingHotelId",
    "oxyContactId", "oxyContactName",
    "baseCapacity",
]


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def airbnb_room_id(url: str) -> str:
    if not url:
        return ""
    m = re.search(r"/rooms/(\d+)", url)
    return m.group(1) if m else ""


def yesno(v) -> str:
    if v is True:
        return "yes"
    if v is False:
        return "no"
    return ""


def owner_display(apt: dict) -> str:
    return " ".join(p for p in [str(apt.get("ownerName") or "").strip(), str(apt.get("ownerSurname") or "").strip()] if p)


def nearest_hub(apt: dict):
    lat, lng = apt.get("lat"), apt.get("lng")
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        return None
    best = None
    for h in KEY_HUBS:
        d = haversine_km(lat, lng, h["lat"], h["lng"])
        if best is None or d < best["km"]:
            best = {"id": h["id"], "name": h["name"], "addr": h["addr"], "km": round(d, 2), "mobile": bool(h.get("mobile"))}
    return best


def completeness(apt: dict) -> dict:
    name = apt.get("name") or ""
    dummy = name == DUMMY
    return {
        "dummy": dummy,
        "hasLanguage": bool(apt.get("language")),
        "hasOwnerName": bool(owner_display(apt)),
        "hasOwnerEmail": bool(apt.get("ownerEmail")),
        "hasAddress": bool(apt.get("address")),
        "hasCoords": apt.get("lat") not in (None, "") and apt.get("lng") not in (None, ""),
        "hasAirbnbUrl": bool(apt.get("airbnbUrl")),
        "hasBookingUrl": bool(apt.get("bookingUrl")),
        "hasBookingHotelId": bool(str(apt.get("bookingHotelId") or "").strip()),
        "hasOxygenContact": bool(apt.get("oxyContactId")),
        "hasB2bPartner": bool(apt.get("b2bPartner")) if apt.get("profile") == "b2b" else None,
        "hasClearGroup": bool(apt.get("clearGroup")),
        "hasMgmtFee": apt.get("mgmtFee") not in (None, ""),
        "hasCleaningFee": apt.get("cleaningFee") not in (None, ""),
    }


def bt_note(name: str) -> str:
    return P4_CARRIERS.get(name) or P4_EXEMPT.get(name) or ""


def enrich(apt: dict) -> dict:
    name = apt.get("name") or ""
    room = airbnb_room_id(apt.get("airbnbUrl") or "")
    out = {k: apt.get(k) for k in SCHEMA_FIELDS}
    # Keep extra live keys we have not listed, except anything that looks like a tax id.
    for k, v in apt.items():
        lk = k.lower()
        if k in out:
            continue
        if any(s in lk for s in ("afm", "αφμ", "taxid", "tax_id", "vatnumber", "vat_number")):
            continue
        out[k] = v
    out["airbnbRoomId"] = room
    out["p4Note"] = bt_note(name)
    out["thessalonikiOperation"] = name in THESSALONIKI_OP
    out["dummy"] = name == DUMMY
    out["nearestKeyHub"] = nearest_hub(apt)
    out["completeness"] = completeness(apt)
    return out


def md_cell(v) -> str:
    if v is None:
        return ""
    if v is True:
        return "yes"
    if v is False:
        return "no"
    s = str(v).replace("|", "/").replace("\n", " ")
    return s


def build():
    src = json.loads(SRC.read_text())
    raw = src["apartments"]
    enriched = [enrich(a) for a in raw]
    operating = [a for a in enriched if not a["dummy"]]
    profiles = {}
    for a in operating:
        profiles[a.get("profile") or "unset"] = profiles.get(a.get("profile") or "unset", 0) + 1

    missing_lang = [a["name"] for a in operating if not a.get("language")]
    missing_b2b = [a["name"] for a in operating if a.get("profile") == "b2b" and not a.get("b2bPartner")]
    missing_airbnb = [a["name"] for a in operating if not a.get("airbnbUrl")]
    missing_booking_id = [a["name"] for a in operating if not str(a.get("bookingHotelId") or "").strip()]
    missing_coords = [a["name"] for a in operating if a["completeness"]["hasCoords"] is False]
    missing_address = [a["name"] for a in operating if not a.get("address")]
    missing_email = [a["name"] for a in operating if not a.get("ownerEmail")]
    missing_oxy = [a["name"] for a in operating if not a.get("oxyContactId")]

    groups = {}
    for a in operating:
        g = a.get("clearGroup") or ""
        if g:
            groups.setdefault(g, []).append(a["name"])

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    catalog = {
        "builtAt": now,
        "sourceSnapshot": src.get("pulledAt"),
        "source": src.get("source"),
        "note": (
            "All apartment fields available in Elysian Clearing without a live login. "
            "Base = production S.apts snapshot. Derived: Airbnb room id, P4 note, nearest Keys Hub, completeness. "
            "Live Property Info (amenities / ΑΜΑ / FAQs) and Keys Hubs assignments live in Postgres and need an attended session. "
            "ΑΦΜ / tax IDs are never stored."
        ),
        "counts": {
            "apartments": len(enriched),
            "operating": len(operating),
            "dummies": [DUMMY],
            "operatingProfiles": profiles,
            "businessTaxOn": sum(1 for a in enriched if a.get("businessTax") is True),
            "businessTaxOff": sum(1 for a in enriched if a.get("businessTax") is not True),
            "clearGroups": {k: len(v) for k, v in groups.items()},
        },
        "businessTaxCarriers": list(P4_CARRIERS.keys()),
        "keyHubs": KEY_HUBS,
        "gaps": {
            "languageUnset": missing_lang,
            "b2bPartnerEmpty": missing_b2b,
            "noAirbnbUrl": missing_airbnb,
            "noBookingHotelId": missing_booking_id,
            "noCoords": missing_coords,
            "noAddress": missing_address,
            "noOwnerEmail": missing_email,
            "noOxygenContact": missing_oxy,
        },
        "clearGroups": groups,
        "apartments": enriched,
    }
    OUT_JSON.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    write_md(src, catalog, enriched, operating, groups)
    return catalog


def write_md(src, catalog, enriched, operating, groups):
    pulled = src.get("pulledAt")
    lines = []
    lines.append("# Apartment configuration (live snapshot + catalog)")
    lines.append("")
    lines.append("Canonical copy of every apartment in Elysian Clearing **Configuration** (`S.apts`), plus every listing / grouping field we can derive from the tool without a live login. **Do not store ΑΦΜ.** Refresh `apartment-config.json` from `/api/db/data` when Configuration changes, then run `python3 scripts/build-apartment-catalog.py`.")
    lines.append("")
    lines.append(f"- Pulled (live `S.apts`): `{pulled}`")
    lines.append(f"- Catalog built: `{catalog['builtAt']}`")
    lines.append(f"- Source: `{src.get('source')}`")
    lines.append(f"- Rows in Configuration: **{catalog['counts']['apartments']}** (operating **{catalog['counts']['operating']}** + dummy **1**)")
    op = catalog["counts"]["operatingProfiles"]
    lines.append(f"- Operating profiles: leased {op.get('leased', 0)} · b2b {op.get('b2b', 0)} · private {op.get('private', 0)}")
    lines.append("- Dummy row (not an operating unit): **ZZ-TEST-DONOTUSE**")
    lines.append(f"- `businessTax` on: {catalog['counts']['businessTaxOn']} · off: {catalog['counts']['businessTaxOff']}")
    lines.append("- Designated P4 carriers (same-address groups): **Votsala 1 Luxury Stay with Patio**, **Elysian Lycabettus - Horizon** — Votsala 2–8 and Lycabettus Panorama / Resilience are exempt")
    lines.append("- Machine-readable full catalog: [`apartment-catalog.json`](apartment-catalog.json) · raw snapshot: [`apartment-config.json`](apartment-config.json)")
    lines.append("- Live **Property Info** (`/api/rental-info`) and **Keys Hubs assignments** (`S.keyHubs`) need an attended login — schema in [`property-info.md`](property-info.md) and [`keys-hubs.md`](keys-hubs.md)")
    lines.append("")
    lines.append("## How to read the flags")
    lines.append("")
    lines.append("| Field | Meaning |")
    lines.append("|---|---|")
    lines.append("| `profile` | `leased` / `b2b` / `private` |")
    lines.append("| `mgmtFee` | Management fee % of net (after platform fees, TAKK, optional VAT/mun.tax, cleaning, business tax) |")
    lines.append("| `cleaningFee` | Cleaning amount charged to the owner on checkout |")
    lines.append("| `businessTax` | Leased-profile τέλος επιτηδεύματος. Reduces the mgmt-fee base once per month when the flag is on. Same-address buildings share one levy — only the designated carrier should have this on. |")
    lines.append("| `vatLiable` / `chargeVat` / `vatOnFees` / `deductVAT` | Owner VAT treatment vs Elysian 24% on fees |")
    lines.append("| `deductCT` | Climate tax (TAKK) deducted from owner payout |")
    lines.append("| `municipalityTax` | Municipal accommodation tax deducted when on |")
    lines.append("| `deductCleaning` | Cleaning deducted from payout |")
    lines.append("| `fixedCharges` | Monthly extras (software, electricity, water, …) on the owner report |")
    lines.append("| `b2bPartner` / `b2bRemitRate` | B2B partner name and remittance rate (often empty — grouping may live in `clearGroup`) |")
    lines.append("| `clearGroup` | Shared clearing group (Votsala, Michalakopoulou, Cedar Apt, Veranda, Le Apartments, Sarris, …) |")
    lines.append("| `bookingHotelId` | Booking.com hotel / apartment id used to file platform invoices. Votsala 1–8 share `13180441`. |")
    lines.append("| `airbnbRoomId` | Numeric Airbnb listing id parsed from `airbnbUrl` |")
    lines.append("| `oxyContactId` / `oxyContactName` | Linked Oxygen Pelatologio contact for ΑΠΥ/ΤΠΥ |")
    lines.append("| `nearestKeyHub` | Closest physical Keys Hub by lat/lng (assignment of actual key sets is live `S.keyHubs`) |")
    lines.append("")
    lines.append("## Directory")
    lines.append("")
    lines.append("| Apartment | City | Profile | Lang | BT | BT note | Mgmt % | Cleaning | deductCT | deductVAT | Mun. tax | vatOnFees | clearGroup | b2bPartner |")
    lines.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    for a in sorted(enriched, key=lambda x: ((x.get("city") or ""), (x.get("name") or ""))):
        lines.append(
            "| {name} | {city} | {profile} | {lang} | {bt} | {note} | {mgmt} | {clean} | {ct} | {dv} | {mun} | {vof} | {cg} | {bp} |".format(
                name=md_cell(a.get("name")),
                city=md_cell(a.get("city")),
                profile=md_cell(a.get("profile")),
                lang=md_cell(a.get("language")),
                bt=yesno(a.get("businessTax")),
                note=md_cell(a.get("p4Note")),
                mgmt=md_cell(a.get("mgmtFee")),
                clean=md_cell(a.get("cleaningFee")),
                ct=yesno(a.get("deductCT")),
                dv=yesno(a.get("deductVAT")),
                mun=yesno(a.get("municipalityTax")),
                vof=yesno(a.get("vatOnFees")),
                cg=md_cell(a.get("clearGroup")),
                bp=md_cell(a.get("b2bPartner")),
            )
        )
    lines.append("")
    lines.append("## Listings (Airbnb + Booking.com)")
    lines.append("")
    lines.append("Every channel id the clearing tool stores or can derive. Sunset Nest in Fiskardo has Airbnb but no Booking.com hotel id.")
    lines.append("")
    lines.append("| Apartment | Airbnb room | Booking hotel id | Airbnb URL | Booking URL |")
    lines.append("|---|---|---|---|---|")
    for a in sorted(operating, key=lambda x: x.get("name") or ""):
        lines.append(
            "| {name} | {room} | {hid} | {au} | {bu} |".format(
                name=md_cell(a.get("name")),
                room=md_cell(a.get("airbnbRoomId")),
                hid=md_cell(a.get("bookingHotelId")),
                au=md_cell(a.get("airbnbUrl")),
                bu=md_cell(a.get("bookingUrl")),
            )
        )
    lines.append("")
    lines.append("## Addresses, coordinates, nearest Keys Hub")
    lines.append("")
    lines.append("Nearest hub is **distance only**. Actual backup-key assignments live in `S.keyHubs` (not in this snapshot).")
    lines.append("")
    lines.append("| Apartment | Address | Lat | Lng | Nearest hub | km |")
    lines.append("|---|---|---|---|---|---|")
    for a in sorted(operating, key=lambda x: x.get("name") or ""):
        nh = a.get("nearestKeyHub") or {}
        lines.append(
            "| {name} | {addr} | {lat} | {lng} | {hub} | {km} |".format(
                name=md_cell(a.get("name")),
                addr=md_cell(a.get("address")),
                lat=md_cell(a.get("lat")),
                lng=md_cell(a.get("lng")),
                hub=md_cell(nh.get("name")),
                km=md_cell(nh.get("km")),
            )
        )
    lines.append("")
    lines.append("## Oxygen contacts")
    lines.append("")
    lines.append("| Apartment | Oxygen contact | Linked |")
    lines.append("|---|---|---|")
    for a in sorted(operating, key=lambda x: x.get("name") or ""):
        lines.append(
            "| {name} | {cn} | {ok} |".format(
                name=md_cell(a.get("name")),
                cn=md_cell(a.get("oxyContactName")),
                ok="yes" if a.get("oxyContactId") else "no",
            )
        )
    lines.append("")
    lines.append("## Clearing groups")
    lines.append("")
    for g, names in sorted(groups.items()):
        lines.append(f"- **{g}** ({len(names)}): {', '.join(names)}")
    lines.append("")
    lines.append("## Completeness gaps (operating units)")
    lines.append("")
    gaps = catalog["gaps"]
    lines.append(f"- Language unset (**{len(gaps['languageUnset'])}**): {', '.join(gaps['languageUnset']) or '—'}")
    lines.append(f"- `b2bPartner` empty on all B2B units (**{len(gaps['b2bPartnerEmpty'])}**): grouping often lives in `clearGroup`")
    lines.append(f"- No Airbnb URL (**{len(gaps['noAirbnbUrl'])}**): {', '.join(gaps['noAirbnbUrl']) or '—'}")
    lines.append(f"- No Booking.com hotel id (**{len(gaps['noBookingHotelId'])}**): {', '.join(gaps['noBookingHotelId']) or '—'}")
    lines.append(f"- No address (**{len(gaps['noAddress'])}**): {', '.join(gaps['noAddress']) or '—'}")
    lines.append(f"- No lat/lng (**{len(gaps['noCoords'])}**): {', '.join(gaps['noCoords']) or '—'}")
    lines.append(f"- No owner email (**{len(gaps['noOwnerEmail'])}**): {', '.join(gaps['noOwnerEmail']) or '—'}")
    lines.append(f"- No Oxygen contact (**{len(gaps['noOxygenContact'])}**): {len(gaps['noOxygenContact'])} units — needed before ΑΠΥ/ΤΠΥ send")
    lines.append("")
    lines.append("## Fixed charges")
    lines.append("")
    lines.append("| Apartment | Charge | Amount | VAT | Notes |")
    lines.append("|---|---|---|---|---|")
    for a in sorted(enriched, key=lambda x: ((x.get("city") or ""), (x.get("name") or ""))):
        charges = a.get("fixedCharges") or []
        if not charges:
            continue
        for fx in charges:
            lines.append(
                "| {name} | {label} | {amt} | no |  |".format(
                    name=md_cell(a.get("name")),
                    label=md_cell(fx.get("label")),
                    amt=md_cell(fx.get("amount")),
                )
            )
    lines.append("")
    lines.append("## Owners (private repo — never copy to a public place)")
    lines.append("")
    lines.append("| Apartment | Owner | Email | Email 2 | Email 3 | Phone |")
    lines.append("|---|---|---|---|---|---|")
    for a in sorted(enriched, key=lambda x: ((x.get("city") or ""), (x.get("name") or ""))):
        lines.append(
            "| {name} | {own} | {e1} | {e2} | {e3} | {ph} |".format(
                name=md_cell(a.get("name")),
                own=md_cell(owner_display(a)),
                e1=md_cell(a.get("ownerEmail")),
                e2=md_cell(a.get("ownerEmail2")),
                e3=md_cell(a.get("ownerEmail3")),
                ph=md_cell(a.get("ownerPhone")),
            )
        )
    lines.append("")
    lines.append("## JSON")
    lines.append("")
    lines.append("Raw live snapshot: [`apartment-config.json`](apartment-config.json). Enriched catalog (listings, hubs, gaps): [`apartment-catalog.json`](apartment-catalog.json). Same fields, no ΑΦΜ.")
    lines.append("")
    OUT_MD.write_text("\n".join(lines))


if __name__ == "__main__":
    cat = build()
    print("apartments", cat["counts"]["apartments"])
    print("operating", cat["counts"]["operating"])
    print("profiles", cat["counts"]["operatingProfiles"])
    print("gaps", {k: len(v) for k, v in cat["gaps"].items()})
    print("wrote", OUT_JSON)
    print("wrote", OUT_MD)
