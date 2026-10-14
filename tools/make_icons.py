#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Render the app icons from assets/icon.svg with headless Chrome into assets/icons/.

"any" icons are the round mark on a transparent background; the maskable and Apple icons put it on a dark square,
shrunk into the launcher safe zone. tools/build_site.py copies them into docs/icons/. Teams show their own crest
inside the app; these icons are the installed app's.

Usage: python3 tools/make_icons.py
"""
import base64
import pathlib
import tempfile

from chrome import run_chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "icon.svg"
OUT = ROOT / "assets" / "icons"
DARK = "#151515"
TRANSPARENT = None

# (file, size, mark scale within the square, background)
ICONS = [
    ("favicon-32.png", 32, 1.0, TRANSPARENT),
    ("icon-192.png", 192, 1.0, TRANSPARENT),
    ("icon-512.png", 512, 1.0, TRANSPARENT),
    ("icon-maskable-512.png", 512, 0.78, DARK),
    ("apple-touch-icon.png", 180, 0.9, DARK),
]


def render(target: pathlib.Path, size: int, scale: float, background: str | None) -> None:
    data = base64.b64encode(SOURCE.read_bytes()).decode("ascii")
    side = round(size * scale)
    page = (
        f"<!doctype html><style>html,body{{margin:0;width:{size}px;height:{size}px;background:{background or 'transparent'};"
        f"display:grid;place-items:center;overflow:hidden}}img{{width:{side}px;height:{side}px;display:block}}</style>"
        f'<img src="data:image/svg+xml;base64,{data}">'
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


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size, scale, background in ICONS:
        render(OUT / name, size, scale, background)
    print("assets/icons/")


if __name__ == "__main__":
    main()
