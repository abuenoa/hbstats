#!/usr/bin/env python3
"""Render the app icons and the scoreboard crest from the club crest (src/escudo.jpg) with headless Chrome.

- docs/icons/*.png: launcher icons. "any" icons are the round crest on a transparent background; the maskable one
  and the Apple icon (which cannot be transparent) put it on a dark square, shrunk into the launcher safe zone.
- src/app.html: the small crest in the scoreboard is inlined as a data URI, so the app stays a single file.

Usage: python3 tools/make_icons.py
"""
import base64
import pathlib
import re
import tempfile

from chrome import run_chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
CREST = ROOT / "src" / "escudo.jpg"
APP = ROOT / "src" / "app.html"
OUT = ROOT / "docs" / "icons"
DARK = "#151515"
TRANSPARENT = None
CREST_IN_BAR_PX = 96  # twice the 44 px it is shown at, for sharp high-density screens
BAR_CREST = re.compile(r'(<img class="crest" alt="" src=")data:image/png;base64,[^"]*(")')

# (file, size, crest scale within the square, background)
ICONS = [
    ("favicon-32.png", 32, 1.0, TRANSPARENT),
    ("icon-192.png", 192, 1.0, TRANSPARENT),
    ("icon-512.png", 512, 1.0, TRANSPARENT),
    ("icon-maskable-512.png", 512, 0.78, DARK),
    ("apple-touch-icon.png", 180, 0.9, DARK),
]


def render(target: pathlib.Path, size: int, scale: float, background: str | None) -> None:
    crest = base64.b64encode(CREST.read_bytes()).decode("ascii")
    side = round(size * scale)
    bg = background or "transparent"
    page = (
        f"<!doctype html><style>html,body{{margin:0;width:{size}px;height:{size}px;background:{bg};"
        f"display:grid;place-items:center;overflow:hidden}}img{{width:{side}px;height:{side}px;border-radius:50%;display:block}}</style>"
        f'<img src="data:image/jpeg;base64,{crest}">'
    )
    flags = [f"--window-size={size},{size}", "--hide-scrollbars", f"--screenshot={target}"]
    if background is TRANSPARENT:
        flags.append("--default-background-color=00000000")
    with tempfile.TemporaryDirectory() as tmp:
        html = pathlib.Path(tmp) / "icon.html"
        html.write_text(page, encoding="utf-8")
        run_chrome(html, *flags)
    if not target.exists():
        raise RuntimeError(f"Chrome did not write {target.name}")


def inline_bar_crest() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        png = pathlib.Path(tmp) / "crest.png"
        render(png, CREST_IN_BAR_PX, 1.0, TRANSPARENT)
        data = base64.b64encode(png.read_bytes()).decode("ascii")
    app = APP.read_text(encoding="utf-8")
    updated, count = BAR_CREST.subn(lambda m: f"{m.group(1)}data:image/png;base64,{data}{m.group(2)}", app)
    if count != 1:
        raise RuntimeError('src/app.html must contain exactly one <img class="crest" alt="" src="data:image/png;base64,...">')
    APP.write_text(updated, encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size, scale, background in ICONS:
        render(OUT / name, size, scale, background)
        print(f"icons/{name}")
    inline_bar_crest()
    print("src/app.html crest updated")


if __name__ == "__main__":
    main()
