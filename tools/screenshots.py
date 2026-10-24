#!/usr/bin/env python3
# HBStats — Copyright (C) 2026 Antonio Bueno Antón. SPDX-License-Identifier: AGPL-3.0-or-later
"""Capture the README screenshots from the built page with the sample match.

Each scene is a snippet spliced into the end of the app's own scope (like the test suite) that puts the app in one
state; headless Chrome then saves the screen at tablet size. Run python3 tools/build_site.py first. The page loads
its fonts from Google Fonts, so capture with a network connection (and an emoji font installed for the icons).
Usage: python3 tools/screenshots.py [scene...]   (all scenes if none given)

The matrix mode checks layouts instead: every scene at every size and theme, each with a probe that reports horizontal
overflow, visible «NaN» / «undefined» text, and (in .home, #sheet and #final) text below its WCAG contrast, touch targets
under 44 px and running motion. It prints one line per image and exits 1 when any probe fails (--report-only: exits 0).
Usage: python3 tools/screenshots.py --matrix [--sizes 1280x800,1024x640] [--themes light,dark] [--motion reduce|no-preference]
                                    [--report-only] [--out DIR] [scene...]
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
# The MVP card is drawn on a canvas of its own size; the window is that size, so the screenshot is the card's PNG.
MVP_CARD_SIZE = "1080,1350"
MVP_FIELD_NAME = "Maximiliano Fernández Lo"
MVP_KEEPER_NAME = "Wolfeschlegelsteinhausen"
MVP_CARD_SNIPPET = (
    f"{SAMPLE} commit(); (async () => {{ await document.fonts.ready;"
    " const data = mvpCardData(state, '%s', matchRatings(state)); data.name = '%s';"
    " %s"
    " const canvas = document.createElement('canvas'); document.body.replaceChildren(canvas); document.body.style.margin = '0';"
    " drawMvpCard(canvas, data, { photo: data.photo ? await loadImage(data.photo) : null, crest: await loadImage(data.crest) }); })();"
)
MVP_SAMPLE_PHOTO = (
    "const face = document.createElement('canvas'); face.width = face.height = 160; const f = face.getContext('2d');"
    " f.fillStyle = '#b7c4d6'; f.fillRect(0, 0, 160, 160); f.fillStyle = '#e0b48f'; f.beginPath(); f.arc(80, 70, 36, 0, 7); f.fill();"
    " f.fillStyle = '#34495e'; f.beginPath(); f.arc(80, 190, 70, 0, 7); f.fill(); data.photo = face.toDataURL('image/png');"
)
# The sample match logs no court, so its minutes are unknown: the field card gets a 4th tile, the keeper card keeps three.
MVP_SAMPLE_MINUTES = " data.kpis.push(['Min', '52']);"
# The ratings card of the 16-player sample squad: eleven played (the other five are «S/C»), two photos, two long names.
RATINGS_CARD_WIDTH, RATINGS_CARD_HEAD, RATINGS_CARD_ROW, SAMPLE_SQUAD = 1080, 300, 120, 16
RATINGS_CARD_SIZE = f"{RATINGS_CARD_WIDTH},{RATINGS_CARD_HEAD + SAMPLE_SQUAD * RATINGS_CARD_ROW}"
# The sample match with a court log (eleven on court the whole match) and a full-time clock, so minutes and +/− are known.
COURT_LOGGED = (
    "state.courtSets = [state.players.slice(0, 11).map((p) => p.id)]; state.court = [{ abs: 0, set: 0 }];"
    " state.clock = { period: 2, elapsedMs: CONFIG.halfSeconds * 1000, runningSince: null };"
)
RATINGS_CARD_SNIPPET = (
    f"{SAMPLE} {COURT_LOGGED} commit(); (async () => {{ await document.fonts.ready;"
    " const data = ratingsCardData(state, matchRatings(state));"
    f" {MVP_SAMPLE_PHOTO} data.rows[0].photo = data.rows[3].photo = data.photo;"
    f" data.rows[0].name = '{MVP_FIELD_NAME}'; data.rows[2].name = '{MVP_KEEPER_NAME}';"
    " const canvas = document.createElement('canvas'); document.body.replaceChildren(canvas); document.body.style.margin = '0';"
    " drawRatingsCard(canvas, data, { crest: await loadImage(data.crest), faces: await Promise.all(data.rows.map((r) => (r.photo ? loadImage(r.photo) : null))) }); })();"
)
# Card scenes: one scene name writes several files, each a card with its own snippet and window size.
CARD_SCENES = {
    "mvp-image": {
        "mvp-field": (MVP_CARD_SNIPPET % ("p17", MVP_FIELD_NAME, MVP_SAMPLE_PHOTO + MVP_SAMPLE_MINUTES), MVP_CARD_SIZE),
        "mvp-keeper": (MVP_CARD_SNIPPET % ("p1", MVP_KEEPER_NAME, ""), MVP_CARD_SIZE),
    },
    "ratings-image": {"ratings-card": (RATINGS_CARD_SNIPPET, RATINGS_CARD_SIZE)},
}
# Matrix-only scenes: the season fixture (tools/scenes/season.js) puts the app in the team pages of a club with four matches.
SHEET_STATS = f"{SAMPLE} commit(); ui.sheetMode = 'sheet'; ui.sheetTab = 'stats'; renderSheet(); $('sheet').hidden = false;"
SHEET_SUMMARY = SHEET_STATS.replace("'stats'", "'summary'")
SHEET_PLAYER = SHEET_STATS.replace("'stats'", "'player'")
SHEET_SUMMARY_COURT = SHEET_SUMMARY.replace("commit();", f"{COURT_LOGGED} commit();", 1)
TOP_SCORER_SAMPLE_ID = "p17"
SAMPLE_KEEPER_ID = "p1"
MATRIX_SCENES = {
    "team": "await seedSeason();",
    "player": f"showPlayer((await seedSeason()).get('{TOP_SCORER_SAMPLE_ID}'));",
    "keeper": "await seedSeason(); showPlayer(home.roster.find((p) => p.pos === 'POR').id);",
    "player-match": f"showPlayer((await seedSeason()).get('{TOP_SCORER_SAMPLE_ID}')); showPlayerMatch(home.season[0].id);",
    "keeper-match": "await seedSeason(); showPlayer(home.roster.find((p) => p.pos === 'POR').id); showPlayerMatch(home.season[0].id);",
    "matches": "await seedSeason(); await showMatches();",
    "stats": "await seedSeason(); await showStats();",
    "stats-empty": "await seedSeason(); home.season = []; showHomeView('stats');",
    "team-edit": "await seedSeason(); showHomeView('team-edit');",
    "tuning": "await seedSeason(); await showRatingTune(); Object.assign(home.weightsDraft, { turnover: -0.7, shot: 1.1 }); renderHome();",
    "profile": "await seedSeason(); await showProfile();",
    "squad": "await seedSeason(); openSquad();",
    "template": "await seedSeason(); await showProfile(); editTemplate(null);",
    "attendance": "await seedSeason(); await showAttendance();",
    "attendance-match": "await seedSeason(); await showAttendance(); openAttendanceDay('2026-10-17');",
    "sheet-summary": SHEET_SUMMARY,
    "sheet-summary-court": SHEET_SUMMARY_COURT,
    "sheet-stats": SHEET_STATS,
    "sheet-player": f"{SHEET_PLAYER} ui.sheetPlayer = '{TOP_SCORER_SAMPLE_ID}'; renderSheet();",
    "sheet-keeper": f"{SHEET_PLAYER} ui.sheetPlayer = '{SAMPLE_KEEPER_ID}'; renderSheet();",
    "halftime": SCENES["halftime"],
    "final": SCENES["final"],
    "final-share": f"{SAMPLE} commit(); openFinal(); await ui.mvpCardReady; $('mvp-preview').scrollIntoView({{ block: 'center' }});",
}
# Thresholds the probe judges by (contrast: WCAG 1.4.3; the 44 px target is the AAA size of 2.5.5, stricter than the AA 24 px of 2.5.8; in CSS px).
PROBE_LIMITS = {"textRatio": 4.5, "largeTextRatio": 3, "largeTextPx": 24, "largeBoldTextPx": 18.66, "boldWeight": 700, "targetPx": 44}
PROBE_SCOPE = ".home, #sheet, #final"
TARGET_SELECTOR = "button, a[href], input, select, summary, [role=button], [data-player-match]"
UNMEASURED_SHOWN = 5
MOTION_CHOICES = ("no-preference", "reduce")
REDUCED_MOTION_FLAG = "--force-prefers-reduced-motion"
# Written into the page once the scene is drawn; the tool reads it back from the dumped DOM. It runs in the app's scope
# (for contrastRatio) with `limits` in reach. contrast and targets list only what fails. motion counts what moves and is 0
# unless reduced motion is active. unmeasured lists text the probe cannot judge: over a gradient or image background, or
# with an SVG fill that is not a plain colour. data-contrast-skip works from an ancestor, data-target-exempt on the element only.
PROBE = """
    const badText = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (/\\bNaN\\b|\\bundefined\\b/.test(node.nodeValue) && parent && !['SCRIPT', 'STYLE'].includes(parent.tagName)
        && parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) badText.push(node.nodeValue.trim().slice(0, 80));
    }
    const roots = [...document.querySelectorAll(scope)];
    const scoped = (selector) => [...new Set(roots.flatMap((root) => [...root.querySelectorAll(selector)]))];
    const visible = (el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgbaOf = (css) => {
      swatch.clearRect(0, 0, 1, 1);
      swatch.fillStyle = '#000';
      swatch.fillStyle = css;
      swatch.fillRect(0, 0, 1, 1);
      return [...swatch.getImageData(0, 0, 1, 1).data];
    };
    const over = (top, under) => {
      const alpha = top[3] / 255;
      return [0, 1, 2].map((i) => Math.round(top[i] * alpha + under[i] * (1 - alpha))).concat(255);
    };
    const hexOf = (rgba) => '#' + rgba.slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('');
    const backdropOf = (el) => {
      const layers = [];
      let image = false;
      for (let node = el; node && !layers.some((l) => l[3] === 255); node = node.parentElement) {
        const style = getComputedStyle(node);
        image = image || style.backgroundImage !== 'none';
        layers.push(rgbaOf(style.backgroundColor));
      }
      return { rgba: layers.reduceRight((under, layer) => over(layer, under), [255, 255, 255, 255]), image };
    };
    const opacityOf = (el) => {
      let product = 1;
      for (let node = el; node; node = node.parentElement) product *= Number(getComputedStyle(node).opacity);
      return product;
    };
    // SVG text sits on the shapes drawn before it in the same drawing (cells, floors), not only on the page behind the SVG.
    // Masked shapes are skipped, because hit testing ignores masks and they would count where they are not drawn. Filled shapes
    // that are masked or drawn after the text can tint it in ways this cannot compute, so such text is reported as unmeasured.
    const svgBackdrop = (el) => {
      // Hit testing only sees what is inside the window: bring the text in, then put every scroll position back.
      const scrolled = [];
      for (let node = el.parentElement; node; node = node.parentElement) scrolled.push([node, node.scrollTop, node.scrollLeft]);
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const box = el.getBoundingClientRect();
      const filled = document.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2)
        .filter((hit) => hit instanceof SVGGeometryElement && !(hit instanceof SVGLineElement) && hit.ownerSVGElement === el.ownerSVGElement && !/^(none|url)/.test(getComputedStyle(hit).fill));
      scrolled.forEach(([node, top, left]) => { node.scrollTop = top; node.scrollLeft = left; });
      const below = filled.filter((hit) => !hit.hasAttribute('mask') && hit.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const covered = filled.some((hit) => hit.hasAttribute('mask') || hit.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
      const base = backdropOf(el.ownerSVGElement);
      const rgba = below.reduceRight((under, shape) => {
        const style = getComputedStyle(shape);
        if (/^(none|url)/.test(style.fill)) return under;
        const fill = rgbaOf(style.fill);
        fill[3] = Math.round(fill[3] * Number(style.fillOpacity) * opacityOf(shape));
        return over(fill, under);
      }, base.rgba);
      return { rgba, image: base.image, covered };
    };
    const contrast = [], unmeasured = [];
    scoped('*').forEach((el) => {
      const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.nodeValue.trim()).join(' ').trim();
      if (!own || el.closest('[data-contrast-skip], script, style') || !visible(el)) return;
      const style = getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      const large = size >= limits.largeTextPx || (size >= limits.largeBoldTextPx && Number(style.fontWeight) >= limits.boldWeight);
      const need = large ? limits.largeTextRatio : limits.textRatio;
      const paint = el instanceof SVGElement ? style.fill : style.color;
      if (el instanceof SVGElement && /^(none|url)/.test(paint)) { unmeasured.push({ text: own.slice(0, 40), why: 'svg fill ' + paint.slice(0, 20) }); return; }
      const { rgba: back, image, covered } = el instanceof SVGElement ? svgBackdrop(el) : backdropOf(el);
      if (covered) unmeasured.push({ text: own.slice(0, 40), why: 'under masked or overlaid shapes' });
      if (image) unmeasured.push({ text: own.slice(0, 40), why: 'image backdrop' });
      const ink = rgbaOf(paint);
      ink[3] = Math.round(ink[3] * opacityOf(el));
      const ratio = contrastRatio(hexOf(over(ink, back)), hexOf(back));
      if (ratio < need) contrast.push({ text: own.slice(0, 40), ratio: Math.round(ratio * 100) / 100, need, in: el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : '') });
    });
    const targets = scoped(targetSelector).filter((el) => visible(el) && !el.hasAttribute('data-target-exempt')).flatMap((el) => {
      const { width, height } = el.getBoundingClientRect();
      if (width >= limits.targetPx && height >= limits.targetPx) return [];
      return [{ sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].join('.') : ''), w: Math.round(width), h: Math.round(height) }];
    });
    const seconds = (list) => list.split(',').map((t) => parseFloat(t) * (t.trim().endsWith('ms') ? 0.001 : 1));
    const slides = (el) => {
      const style = getComputedStyle(el);
      const properties = style.transitionProperty.split(',').map((p) => p.trim());
      const durations = seconds(style.transitionDuration);
      return properties.some((p, i) => (p === 'transform' || p === 'all') && durations[i % durations.length] > 0);
    };
    const running = document.getAnimations().filter((a) => a.playState === 'running' && roots.some((root) => root.contains(a.effect && a.effect.target)));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = reduced ? running.length + scoped('*').filter((el) => visible(el) && slides(el)).length : 0;
    return { overflowX: document.documentElement.scrollWidth > innerWidth, badText, contrast, targets, motion, unmeasured };
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
  const limits = {json.dumps(PROBE_LIMITS)}, scope = {json.dumps(PROBE_SCOPE)}, targetSelector = {json.dumps(TARGET_SELECTOR)};
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


def capture(app: str, snippet: str, out: pathlib.Path, size: str, matrix: bool = False, motion: str = "reduce") -> dict | None:
    """Screenshot one scene to `out`; in matrix mode also return its probe, read from a second --dump-dom run.
    README scenes are always captured with reduced motion; the matrix takes the choice of --motion."""
    # The page sits next to the built one so its relative icon and manifest URLs resolve.
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=SOURCE_PAGE.parent, encoding="utf-8") as page:
        page.write(scene_page(app, snippet, matrix))
        page.flush()
        out.unlink(missing_ok=True)
        motion_flags = [REDUCED_MOTION_FLAG] if motion == "reduce" else []
        flags = [f"--window-size={size}", "--hide-scrollbars", f"--virtual-time-budget={RENDER_BUDGET_MS}", *motion_flags]
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
    """The probe's verdict as «overflowX=… badText=… contrast=n targets=n motion=n», or an empty string when it is clean."""
    if "error" in probe:
        return f"scene failed: {probe['error']}"
    counts = {"overflowX": probe["overflowX"], "badText": probe["badText"], "contrast": len(probe["contrast"]),
              "targets": len(probe["targets"]), "motion": probe["motion"]}
    if not any(counts.values()):
        return ""
    return " ".join(f"{key}={json.dumps(value) if isinstance(value, list) else str(value).lower() if isinstance(value, bool) else value}" for key, value in counts.items())


def run_matrix(app: str, names: list[str], sizes: list[str], themes: list[str], out_dir: pathlib.Path, motion: str) -> bool:
    out_dir.mkdir(parents=True, exist_ok=True)
    passed = True
    for name in names:
        for theme in themes:
            for size in sizes:
                width, height = size.split("x")
                out = out_dir / f"{name}-{theme}-{width}x{height}.png"
                probe = capture(app, f"applyTheme('{theme}'); {MATRIX_SCENES[name]}", out, f"{width},{height}", matrix=True, motion=motion)
                problem = probe_problem(probe)
                passed &= not problem
                print(f"{shown(out)}: " + (f"FAIL {problem}" if problem else "ok"))
                if probe.get("unmeasured"):
                    print(f"  unmeasured={len(probe['unmeasured'])}: " + "; ".join(f"{u['text']!r} ({u['why']})" for u in probe["unmeasured"][:UNMEASURED_SHOWN]))
    return passed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("scenes", nargs="*", help="scene names (all if none given)")
    parser.add_argument("--matrix", action="store_true", help="every scene at every size and theme, with a layout probe")
    parser.add_argument("--sizes", default=DEFAULT_SIZES, help="matrix window sizes, WIDTHxHEIGHT comma separated")
    parser.add_argument("--themes", default=DEFAULT_THEMES, help="matrix themes, comma separated")
    parser.add_argument("--motion", choices=MOTION_CHOICES, default="no-preference", help="matrix only: the motion preference the page sees")
    parser.add_argument("--report-only", action="store_true", help="matrix only: print what the probes find but exit 0")
    parser.add_argument("--out", type=pathlib.Path, default=None, help="output folder (default .github/readme, or the matrix folder you choose)")
    args = parser.parse_args()
    available = MATRIX_SCENES if args.matrix else {**SCENES, **CARD_SCENES}
    unknown = [n for n in args.scenes if n not in available]
    if unknown:
        raise SystemExit(f"Unknown scene(s): {', '.join(unknown)}. Available: {', '.join(available)}")
    if not SOURCE_PAGE.exists():
        raise SystemExit(f"{SOURCE_PAGE} not found: run python3 tools/build_site.py first")
    app = SOURCE_PAGE.read_text(encoding="utf-8")
    names = args.scenes or list(SCENES if not args.matrix else available)
    if args.matrix:
        if args.out is None:
            raise SystemExit("--matrix needs --out DIR")
        if not run_matrix(app, names, args.sizes.split(","), args.themes.split(","), args.out, args.motion) and not args.report_only:
            raise SystemExit(1)
        return
    out_dir = args.out or OUT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in names:
        for file, snippet, size in [(name, SCENES[name], TABLET_SIZE)] if name in SCENES else [(f, *card) for f, card in CARD_SCENES[name].items()]:
            out = out_dir / f"{file}.png"
            capture(app, snippet, out, size)
            print(shown(out))


if __name__ == "__main__":
    main()
