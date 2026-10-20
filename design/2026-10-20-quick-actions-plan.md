# Quick actions panel, shot zones and penalties: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the operator log fast play action-first, classify shots as 6 m / 9 m / +11 m, and record 7 m only
through a penalty flow.

**Architecture:** Everything lives in the single-file app `src/app.html` (vanilla JS IIFE, event-sourced `state`,
undoable `record(op)`). The new pieces follow the existing idioms:

- UI-only state in `ui`.
- Events through `addEvent` and `record`.
- Lineup changes travel inside the history op, so undo reverts them.
- Rendering through the `render*` functions called by `renderAll`.

**Tech Stack:** vanilla JS + SVG; in-page test suite `tests/inject.js` run by `tools/run_tests.py` in headless Chrome.

**Spec:** `design/2026-10-20-quick-actions-design.md`

## Global Constraints

- Keep the SVG coordinate system: `UNITS_PER_M = 50`, `GOAL_LINE_Y = 260`, `GOAL_FACE = {x:320,y:20,w:360,h:240}`.
- Court depth: 11.8 m, so `COURT.maxY = GOAL_LINE_Y + 11.8 * UNITS_PER_M = 850`.
- Zones:
  - 6M below 8.7 m.
  - 9M from 8.7 m up to (not including) 11 m.
  - 11M from 11 m. The label is «+11 m».
  - Distance is measured as in today's `zoneFrom`: from the goal-line segment between the posts.
  - 7M only comes from the penalty flow.
- The stored `zone`/`from` of past events never change, including old `7M`.
- One screen, no scrolling, at 1280×800 and 1024×640.
- UI copy in Spanish. Code, comments and commits in English. No new dependencies.
- The `libs` test needs the CDN. It fails without internet; that failure is not a regression.

## Review Focus

1. An undo right after an armed action on a bench player must remove the event **and** take the player back off.
   (Task 3 test «undo reverts the automatic substitution».)
2. A pending penalty survives an automatic phase change and only ends on shot, ✕, undo/delete of its event, or a
   manual phase toggle. (Task 4 tests.)
3. A disqualified player or one serving a 2' must never glow nor be pickable from the panel.
   (Task 5 test «players out of play do not glow».)
4. Armed action vs armed shooter (`ui.shooter`) must not both be active. (Task 5 test «arming an action clears the
   armed shooter and vice versa».)
5. Old matches with `7M` shots still render and count 7 m in the sheet, live panel and PDF tables.
   (Task 1 test «old 7M events still count».)

---

### Task 1: Zones 6/9/+11, longer court, stats know 11M

**Files:**
- Modify: `src/app.html`:
  - constants near `:781–795`
  - `zoneFrom` `:856–862`
  - `CONFIG.targets` `:754`
  - `courtFloorSvg` `:1563–1573`
  - `<svg id="court" viewBox>` `:643`
  - shot-map SVG `:2499`
  - lane analysis `:2313–2326`
  - PDF court `:2996–3030`
- Test: `tests/inject.js`

**Interfaces:**
- Produces:
  - `zoneFrom(pt) -> '6M' | '9M' | '11M'`
  - `ZONES['11M'] = '+11 m'`
  - `SHEET_ZONES = ['6M', '9M', '11M', 'CONTRA', '7M']`
  - `CONFIG.zones = { nineFromM: 8.7, elevenFromM: 11 }`
  - `COURT_DEPTH_M = 11.8`
  - `COURT_VIEW_H` (SVG height = `COURT.maxY + 30`), used by every court SVG/PDF in place of the literal `810`.

- [ ] **Step 1: Write the failing tests**
  - `T('zones by distance: 6 m, 9 m on the dashed line, +11 m', …)`:
    - `zoneFrom(m(0, 7)) === '6M'` (penalty mark is 6M now)
    - `zoneFrom(m(0, 8.6)) === '6M'`
    - `zoneFrom(m(0, 8.8)) === '9M'`
    - `zoneFrom(m(0, 10.9)) === '9M'`
    - `zoneFrom(m(0, 11.2)) === '11M'`
    - `zoneFrom(m(-6, 8)) === '9M'` (distance from the post segment: hypot(4.5, 8) ≈ 9.2)
  - `T('court reaches 11.8 m and draws the +11 m line', …)`:
    - `COURT.maxY === 850`
    - `$('court').viewBox.baseVal.height === COURT_VIEW_H`
    - `$('court-floor').textContent.includes('+11 m')`
  - `T('11M shots count in zone tables', …)`:
    - `addEvent('SHOT', {playerId:'p8', origin:m(0,11.5), target:{x:500,y:120}, from:'11M', zone:'11M', result:'GOL'})`
    - `liveStats().us.zones.some(z => z.id === '11M' && z.att >= 1)`
    - the player row from the sheet stats includes the 11M cell
    - `undo()`
  - `T('old 7M events still count', …)`:
    - add a `SHOT` with `zone:'7M', from:'7M'`
    - the 7M zone of `liveStats().us` has `att >= 1`
    - `undo()`

- [ ] **Step 2: Run** `python3 tools/run_tests.py 2>/dev/null | grep -v '^\['`. Expected: the 4 new tests FAIL.

- [ ] **Step 3: Implement.**
  - `zoneFrom` drops the `SEVEN_M` branch. Keep `SEVEN_M` for the penalty spot in Task 4.
  - Add 11M everywhere a zone list is enumerated: `ZONES`, `SHEET_ZONES`, `CONFIG.targets['11M'] = [45, 35]`, sheet
    headers, PDF zone heads, `SHOT_ZONE_HEAD`.
  - In the lane analysis, "far" = `9M` or `11M`.
  - The 11 m line in `courtFloorSvg`: dotted path `M -125 260 A 550 550 0 0 0 425 810 L 575 810 A 550 550 0 0 0 1125 260`
    in a fainter stroke, with a label `+11 m` at about `(600, 835)`. Grow floor rects and clip to `COURT_VIEW_H - 260`.

- [ ] **Step 4: Run tests.** Expected: all pass except `libs`.

- [ ] **Step 5: Commit** `feat(court): classify shots as 6, 9 or +11 metres`

### Task 2: Clock steps ±1/5/10/30

**Files:** Modify `src/app.html` `CONFIG.clockSteps` `:731` and the clock pop grid `:1863`. Test `tests/inject.js`.

**Interfaces:** Produces `CONFIG.clockSteps = [-30, -10, -5, -1, 1, 5, 10, 30]`, rendered as two `.act-grid.four`
rows (negative row, then positive row).

- [ ] **Step 1: Failing test.** `T('clock pop offers ±1, 5, 10 and 30 s that add up', …)`:
  - `openClockPop({x:100,y:100})`
  - 8 `[data-adjust]` buttons, labels `−30s … +30s`
  - with the clock paused at `elapsedMs = 60000`, click `+30`, `+5` and `+1`; then `elapsedMs === 96000`
    (for clock-up)
  - `closePop()` and restore
- [ ] **Step 2: Run.** Expected: FAIL (4 buttons).
- [ ] **Step 3: Implement.** Split `clockSteps` into `s < 0` and `s > 0` rows.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(clock): add 5 and 30 second clock steps`

### Task 3: Undoable automatic substitution

**Files:** Modify `src/app.html`: `applyOp`/`revertOp` `:1188–1199`, `addEvent` `:1212–1219`, new helper next to
the bench drag code `:2138–2171`. Test `tests/inject.js`.

**Interfaces:**
- Produces:
  - `benchSwapFor(playerId) -> { phase, inId, outId, spot } | null`. Brings a bench field player onto the
    **current phase** lineup:
    - It replaces the court player of the same `pos`; if several share it, the one with the largest `y` (furthest
      from goal).
    - It returns `null` if the player is already on court, is a goalkeeper, or no court player has that position.
  - `addEvent(kind, data, opts)` where `opts.bringOn = playerId`. The op gets
    `op.lineup = { phase, inId, outId, spot }`:
    - `applyOp` moves `inId` onto `spot` and removes `outId`.
    - `revertOp` does the opposite.
    - If `benchSwapFor` returns `null` for a bench player, `hint('Arrástralo a la pista si ha entrado')`.

- [ ] **Step 1: Failing tests.**
  - `T('an action by a bench player brings them on for the same position', …)`:
    - in `ATK`, pick a bench LAT
    - `addEvent('ACTION', {playerId, action:'ASIST'}, {bringOn: playerId})`
    - `lineup()[playerId]` exists, and the former LAT is not in `lineup()`
  - `T('undo reverts the automatic substitution', …)`:
    - same set-up, then `undo()`
    - the event is gone, the bench player is off, and the former player is back at the same spot
    - `redo()` re-applies both
  - `T('no court player of that position: event kept, lineup untouched', …)`:
    - empty the PIVs from the lineup, then act with a bench PIV
    - the event is recorded, the lineup keys are unchanged, and `$('hint').textContent` includes `Arrástralo`
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** as in Interfaces. A `ui.shooter` that is swapped out is cleared, as in `endBenchDrag`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(lineup): bring bench players on when they act`

### Task 4: Penalty flow

**Files:** Modify `src/app.html`:
- `ui` `:912`
- pop click handler for `data-action` `:1937`
- `endCourtDrag` `:2077–2111`
- `openShotPop`/`shotPopHtml` `:1795–1834`
- `renderArmed` `:1658`
- court floor (glow on the mark)
- `setPhase` (manual toggle path in the `.phase` click handler `:2205`)
- `undo`/`deleteEvent`

Test `tests/inject.js`.

**Interfaces:**
- Consumes: `addEvent(..., {bringOn})` from Task 3.
- Produces:
  - `ui.penalty = { team: 'us' | 'them', eventId, byId } | null`
  - `PENALTY_SPOT = m(0, SEVEN_M.dy)`
  - `startPenalty(team, eventId, byId)`
  - `cancelPenalty()`
  - `penaltyShooterId() -> playerId`: the last available player whose `SHOT.from === '7M'`, else `ui.penalty.byId`.
  - Recording `ACTION` `PROV7` (team `us`) or `PEN7C` (team `them`) by any path calls `startPenalty`.

- [ ] **Step 1: Failing tests.**
  - `T('provoked 7 m: next shot starts on the mark as 7M', …)`:
    - `ATK`; record `PROV7` for p8 through the popup click path
    - `ui.penalty.team === 'us'`
    - simulate a drawn shot from `m(-5, 9)`: call the same function `endCourtDrag` uses (extract it as
      `shotFromDrag(origin, target, anchor)`), then pick result GOL
    - the last event is `SHOT` with `origin` equal to `PENALTY_SPOT`, `from === '7M'` and `zone === '7M'`
    - `ui.penalty === null`
  - `T('penalty shooter defaults to the last 7 m taker, else the provoker', …)`
  - `T('committed 7 m: next rival shot is a 7M rival shot', …)`
  - `T('pending penalty survives auto phase change, ends on manual toggle, undo or ✕', …)`:
    - start a penalty
    - `addEvent('TURNOVER', …)` (auto phase change): still pending
    - click `.phase [data-phase]`: null
    - again, then `undo()` of the PROV7: null
    - again, then `[data-unarm]` click: null
  - `T('no Contraataque on a penalty shot', …)`: the shot popup has no `[data-contra]`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - While pending, any shot start (empty court or token drag) uses `PENALTY_SPOT` as origin and zone `7M`.
  - Our penalty presets `playerId: penaltyShooterId()` with `pick: true`.
  - The armed bar shows `Penalti a favor` or `Penalti en contra` · `Dibuja el tiro` plus ✕ (`data-unarm`). ✕ clears
    the penalty first.
  - The mark glows gold (class on a `#penalty-spot` element in the floor).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(shots): record 7 m only through a penalty flow`

### Task 5: Shooter preselected by zone

**Files:** Modify `src/app.html`: `lastShooterId` usage in `endCourtDrag` `:2107`. Add `CONFIG.shooterZones`. Test
`tests/inject.js`.

**Interfaces:**
- Produces:
  - `CONFIG.shooterZones = { wingDxM: 6, wingDyM: 5, pivotM: 7.5, pivotDxM: 4, centreDxM: 2.8 }`
  - `expectedPosition(pt) -> 'EXT' | 'LAT' | 'CEN' | 'PIV'`. Use the spec's thresholds, with `dx` from the goal
    centre, `dy` from the goal line, and `d` the zone distance.
  - `zoneShooterId(origin) -> playerId | null`: the nearest player of the expected position available in the ATK
    lineup, else the nearest available field player.

- [ ] **Step 1: Failing tests.**
  - `T('expected position from where the shot starts', …)`:
    - `m(-8, 2)` → EXT
    - `m(1, 6.5)` → PIV
    - `m(0.5, 9.5)` → CEN
    - `m(-4, 9)` → LAT
  - `T('drawn attack shot preselects the court player of that zone', …)`:
    - an ATK lineup with a known EXT at the left wing
    - a shot from `m(-8, 2)` opens the picker with that EXT `aria-pressed="true"`
  - `T('a player off court (2 min) is never preselected', …)`
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Replace `lastShooterId()` with `zoneShooterId(d.origin)` for drawn shots. Picking a
  bench shooter commits with `{ bringOn }` (Task 3).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(shots): preselect the shooter by court zone`

### Task 6: Actions panel with arming

**Files:** Modify `src/app.html`:
- right `<aside>` `:671–686`: add `<div class="seg" id="panel-mode">` (Acciones / KPIs) and `<div id="acts">`; wrap
  today's team-seg, lines and `#live` in `<div id="kpis">`
- CSS near `.armed-bar`
- `renderAll`
- `tokenMarkup`/`renderBench`/`renderGk` for the glow class
- bench and token tap handlers
- `setPhase`

Test `tests/inject.js`.

**Interfaces:**
- Consumes: `addEvent(…, {bringOn})` (Task 3) and `startPenalty` (Task 4, through recording PROV7/PEN7C).
- Produces:
  - `PANEL_ACTIONS = { ATK: ['ASIST', 'PROV7', 'TURNOVER'], DEF: ['RECUP', 'BLOC', 'PEN7C', 'DEFFAULT'] }`
    - `TURNOVER` sub = the `CONFIG.turnoverGroups` types.
    - `DEFFAULT` sub = the `CONFIG.defFaultGroups` actions except `PEN7C`.
  - `ui.panelMode = 'acts' | 'kpis'` (default `'acts'`)
  - `ui.armedAction = { key, sub: string | null } | null`, `ui.armTimer`
  - `CONFIG.armMs = 4000` (doubled while a sub-type is pending)
  - `armAction(key)` (toggles), `chooseArmedSub(sub)`, `disarmAction()`, `canReceive(playerId) -> boolean`,
    `applyArmedAction(playerId)`
  - The glow is CSS class `target` on `.tok`, `.bench-player` and `#gk-card`.

- [ ] **Step 1: Failing tests.**
  - `T('panel shows only the current phase actions', …)`:
    - in ATK, `#acts [data-panel-act]` keys are exactly `ASIST, PROV7, TURNOVER`
    - in DEF, `RECUP, BLOC, PEN7C, DEFFAULT`
    - no sanction buttons
  - `T('arm then tap: recovery by a bench player is logged and they come on', …)`:
    - DEF; click `[data-panel-act="RECUP"]`
    - every available field player has `.target`
    - click a bench `.bench-player`
    - the last event is `ACTION RECUP` for them, the phase is now ATK (Auto), and the player is in
      `state.lineups.DEF` (the phase in which they acted)
  - `T('typed actions ask the type first', …)`:
    - ATK; arm `TURNOVER`; type chips render; nobody has `.target` yet
    - choose `Pase`, then tap a token
    - the last event is `TURNOVER` with `subtype: 'Pase'`
  - `T('goalkeeper glows only for Asistencia', …)`:
    - arm `ASIST`: `#gk-card` and the gk token have `.target`
    - arm `RECUP` (DEF): they do not
    - tapping the gk with RECUP armed records nothing
  - `T('players out of play do not glow', …)`: a player serving 2' and a disqualified one have no `.target`.
  - `T('armed action calms down after CONFIG.armMs', …)`: call `disarmAction()` (as the timer would), then
    `ui.armedAction === null` and no `.target`.
  - `T('arming an action clears the armed shooter and vice versa', …)`
  - `T('KPIs mode shows today\'s live panel', …)`: click KPIs; `#kpis` visible, `#acts` hidden, `#live .kpi` present.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - A tap on a token or bench player while armed calls `applyArmedAction` instead of opening the popup or starting a
    drag/move. Use the existing `!d.moved` tap paths in `endCourtDrag`/`endBenchDrag`.
  - Recording uses `addEvent('ACTION' | 'TURNOVER', …, { bringOn })`.
  - `setPhase` and a phase change from Auto call `disarmAction()`.
  - Buttons reuse the colour classes `c-defensa`, `c-ataque`, `c-error`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(panel): log actions first, then the player`

### Task 7: Fit check and release build

**Files:** `docs/` (generated), screenshot script in the scratchpad.

- [ ] **Step 1: Build.** Run `python3 tools/build_site.py`. Expected: no error.
- [ ] **Step 2: Screenshots.** Capture the sample match at 1280×800 and at 1024×640, in ATK with an armed action and in
  DEF with a pending penalty. Check by eye: no scrollbars, the panel buttons fit, the +11 m label is visible, and the
  goal is not cut off.
- [ ] **Step 3: Full test run.** Expected: all pass except `libs` (CDN).
- [ ] **Step 4: Commit** `chore(site): rebuild docs` and include the Finalizar change already in the working tree.
  Push only when the user asks.
