# HBStats

Live handball statistics for a landscape tablet, used with finger or stylus. Multi-club: each club gets its own
installable app (name, crest, brand colours, separate data) at `https://abuenoa.github.io/hbstats/<club>/`.
One screen: draggable players on court, shot trajectories drawn in one gesture, goalkeeper and rival tracking,
match sheet (acta) with both rosters, analysis with key points, and PDF reports.

It is an installable web app (PWA): it works offline once opened, keeps each match on the device, and
installs from the browser ("Add to home screen") on Android and iPad.

## Layout

| Path | What it is |
|---|---|
| `src/app.html` | The whole app (markup, styles, script). Single source of truth; also publishable as a Claude artifact, so it has no `<html>`/`<head>` of its own. |
| `src/sw.js` | Service worker (offline). `__BUILD__` is replaced at build time. |
| `tenants/<club>/tenant.json` | Club settings: name, team, brand colours, optional roster (fields in `tools/tenants.py`). |
| `tenants/<club>/escudo.jpg` | Club crest; `icons/` next to it is generated from it. |
| `docs/` | Generated site (GitHub Pages serves this folder): `docs/<club>/` per club plus a club list at the root. Do not edit by hand. |
| `tests/inject.js` | In-page test suite (runs inside the app's scope). |
| `tools/` | Build, icon and test scripts (Python 3 standard library + a headless Chrome). |

## Commands

```sh
python3 tools/run_tests.py    # run the test suite against src/app.html
python3 tools/build_site.py   # regenerate docs/ from src/
python3 tools/make_icons.py [club]   # regenerate a club's icons from its crest (all clubs if none given)
```

The scripts find Chrome through the `CHROME` environment variable, a Playwright-installed browser, or
`google-chrome`/`chromium` on the PATH.

## Adding a club

1. Create `tenants/<club>/` (lowercase, digits, hyphens) with a square `escudo.jpg` and a `tenant.json`
   (copy `tenants/triana/tenant.json` and change the values; `brandInk` is the text colour on the brand colour).
2. `python3 tools/make_icons.py <club>`, then `python3 tools/build_site.py`.
3. Commit and push: the club appears in the list at the site root and installs from `/hbstats/<club>/`.

Semantic colours (goals against in red, saves in blue, misses in grey…) are the same for every club; the brand
colours only touch primary buttons, our score, the background glow and the PDF header.

## Release

1. Edit `src/`, run the tests, run the build.
2. Commit `src/` and `docs/` together and push: the site updates and installed tablets pick up the new
   version the next time they open the app with a connection.

## Data

Matches live in the browser storage of each tablet (no server, no accounts). Rosters move between devices
with *Acta → Guardar / Cargar* (JSON files).

External files loaded at runtime (cached for offline use by the service worker): Google Fonts (Barlow Condensed),
jsPDF 2.5.1 and jsPDF-AutoTable 3.5.31 from cdnjs (only when a PDF is generated).

## Contributing

Issues and pull requests are welcome (in Spanish or English): read [CONTRIBUTING.md](CONTRIBUTING.md). Pull
requests are accepted under the [Contributor License Agreement](CLA.md), and CI must pass (tests and an
up-to-date `docs/`).

## Licence

Copyright (C) 2026 Antonio Bueno Antón.

HBStats is free software under the [GNU Affero General Public License v3.0 or later](LICENSE): you may use, study,
modify and share it, and anyone who offers a modified version to users over a network must publish its source
under the same licence. The app links to this repository so every user can get the source.

This is the open edition. A commercial edition with premium features may be offered separately by the copyright
holder; contributions can be included in both under the CLA.

**Club crests and names are not covered by the licence.** `tenants/*/escudo.jpg`, the icons generated from them and
the club names belong to their clubs; do not reuse them without the club's permission.
