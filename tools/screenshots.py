#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Capture the README screenshots from the built Triana page with the sample match.

Each scene is a snippet spliced into the end of the app's own scope (like the test suite) that puts the app in one
state; headless Chrome then saves the screen at tablet size. Run python3 tools/build_site.py first. The page loads
its fonts from Google Fonts, so capture with a network connection (and an emoji font installed for the icons).
Usage: python3 tools/screenshots.py [scene...]   (all scenes if none given)
"""
import pathlib
import sys
import tempfile

from chrome import run_chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE_PAGE = ROOT / "docs" / "triana" / "index.html"
OUT_DIR = ROOT / ".github" / "readme"
APP_END = "})();"
TABLET_SIZE = "1280,800"
RENDER_BUDGET_MS = 8000

SAMPLE = "state = sampleState(); ui.sheetMode = 'sheet'; $('sheet').hidden = true; ui.show = new Set(['GOL', 'PARADA', 'FALLO']);"
SCENES = {
    "setup": "state = sampleState(); state.setupDone = false; commit(); openSetup();",
    "defence": f"{SAMPLE} setPhase('DEF'); ui.source = 'GK'; commit();",
    "attack-picker": (
        f"{SAMPLE} setPhase('ATK'); ui.source = 'US'; commit();"
        "openShotPop({ type: 'ourShot', playerId: null, pick: true, origin: { x: 520, y: 470 }, target: { x: 560, y: 110 } },"
        " { x: 640, y: 300 });"
    ),
    "dark": f"{SAMPLE} applyTheme('dark'); setPhase('ATK'); ui.source = 'US'; commit();",
    "analysis": f"{SAMPLE} commit(); ui.sheetMode = 'sheet'; ui.sheetTab = 'analysis'; renderSheet(); $('sheet').hidden = false;",
    "goalkeeper": f"{SAMPLE} commit(); ui.sheetMode = 'sheet'; ui.sheetTab = 'gk'; renderSheet(); $('sheet').hidden = false;",
    "final": f"{SAMPLE} commit(); openFinal();",
}


def scene_page(app: str, snippet: str) -> str:
    cut = app.rfind(APP_END)
    if cut < 0:
        raise ValueError(f"{SOURCE_PAGE} must end its script with an IIFE '{APP_END}'")
    injected = f"  {snippet}\n"
    return app[:cut] + injected + app[cut:]


def capture(name: str, app: str) -> pathlib.Path:
    # The page sits next to the built one so its relative icon and manifest URLs resolve.
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=SOURCE_PAGE.parent, encoding="utf-8") as page:
        page.write(scene_page(app, SCENES[name]))
        page.flush()
        out = OUT_DIR / f"{name}.png"
        out.unlink(missing_ok=True)
        result = run_chrome(pathlib.Path(page.name), f"--window-size={TABLET_SIZE}", "--hide-scrollbars", "--force-prefers-reduced-motion",
                            f"--virtual-time-budget={RENDER_BUDGET_MS}", f"--screenshot={out}")
    if result.returncode != 0 or not out.exists():
        raise RuntimeError(f"Scene '{name}' failed (exit {result.returncode}):\n{result.stderr[-2000:]}")
    return out


def main(names: list[str]) -> None:
    unknown = [n for n in names if n not in SCENES]
    if unknown:
        raise SystemExit(f"Unknown scene(s): {', '.join(unknown)}. Available: {', '.join(SCENES)}")
    if not SOURCE_PAGE.exists():
        raise SystemExit(f"{SOURCE_PAGE} not found: run python3 tools/build_site.py first")
    app = SOURCE_PAGE.read_text(encoding="utf-8")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in names or list(SCENES):
        print(capture(name, app).relative_to(ROOT))


if __name__ == "__main__":
    main(sys.argv[1:])
