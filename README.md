# HBStats

Live handball statistics for a landscape tablet, used with finger or stylus (Triana BM Vivero).
One screen: draggable players on court, shot trajectories drawn in one gesture, goalkeeper and rival tracking,
match sheet (acta) with both rosters, analysis with key points, and PDF reports.

It is an installable web app (PWA): it works offline once opened, keeps each match on the device, and
installs from the browser ("Add to home screen") on Android and iPad.

## Layout

| Path | What it is |
|---|---|
| `src/app.html` | The whole app (markup, styles, script). Single source of truth; also publishable as a Claude artifact, so it has no `<html>`/`<head>` of its own. |
| `src/sw.js` | Service worker (offline). `__BUILD__` is replaced at build time. |
| `src/manifest.webmanifest` | App name, icons, landscape, fullscreen. |
| `src/escudo.jpg` | Club crest: source of the app icons and the scoreboard crest. |
| `docs/` | Generated site that gets published (GitHub Pages serves this folder). Do not edit by hand. |
| `tests/inject.js` | In-page test suite (runs inside the app's scope). |
| `tools/` | Build, icon and test scripts (Python 3 standard library + a headless Chrome). |

## Commands

```sh
python3 tools/run_tests.py    # run the test suite against src/app.html
python3 tools/build_site.py   # regenerate docs/ from src/
python3 tools/make_icons.py   # regenerate docs/icons/ and the inline scoreboard crest from src/escudo.jpg
```

The scripts find Chrome through the `CHROME` environment variable, a Playwright-installed browser, or
`google-chrome`/`chromium` on the PATH.

## Release

1. Edit `src/`, run the tests, run the build.
2. Commit `src/` and `docs/` together and push: the site updates and installed tablets pick up the new
   version the next time they open the app with a connection.

## Data

Matches live in the browser storage of each tablet (no server, no accounts). Rosters move between devices
with *Acta → Guardar / Cargar* (JSON files).

External files loaded at runtime (cached for offline use by the service worker): Google Fonts (Barlow Condensed),
jsPDF 2.5.1 and jsPDF-AutoTable 3.5.31 from cdnjs (only when a PDF is generated).
