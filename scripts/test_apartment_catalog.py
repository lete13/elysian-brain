#!/usr/bin/env python3
"""Assert the enriched apartment catalog stays complete and AFM-free."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP = json.loads((ROOT / "claude" / "apartment-config.json").read_text())
CAT = json.loads((ROOT / "claude" / "apartment-catalog.json").read_text())
MD = (ROOT / "claude" / "apartment-config.md").read_text()

AFM_RE = re.compile(r"αφμ|afm|tax[_ ]?id|vat[_ ]?number", re.I)


def fail(msg):
    print("FAIL:", msg)
    sys.exit(1)


assert CAT["counts"]["apartments"] == 62, CAT["counts"]
assert CAT["counts"]["operating"] == 61
assert CAT["counts"]["operatingProfiles"] == {"leased": 31, "b2b": 16, "private": 14}
assert CAT["counts"]["dummies"] == ["ZZ-TEST-DONOTUSE"]
assert len(CAT["apartments"]) == len(SNAP["apartments"]) == 62

snap_ids = {a["id"] for a in SNAP["apartments"]}
cat_ids = {a["id"] for a in CAT["apartments"]}
assert snap_ids == cat_ids, snap_ids ^ cat_ids

names = [a["name"] for a in CAT["apartments"]]
assert "Elysian Ariadne" in names
assert "Filoxenia Apartment Athens" in names
assert "ZZ-TEST-DONOTUSE" in names

votsala = [a for a in CAT["apartments"] if (a.get("clearGroup") == "Votsala")]
assert len(votsala) == 8
assert {a.get("bookingHotelId") for a in votsala} == {"13180441"}

sunset = next(a for a in CAT["apartments"] if a["name"].startswith("Sunset Nest"))
assert not sunset.get("bookingHotelId"), "Sunset Nest should be the missing Booking id"

horizon = next(a for a in CAT["apartments"] if "Horizon" in a["name"])
assert horizon.get("p4Note") == "carrier"
assert horizon.get("businessTax") is True

v2 = next(a for a in CAT["apartments"] if a["name"].startswith("Votsala 2"))
assert v2.get("p4Note").startswith("same-address")
assert v2.get("businessTax") is False

blob = json.dumps(CAT, ensure_ascii=False) + MD
if AFM_RE.search(blob):
    # The word ΑΦΜ in "Do not store ΑΦΜ" is allowed; a numeric tax id is not.
    for m in AFM_RE.finditer(blob):
        ctx = blob[max(0, m.start() - 40) : m.end() + 40]
        if "never" not in ctx.lower() and "do not" not in ctx.lower() and "ΑΦΜ" not in ctx:
            fail("possible tax-id leak: " + ctx.replace("\n", " "))

for a in CAT["apartments"]:
    assert a.get("id") and a.get("name")
    if not a.get("dummy"):
        assert a.get("profile") in ("leased", "b2b", "private"), a["name"]
    if a.get("airbnbUrl"):
        assert a.get("airbnbRoomId"), a["name"]

assert "Seaside Lavrio Beach House" in MD
assert "Listings (Airbnb + Booking.com)" in MD
assert "Owners (private repo" in MD
assert CAT["gaps"]["noBookingHotelId"] == ["Sunset Nest in Fiskardo"]
assert len(CAT["gaps"]["languageUnset"]) == 5
assert len(CAT["gaps"]["b2bPartnerEmpty"]) == 16

print("ok", CAT["counts"]["operating"], "operating ·", len(CAT["gaps"]["noOxygenContact"]), "missing Oxygen")
