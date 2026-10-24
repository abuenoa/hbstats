# Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** one navigation model across the app.
- Every page leaves from its top-left, with one control: «‹ Parent», or «Cancelar» for edit tasks.
- Every page has its one primary action at the top-right.
- The half-time and final cards leave from the left of their footer.
- The Android back gesture and Escape do what the visible leading control does.
- The live match screen does not change.

**Spec:** `design/2026-10-24-navigation-design.md`.
- § 3 is the model and § 4 the hierarchy.
- § 5 gives the exact labels per screen.
- § 7 lists the acceptance checks the tests below implement.

**Tech stack:** vanilla JS in `src/app.html`. In-page tests are in `tests/inject.js`, run by
`python3 tools/run_tests.py`. Layouts are checked with `python3 tools/build_site.py && python3 tools/screenshots.py
--matrix --out "$TMPDIR/nav" <scenes>`.

## Global Constraints

- One file, `src/app.html`. No new dependencies.
- Reuse the existing idioms:
  - `home.view` / `renderHome` / `showHomeView` / `HOME_VIEWS` / `PROFILE_VIEWS`;
  - `esc` for every user string;
  - `armedButton` / `confirmTap` for anything that discards;
  - the CSS tokens (`--target`, `--space-*`, `--radius-*`), both themes;
  - named constants for every label used in more than one place (`NAV_LABELS` below).
- **The live screen must not change:** `.strip`, `#btn-home` («‹ Partidos», class `back`), the popups and their
  tests. Do not touch the CSS rules `.btn.back` and `.back` (they style the live strip and the popup «‹ Pérdida»).
  The new style is `.btn.back-nav`.
- Every task adds the tests named in it and updates the existing tests it breaks. Change only their selectors or
  labels, never their intent. `python3 tools/run_tests.py` must pass; the `libs` test may fail offline only.
- After each task, run the matrix on the scenes listed in the task. The probe must pass at 1280×800 and 1024×640 in
  light and dark. Look at the images.
- Commit after each task: `<type>(<scope>): <subject>` (imperative, ≤ 50 characters), a 72-column body, and the
  trailer `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. Run `python3 tools/build_site.py`
  and commit `docs/` in the last task only.

## Shared pieces (built in Task 1, reused by Tasks 2–3)

- `const NAV_LABELS = { teams: 'Mis equipos', team: 'Equipo', matches: 'Partidos', liveMatch: 'Volver al partido',
  halftime: 'Descanso', final: 'Final', cancel: 'Cancelar' };`
- `backButtonHtml(label, attrs)`: returns
  `<button class="btn back-nav press" type="button" data-nav-leading ${attrs}>‹ ${esc(label)}</button>`.
- `cancelButtonHtml(attrs, armId)`:
  - with `armId`: `armedButton(armId, NAV_LABELS.cancel, \`data-nav-leading ${attrs}\`)`;
  - without: a plain `.btn` with `data-nav-leading`.
- `pageBarHtml({ leading = '', title = '', actions = '' })`: returns
  `<div class="page-bar">${leading}${title ? \`<h2 class="page-title">${esc(title)}</h2>\` : ''}<div class="page-actions">${actions}</div></div>`.
  `actions` is HTML whose last button is the primary, if there is one.
- CSS for the page bar:
  - `.page-bar`: flex, `align-items: center`, `gap: var(--space-3)`, `min-height: var(--target)`;
  - `.page-title`: `flex: 1 1 auto`, `min-width: 0`, ellipsis, `font: var(--type-title)`;
  - `.page-actions`: `margin-left: auto`, flex, `gap: var(--space-2)`, `flex-wrap: nowrap`;
  - `.btn.back-nav`: outline (`--surface` background, `--line` border, `--fg` text), `flex: none`, never filled.
- CSS for the `#home` top bar:
  - `.top-bar`: `position: sticky; top: 0; z-index: 2`, glass background as `.home-head` today;
  - it holds `.app-bar` (row 1, today's `.home-head` content without the back and the primary) and `.page-bar`
    (row 2);
  - the whole `.top-bar` is at most 128 px tall at 1024×640.

---

### Task 1: The management top bar (back buttons and primary actions)

**Files:** `src/app.html` (CSS near `.home-head` at about line 798; JS `homeHeadHtml`, `profileHeadHtml`,
`renderHome`, `HOME_VIEWS` renderers), `tests/inject.js`, `tools/screenshots.py` (`MATRIX_SCENES`).

- [ ] Add `NAV_LABELS`, `backButtonHtml`, `cancelButtonHtml`, `pageBarHtml` and the CSS above.
- [ ] Split `homeHeadHtml()` into an app bar: crest, team name and club, and the `.tabs` segmented control.
  - Remove «‹ Perfil» and the `team`-only «+ Nuevo partido» from it.
  - Keep the tab `aria-pressed` rule as it is.
  - Keep the tabs' `data-home-view`: the armed leave of `rating-tune` through a tab (tests at about line 2126) must
    keep working.
- [ ] Add `const HOME_BARS = { view: () => ({ leading, title, actions }) }` for every `HOME_VIEWS` key except
  `squad` and `rating-tune` (Task 2):
  - `team`, `matches`, `stats`: leading `backButtonHtml(NAV_LABELS.teams, 'data-home-view="profile"')`, no title.
    - `team` actions: `<button class="btn go press" data-new-match>+ Nuevo partido</button>`.
    - `matches` actions: «Ver partido de ejemplo» (`data-sample`), then «+ Nuevo partido».
  - `player`: leading «‹ Equipo» (`data-home-view="team"`), title `player.name`, actions «Editar ficha» (the
    existing `data-player-edit` toggle).
  - `player-match`: leading `backButtonHtml(player.name, 'data-player-back')`, title `${player.name} · ${match.them}`,
    actions «Abrir el partido» (existing `data-player-match-open`, primary).
  - `team-edit`: leading «‹ Equipo», title «Editar equipo».
  - `attendance`: leading «‹ Equipo», title «Asistencia».
  - The bar functions must handle the views' «Cargando…» and «gone» cases (`player` / `player-match` when the player
    or match is missing): fall back to a bar with only the leading control.
- [ ] `renderHome`: for team views, render
  `<header class="top-bar glass">${appBar}${pageBarHtml(HOME_BARS[v]())}</header><main class="home-body">…`. For the
  profile, keep `profileHeadHtml()` (no page bar).
- [ ] Delete the old rows:
  - `.player-bar` in `playerPageHtml` and `playerMatchHtml` (their buttons move to the bar);
  - the «‹ Equipo» row in `teamEditHtml`;
  - the top `row-actions` in `matchesHtml`;
  - the `.player-bar` CSS if it is no longer used.
  - Keep the empty-state note that names «Nuevo partido».
- [ ] Escape on `#home`: in the existing `document` keydown handler, add a branch for when `#home` is visible and
  no popup is open: `document.querySelector('#home [data-nav-leading]')?.click()`.
- [ ] Update the existing tests:
  - about line 2552: `.player-bar [data-home-view="team"]` with `‹ ${team.name}` → `.page-bar [data-nav-leading]`
    with «‹ Equipo»;
  - about line 2696: the same selector;
  - about line 2829: «‹ Ficha» → `‹ ${player.name}`;
  - about line 3486: `.home-head .btn.go` → `.top-bar .btn.go`.
- [ ] New tests (`TA`, each restores `home` as the neighbouring tests do):
  - `nav: every management view has one leading control`: spec check 1, for the views of this task.
  - `nav: profile has no leading control`: spec check 2.
  - `nav: back labels name the parent`: spec check 3 (click each and assert `home.view`).
  - `nav: one primary per page bar and none in the app bar`: spec check 5.
  - `nav: sub-views have a title`: spec check 6 for `player`, `player-match`, `team-edit` and `attendance`.
  - `nav: page bar stays in view on a long page`: spec check 7 (`player` with the season seeded, scrolled to the
    bottom). Measure the `.top-bar` height.
  - `nav: Escape on attendance goes back to Equipo`: part of spec check 11.
- [ ] Add matrix scenes `squad` (`await seedSeason(); openSquad();`) and `template`
  (`await seedSeason(); await showProfile(); editTemplate(null);`) to `MATRIX_SCENES`.
- [ ] Verify:
  - `python3 tools/run_tests.py`;
  - `python3 tools/build_site.py && python3 tools/screenshots.py --matrix --out "$TMPDIR/nav1" team player
    player-match keeper-match matches stats stats-empty team-edit attendance profile`.
  - Check by eye: one «‹» per image, at the far left of row 2; the primary at the far right.
- [ ] Commit `feat(nav): one top bar with back and primary action`.

### Task 2: Edit tasks lead with «Cancelar» and end with the primary

**Files:** `src/app.html` (`squadHtml`, `templateHtml`, `ratingTuneHtml`, the `team-new` branch of `renderHome`,
`passwordHtml`, `teamFormHtml`), `tests/inject.js`.

- [ ] `squad`: add to `HOME_BARS`:
  - leading `cancelButtonHtml('data-home-view="matches"')`;
  - title «Convocatoria»;
  - actions «Siguiente ›» (`.btn.go`, `data-squad-next`, disabled rule unchanged).
  - Remove the `.sheet-head` from `squadHtml`.
- [ ] `rating-tune`: add to `HOME_BARS`:
  - leading `cancelButtonHtml('data-home-view="team"', TUNE_LEAVE_ARM)`. It keeps today's armed leave and its
    warning; `tuneDirty()` decides whether it arms, through the existing click handler;
  - title «Ajustar puntuación»;
  - actions «Restablecer» (`data-tune="reset"`), then «Guardar» (`id="tune-save"`, primary, same disabled rule).
  - Remove that `row-actions` from the «Nota de la plantilla» card.
  - `tuneKnob` must still find `#tune-save`.
- [ ] `template` (profile view): render a page bar under `profileHeadHtml()`:
  - leading «Cancelar» (`data-home-view="profile"`);
  - title «Nueva plantilla» / «Editar plantilla»;
  - actions «Guardar» (`data-template-store`, primary).
  - Remove the `.sheet-head` from `templateHtml`.
- [ ] `team-new` with teams: the card's head becomes
  `pageBarHtml({ leading: cancel, title, actions: submit })`:
  - `cancel` is «Cancelar», `data-cancel-team`;
  - `submit` is `<button class="btn primary press" type="submit" form="team-new-form">Crear equipo</button>`.
  - Give the form `id="team-new-form"` (`teamFormHtml(..., true)`) and drop its bottom submit when creating.
  - With no teams: no leading control, and the submit still sits in the bar.
  - Editing a team (`team-edit`) keeps «Guardar cambios» in the card.
- [ ] `password` when `home.passwordChange`:
  - head `pageBarHtml({ leading: Cancelar (data-home-view="profile"), title: 'Elige tu contraseña', actions: submit
    with form="password-form" labelled «Guardar» })`;
  - remove the bottom row.
  - The first-time password screen is unchanged.
- [ ] Update the existing tests that click `.sheet-head` buttons or read the old rows (`convocatoria…`, the template
  tests, the tune tests at about lines 2126–2140, `deleting the last team…`). Selectors only.
- [ ] New tests:
  - `nav: edit tasks lead with Cancelar and end with the primary`: spec check 4, for `squad`, `template`,
    `rating-tune` and `team-new`.
  - `nav: tuning Cancelar arms when dirty, also from Escape`: the rest of spec check 11.
  - `nav: new team submits from the bar`: fill the form, click the bar's «Crear equipo», assert the team was
    created (reuse the existing new-team test's backend stub).
- [ ] Verify: `python3 tools/run_tests.py`; matrix on `squad template tuning profile`, plus
  `"await seedSeason(); await showProfile(); openNewTeam();"` checked once by hand in a scratch copy of the tool.
- [ ] Commit `feat(nav): lead edit tasks with Cancelar`.

### Task 3: Match pages and cards (setup, Hoja, half-time, final)

**Files:** `src/app.html` (`renderSheet`, `closeSheet`, `openSheetPlayer`, `openHalftime`, `openFinal`, the
`#sheet` / `#final` click handlers at about line 5040, the `document` keydown handler at about line 3129, CSS for
`#sheet .page-bar` and `.sheet-tabs`), `tests/inject.js`, `tools/screenshots.py`.

- [ ] Setup (`ui.sheetMode === 'setup'`):
  - `pageBarHtml({ leading: backButtonHtml(NAV_LABELS.matches, 'data-go-home'), title: 'Preparar partido', actions:
    Empezar partido ▶ (.btn.go, data-start-match) })`;
  - keep `#setup-status` under it.
- [ ] Hoja: the title is the score line. Its leading control is `backButtonHtml(label, 'data-close-sheet')`, where
  `label` is:
  - `ui.sheetReturn.playerId` → `${name} · ${state.them}`, the title of `player-match`, with the name from
    `state.players` or `rosterPlayer`. A bare name would repeat `player-match`'s own «‹ <name>», which goes to the card;
  - `ui.sheetReturn.summary === 'halftime'` → «Descanso»;
  - `ui.sheetReturn.summary === 'final'` → «Final»;
  - otherwise «Volver al partido».
  - No trailing actions.
  - The tabs move to `<div class="tabs sheet-tabs" role="group" aria-label="Secciones">` under the bar. They must
    stay on one line at 1024 px (`flex-wrap: nowrap`, horizontal scroll as the fallback).
  - Remove the red `.btn.primary` «Volver» / «‹ Ficha».
- [ ] `data-final-sheet`: set `ui.sheetReturn = { summary: state.finished ? 'final' : 'halftime' }` before opening.
  In `closeSheet()`:
  - with `sheetReturn.summary`: clear it, hide the sheet, then call `openHalftime()` / `openFinal()`;
  - with `sheetReturn.playerId`: `backToPlayerMatch` as today;
  - otherwise: hide.
  - Every other way into the Hoja (the strip «Hoja» button, `openPdfPick`) must clear `ui.sheetReturn.summary`
    first, so a stale summary return never leaks.
- [ ] Half-time footer, in this order:
  - `backButtonHtml(NAV_LABELS.liveMatch, 'data-final-close')`;
  - a flex spacer;
  - «Ver Hoja»;
  - «▶ 2ª parte» (`.btn.go`, last, only in period 1).
  - Final footer: the same leading control, spacer, «Ver Hoja». Remove «Cerrar».
  - Keep `.final-actions` sticky and flush, as it is today.
- [ ] Escape: when `#final` is visible and no popup is open, `hideFinal()`. Insert it before the sheet branch.
- [ ] Update the existing tests:
  - about lines 1201–1203, 1659 and 1663: `[data-final-close]` is kept as the attribute, so only the label and order
    assertions change;
  - about line 2957: `'‹ Ficha'` → `‹ ${playerName} · ${state.them}`;
  - about line 2997: `'Volver'` → `'‹ Volver al partido'`.
- [ ] New tests:
  - `nav: match pages and cards lead with the exit`: spec check 8, including the tabs on one line (set the window
    size the way the existing layout tests do, or skip that assertion with a clear message when the suite's window
    is wider than 1024).
  - `nav: hoja back names its destination`: spec check 9, all four origins. Check where each one lands: the live
    screen, `player-match`, `#final` showing half-time, `#final` showing the final.
  - `nav: no bare Volver or Cerrar`: spec check 10, over `#home`, `#sheet` and `#final` in each state the suite can
    reach.
  - `nav: Escape closes the final card`.
  - `live strip unchanged`: spec check 13.
- [ ] Add matrix scenes `setup` (`SCENES["setup"]`) and `sheet-from-player`:
  `SHEET_PLAYER` + `ui.sheetPlayer = TOP_SCORER_SAMPLE_ID; ui.sheetReturn = { playerId: TOP_SCORER_SAMPLE_ID, matchId: null }; renderSheet();`.
- [ ] Verify:
  - `python3 tools/run_tests.py`;
  - matrix on `setup sheet-summary sheet-stats sheet-player sheet-from-player halftime final final-share`;
  - `python3 tools/screenshots.py defence attack-picker dark` and compare with `.github/readme/` on `main`: the live
    scenes are unchanged.
- [ ] Commit `feat(nav): lead match pages and cards with exit`.

### Task 4: System back and the site build

**Files:** `src/app.html` (a new `// ---- Back gesture ----` block near `leaveMatch`; `showHomeView`), `tests/inject.js`,
`docs/` (build output).

- [ ] Guard-entry model. There is no history stack mirroring the views.
  - `armBackGuard()`: when `!ui.backGuard`, call `history.pushState({ hbstatsGuard: true }, '')` and set
    `ui.backGuard = true`.
  - Call it in `showHomeView` when the view is not `profile`, `login`, `password`, `loading` or `error`; when the
    setup sheet, the Hoja or `#final` opens; and when a match is entered.
  - Skip it in the public demo (`DEMO`).
- [ ] `window.addEventListener('popstate', …)`:
  - set `ui.backGuard = false`;
  - if a popup is open: `closePop()`, then `armBackGuard()`;
  - else if `#final` is visible: click its `[data-nav-leading]`;
  - else if `#sheet` is visible: click its `[data-nav-leading]`;
  - else if `#home` is visible: click its `[data-nav-leading]` if one exists (none at the profile, so the next back
    leaves the app);
  - else, on the live screen: `armBackGuard()` and `hint(LIVE_BACK_HINT)`, with
    `const LIVE_BACK_HINT = 'Para salir del partido, pulsa ‹ Partidos'`.
  - An armed «Cancelar» only arms on the first back: re-arm the guard after the click if the view did not change.
- [ ] New tests (they drive `popstate` through `history.back()` and wait for the event, with a timeout error that
  says which screen did not answer):
  - `nav: system back runs the leading control`: `player` → `team`; Hoja → live screen; final → live screen.
  - `nav: system back on the live screen keeps the match`: `currentMatchId` is unchanged and the hint is shown.
  - `nav: system back at the profile is left to the browser`: no guard is pushed (`ui.backGuard === false`).
- [ ] Verify: `python3 tools/run_tests.py`. Then by hand on an Android tablet or in Chrome device mode:
  - the edge-swipe back on a player card returns to «Equipo»;
  - on the live screen it shows the hint and stays.
- [ ] `python3 tools/build_site.py`, and run the full matrix
  `python3 tools/screenshots.py --matrix --out "$TMPDIR/nav4"`; every probe must pass.
- [ ] Commit `feat(nav): map system back to the leading control`. Commit `docs/` in the same commit or in
  `chore(site): rebuild`.

## Review Focus

1. **Exactly one leading control on each screen**, never two. Look for stale `.player-bar`, `.sheet-head` and
   `row-actions` rows left behind.
2. **Armed exits:** the tuning «Cancelar», via a tab, Escape or system back, must never discard unsaved weights on
   the first input.
3. **`ui.sheetReturn` hygiene:** no stale player or summary return after `leaveMatch()`, a new match or the sample.
4. **Live screen pixel-identical:** README scenes, strip tests, `#btn-home`.
5. **History guard:** one entry at most; there must be no loop of pushes and pops (watch `history.length` in the
   tests).
