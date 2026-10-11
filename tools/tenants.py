"""Club (tenant) configuration: one folder per club in tenants/<slug>/ with tenant.json and escudo.jpg.

tenant.json fields:
  slug      folder name and URL path (lowercase letters, digits, hyphens)
  club      full club name (app name, PDF header)
  team      short team name shown on the scoreboard
  brand     main brand colour (#rrggbb): primary buttons, our score, PDF header
  brand2    second brand colour (#rrggbb): background glow, PDF header stripe
  brandInk  text colour on top of `brand` (#rrggbb)
  roster    optional first-run roster: [{"num": 1, "name": "...", "pos": "POR|EXT|LAT|CEN|PIV"}, ...]
  legacyStorageKey  optional: storage key of a release before per-club storage, read once so the match carries over
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TENANTS = ROOT / "tenants"
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
REQUIRED = ("slug", "club", "team", "brand", "brand2", "brandInk")
POSITIONS = {"POR", "EXT", "LAT", "CEN", "PIV"}


def _validate(folder: pathlib.Path, data: dict) -> dict:
    where = f"tenants/{folder.name}/tenant.json"
    missing = [k for k in REQUIRED if not data.get(k)]
    if missing:
        raise ValueError(f"{where}: missing {', '.join(missing)}")
    if data["slug"] != folder.name or not SLUG.match(data["slug"]):
        raise ValueError(f"{where}: slug must equal the folder name and use a-z, 0-9 and hyphens")
    for key in ("brand", "brand2", "brandInk"):
        if not HEX.match(data[key]):
            raise ValueError(f"{where}: {key} must be a #rrggbb colour")
    roster = data.get("roster")
    if roster is not None:
        if not roster or not any(p.get("pos") == "POR" for p in roster):
            raise ValueError(f"{where}: roster needs at least one goalkeeper (POR)")
        for p in roster:
            if not isinstance(p.get("num"), int) or not p.get("name") or p.get("pos") not in POSITIONS:
                raise ValueError(f"{where}: every roster entry needs num (int), name and pos ({', '.join(sorted(POSITIONS))})")
    if not (folder / "escudo.jpg").exists():
        raise ValueError(f"tenants/{folder.name}/escudo.jpg is missing")
    return data


def load_tenants() -> list[dict]:
    """All clubs, sorted by slug, each with an extra 'dir' key pointing at its folder."""
    tenants = []
    for folder in sorted(p for p in TENANTS.iterdir() if p.is_dir()):
        data = _validate(folder, json.loads((folder / "tenant.json").read_text(encoding="utf-8")))
        tenants.append({**data, "dir": folder})
    if not tenants:
        raise ValueError("No clubs found in tenants/")
    return tenants


def rgb_triplet(hex_colour: str) -> str:
    """'#d4202a' → '212, 32, 42' (for rgba(var(--x), alpha) in CSS)."""
    return ", ".join(str(int(hex_colour[i:i + 2], 16)) for i in (1, 3, 5))
