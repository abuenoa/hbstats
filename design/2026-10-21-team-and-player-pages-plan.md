# Team Page and Player Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** open a team on a visual team page (season, leaders, squad of faces); tapping a face opens a player card
with poster header, coloured radar, court zone map, goal grid, evolution, per-match rows and the MVP crown; the
coach picks the match MVP on the end-of-match summary.

**Architecture:** everything lives in `src/app.html`.
- **Season data:** a new backend read, `listMatchStates`, kept as a device copy and merged with matches not uploaded
  yet. Pure functions turn match states into per-match and season figures.
- **New home views:** `team` (the dashboard), `team-edit` (today's form and roster table) and `player` (the card).
- **Charts:** hand-made inline SVG on the existing CSS tokens.

**Tech stack:** vanilla JS in one HTML file; tests in `tests/inject.js` run by `python3 tools/run_tests.py`
(headless Chrome); Supabase via the existing backend object.

**Spec:** `design/2026-10-21-team-and-player-pages-design.md`. Mockups are in `design/mockups/`.

## Global Constraints

- One file, `src/app.html`, in vanilla JS. No new dependencies and no chart library.
- Use the existing idioms:
  - `home.view` with `renderHome`, `showHomeView` and `HOME_VIEWS`;
  - `esc` for every user string put into HTML;
  - `discHtml` and the team photos (`setTeamPhotos`, `photoOf`) for faces;
  - the CSS tokens, both themes;
  - `CONFIG` for thresholds; no magic numbers.
- The live match screen must not change, and past matches keep their numbers.
- Home pages may scroll vertically. They lay out in three columns at 1280×800 and two at 1024×640, in light and dark.
- No placeholder figures: a player with no matches shows «Sin partidos todavía».
- Every task adds tests to `tests/inject.js`. The suite must pass with `python3 tools/run_tests.py`. The `libs` test
  may fail offline only.
- Commit after each task with `<type>(<scope>): <subject>` (imperative, ≤ 50 characters), a 72-column body, and the
  trailer `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Run `python3 tools/build_site.py` and commit `docs/` in the last task only.

## Review Focus

1. **Matches with players missing from the roster:** the sample's `p1` ids, players added during a match, and
   retired players. They must be skipped without errors, and must not affect the leaders or the team best.
2. **A team with no finished match**, and a player with no matches. No division by zero; the empty text shows instead
   of charts.
3. **Offline:** with no coverage, the season reads come from the device copy plus the matches not uploaded yet. Pages
   must not throw when `listMatchStates` fails and no copy exists.
4. **Editing a dorsal to one already taken:** it is refused through the existing `dorsalProblem` message, and the
   card is left unchanged.
5. **User strings** (names, rival, venue) are always escaped in the new HTML, including SVG labels.

---

### Task 1: Season data layer

**Files:**
- Modify: `src/app.html`: the backends (`localBackend`, `supabaseBackend`), `playerStats`, and a new "Season" section
  near `withLocalChanges`.
- Test: `tests/inject.js`.

**Interfaces:**
- **Produces:**
  - `backend.listMatchStates(teamId) → Promise<[{ id, date, them, venue, status, scoreUs, scoreThem, state }]>`.
    - Supabase: select `id,played_on,rival,venue,status,score_us,score_them,state` for the team, with the same order
      as `listMatches`.
    - Local backend: from `read().matches`, built with `matchSummary(id, m.state)` plus `state`.
  - `async function loadSeason() → { matches, offline }`.
    - It reads through `cachedRead(\`season:${team.id}\`, …)`.
    - It merges device matches not uploaded yet (dirty, same `teamId`), as `withLocalChanges` does.
    - It keeps matches with `status` `live` or `finished` whose state is not `sample`.
    - It stores the result in `home.season` (an array, newest first). On failure with no device copy it returns an
      empty list and `offline: true`.
  - `playerStats(id, events = state.events)`: the existing function gains an optional events argument. Every existing
    call stays as it is.
  - `function matchResult(m) → 'G' | 'E' | 'P'`, from `scoreUs` and `scoreThem`.
  - `function teamSeason(matches) → { played, won, drawn, lost, form: ['G'|'E'|'P'…], goalsFor, goalsAgainst, shots,
    shotGoals, saves, onTarget, turnovers, recoveries, latest }`.
    - The win/draw/loss counts, `form` (oldest first) and `latest` use **finished** matches only.
    - The other totals use all matches given.
  - `function playerMatchRow(m, player) → null | row`. It returns null when `m.state.players` does not list
    `player.id`.
    - Field player row: `{ id, date, them, scoreUs, scoreThem, result, mvp, goals, shots, assists, turnovers,
      recoveries, blocks, prov7, faults, shotsList }`.
      - `faults`: FALTA + GOLPE + the cards and 2' from `SANCTION`.
      - `shotsList`: the player's `SHOT` events.
    - Goalkeeper row (roster `pos === 'POR'`): `saves`, `onTarget` and `facedList` (the `RIVAL_SHOT` events with this
      `gkId`) instead of the shooting fields; it keeps `assists` and `mvp`.
    - `mvp` is `m.state.mvpId === player.id`.
  - `function playerSeason(matches, player) → { rows, totals, mvps }`.
    - `rows` are the non-null `playerMatchRow` results, newest first.
    - `totals` add up the numeric fields; `mvps` counts the rows with `mvp`.

- [ ] **Step 1: Write the failing tests.**
  - `season: local backend lists match states with their summary`: save two matches through
    `localBackend().saveMatch` for a test team, then `listMatchStates` returns both with `state.events`.
  - `season: only live and finished matches, sample excluded, local changes merged`: build `home.season` through
    `loadSeason()` with a stub backend (`{ listMatchStates: async () => [...] }`) and one dirty local match.
  - `season: team record uses finished matches only`: one finished 28–23 and one live 3–5 give
    `won 1, lost 0, played 1, goalsFor 31`.
  - `season: player rows skip matches without the player and count MVPs`: two states, the player in one of them,
    `mvpId` set; expect `rows.length 1, mvps 1`.
  - `season: goalkeeper row counts saves and on-target rival shots`.
  - `season: no coverage and no copy gives an empty season, offline`.
- [ ] **Step 2: Run them.** `python3 tools/run_tests.py`. Expected: the new tests FAIL (undefined functions).
- [ ] **Step 3: Implement the interfaces above.** Reuse `matchSummary`, `cachedRead`, `localMatches`, `score` and
  `playerStats(id, events)`.
- [ ] **Step 4: Run the suite.** Expected: everything passes except offline `libs`.
- [ ] **Step 5: Commit:** `feat(season): read every match of the team`.

### Task 2: Zones, rates and radar axes

**Files:**
- Modify: `src/app.html`, a new "Season figures" block after Task 1's.
- Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** Task 1 rows, plus the existing `laneOf`, `LANES`, `goalDistance`, `CONFIG.zones.nineFromM`,
  `goalCell`, `inGoalFace`, `groupOf` and `GOAL_GRID`.
- **Produces:**
  - `function shotZone(e) → 'P7' | 'CONTRA' | \`${laneId}:near\` | \`${laneId}:far\``.
    - Our shots: `from === '7M'` gives P7; `zone === 'CONTRA'` gives CONTRA.
    - Rival shots: `zone === '7M'` gives P7; `contra` gives CONTRA.
    - Otherwise the lane is `laneOf(e.origin)`. The ring is near when `goalDistance(e.origin) <
      CONFIG.zones.nineFromM`, else far.
  - `function zoneRates(list, success) → Map<zoneKey, { ok, n }>`.
    - Only shots on target count (result group GOL or PARADA).
    - `success(e)` is true for a goal (field player) or a save (goalkeeper).
  - `function goalRates(list, success) → number[GOAL_GRID][GOAL_GRID] of { ok, n }`. It uses `goalCell` on targets
    inside the goal face.
  - `function fieldRadar(season, best) → [{ key, label, value, text, fraction, group }]`. Keys in order: `pct`,
    `goals`, `assists`, `prov7`, `recoveries`, `blocks`, `security`, `discipline`.
    - Values are per match; `pct` is goals over shots.
    - `fraction` is the value over `best[key]`, clamped to 0–1.
    - `security` and `discipline` are inverted: 1 − the value over the best for turnovers or faults per match. When
      the best is 0, they are 1.
    - `group` is `act-good` for the first four, `act-def` for recoveries and blocks, `act-bad` for security and
      `act-rule` for discipline.
  - `function keeperRadar(season, best) → same shape`. Keys: `pct`, `near`, `far`, `p7`, `contra`, `assists`.
    `group` is `act-def`, except `p7` (`act-rule`), `contra` (`act-bad`) and `assists` (`act-good`).
  - `function teamBest(matches, roster) → { field: {…per key max}, keeper: {…} }`.
    - Only active roster players with at least one row count.
    - Field keys are those of `fieldRadar` (`security` and `discipline` take the highest turnovers and faults per
      match); keeper keys are those of `keeperRadar`.
  - `function rateColour(fraction) → CSS colour`: red `--act-bad` at 0, amber `--dos` at 0.5, green `--act-good` at
    1. Use `color-mix(in srgb, …)` between the tokens so both themes work.
- Add `CONFIG.leaders = { minShots: 3 }`. Task 5 reads it.

- [ ] **Step 1: Write the failing tests.**
  - `zones: lane and ring from the origin, 7 m and counters apart`: an origin at m(-8, 2) is an `EXT_I:near` zone;
    m(0, 10) is a `CEN:far` zone; a `7M` shot is P7; a contra shot is CONTRA.
  - `zones: rates count only shots on target`: GOL, PARADA, FUERA and PALO give `{ ok: 1, n: 2 }` for goals.
  - `radar: fractions against the team best, inverted axes`: a player with 2 turnovers per match against a best of 4
    has `security` 0.5; when the best is 0, security is 1.
  - `radar: keeper axes and groups`.
  - `radar: team best ignores players missing from the roster`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.** Expected: PASS (except offline `libs`).
- [ ] **Step 5: Commit:** `feat(season): zone rates and radar axes`.

### Task 3: MVP of the match

**Files:**
- Modify: `src/app.html`: `restoreState`, `freshMatch` (if it lists defaults), `openFinal` and the final-screen click
  handler.
- Test: `tests/inject.js`.

**Interfaces:**
- **Produces:**
  - `state.mvpId: string | null`. It defaults to null in `restoreState` and in new matches.
  - `function setMvp(id)`. It sets the MVP, or clears it when `id` is already the MVP, then calls `save()` (or
    `commit()`, following what the final screen does for `reportEmail`) and re-renders the final screen. It is not
    undoable and is not an event.
  - `function crownSvg(cls = '') → string`, the crown described in the spec (one inline SVG, with no `id` collisions:
    use `currentColor`-free gradients scoped per call, or a single `<defs>` at the document level).
  - `openFinal` gains a «MVP del partido» row between the KPI tiles and the details.
    - It shows one face button per player in `state.players`, sorted by `byPosition`, using `discHtml` and the name.
    - The buttons carry `data-mvp="<id>"` and `aria-pressed`.
    - The picked one shows `crownSvg('crown-face')`.

- [ ] **Step 1: Write the failing tests.**
  - `mvp: final screen picks, changes and clears the MVP`: click `[data-mvp]` twice on one player, then once on
    another. Assert `state.mvpId` after each click, and that `restoreState` keeps it.
  - `mvp: old saved matches restore with no MVP`: `restoreState` on a state without `mvpId` gives null.
  - `mvp: picking the MVP changes no statistic`: `liveStats()` and `score()` are the same before and after.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, with CSS for `.crown-face` (absolute, about −34°, top-left over the face) and `.mvp-pick`.
- [ ] **Step 4: Run the suite.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(match): pick the MVP on the final summary`.

### Task 4: Chart components

**Files:**
- Modify: `src/app.html`, a new "Season charts" block plus CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** Task 2's `zoneRates`, `goalRates`, the radar arrays and `rateColour`; the existing `courtFloorSvg`,
  `LANES`, `GOAL_FACE` and `GOAL_GRID`.
- **Produces** (each returns an HTML/SVG string):
  - `function radarSvg(axes, centreText, centreLabel)`.
    - Polygon rings; one spoke per axis in `var(--${group})`; a dot per axis in that colour.
    - Each axis gets its value (`text`) and `label` placed outside the polygon, never clipped: give the viewBox
      margin.
    - The centre shows `centreText` and `centreLabel`. All text is escaped.
  - `function zoneMapSvg(list, success, colours)`.
    - It draws the real court through `courtFloorSvg(clipId)`, with a unique clip id per call.
    - The near and far ring zones are lane wedges masked by the 6 m area and the 9 m line, as in the goalkeeper
      mockup. The zone fill is `rateColour(ok/n)` at about 0.55 opacity, or neutral with no shots.
    - Each zone with shots gets its «NN %» and «ok/n» labels.
    - Each origin gets a small faint dot coloured by result through `colours[group]`.
    - Lane names go along the bottom edge.
    - 7 m and counter-attacks are not drawn; the caller shows them as tiles.
  - `function goalRateSvg(list, success)`: the 3×3 goal grid, filled with `rateColour`, and labelled «NN %» and «ok/n».
  - `function evolutionSvg(rows, barKey, pct)`: one bar per match (oldest left) for `barKey`, with a line for
    `pct(row)` in 0–1. Date labels under the bars.

- [ ] **Step 1: Write the failing tests.**
  - `charts: radar labels every axis with its value and colour`: count the axis `<text>` labels and check the
    `var(--act-good)` strokes.
  - `charts: zone map labels only zones with shots and skips 7 m and counters`.
  - `charts: goal grid shows rates for cells with shots`.
  - `charts: user text is escaped in charts`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(season): radar, zone map and goal grid charts`.

### Task 5: Team page and menus

**Files:**
- Modify: `src/app.html`: `homeHeadHtml` (tabs «Equipo · Partidos»), `HOME_VIEWS`, `selectTeam`, the home click
  handler, `teamViewHtml` (renamed to the editor view) and the CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** Tasks 1 to 4.
- **Produces:**
  - Home views:
    - `team`: the new dashboard, `teamPageHtml()`.
    - `team-edit`: today's `teamViewHtml` content, plus a «‹ Equipo» back button.
    - `player`: Task 6.
  - `async function showTeamPage()`. It sets the view to `team`, renders, then awaits `loadSeason()` and renders
    again while the view is still `team`, mirroring `showMatches`.
  - `selectTeam` ends with `await showTeamPage()` instead of `showMatches()`. Resuming a match is unchanged.
  - Tabs: `data-home-view="team"` opens the team page and `"matches"` the match list. «+ Nuevo partido» stays where
    it is in the match list; also add it to the team page header.
  - `home.leaderMetric`, one of `'goals' | 'pct' | 'saves' | 'recoveries' | 'assists' | 'mvps'` (default `goals`),
    switched by chips with `data-leader="<metric>"`.
  - `function leaders(matches, roster, metric) → [{ player, value, detail }]`.
    - Sorted by value, descending, with ties broken by dorsal.
    - `pct` keeps players with at least `CONFIG.leaders.minShots` shots; `saves` keeps goalkeepers only.
    - Only active roster players, and at most 7 rows.
  - Team page layout, as in the team mockup:
    - **Season card:** W–D–L and the form chips; the six KPI tiles, the first highlighted in `--brand`; «Último
      partido» with the MVP face and crown when there is one.
    - **Leaders** card.
    - **Squad** card, grouped by `CONFIG.positions` order with goalkeepers first. Each face button carries
      `data-player="<id>"`.
    - An «Editar equipo» button (`data-home-view="team-edit"`).
    - With no matches: the season card says «Sin partidos todavía» and the leaders card hides its list.

- [ ] **Step 1: Write the failing tests** (async, in the account tests block, with the local backend).
  - `team page: opening a team shows the team page first`: `selectTeam(team)`, then `home.view === 'team'` and
    `.squad [data-player]` count equals the active roster.
  - `team page: leaders switch metric and respect the minimum shots`.
  - `team page: Editar equipo opens the old editor with import and export`.
  - `team page: a team without matches shows the empty text, no NaN`: assert that `$('home').textContent` has no
    `NaN` and no `undefined`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Update any existing test that expected `matches` after `selectTeam`.
- [ ] **Step 4: Run the suite.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(team): open teams on a season dashboard`.

### Task 6: Player card and «Editar ficha»

**Files:**
- Modify: `src/app.html`: the `player` view, the click and change handlers, and `crestFromFile`, generalised for
  photos. Add CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** Tasks 1 to 5, `saveTeamPlayer`, `dorsalProblem`, `posButtons` and `IMAGE_DATA_URL`.
- **Produces:**
  - `home.playerId`, plus `function showPlayer(id)`, which sets the view to `player` and renders. `[data-player]`
    anywhere on the team page calls it. A «‹ <team name>» button goes back to `team`.
  - `function playerPageHtml()`, laid out as in the player and goalkeeper mockups:
    - **Poster header:**
      - the face through a bigger disc variant, ringed in the position colour;
      - `crownSvg('crown-face')` when `mvps > 0`;
      - the dorsal watermark, clipped to the card;
      - the court name in display type; the card name, position label and dorsal under it.
    - **Sentences with big numbers:**
      - field players: «G goles en S lanzamientos», «N partidos jugados», «T pérdidas», «C goles al contraataque»;
      - goalkeepers: «S paradas de O a puerta», «x de y penaltis parados», «G goles encajados», «N partidos jugados».
    - **Highlight tiles:** the first one is coloured: `--brand` for field players and `--parada` for goalkeepers. It
      adds «el mejor del equipo» when the player leads that metric. Below them, the MVP tile with the upright crown
      and «N · MVP del partido · N de M partidos» when `mvps > 0`.
    - **Radar:**
      - field players: `fieldRadar` with the centre showing the shooting %;
      - goalkeepers: `keeperRadar` with the centre showing the save %.
    - **Zone map:** `zoneMapSvg` over the season's `shotsList` or `facedList`, plus two tiles for 7 m and the counter
      coloured with `rateColour`.
    - **Goal grid** (`goalRateSvg`) and **evolution** (`evolutionSvg`).
    - **Per-match table:**
      - field players: Fecha, Rival, Res., Goles, %, Pases, Pérd.;
      - goalkeepers: Fecha, Rival, Res., Paradas, %, 7 m, Goles.
      - Each MVP row gets class `mvp-row`, with the tilted crown on its top-left corner.
    - **No matches:** only the header and «Sin partidos todavía».
  - **«Editar ficha»** (`data-player-edit`) toggles an inline panel:
    - inputs for the court name, dorsal and card name;
    - position buttons through `posButtons`;
    - «Subir foto» through a hidden file input, `photoFromFile(file)`, and «Quitar foto»;
    - «Guardar» saves through `saveTeamPlayer(player, changes)`;
    - errors (a taken dorsal, an empty name) show through `homeStatus`, and the card stays open;
    - after a save, `setTeamPhotos(home.roster)` refreshes the faces.
  - **`imageFromFile(file, sizePx, type)`**, generalised from `crestFromFile`, which keeps its behaviour by calling
    it. The new `photoFromFile` calls it with `CONFIG.photoSizePx` (128) and `'image/jpeg'`. The result must be under
    `MAX_PHOTO_LENGTH`.

- [ ] **Step 1: Write the failing tests.**
  - `player card: tapping a face opens the card with sentences and radar`.
  - `player card: goalkeeper card uses keeper sentences and radar`.
  - `player card: MVP crown and tile appear only with an MVP`.
  - `player card: no matches shows the empty text`.
  - `player card: edit saves court name, card name and position`.
  - `player card: a taken dorsal is refused and nothing changes`.
  - `player card: photo upload becomes a small square jpeg`: use an `OffscreenCanvas` or a canvas blob built in the
    test, like the crest test does.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the suite.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(players): season card with radar and zones`.

### Task 7: Layout pass, docs and screenshots

**Files:**
- Modify: the CSS in `src/app.html`; `docs/` (generated).
- Test: `tests/inject.js` (layout checks).

- [ ] **Step 1: Write the failing tests.**
  - `layout: team page and player card have no horizontal overflow at the test viewport`:
    `document.documentElement.scrollWidth <= innerWidth` with the team page, then with the player card open.
  - `layout: radar labels stay inside their card`: every `.radar text` bounding box is inside the card's box.
- [ ] **Step 2: Run them.** They fail if anything overflows; otherwise they pin the layout, which is fine.
- [ ] **Step 3: Make the CSS match the mockups.**
  - Three columns at ≥ 1200 px wide and two below that (1024×640).
  - Light and dark themes through the tokens.
  - Then take screenshots through a scratch scene (sample state plus `setTeamPhotos`) at 1280×800 and 1024×640, in
    both themes, and fix what looks wrong.
- [ ] **Step 4: Run the suite, build the site and check that it is in sync.** Run `python3 tools/run_tests.py`, then
  `python3 tools/build_site.py`, then `git status` (`docs/` changed).
- [ ] **Step 5: Commit:** `style(team): lay out the team and player pages`, including `docs/`.
