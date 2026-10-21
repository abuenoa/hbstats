#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Capture the README screenshots from the built page with the sample match.

Each scene is a snippet spliced into the end of the app's own scope (like the test suite) that puts the app in one
state; headless Chrome then saves the screen at tablet size. Run python3 tools/build_site.py first. The page loads
its fonts from Google Fonts, so capture with a network connection (and an emoji font installed for the icons).
Usage: python3 tools/screenshots.py [scene...]   (all scenes if none given)

The matrix mode checks layouts instead: every scene at every size and theme, each with a probe that reports horizontal
overflow and visible «NaN» / «undefined» text. It prints one line per image and exits 1 when any probe fails.
Usage: python3 tools/screenshots.py --matrix [--sizes 1280x800,1024x640] [--themes light,dark] [--out DIR] [scene...]
"""
import argparse
import html
import json
import pathlib
import re
import tempfile

from chrome import run_chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE_PAGE = ROOT / "docs" / "index.html"
OUT_DIR = ROOT / ".github" / "readme"
APP_END = "})();"
TABLET_SIZE = "1280,800"
RENDER_BUDGET_MS = 8000
SCENES_DIR = pathlib.Path(__file__).resolve().parent / "scenes"
CLOUD_CONFIG_LINE = re.compile(r"const CLOUD_CONFIG = .*;")
DEFAULT_SIZES = "1280x800,1024x640"
DEFAULT_THEMES = "light,dark"
PROBE_SETTLE_MS = 100
BOOT_POLL_MS = 10
PROBE_META = re.compile(r'<meta name="probe" content="([^"]*)"')

# The home screen opens over the app; scenes close it and dress the app as a club with its colours.
SAMPLE = ("applyTeam({ ...DEFAULT_TEAM, club: 'Triana BM Vivero', name: 'Triana' }); state = sampleState(); $('home').hidden = true;"
          " ui.sheetMode = 'sheet'; $('sheet').hidden = true; ui.show = new Set(['GOL', 'PARADA', 'FALLO']);")
SCENES = {
    "setup": f"{SAMPLE} state.setupDone = false; commit(); openSetup();",
    "defence": f"{SAMPLE} setPhase('DEF'); ui.source = 'GK'; commit();",
    "attack-picker": (
        f"{SAMPLE} setPhase('ATK'); ui.source = 'US'; commit();"
        "openShotPop({ type: 'ourShot', playerId: null, pick: true, origin: { x: 520, y: 470 }, target: { x: 560, y: 110 } },"
        " { x: 640, y: 300 });"
    ),
    "dark": f"{SAMPLE} applyTheme('dark'); setPhase('ATK'); ui.source = 'US'; commit();",
    "analysis": f"{SAMPLE} commit(); ui.sheetMode = 'sheet'; ui.sheetTab = 'analysis'; renderSheet(); $('sheet').hidden = false;",
    "goalkeeper": f"{SAMPLE} commit(); ui.sheetMode = 'sheet'; ui.sheetTab = 'gk'; renderSheet(); $('sheet').hidden = false;",
    "halftime": f"{SAMPLE} commit(); openHalftime();",
    "final": f"{SAMPLE} commit(); openFinal();",
}
# Matrix-only scenes: the season fixture (tools/scenes/season.js) puts the app in the team pages of a club with four matches.
SHEET_STATS = f"{SAMPLE} commit(); ui.sheetMode = 'sheet'; ui.sheetTab = 'stats'; renderSheet(); $('sheet').hidden = false;"
TOP_SCORER_SAMPLE_ID = "p17"
MATRIX_SCENES = {
    "team": "await seedSeason();",
    "player": f"showPlayer((await seedSeason()).get('{TOP_SCORER_SAMPLE_ID}'));",
    "keeper": "await seedSeason(); showPlayer(home.roster.find((p) => p.pos === 'POR').id);",
    "matches": "await seedSeason(); await showMatches();",
    "profile": "await seedSeason(); await showProfile();",
    "sheet-stats": SHEET_STATS,
    "halftime": SCENES["halftime"],
    "final": SCENES["final"],
}
# Written into the page once the scene is drawn; the tool reads it back from the dumped DOM.
PROBE = """
    const badText = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (/\\bNaN\\b|\\bundefined\\b/.test(node.nodeValue) && parent && !['SCRIPT', 'STYLE'].includes(parent.tagName)
        && parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) badText.push(node.nodeValue.trim().slice(0, 80));
    }
    return { overflowX: document.documentElement.scrollWidth > innerWidth, badText };
"""


def scene_page(app: str, snippet: str, matrix: bool = False) -> str:
    cut = app.rfind(APP_END)
    if cut < 0:
        raise ValueError(f"{SOURCE_PAGE} must end its script with an IIFE '{APP_END}'")
    if not matrix:
        return app[:cut] + f"  {snippet}\n" + app[cut:]
    # Matrix scenes run on the local backend (the built page points at the cloud) once fonts are loaded and the app has booted.
    app, replaced = CLOUD_CONFIG_LINE.subn("const CLOUD_CONFIG = null;", app)
    if not replaced:
        raise ValueError(f"{SOURCE_PAGE} has no 'const CLOUD_CONFIG = ...;' line to switch to the local backend")
    cut = app.rfind(APP_END)
    season = (SCENES_DIR / "season.js").read_text(encoding="utf-8")
    run = f"""  const writeProbe = (result) => {{
    const meta = document.createElement('meta');
    meta.name = 'probe';
    meta.content = JSON.stringify(result);
    document.head.append(meta);
  }};
  const probe = () => {{{PROBE}  }};
  (async () => {{
    await document.fonts.ready;
    while (home.view === 'loading') await new Promise((resolve) => setTimeout(resolve, {BOOT_POLL_MS}));
    await new Promise((resolve) => setTimeout(resolve));
    {snippet}
    await new Promise((resolve) => setTimeout(resolve, {PROBE_SETTLE_MS}));
    writeProbe(probe());
  }})().catch((err) => writeProbe({{ error: String(err && err.stack || err) }}));
"""
    return app[:cut] + season + run + app[cut:]


def capture(app: str, snippet: str, out: pathlib.Path, size: str, matrix: bool = False) -> dict | None:
    """Screenshot one scene to `out`; in matrix mode also return its probe, read from a second --dump-dom run."""
    # The page sits next to the built one so its relative icon and manifest URLs resolve.
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=SOURCE_PAGE.parent, encoding="utf-8") as page:
        page.write(scene_page(app, snippet, matrix))
        page.flush()
        out.unlink(missing_ok=True)
        flags = [f"--window-size={size}", "--hide-scrollbars", "--force-prefers-reduced-motion", f"--virtual-time-budget={RENDER_BUDGET_MS}"]
        result = run_chrome(pathlib.Path(page.name), *flags, f"--screenshot={out}")
        if result.returncode != 0 or not out.exists():
            raise RuntimeError(f"Scene '{out.stem}' failed (exit {result.returncode}):\n{result.stderr[-2000:]}")
        if not matrix:
            return None
        dumped = run_chrome(pathlib.Path(page.name), *flags, "--dump-dom")
    found = PROBE_META.search(dumped.stdout)
    if dumped.returncode != 0 or not found:
        raise RuntimeError(f"Scene '{out.stem}' wrote no probe (exit {dumped.returncode}):\n{dumped.stderr[-2000:]}")
    return json.loads(html.unescape(found.group(1)))


def shown(path: pathlib.Path) -> pathlib.Path:
    return path.relative_to(ROOT) if path.is_relative_to(ROOT) else path


def probe_problem(probe: dict) -> str:
    if "error" in probe:
        return f"scene failed: {probe['error']}"
    problems = (["horizontal overflow"] if probe["overflowX"] else []) + ([f"bad text {probe['badText']}"] if probe["badText"] else [])
    return "; ".join(problems)


def run_matrix(app: str, names: list[str], sizes: list[str], themes: list[str], out_dir: pathlib.Path) -> bool:
    out_dir.mkdir(parents=True, exist_ok=True)
    passed = True
    for name in names:
        for theme in themes:
            for size in sizes:
                width, height = size.split("x")
                out = out_dir / f"{name}-{theme}-{width}x{height}.png"
                probe = capture(app, f"applyTheme('{theme}'); {MATRIX_SCENES[name]}", out, f"{width},{height}", matrix=True)
                problem = probe_problem(probe)
                passed &= not problem
                print(f"{'FAIL' if problem else 'ok'} {shown(out)}" + (f" {problem}" if problem else ""))
    return passed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("scenes", nargs="*", help="scene names (all if none given)")
    parser.add_argument("--matrix", action="store_true", help="every scene at every size and theme, with a layout probe")
    parser.add_argument("--sizes", default=DEFAULT_SIZES, help="matrix window sizes, WIDTHxHEIGHT comma separated")
    parser.add_argument("--themes", default=DEFAULT_THEMES, help="matrix themes, comma separated")
    parser.add_argument("--out", type=pathlib.Path, default=None, help="output folder (default .github/readme, or the matrix folder you choose)")
    args = parser.parse_args()
    available = MATRIX_SCENES if args.matrix else SCENES
    unknown = [n for n in args.scenes if n not in available]
    if unknown:
        raise SystemExit(f"Unknown scene(s): {', '.join(unknown)}. Available: {', '.join(available)}")
    if not SOURCE_PAGE.exists():
        raise SystemExit(f"{SOURCE_PAGE} not found: run python3 tools/build_site.py first")
    app = SOURCE_PAGE.read_text(encoding="utf-8")
    names = args.scenes or list(available)
    if args.matrix:
        if args.out is None:
            raise SystemExit("--matrix needs --out DIR")
        if not run_matrix(app, names, args.sizes.split(","), args.themes.split(","), args.out):
            raise SystemExit(1)
        return
    out_dir = args.out or OUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in names:
        out = out_dir / f"{name}.png"
        capture(app, SCENES[name], out, TABLET_SIZE)
        print(shown(out))


if __name__ == "__main__":
    main()
