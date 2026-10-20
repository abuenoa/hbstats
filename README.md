<div align="center">

# 🤾 HBStats

**Live handball statistics on a landscape tablet: one screen, finger or stylus, works offline.**

Draw every shot in one gesture, drag players on and off court, follow both goalkeepers, and get a
PDF report with key points when the final whistle goes.

[![CI](https://github.com/abuenoa/hbstats/actions/workflows/ci.yml/badge.svg)](https://github.com/abuenoa/hbstats/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-installable%20%C2%B7%20offline-5A0FC8)
![No build step](https://img.shields.io/badge/runtime%20deps-0-success)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Try the demo**](https://abuenoa.github.io/hbstats/demo/) ·
[Open the app](https://abuenoa.github.io/hbstats/) ·
[Report a bug](https://github.com/abuenoa/hbstats/issues/new?template=bug_report.yml) ·
[Suggest an idea](https://github.com/abuenoa/hbstats/issues/new?template=feature_request.yml) ·
[🇪🇸 En español](#-en-español)

<br>

<img src=".github/readme/defence.png" alt="HBStats during a match: court with players, rival shots drawn on our goal, score and clock at the top, live stats on the right" width="100%">

<sub>Defence view of the sample match: every rival shot on our goalkeeper, saves in blue, goals in red, misses in grey.</sub>

</div>

<details>
<summary><b>Table of contents</b></summary>

- [Why HBStats](#why-hbstats)
- [Features](#features)
- [A match, step by step](#a-match-step-by-step)
- [Install it on a tablet](#install-it-on-a-tablet)
- [For clubs](#for-clubs)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Licence](#licence)
- [🇪🇸 En español](#-en-español)

</details>

## Why HBStats

Handball is fast. Paper templates and button-heavy apps make the person on the bench look down
while the game goes on. HBStats is built around **one gesture per action** on a court that is
always visible:

- 🎯 **Draw the shot**: from where it was taken to where it went in the goal, in one stroke.
  Zone (6 m, 9 m, 7 m) and lane are worked out from the line.
- 🖐️ **Tap a player** for everything else: assist, turnover, recovery, block, defensive fault, 2'.
- ⏱️ **Forget the clock**: it starts by itself when you log a play and handles both halves,
  time-outs and exclusions.
- 📴 **No signal, no problem**: once opened, it works offline. Data stays on the tablet; no accounts, no server.

## Features

<table>
<tr>
<td width="50%" valign="top">

### Shot picker in attack
Draw a shot and pick the shooter: players on court in large buttons, the bench beside them,
ordered by position and colour. The last shooter stays selected.

</td>
<td width="50%" valign="top">

### Both teams, same numbers
Switch between your team and the rival: court lines, goalkeeper tallies and live stats
(shooting %, attack %, turnovers, zones) follow the selection, measured the same way for both.

</td>
</tr>
<tr>
<td><img src=".github/readme/attack-picker.png" alt="Shooter picker popup listing players on court and on the bench, with result buttons"></td>
<td><img src=".github/readme/dark.png" alt="Attack view in dark theme with our shots on the rival goal and our live stats"></td>
</tr>
<tr>
<td width="50%" valign="top">

### Analysis with key points
Who shoots and scores most, where each team gets through (lane × 6 m / 9 m) and where in the goal
they score. Plain-language key points to work on, for defence and attack.

</td>
<td width="50%" valign="top">

### Who hurt each goal most
Our goal or the rival's: who shoots, scores and misses most, the saved and conceded trajectories
with the shooter's dorsal, the shooters ranked by goals (tap one to see only their shots), and
saves and goals by zone and goal sector. The PDF report has the
same maps and rankings.

</td>
</tr>
<tr>
<td><img src=".github/readme/analysis.png" alt="Analysis tab with key points, top shooter and scorer, lanes table and goal sectors"></td>
<td><img src=".github/readme/goalkeeper.png" alt="Goalkeeper tab with the shot map showing each shooter's dorsal and the shooters ranked by goals"></td>
</tr>
<tr>
<td width="50%" valign="top">

### Match setup first
Both rosters (the rival can be just dorsals), venue and date before the throw-off. Rosters save
and load as files, so the next match starts in seconds.

</td>
<td width="50%" valign="top">

### Half-time and final summaries
The headline numbers of both teams as KPIs (yours coloured against the rival's), the full table
one tap below. At half-time, the key points to fix; at the end, the PDF reports (match, key
points, each player) by e-mail or shared to WhatsApp, Drive or Gmail.

</td>
</tr>
<tr>
<td><img src=".github/readme/setup.png" alt="Match setup screen with teams, venue, date and our roster with positions"></td>
<td><img src=".github/readme/final.png" alt="End-of-match summary with KPI tiles for both teams, folded detail table, e-mail and share buttons"></td>
</tr>
</table>

**Also included:** time-outs and 2' for both teams with countdowns and alarms · red and blue cards
(the player is out for good and the team plays 2' short) · separate attack and defence lineups ·
undo / redo for everything · score corrections at any time · light and dark themes · score at
every 5' derived from the goal times.

### Colours that mean the same everywhere

| | Saves | Goals against our keeper | Goals against theirs | Misses |
|---|---|---|---|---|
| Lines, tallies, PDFs | 🔵 blue | 🔴 red | 🟢 green | ⚪ grey |

Players are coloured by position: 🟢 wings · 🟣 backs · 🩷 centre · 🟡 pivots · ⚫ goalkeepers.

## A match, step by step

1. **Prepare**: on the home screen, *Nuevo partido* → pick the squad (convocatoria) from your roster, then the
   rival, venue, date and rival roster, and *Empezar partido*.
2. **Place the players** on court for attack and defence by dragging them from the bench.
3. **Play**: draw shots, tap players for other actions. The clock starts with the first play.
4. **Adjust** when needed: tap the clock to pause or type the exact time; tap the score to correct it.
5. **Finish**: the final summary opens with both teams' numbers and the PDFs ready to send.

> [!TIP]
> Not ready for a real match? The [demo](https://abuenoa.github.io/hbstats/demo/) opens a match already in progress, with
> no account and nothing saved; signed-in coaches also have *Ver partido de ejemplo* on the home screen.

## Install it on a tablet

1. Open **https://abuenoa.github.io/hbstats/** in Chrome (Android) or Safari (iPad).
2. Menu → *Add to home screen* / *Install app*.
3. Sign in once with a connection. From then on it works offline, and it updates itself the next
   time it opens online.

## Accounts and teams

Coaches sign in with an email and a password (by invitation). Each coach's team has its own name, crest,
colours and roster, set up on the home screen under *Equipo*; matches are listed under *Partidos* and saved
to the coach's account, so they can be continued on another tablet. The semantic colours above are the same for
every team; brand colours only touch primary buttons, our score, the background glow and the PDF header.

Accounts run on [Supabase](https://supabase.com): see [supabase/README.md](supabase/README.md) to set up a
project and invite coaches. Want access for your club? [Open an issue](https://github.com/abuenoa/hbstats/issues/new?template=feature_request.yml).

## Development

The whole app is one HTML file with no framework and no build dependencies. The tools need Python 3
(standard library only) and a headless Chrome.

```sh
python3 tools/run_tests.py           # run the test suite against src/app.html
python3 tools/build_site.py          # regenerate docs/ from src/, assets/ and config/cloud.json
python3 tools/dev_server.py          # serve src/ at http://localhost:8080, rebuilt on every save
python3 tools/make_icons.py          # regenerate the app icons from assets/icon.svg
python3 tools/screenshots.py [scene] # refresh the README screenshots from the sample match
```

`docker compose up` runs the same development server in a container (Docker Desktop is enough; no
Python needed on the host). The development build has no accounts and no service worker, so a reload always shows
your latest edit; it is written to `build/dev/` (or inside the container), never to `docs/`.

The scripts find Chrome through the `CHROME` environment variable, a Playwright-installed browser, or
`google-chrome`/`chromium` on the PATH.

<details>
<summary><b>Repository layout</b></summary>

| Path | What it is |
|---|---|
| `src/app.html` | The whole app (markup, styles, script). Single source of truth; also publishable as a Claude artifact, so it has no `<html>`/`<head>` of its own. |
| `src/sw.js` | Service worker (offline). `__BUILD__` and `__SUPABASE_JS__` are replaced at build time. |
| `config/cloud.json` | Supabase project URL and public anon key (optional; without it the build has no accounts). |
| `supabase/` | Database schema and setup guide for accounts. |
| `assets/` | App icon (`icon.svg`) and the PNG icons generated from it. |
| `docs/` | Generated site served by GitHub Pages: the app at the root and the public demo in `docs/demo/`. Do not edit by hand. |
| `tests/inject.js` | In-page test suite (runs inside the app's scope). |
| `tools/` | Build, icon, screenshot and test scripts. |
| `.github/readme/` | README screenshots (generated by `tools/screenshots.py`). |

</details>

<details>
<summary><b>Release and data</b></summary>

**Release.** Edit `src/`, run the tests, run the build, then commit `src/` and `docs/` together and push.
The site updates and installed tablets pick up the new version the next time they open the app online.
CI checks both the tests and that `docs/` is up to date.

**Data.** Teams, rosters and matches live in the coach's Supabase account, with a copy of every open match on
the tablet so play goes on offline; changes upload when there is a connection. Rosters can also move as JSON
files (*Guardar / Cargar*).

**External files** loaded at runtime and cached for offline use: Google Fonts (Barlow Condensed),
supabase-js 2.45.4 from jsDelivr (accounts), and jsPDF 2.5.1 with jsPDF-AutoTable 3.5.31 from cdnjs (only when a
PDF is generated).

</details>

## Roadmap

- [x] Live tracking of both teams with shot maps, goalkeepers and analysis
- [x] PDF reports and end-of-match summary
- [x] Installable offline app
- [x] Coach accounts with their own team, roster and saved matches
- [ ] Testing on more tablets with coaches (feedback welcome)
- [ ] Season history and per-player reports across matches
- [ ] Squad call-ups sent to the players
- [ ] Configurable turnover and observation types per coach
- [ ] Android package (APK) from the same app

Have an idea? [Suggest it](https://github.com/abuenoa/hbstats/issues/new?template=feature_request.yml), in Spanish or English.

## Contributing

Issues and pull requests are welcome, in Spanish or English. Read [CONTRIBUTING.md](CONTRIBUTING.md) and
the [code of conduct](CODE_OF_CONDUCT.md). Pull requests are accepted under the
[Contributor License Agreement](CLA.md), and CI must pass (tests and an up-to-date `docs/`).

Coaches who do not code help just as much: try it in a match and
[tell us what got in the way](https://github.com/abuenoa/hbstats/issues/new?template=bug_report.yml).

## Licence

Copyright (C) 2026 Antonio Bueno Antón.

HBStats is free software under the [GNU Affero General Public License v3.0 or later](LICENSE): you may use, study,
modify and share it, and anyone who offers a modified version to users over a network must publish its source
under the same licence. The app links to this repository so every user can get the source.

This is the open edition. A commercial edition with premium features may be offered separately by the copyright
holder; contributions can be included in both under the CLA.

**Club crests and names are not covered by the licence.** Crests and names that teams upload to their accounts
belong to their clubs; do not reuse them without the club's permission.

## 🇪🇸 En español

**HBStats** es una app para apuntar las estadísticas de un partido de balonmano en directo, con la tablet
en horizontal y con el dedo o un lápiz. Todo cabe en una pantalla: la pista con tus jugadores, el marcador
y el reloj, y las estadísticas en vivo.

- **Lanzamientos de un trazo:** dibujas desde dónde se tira hasta dónde va en la portería, y la app sabe si
  es de 6 m, 9 m o 7 m.
- **Los dos equipos:** tu equipo y el rival con las mismas estadísticas, sus porteros y sus lanzadores por dorsal.
- **Análisis y puntos clave:** quién lanza y marca más, por dónde penetran, dónde marcan y qué mejorar.
- **Informes PDF** al acabar, por correo o compartidos por WhatsApp.
- **Tu equipo, tu cuenta:** entras con email y contraseña (por invitación), personalizas nombre, escudo, colores y
  plantilla, y cada partido sale de una convocatoria y se guarda en tu cuenta.
- **Sin conexión:** funciona sin cobertura una vez abierta; los partidos se suben solos al volver la conexión.

Pruébala sin cuenta en la **[demo](https://abuenoa.github.io/hbstats/demo/)** (un partido a medias). Para usarla con tu
equipo, ábrela en la tablet en **https://abuenoa.github.io/hbstats/** y usa *Añadir a pantalla de inicio*.
¿Quieres acceso para tu club o tienes una idea? [Abre una propuesta](https://github.com/abuenoa/hbstats/issues/new?template=feature_request.yml).
