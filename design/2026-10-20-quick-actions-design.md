# Quick actions panel, shot zones and penalties — design

Date: 2026-10-20 · Status: agreed with the coach (clickable prototype «B» validated).

## Why

In the first real match (Triana 28-23 CBMLEPE) the operator could not keep up. A recovery, a fast break, a saved
shot and a provoked 7 m happened within about 10 seconds, and the players involved had only just come on. Today each
action needs four steps: move the player onto the court, find the dorsal, open the player popup, then pick the action.
The coach thinks **action first, player second**, and recognises players more easily by sight than by dorsal. Photos
come in a later project; this design must not block them.

Two classification problems showed up in that match:

- **7 m:** any shot that starts within 1 m of the penalty mark is stored as a penalty (`zoneFrom`). Penetrations through
  the centre were counted as 7 m.
- **9 m:** the court only reaches 10.4 m (`COURT.maxY = 780`), so the 9 m band is a thin strip at the bottom. Not a
  single shot in the match was classified as 9 m.

## Goals

1. **Actions panel** in the right-hand panel. A segmented control at the top switches between **Acciones** and
   **KPIs**.
   - **KPIs** is today's content: the team selector, the line toggles and `#live`.
   - **Acciones** shows the goalkeeper card plus only the actions of the current phase:
     - **Attack (ATK):** Asistencia, Provoca 7 m, Pérdida › (then the turnover type).
     - **Defence (DEF):** Recupera, Bloca, 7 m cometido, Falta def. › (then the defensive fault types in
       `CONFIG.defFaultGroups` other than `PEN7C`).
   - Sanctions are **not** in the panel; they stay on the top bar (our 2' and the rival 2' buttons), as today.
   - **Goalkeeper (coach's decision):** of the panel actions, the goalkeeper can only receive **Asistencia**. When it
     is armed, the goalkeeper token and the goalkeeper card glow too. For every other action the goalkeeper does not
     glow and ignores taps. Sanctions keep including the goalkeeper through the top-bar 2' picker, as today. Assists by
     the goalkeeper count in their stats, in the sheet and in the PDF, like any player's.
2. **Arming.**
   - Tapping an action arms it. Actions with a type first show their type chips inside the panel, and the action arms
     once a type is chosen.
   - While armed, every player who can receive the action glows gold, both the court tokens and the bench buttons.
   - Tapping one records the event; the player can be on court or on the bench.
   - Tapping the same action again, changing phase, or waiting `CONFIG.armMs` (4 s; doubled while choosing a type)
     disarms it.
3. **Bench players come on automatically.** If the chosen player (for an armed action, or as a shooter) is on the
   bench, they enter the **current phase's** lineup in place of the court player of the same position.
   - If several court players share that position, the one nearest the goal-centre line is replaced (builder's call:
     any deterministic rule is fine).
   - If nobody on court has that position, the event is still recorded, the lineup is left unchanged, and a hint says
     «Arrástralo a la pista si ha entrado».
   - Goalkeepers are excluded: the goalkeeper keeps today's `gkId` handling.
   - *Builder's call (settled at review):* the automatic substitution is part of the same undoable operation as the
     event, so «↶» removes the event **and** puts the lineup back. This means lineup snapshots go into the history op.
4. **Phase follows play.** This is unchanged: `phaseAfter` with «Auto». The panel re-renders for the new phase.
5. **Shot zones by distance from the goal:**
   - **6M:** inside the dashed 9 m line, including the 6 m area and the penalty-mark area.
   - **9M:** on or beyond the dashed line, up to 11 m. "On the line" counts: use 8.7 m, the same tolerance as the
     prototype. All distances are measured like `zoneFrom` today, from the goal-line segment between the posts.
   - **11M:** beyond 11 m, labelled «+11 m».
   - **7M:** only through the penalty flow (goal 6). Never inferred from where the shot starts.
6. **Penalty flow.**
   - Recording «Provoca 7 m» (ATK) or «7 m cometido» (DEF) from the panel or the player popup leaves a **pending
     penalty**. The penalty mark glows gold and the armed bar shows «Penalti a favor / en contra · dibuja el tiro ✕».
   - The next drawn shot starts at the penalty mark, whatever point the finger starts from, and gets zone `7M` with no
     «Contraataque» option. ✕ cancels the pending penalty.
   - Our penalty: the shooter defaults to the last player who took a 7 m and is still available, otherwise to the
     player who provoked it.
   - Rival penalty: the shot is a `RIVAL_SHOT` with zone `7M`.
   - The pending state is UI-only (`ui`), not saved.
   - *Builder's call (settled at review):*
     - A pending penalty has **no timeout**, since setting up a 7 m can take 20 s or more.
     - It ends when the penalty shot is recorded, on ✕, when the PROV7/PEN7C event is undone or deleted, or on a
       **manual** phase toggle. An automatic phase change does not end it, and neither does arming another action.
     - While it is pending, a shot started by dragging from a player token also starts at the penalty mark.
     - The penalty rule wins over goal 7's zone default. A bench taker comes on through goal 3.
7. **Shooter preselected by zone** for a shot we draw in attack, replacing «last shooter».
   - From the start point, work out the expected position. *Thresholds copied from the prototype:* `dx` is the
     horizontal offset from the goal centre in metres, `dy` the depth from the goal line, and `d` the `zoneFrom`
     distance, measured from the goal-line segment between the posts.
     - |dx| > 6 m and dy < 5 m → **EXT**
     - d < 7.5 m and |dx| < 4 m → **PIV**
     - |dx| < 2.8 m → **CEN**
     - otherwise → **LAT**
   - Pick the nearest ATK-lineup player of that position, falling back to the nearest field player.
   - The picker still lets them change it.
8. **Longer court: 11.8 m.**
   - Set `COURT.maxY` to `GOAL_LINE_Y + 11.8 m`.
   - Grow the court SVG's `viewBox` height and the floor drawing (`courtFloorSvg`, the sheet's shot-map SVG, the PDF
     court) to match.
   - Draw a faint dotted 11 m line labelled «+11 m».
   - **Keep the coordinate system** (50 units/m, goal line y = 260, `GOAL_FACE`) so stored origins and targets of past
     matches stay valid. The goal face keeps its size in SVG units. The whole court scales slightly on screen; that is
     accepted.
9. **Stats understand `11M`.**
   - Add it to `ZONES` («+11 m»), `SHEET_ZONES` and `CONFIG.targets`, the last using the same reference as 9M.
   - It also goes in the per-player zone tables, the live «Por zona» bars and the PDFs.
   - In the lane analysis, 11M counts as "far", together with 9M.

10. **Faster clock correction** (requested at approval). The clock stops often and the operator falls behind.
    - In the clock popup, `CONFIG.clockSteps` becomes `[-30, -10, -5, -1, 1, 5, 10, 30]`, shown as two rows of big
      buttons (minus row, plus row). Steps add up, so three taps cover any offset up to a minute.
    - The exact mm:ss input stays.

## Non-goals (later projects, in this order)

- Player photos on the tokens, rival roster editing during the match, more than 16 rivals with season history.
- A new visual «Hoja», half-time KPI screen, coach feedback (+/-, transitions, turnover zones), the server e-mail.
- Season tracking, ratings, MVP, WhatsApp cards.

## Anti-goals

- No extra taps compared with today for anything that already works: drawing a shot, the player popup, dragging subs.
  The player popup stays as a second path.
- No layout change that breaks the one-screen rule (1280×800 and 1024×640, no scrolling).
- Past matches must not change their numbers: stored `zone`/`from` values are kept as they are, including old `7M`.

## Constraints

- Single file `src/app.html`, vanilla JS, existing idioms (`CONFIG`, `ui`, `addEvent`, `record`, `openPop`, `hint`,
  `aria-pressed` toggles, `.press` buttons, colour classes such as `c-defensa`, `c-error`, `t-*`).
- Tests go in `tests/inject.js`, run with `tools/run_tests.py`. Release with `tools/build_site.py`, then commit `src`
  and `docs`.
- Any new event fields must survive `restoreState` and sync. No database change is needed.

## Left to the builder

- Exact styling of the glow, the panel buttons and the penalty-mark highlight, within the existing look.
- Where in `ui` the armed action and the pending penalty live, and how arming interacts with the existing «armed
  shooter» bar (`ui.shooter`). They must not both be active at once.
- Default mode of the right panel: **Acciones**.
