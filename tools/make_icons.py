#!/usr/bin/env python3
"""Render the PNG app icons in docs/icons/ from src/icon.svg with headless Chrome.

The maskable icon shrinks the crest into the safe zone (inner 80% circle) that launchers may crop to.
Usage: python3 tools/make_icons.py
"""
import pathlib
import tempfile

from chrome import run_chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
SVG = (ROOT / "src" / "icon.svg").read_text(encoding="utf-8")
OUT = ROOT / "docs" / "icons"
MASKABLE_SCALE = 0.72

ICONS = [
    ("favicon-32.png", 32, 1.0),
    ("apple-touch-icon.png", 180, 1.0),
    ("icon-192.png", 192, 1.0),
    ("icon-512.png", 512, 1.0),
    ("icon-maskable-512.png", 512, MASKABLE_SCALE),
]


def render(name: str, size: int, scale: float) -> None:
    svg = SVG.replace('<g id="crest">', f'<g id="crest" transform="translate(256 256) scale({scale}) translate(-256 -256)">')
    page = f"<!doctype html><style>html,body{{margin:0;background:#151515}}svg{{display:block;width:{size}px;height:{size}px}}</style>{svg}"
    with tempfile.TemporaryDirectory() as tmp:
        html = pathlib.Path(tmp) / "icon.html"
        html.write_text(page, encoding="utf-8")
        run_chrome(html, f"--window-size={size},{size}", "--hide-scrollbars", f"--screenshot={OUT / name}")
    if not (OUT / name).exists():
        raise RuntimeError(f"Chrome did not write {name}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size, scale in ICONS:
        render(name, size, scale)
        print(f"icons/{name}")


if __name__ == "__main__":
    main()
