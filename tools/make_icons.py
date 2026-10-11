#!/usr/bin/env python3
"""Render each club's icons from its crest (tenants/<slug>/escudo.jpg) with headless Chrome.

Writes tenants/<slug>/icons/: launcher icons ("any" = round crest on transparent background; maskable and Apple
icons = crest on a dark square, shrunk into the launcher safe zone) and crest-96.png, the scoreboard crest that
tools/build_site.py inlines into each club's page. The crest of the default club in src/app.html (its TENANT block)
is also refreshed there, so the source page keeps working on its own (tests, artifact preview).

Usage: python3 tools/make_icons.py [slug ...]   (no slug = every club)
"""
import base64
import pathlib
import re
import sys
import tempfile

from chrome import run_chrome
from tenants import ROOT, load_tenants

APP = ROOT / "src" / "app.html"
DARK = "#151515"
TRANSPARENT = None
BAR_CREST_FILE = "crest-96.png"
BAR_CREST = re.compile(r'(<img class="crest" alt="" src=")data:image/png;base64,[^"]*(")')
DEFAULT_SLUG = re.compile(r"const TENANT = \{ slug: '([a-z0-9-]+)'")

# (file, size, crest scale within the square, background)
ICONS = [
    ("favicon-32.png", 32, 1.0, TRANSPARENT),
    ("icon-192.png", 192, 1.0, TRANSPARENT),
    ("icon-512.png", 512, 1.0, TRANSPARENT),
    ("icon-maskable-512.png", 512, 0.78, DARK),
    ("apple-touch-icon.png", 180, 0.9, DARK),
    (BAR_CREST_FILE, 96, 1.0, TRANSPARENT),  # shown at 44 px: twice that for high-density screens
]


def render(crest: pathlib.Path, target: pathlib.Path, size: int, scale: float, background: str | None) -> None:
    data = base64.b64encode(crest.read_bytes()).decode("ascii")
    side = round(size * scale)
    page = (
        f"<!doctype html><style>html,body{{margin:0;width:{size}px;height:{size}px;background:{background or 'transparent'};"
        f"display:grid;place-items:center;overflow:hidden}}img{{width:{side}px;height:{side}px;border-radius:50%;display:block}}</style>"
        f'<img src="data:image/jpeg;base64,{data}">'
    )
    flags = [f"--window-size={size},{size}", "--hide-scrollbars", f"--screenshot={target}"]
    if background is TRANSPARENT:
        flags.append("--default-background-color=00000000")
    with tempfile.TemporaryDirectory() as tmp:
        html = pathlib.Path(tmp) / "icon.html"
        html.write_text(page, encoding="utf-8")
        run_chrome(html, *flags)
    if not target.exists():
        raise RuntimeError(f"Chrome did not write {target}")


def inline_bar_crest(png: pathlib.Path) -> None:
    app = APP.read_text(encoding="utf-8")
    data = base64.b64encode(png.read_bytes()).decode("ascii")
    updated, count = BAR_CREST.subn(lambda m: f"{m.group(1)}data:image/png;base64,{data}{m.group(2)}", app)
    if count != 1:
        raise RuntimeError('src/app.html must contain exactly one <img class="crest" alt="" src="data:image/png;base64,...">')
    APP.write_text(updated, encoding="utf-8")


def main(slugs: list[str]) -> None:
    tenants = [t for t in load_tenants() if not slugs or t["slug"] in slugs]
    unknown = set(slugs) - {t["slug"] for t in tenants}
    if unknown:
        raise SystemExit(f"Unknown club(s): {', '.join(sorted(unknown))}")
    default = DEFAULT_SLUG.search(APP.read_text(encoding="utf-8"))
    for t in tenants:
        out = t["dir"] / "icons"
        out.mkdir(exist_ok=True)
        for name, size, scale, background in ICONS:
            render(t["dir"] / "escudo.jpg", out / name, size, scale, background)
        print(f"tenants/{t['slug']}/icons/")
        if default and default.group(1) == t["slug"]:
            inline_bar_crest(out / BAR_CREST_FILE)
            print("src/app.html crest updated")


if __name__ == "__main__":
    main(sys.argv[1:])
