# Next Phase Implementation Plan — ratings, MVP vote, visual pages, dashboards

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development, following the
> **Agent loop protocol** below. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- a substitution log that gives minutes and +/−;
- a Sofascore-style rating per player and match;
- an MVP card for WhatsApp, generated at every final;
- an MVP vote that feeds the rating and the match MVP;
- visual «Hoja», half-time, final and home pages;
- season team dashboards with the other coaches' feedback;
- a weights editor for the rating.
- a design system (tokens, type roles, spacing, radii, rings, motion, focus, touch, contrast) under every page;
- a per-match drill-down on the player card, into the match filtered to that player;
- a match calendar with the next match and every round linked to its match;
- attendance per player and session.

**Architecture:**
- Everything stays in `src/app.html`.
- New facts are recorded only where they cannot be derived: the court log `state.court` and the `on` stamps on
  events. Everything else (minutes, +/−, ratings, attack types) comes from pure functions over a match state.
- The rating is linear in a feature vector, so the tuning preview only recombines it.
- Images are drawn with the Canvas 2D API.
- The online vote (M4b) adds two Supabase tables and two anon RPCs.
- Two new team-scoped tables, `fixtures` and `attendance_sessions`. Both are read through `cachedRead` and have a
  device copy. Attendance writes are device-first, with a sync like matches.
- Fixture–match links and match-day attendance are derived by pure functions. Only explicit links and marks are
  stored.

**Tech stack:** vanilla JS in one HTML file; tests in `tests/inject.js` via `python3 tools/run_tests.py` (headless
Chrome); screenshots via `tools/screenshots.py`; Supabase via the existing backend objects.

**Spec:** `design/2026-10-21-next-phase-design.md`. Look: `design/2026-10-21-team-and-player-pages-design.md` and
`design/mockups/*.png`.

**Branches:** one per milestone, `feat/m<N>-<slug>`. Each is cut from `main` after the previous milestone is merged.

## Global Constraints

- One file, `src/app.html`, in vanilla JS. No new dependencies, no chart library, no html2canvas.
- Use the existing idioms:
  - `CONFIG` for every threshold and weight;
  - `esc` for every user string in HTML and SVG;
  - `discHtml` and `photoOf` for faces;
  - the CSS tokens in both themes;
  - `home.view`, `renderHome`, `showHomeView` and `HOME_VIEWS`;
  - `cachedRead` for reads;
  - pure functions that take `events` or a state, with defaults, so the existing calls stay unchanged.
- **The live screen gains no tap, popup or visible element.** Every existing live-screen test passes unchanged.
- **Past matches keep every number.** Matches without `court` or `on` show «–» for Min and +/−, and are rated with
  confidence 1.
- **Ratings, votes and the MVP never change a statistic**, the score or the undo history.
- Every task adds tests to `tests/inject.js`. The suite passes with `python3 tools/run_tests.py`; only the `libs` test
  may fail, and only offline.
- **UI tasks** attach the screenshot matrix (1280×800 and 1024×640, light and dark) from
  `python3 tools/screenshots.py --matrix --out <dir> <scenes>`. Its probe must report no horizontal overflow and no
  `NaN` or `undefined` text.
- Commits: `<type>(<scope>): <subject>` (imperative, ≤ 50 characters, no trailing period), a body at 72 columns, and
  the trailer `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- `python3 tools/build_site.py`, then commit `docs/`, in each milestone's last task only.
- Supabase: `supabase/schema.sql` stays idempotent and RLS is on every table.
  - M0d.1 and M0e.1 are applied to the live project by the orchestrator through the Supabase MCP
    (`apply_migration`, then `get_advisors` security), as the coach asked on 2026-10-21. Implementers never touch the
    live project.
  - M4b.1 and M7.1 stay a human step.
- **From M0b, UI tasks** also need the probe's `contrast=0 targets=0 motion=0` for their scenes, in both themes.
  Pages outside the live screen use the semantic tokens, type roles, spacing and radii of M0b; raw hex in new CSS is
  a review finding.
- **Verification conventions**, used by every task, old and new, unless the task states otherwise:
  - **V-suite:** `python3 tools/run_tests.py`. Expected last line: `<N> passed, 0 failed`. Offline only:
    `1 failed`, with `FAIL libs` as the only FAIL line.
  - **V-matrix `<scenes>`:** `python3 tools/screenshots.py --matrix --out $TMPDIR/<task> <scenes>`. Expected: one
    `ok` line per image, and exit 0.
  - **V-live:** `python3 tools/screenshots.py` (README mode), then `cmp` of each live scene (`defence`,
    `attack-picker`, `dark`, and the other README scenes) against the M0 copies kept in `$TMPDIR/m0-readme`.
    Expected: no output, exit 0.

## Review Focus

1. **The court log at the edges:**
   - undo and redo of bench swaps;
   - the same second;
   - the clock moved back;
   - half-time;
   - goalkeeper changes;
   - a 2′ or a red card;
   - a bench player who shoots;
   - the sample and setup, which log nothing;
   - old matches, which get no log.
2. **Rating purity:**
   - the same inputs give the same rating everywhere;
   - no global `state` read inside `ratingFeatures`;
   - «S/C» rules;
   - clamping and rounding;
   - the coach's fixed relations (PROV7 = −BEATEN = −PEN7C; keeper team fault < field team fault).
3. **Old data:** matches with no `court`, no `on`, no `votes` or no `mvpSource`, legacy per-player NOATK, and events
   without an origin.
4. **Escaping:** user strings in the new HTML and SVG, the vote page and the image texts (the canvas needs no
   escaping, but long names are fitted).
5. **The vote's security (M4b):**
   - no anon table access;
   - the token only in the URL fragment and stored only as its hash;
   - the RPCs validate the poll window and the candidate;
   - the RPCs return nothing from other polls.
6. **Resources:** object URLs revoked, no listener added per render, timers cleared.
7. **Design system:** the live screen is unchanged (V-live, the geometry test); no `transition: all`; hover gated;
   reduced-motion branch; concentric radii; tokens rather than hex.
8. **Calendar:** the link rule at the edges (same rival twice in a season; a Saturday match against a Sunday
   reference; an explicit link against an auto link; a match deleted); fixture RLS requires the match in the same
   team; re-import keeps the kickoff.
9. **Attendance:** offline then online; two devices on one day; convocados locked; «No convocado» not counted; notes
   escaped; no NaN with zero sessions.
10. **Drill-down:** the helpers given a state argument read no global `state`; the PDF pages are byte-for-byte the
    same; the «Volver» path out of the match goes back to the card.

---

## Agent loop protocol

**Roles**
- **Orchestrator (Opus, the main session)**
  - Owns the ledger `.superpowers/sdd/<plan>/progress.md` and writes one brief per task: the task text, the Global
    Constraints, the Interfaces and the goal checks, verbatim.
  - Runs the review gate and decides the rulings.
  - The only agent that talks to the coach.
- **Implementer (Sonnet, one subagent per task)**
  - Owns the implement→test loop on its task only.
  - Never edits the design or the plan, never pushes or merges, and never dispatches subagents.
- **Reviewer (Opus, a fresh subagent per review)**
  - Read-only. Judges the task diff against the brief: first spec compliance, then quality, then the screenshots.

**Implement→test loop (Sonnet)**
1. Read the brief, the files it names and the surrounding code. Search before writing new helpers.
2. Write the task's tests. Run the suite and confirm that the new tests fail for the expected reason.
3. Implement. Run the full suite.
4. On failure, diagnose (superpowers:systematic-debugging), fix and rerun. **Cap: 6 suite runs after step 3.** When
   the cap is reached, stop and report `BLOCKED` with the failing output, the hypothesis and what was tried. Do not
   weaken or delete a test to get green.
5. UI tasks: run the screenshot matrix for the task's scenes, look at all four images, and fix what is wrong. This
   counts toward the same cap.
6. Self-check every goal check of the task, one line each, PASS or FAIL with evidence (a test name, a probe line or an
   image path).
7. Commit, then write `task-<id>-report.md`: files touched, tests added, goal-check table, screenshot paths,
   deviations, and the minors the implementer spotted.

**Review gate (Opus)**
- The reviewer gets the brief, the report, the diff file (`git diff <base>..<head>`) and the screenshot paths. It
  answers with one verdict:
  - `APPROVE`;
  - `FIX` with findings tagged **blocker** / **important** / **minor**;
  - `REPLAN` when the brief itself is wrong.
- **FIX:** the orchestrator sends the blocker and important findings back to a fresh Sonnet implementer, with the
  same loop and cap. **Cap: 3 fix rounds per task.** Minors go to the ledger as `minor (deferred)` unless they take
  one line.
- **Escalation:** a cap reached, a `REPLAN` verdict or a needed coach decision stops the task. The orchestrator
  writes the open question to the ledger and asks the coach. No agent guesses a coach decision. Where the design
  gives a proposal, that proposal stands until the coach changes it.
- **Milestone gate:** after the last task, a whole-milestone Opus review runs on `main..HEAD`, with the full suite,
  `build_site.py` and the full screenshot matrix of the milestone's scenes. The coach then accepts, and the
  milestone merges.

**Sequencing**
- `src/app.html` and `tests/inject.js` are single files. **Tasks never run in parallel**, and the next task starts
  only after the previous one is `APPROVE`d (its fixes change the same lines).
- **Allowed in parallel** with a running implementer:
  - the orchestrator writing the next brief;
  - planning or design of the next milestone;
  - tool-only or SQL-only work in its own git worktree (M0.1 `tools/screenshots.py`, M4b.1 `supabase/schema.sql`),
    cherry-picked by the orchestrator once both are approved.
  - M0d.1 and M0e.1: `supabase/schema.sql` and `tools/calendar_sql.py`.
- **Never in parallel:**
  - two implementers;
  - an implementer and a fix round, on `src/app.html` or `tests/inject.js`;
  - a review overlapping the next task of the same branch.
- Milestones are strictly sequential: M0 → M0b → M0c → M0d → M0e → M1 → M2 → M3 → M4a → M5 → M4b → M6 → M7.
  M4b may move after M6 if the coach has not decided decisions 1–2. M0d.1 and M0e.1 (SQL only) may run in their own
  worktree while an implementer runs.

**Ledger lines** (as in the previous plan):
- `Task X: complete (commits a..b, review clean)`;
- `Task X: fix round n/3 (k addressed, m open)`;
- `Task X: Ruling: … — cost if wrong: …`;
- `Task X: minor (deferred): …`;
- `Task X: BLOCKED: …`.

---

## M0 — Groundwork

### Task 0.1: Screenshot matrix and season fixture

**Files:**
- Modify: `tools/screenshots.py`.
- Create: `tools/scenes/season.js`, a JS snippet spliced into the app scope like the scenes.
- Test: none in `tests/`. The goal checks run the tool.

**Interfaces:**
- CLI: `python3 tools/screenshots.py [--matrix] [--sizes 1280x800,1024x640] [--themes light,dark] [--out DIR]
  [scene...]`.
  - Without `--matrix`, today's README behaviour stays byte-for-byte (1280×800 light into `.github/readme`).
  - `--matrix` writes `<out>/<scene>-<theme>-<w>x<h>.png`.
- **Probe**
  - After rendering, each scene writes `<meta name="probe" content='{"overflowX":bool,"badText":[…]}'>`. Here
    `overflowX` is `document.documentElement.scrollWidth > innerWidth`, and `badText` lists the visible text nodes
    that match `/\bNaN\b|\bundefined\b/`.
  - The tool reads it with a `--dump-dom` run, prints one line per image, and exits 1 when any probe fails.
- `tools/scenes/season.js` defines `seedSeason()`. It saves, through `localBackend()`:
  - a team with 12 roster players, each with a `TINY` photo;
  - four match states built from `sampleState()` with varied events, scores, dates and one `mvpId`.
  It then calls `selectTeam`.
- New scenes:
  - `team`, `player` (a field player), `keeper`, `matches`, `profile`;
  - `sheet-stats` and `sheet-summary` (the latter added in M5);
  - `final` and `halftime`, already present, now in the matrix.

- [ ] **Step 1:** implement the flags, the probe and the fixture. Keep `capture()` reused for both modes.
- [ ] **Step 2:** run `python3 tools/build_site.py`, then `python3 tools/screenshots.py --matrix --out $TMPDIR/m0
  team player keeper matches profile final halftime`.
- [ ] **Step 3:** commit `chore(tools): screenshot matrix with a layout probe`.

**Goal checks:**
- [ ] 28 PNGs (7 scenes × 2 sizes × 2 themes), and every probe line passes.
- [ ] `python3 tools/screenshots.py` with no flags writes the same file names as before into `.github/readme`.
- [ ] A scene injected with `document.body.style.width = '3000px'` makes the tool exit 1. Check it by hand; do not
  commit it.

### Task 0.2: Season data minors

**Files:**
- Modify: `src/app.html` (season figures, charts, team page).
- Test: `tests/inject.js`.

**Interfaces** (behaviour only; no new public names unless listed):
- `shotZone(e)`: an event without `origin` returns `ZONE_UNKNOWN = 'NA'`. `zoneRates` counts it under that key, and
  `zoneMapSvg` ignores it.
- `teamBest`: computes `fieldValues` and `keeperValues` once per player.
- `teamBest(...).field.pct`: falls back to the best rate among all shooters when nobody reaches
  `CONFIG.leaders.minShots`. The radar axis is no longer 0 for everyone.
- `radarSvg` with no axes and `evolutionSvg` with `NaN` or null rates emit no `NaN` coordinate. A null rate draws no
  dot.
- Add comments:
  - `teamSeason`: `form` and `latest` expect newest-first input;
  - `leaders`: goalkeepers are included for assists and MVPs, and zero values are left out.
- Test hygiene:
  - move the `CONFIG.leaders.minShots` assert out of the `rateColour` test;
  - drop the redundant `bestOf(...)` spread;
  - the zone-label test reads `LANES` and the court constants instead of 425/575/300/450.

- [ ] **Step 1: Write the failing tests.**
  - `season: player rows count blocks, 7 m provoked, recoveries and turnovers`.
  - `season: team totals count turnovers, recoveries and saves`.
  - `zones: a shot without origin is skipped by the map`.
  - `radar: shooting axis falls back when nobody reaches the minimum shots`.
  - `charts: no NaN with empty axes or missing rates`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `fix(season): guard zones, charts and team best`.

**Goal checks:**
- [ ] The five tests pass, and nothing else changes.
- [ ] `team`/`player`/`keeper` matrix probes pass.

### Task 0.3: Season freshness and card robustness

**Files:**
- Modify: `src/app.html` (`loadSeason`, `showTeamPage`, `importLegacyMatch`, `playerPageHtml`, `crestFromFile` error
  text, boot wiring).
- Test: `tests/inject.js`.

**Interfaces:**
- `loadSeason()` captures `team.id` and drops its result when the team changed while it was loading.
- `window` `online` listener: when `home.seasonOffline` is true, clear `home.season`, and re-render if the view is
  `team` or `player`. Register it once, at boot.
- `importLegacyMatch` clears `home.season`.
- `playerPageHtml` falls back to `showTeamPage()` when `rosterPlayer(home.playerId)` is gone after a reload.
- The crest and photo error text reads «No se pudo usar la imagen: tiene que ser…». No repeated «la imagen».

- [ ] **Step 1: Write the failing tests.**
  - `season: entering, restarting and switching team clear the season`.
  - `season: importing a legacy match clears the season`.
  - `season: a team switch during loading keeps the new team's season`.
  - `season: coming back online reloads an offline season`.
  - `player card: a player removed from the roster falls back to the team page`.
  - `player card: a malicious name is escaped in the poster, the table and every SVG`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `fix(team): refresh the season and harden the card`, with `docs/`.

**Goal checks:**
- [ ] All six tests pass.
- [ ] The M0 matrix passes.
- [ ] The ledger lists every deferred minor of the previous plan as `done`, `dropped (reason)` or `→ M5.4`.

---

## M0b — Design system

### Task 0b.1: Contrast, touch and motion probe; live-screen guard

**Files:** Modify `tools/screenshots.py`, `src/app.html` (two pure helpers). Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** M0.1's `--matrix` probe and `<meta name="probe">`.
- **Produces:**
  - `function relLuminance(hex) → number` and `function contrastRatio(a, b) → number`, in `src/app.html`
    ("Colour").
  - The probe JSON gains three fields, each scanning `.home`, `#sheet` and `#final` only:
    - `contrast: [{ text, ratio, need }]`: visible leaf text against the first opaque ancestor background; `need` is
      3 when the text is 24 px or more, or 18.66 px or more and bold; elements marked `data-contrast-skip` (text on
      photos) are left out;
    - `targets: [{ sel, w, h }]`: `button`, `a[href]`, `input`, `select`, `summary`, `[role=button]`,
      `[data-player-match]` smaller than 44×44; `data-target-exempt="<reason>"` skips one;
    - `motion: n`: running `document.getAnimations()`, plus elements whose computed `transition-duration` is
      greater than 0 on `transform`, measured under `--motion reduce`.
  - CLI: `--motion reduce|no-preference` (default `no-preference`). `reduce` adds Chrome's
    `--force-prefers-reduced-motion`.
  - The probe line becomes `<img>: ok` or `<img>: FAIL overflowX=… badText=… contrast=n targets=n motion=n`.
    `--report-only` prints but exits 0.
  - Test constant `LIVE_GEOMETRY`: `getBoundingClientRect()` of `#bar`, `#clock`, `#court`, `#bench`, `#panel`, the
    action-strip buttons and `.lineup` tokens, recorded at the suite's viewport before any CSS change.

- [ ] **Step 1: Write the tests.**
  - `design: contrastRatio matches known pairs`: `#000`/`#fff` gives 21; `#767676`/`#fff` gives 4.54 ± 0.01; the
    order of the arguments does not matter.
  - `design: live screen geometry unchanged`: every rect in `LIVE_GEOMETRY` is equal to within 0.5 px.
- [ ] **Step 2:** implement; V-suite.
- [ ] **Step 3:** save the README scenes to `$TMPDIR/m0-readme` (V-live baseline). Run
  `python3 tools/screenshots.py --matrix --report-only --motion reduce --out $TMPDIR/0b1 team player keeper matches profile final halftime`.
  Paste the counts into the report as the baseline for 0b.4.
- [ ] **Step 4:** commit `chore(tools): probe contrast, targets and motion`.

**Goal checks:**
- [ ] V-suite.
- [ ] The probe prints contrast, targets and motion for all 28 images.
- [ ] A hand-made 20×20 button in `.home` makes the run without `--report-only` exit 1. Check by hand; do not commit
  it.

### Task 0b.2: Semantic tokens, type roles, spacing and rating bands

**Files:** Modify `src/app.html` (`:root`, both dark blocks, a new "Design tokens" CSS block). Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** the existing custom properties, unchanged.
- **Produces:** the design's token list exactly: `--color-*`, `--type-*`, `--space-*`, `--radius-*`, `--ring`,
  `--ring-hover`, `--photo-outline`, `--dur-*`, `--ease-out`, `--focus-ring`, `--rating-*` and `--rating-ink-*`, in
  light and dark.
  - Dark values are defined once and reached through both existing switches (the media query and
    `[data-theme="dark"]`), as today.
  - Utility classes `.t-display`, `.t-title`, `.t-heading`, `.t-body`, `.t-caption`, `.num` (`tabular-nums`).
  - `const RATING_BANDS = ['top', 'good', 'mid', 'low', 'bad']`.

- [ ] **Step 1: Write the failing tests.**
  - `design: every semantic token resolves in both themes`: `getComputedStyle(document.documentElement)` gives a
    non-empty value for each listed token, with `data-theme` set to light and then to dark.
  - `design: tertiary text passes 4.5:1 on the surface in both themes`.
  - `design: rating band numerals pass 4.5:1 and fills 3:1 on the surface in both themes`.
  - `design: adjacent rating bands differ in lightness`: `contrastRatio` is 1.3 or more for each adjacent pair, in
    both themes.
  - `design: live tokens keep their values`: a snapshot of `--act-good`, `--act-def`, `--act-bad`, `--act-rule`,
    `--act-rival`, `--gol`, `--parada`, `--fallo`, `--radius` and `--tap` in both themes, taken before the change.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `style(app): semantic tokens and type roles`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-live: no output.
- [ ] `live screen geometry unchanged` passes.

### Task 0b.3: Rings, radii, photo outlines, motion, hover and focus

**Files:** Modify `src/app.html` (CSS for `.sheet-card`, `.kpi-tile`, `.tile`, `.leader`, squad faces, `.home`,
`#sheet`, `#final`, the reduced-motion block, the theme toggle). Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** 0b.2's tokens.
- **Produces:**
  - Cards outside the live screen use `--ring`, `border: 1px solid transparent` and `--radius-lg`.
  - Nested tiles and photos follow outer = inner + padding.
  - `.home .disc img`, `#sheet .disc img` and `#final .disc img` get `outline: 1px solid var(--photo-outline);
    outline-offset: -1px`.
  - Press feedback is `scale: .96` over `--dur-press` with `--ease-out`, and never on `:disabled`.
  - All new or changed `:hover` rules sit inside `@media (hover: hover)`.
  - `:focus-visible` uses `--focus-ring` on `a, input, select, summary, [tabindex], .chip`.
  - `function suppressThemeTransitions()` is called by the theme switch: it adds `*{transition:none!important}`,
    forces a reflow, and removes the rule after two `requestAnimationFrame`s.

- [ ] **Step 1: Write the failing tests.**
  - `design: nested radii are concentric`: for `.sheet-card > .kpi-tile` and the squad face card > `.disc`, the outer
    radius equals the inner radius + padding (+ border), within 1 px.
  - `design: no transition: all and every hover is gated`: scan `document.styleSheets`. Every `:hover` rule except
    `.rex-chip:hover .x` sits inside a `(hover: hover)` media rule; no `transition-property` is `all`.
  - `design: reduced motion leaves no transform transition`: under an injected `prefers-reduced-motion: reduce`
    matcher stub, `.home .press` has a computed `transition-duration` of 0 for `transform`.
  - `design: theme switch suppresses transitions for two frames`: the style element is present right after the
    call and gone after 2 rAF.
  - `design: photos get a neutral outline outside the live screen only`: the outline is set on a `.home` disc and
    `none` on a bench disc.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `style(app): rings, radii, motion and focus`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-live.
- [ ] Geometry test.

### Task 0b.4: Apply the system to the pages; contrast and touch to zero

**Files:** Modify `src/app.html` (CSS and markup of the home pages, «Hoja», half-time, final, team edit, profile).
Modify `tools/scenes/season.js` if scenes need data. `docs/`.

**Interfaces:**
- **Consumes:** 0b.1's probe, plus 0b.2 and 0b.3.
- **Produces:**
  - Text on these pages uses the five roles. Every number has `.num` or `tabular-nums`. Gaps use `--space-*`.
  - Controls are 44 px or more (`min-height`, plus a centred `::after` hit area where the visible chip must stay
    small).
  - Keeper (`--por`) rings readable on dark cards.
  - Ranges use the en dash («24–21»).
  - No new public JS names.

- [ ] **Step 1: Write the failing tests.**
  - `design: home, sheet and final controls are at least 44 px`: render each `HOME_VIEWS` view, each sheet tab and
    `openFinal()`, then check every control's rect (the same selector as the probe).
  - `design: every number cell is tabular`: `td`, `.kpi strong`, `.leader .value` and `.tile b` compute
    `font-variant-numeric` containing `tabular-nums`.
- [ ] **Step 2:** implement until the probe is clean.
- [ ] **Step 3:** run V-matrix with
  `team player keeper matches profile final halftime sheet-stats --motion reduce`, and again without `--motion`.
- [ ] **Step 4:** run `build_site.py`, then commit `style(home): apply the design system to pages`, with `docs/`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-matrix: every line `ok`, which means contrast=0, targets=0 and motion=0, in light and dark.
- [ ] V-live.
- [ ] The reviewer compares before and after for each scene. Nothing on the live screen moved.

---

## M0c — Player match drill-down

### Task 0c.1: Shot maps and player figures over any match

**Files:** Modify `src/app.html` ("Hoja" helpers). Test: `tests/inject.js`.

**Interfaces** (existing calls stay unchanged through the defaults):
- `shooterOf(e, s = state)` and `shooterKey(e, s = state)`. They look up `s.players` and `s.rivals`.
- `shotMapSvg(shots, viewKey, focusId, { s = state, colours = MAP_VIEWS[viewKey].colors } = {})`.
- `playerFigures(p, s = state)` and `eventsOf(id, events = state.events)`.
- `function playerReport(p, s = state) → { keeper, shots, figures, zoneHead, zoneRows, turnoverRows, faultRows,
  timeline }`. It is extracted from `pdfPlayer`, which now draws from it; the PDF output is unchanged.

- [ ] **Step 1: Write the failing tests.**
  - `shot map: pure over a saved state equals the live one`: render with the global `state`, then with a deep copy
    passed as `s` while the global `state` is swapped to `sampleState()`. The strings are equal.
  - `player figures: pure over a saved state equals the live one`.
  - `pdf: player pages unchanged after the report refactor`: stub `pdfTable`, `pdfShotChart` and `pdfHeader` to
    record their arguments, run `buildPdf('players')` on the sample, and compare the JSON with a snapshot captured
    before the change.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `refactor(sheet): shot maps over any match`.

**Goal checks:**
- [ ] V-suite.
- [ ] No existing test edited.

### Task 0c.2: Per-match view on the player card

**Files:** Modify `src/app.html` (`playerSeasonHtml` rows, `HOME_VIEWS`, `homeHeadHtml`, a new "Player match" block,
the click handler, CSS). Modify `tools/scenes/season.js` (scenes `player-match`, `keeper-match`). Test:
`tests/inject.js`.

**Interfaces:**
- **Consumes:** `playerMatchRow(m, player)` (its `shotsList` and `facedList`), `home.season`, 0c.1's helpers,
  `goalGridHtml`, `figuresHtml`, `gkFigures`, `CARD_ZONE_COLOURS`.
- **Produces:**
  - Per-match rows: `<tr class="row-link" data-player-match="<matchId>">`, with the date cell as a
    `<button class="row-btn" data-player-match="<matchId>">` (44 px or more).
  - `home.playerMatchId`; `function showPlayerMatch(matchId)`. It falls back to `showPlayer(home.playerId)` when the
    match is not in `home.season`.
  - `HOME_VIEWS['player-match'] = playerMatchHtml`. The «Equipo» tab is pressed on this view.
  - `function playerMatchHtml()`:
    - a «‹ Ficha» button (`data-player-back`);
    - the title: rival, date, venue, score, result chip, and a crown when the player was MVP;
    - figures: `playerFigures(player, m.state)`, or `gkFigures(row.facedList)` for goalkeepers;
    - field players: one `shotMapSvg(row.shotsList, 'US', null, { s: m.state, colours: CARD_ZONE_COLOURS.field })`;
    - goalkeepers: two maps, Detenidos and Encajados (`MAP_GROUPS`), with `CARD_ZONE_COLOURS.keeper`;
    - the goal grids: «Dónde marca» and «Dónde se lo paran» for field players; «Detenidos/Encajados por zona de
      portería» for goalkeepers;
    - a button «Abrir el partido» (`data-player-match-open="<matchId>"`).

- [ ] **Step 1: Write the failing tests.**
  - `player card: tapping a match row opens that match for the player`: `home.view === 'player-match'` and
    `home.playerMatchId` equals the row's id.
  - `player match: field map draws one mark per shot with the card colours`: the number of `<g>` marks equals
    `row.shotsList.length`, and the fills are only `var(--gol)`, `var(--parada)` and `var(--fallo)`.
  - `player match: goalkeeper sees rival shots faced, saves and goals`: the two maps hold `saves` and
    `onTarget − saves` marks, and the grid sums equal the same numbers.
  - `player match: another match's shots are not drawn`.
  - `player match: back returns to the card; a missing match falls back to the card`.
  - `player match: rival and player names are escaped`: a `<img onerror>` name shows as text.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(players): open a match from the card`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-matrix: `player player-match keeper-match`.
- [ ] The season zone map scenes (`player`, `keeper`) differ only in the per-match table's row affordance. The
  reviewer checks.

### Task 0c.3: «Jugador» tab in the «Hoja», opened from the card

**Files:** Modify `src/app.html` (`SHEET_TABS`, `SHEET_RENDERERS`, a new `sheetPlayerHtml`, `enterMatch`,
`leaveMatch`, `resetPlayUi`, the `data-close-sheet` handler, a new `openMatchForPlayer`). Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** `playerReport(p)`, `shotMapSvg`, `goalGridHtml`, `tableHtml`, `loadLatestMatch`.
- **Produces:**
  - `SHEET_TABS` becomes `{ stats, player: 'Jugador', analysis, gk, acta, reports }`.
  - `ui.sheetPlayer` (null by default) and `ui.sheetReturn` (null, or `{ playerId, matchId }`). Both are cleared by
    `resetPlayUi`.
  - `function sheetPlayerHtml()`:
    - picker chips of the convocados, with face and `aria-pressed` (`data-sheet-player`);
    - for the picked player, the on-screen version of the PDF page: figures, map, zone table, turnovers by type,
      defensive faults, timeline; goalkeepers get maps and grids as on the «Portero» tab.
  - `enterMatch(id, saved, dirty, { sheetPlayer } = {})`: with `sheetPlayer` and `setupDone`, it opens the sheet on
    `player` instead of `openFinal()`.
  - `async function openMatchForPlayer(matchId, playerId)`: `loadLatestMatch`, then `enterMatch(…, { sheetPlayer })`,
    and sets `ui.sheetReturn`.
  - `leaveMatch(after = showMatches)`. With `ui.sheetReturn` set, «Volver» reads «‹ Ficha» and calls
    `leaveMatch(() => { home.playerId = r.playerId; showPlayerMatch(r.matchId); })`.

- [ ] **Step 1: Write the failing tests.**
  - `sheet: Jugador tab lists convocados and shows the picked player's figures`: one chip per `state.players`; after
    a pick, the figures text includes the player's goals/shots.
  - `open match for player: lands on the Jugador tab filtered to him`: a finished local match leaves `#final`
    hidden, `#sheet` visible, `ui.sheetTab === 'player'` and `ui.sheetPlayer === id`.
  - `open match for player: a goalkeeper lands on his saves`: the maps hold his `gkId` shots only.
  - `open match for player: Volver returns to the player match view`: `home.view === 'player-match'` and
    `currentMatchId === null`.
  - `render all tabs` (existing) passes with the new tab.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(sheet): a player tab in the Hoja`, with `docs/`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-live.
- [ ] V-matrix: `sheet-player player-match`.
- [ ] The CBMLEPE match report PDF is unchanged (the 0c.1 snapshot test passes).

---

## M0d — Match calendar

### Task 0d.1: `fixtures` table and seed (SQL only; may run in a worktree)

**Files:** Modify `supabase/schema.sql`, `supabase/README.md` (one row in Data). Create `tools/calendar_sql.py` and
`supabase/checks/fixtures.sql`.

**Interfaces:**
- **Produces:**
  - The `fixtures` table exactly as in the design: checks, unique key, index, `touch_updated_at` trigger, RLS
    `fixtures_all` with the same-team match check, and no anon grant.
  - `python3 tools/calendar_sql.py FILE TEAM_ID` prints one `insert … on conflict (team_id, season, competition,
    round) do nothing;`. It validates as `parseCalendar` does, and exits 2 with a message on a bad file.
  - `checks/fixtures.sql`: a member reads 14 rows; a non-member reads 0; linking a match of another team is refused;
    anon reads are refused.

- [ ] **Step 1:** write the SQL, the tool and the checks.
- [ ] **Step 2:** the orchestrator runs:
  - `apply_migration` with name `fixtures`;
  - `execute_sql` with the output of `python3 tools/calendar_sql.py design/data/2026-27-calendario-triana.json
    03e3ca0d-c425-416c-98fa-db8d91cbd49f`, twice;
  - `get_advisors` (security).
- [ ] **Step 3:** commit `feat(db): fixtures table for the calendar`.

**Verify:**
- `select count(*) from public.fixtures where team_id = '03e3ca0d-c425-416c-98fa-db8d91cbd49f'` gives 14 after both
  seed runs.
- The schema runs twice without error.
- The advisors report no new warning.

### Task 0d.2: Read, store and import the calendar

**Files:** Modify `src/app.html` (both backends, a new "Calendar" block, `selectTeam`, `teamEditHtml`, the file
import handler). Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** `cachedRead`, the roster-file reading path (`data-roster-import`).
- **Produces:**
  - `const CALENDAR_FORMAT = 'hbstats-calendario'`.
  - `function parseCalendar(text) → { team, season, competition, fixtures: [{ round, weekend, home, opponent }] }`.
    Spanish errors: «no es JSON», «no es un calendario de HBStats», «jornada repetida: N», «fecha no válida en la
    jornada N», «falta el rival en la jornada N».
  - Backend:
    - `listFixtures(teamId) → Fixture[]`, sorted by weekend, then round;
    - `saveFixtures(teamId, { season, competition, fixtures }) → Fixture[]`: upserts on the unique key and writes
      only the file's columns;
    - `updateFixture(id, { kickoff?, venue?, matchId? }) → Fixture`.
    The local backend keeps `db.fixtures`.
  - `home.fixtures` (null until loaded); `async function loadFixtures() → { offline }` through
    `cachedRead(\`fixtures:${team.id}\`)`. Cleared by `selectTeam`.
  - «Editar equipo» gains a «Calendario» row: the count «14 jornadas · 2026/2027» and «Importar calendario»
    (`data-calendar-import`). The status reads «Calendario importado: 14 jornadas.»

- [ ] **Step 1: Write the failing tests.**
  - `calendar: parses a hbstats-calendario file`: the rounds, `home` flags and `weekend` strings round-trip for a
    3-round literal.
  - `calendar: refuses a wrong format, a repeated round and a bad date`: `throws` with /calendario/, /repetida/,
    /fecha/.
  - `calendar: local backend saves and lists; re-import keeps the kickoff and venue`.
  - `calendar: fixtures load from the device copy offline`: `listFixtures` throws, the cached value comes back, and
    `offline` is true.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(calendar): read and import fixtures`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-matrix: `team-edit`.

### Task 0d.3: Link matches to fixtures (pure)

**Files:** Modify `src/app.html` ("Calendar", `loadSeason`). Test: `tests/inject.js`.

**Interfaces:**
- **Produces:**
  - `function normalName(s) → string`; `const OPPONENT_STOPWORDS = [...]`.
  - `function sameOpponent(a, b) → boolean`.
  - `function weekOf(weekendIso) → [mondayIso, sundayIso]`.
  - `function fixtureMatch(f, matches, taken = new Set()) → match | null`.
  - `function linkFixtures(fixtures, matches) → Map<fixtureId, match>`: explicit links first, then by weekend.
  - `loadSeason` also sets `home.teamMatches`: all statuses, summaries only.
  - `async function persistLinks()` writes `matchId` for auto links when online, and only warns on failure.

- [ ] **Step 1: Write the failing tests.**
  - `calendar: CBMLEPE on 2026-10-17 links to round 1`: round 1 is `EL JAMON CBM LEPE` on 2026-10-18; round 8 is the
    same rival on 2026-12-20. The match `them: 'CBMLEPE'`, `date: '2026-10-17'` maps to round 1 and round 8 has no
    link.
  - `calendar: sameOpponent ignores accents, dots and club words`: `Gades`/`BALONMANO GADES - ASISA` true;
    `BM Nazareno`/`BALONMANO NAZARENO` true; `BM.Lauro`/`EL JAMON CBM LEPE` false; `BM Sur`/`BM PROIN SAN JOSÉ
    RINCONADA` false.
  - `calendar: the same rival in another week does not link`.
  - `calendar: an explicit matchId wins over the auto link`.
  - `calendar: a match links to one fixture only`.
  - `calendar: a kickoff moved to another week still links by its date`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(calendar): link matches to fixtures`.

**Goal checks:**
- [ ] V-suite.

### Task 0d.4: «Próximo partido», «Calendario» and a new match from a fixture

**Files:** Modify `src/app.html` (`teamPageHtml`, new `nextFixtureCardHtml` and `calendarCardHtml`, a fixture editor,
`openSquad`, `createMatch`, `freshMatch`, the click handler, CSS). Modify `tools/scenes/season.js` (seed the 14
fixtures and link two matches). `docs/`.

**Interfaces:**
- **Consumes:** `linkFixtures`, `home.fixtures`, `home.teamMatches`, `updateFixture`, M0b tokens.
- **Produces:**
  - `function nextFixture(fixtures, links, today = todayIso()) → Fixture | null`: the first fixture whose week ends
    on or after `today` and whose linked match is not finished.
  - `function fixtureWhenText(f) → string`: «sáb 24 oct · 18:00» when a kickoff is set, else «fin de semana 24–25
    oct».
  - `function fixtureRivalName(opponent) → string`: at most `MAX_NAME_LENGTH`, cut at a word boundary.
  - Team page order: «Próximo partido» first, then season, leaders, squad, and «Calendario» full width below.
  - Calendar rows:
    - «J{n}», the date, the rival, a «Casa»/«Fuera» badge (text, not colour only);
    - when linked and not in setup, a result chip G/E/P plus the score as a `<button data-open-match>`;
    - the current week gets `aria-current="date"`, a ring and «Esta semana».
  - `data-fixture-edit="<id>"` opens date, time and venue inputs. «Guardar» calls `updateFixture(id, { kickoff,
    venue })`; an empty date clears the kickoff.
  - `data-fixture-new="<id>"` calls `openSquad({ fixtureId })`. `createMatch()` passes
    `freshMatch(base, { them, date, venue })`; `freshMatch(from, prefill = {})` keeps today's defaults when `prefill`
    is empty. After entering the match it calls `updateFixture(f.id, { matchId })` (a warning on failure; the auto
    link covers it).
  - With no fixtures, the page shows a hint: «Importa el calendario en «Editar equipo».»

- [ ] **Step 1: Write the failing tests.**
  - `team page: next match shows round, weekend, rival and home or away`.
  - `team page: exact date and time replace the weekend once set`.
  - `team page: calendar lists every round; played ones open their match`: 14 rows; the round 1 chip reads «G
    28–23» and carries `data-open-match`.
  - `team page: the current week has a ring and reads Esta semana`: exactly one `[aria-current="date"]`.
  - `new match from a fixture: rival, date and venue prefilled and linked`.
  - `team page: opponent names are escaped and no fixtures shows the hint, no NaN`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(team): next match and calendar cards`, with `docs/`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-matrix: `team team-edit`, with contrast, targets and motion all 0.
- [ ] Milestone gate, after deploy: once the coach opens the team page,
  `select round, match_id from public.fixtures where team_id = '03e3ca0d-c425-416c-98fa-db8d91cbd49f' and round = 1`
  returns `9ccbcc75-9781-452f-a49b-db35024d940f`.

---

## M0e — Attendance

### Task 0e.1: `attendance_sessions` table (SQL only; may run in a worktree)

**Files:** Modify `supabase/schema.sql`, `supabase/README.md`. Create `supabase/checks/attendance.sql`.

**Interfaces:**
- **Produces:** the table exactly as in the design: client-made `id`, unique `(team_id, on_date, kind)`, `marks`
  check, `touch_updated_at` trigger, RLS `attendance_all` with the same-team match check, index
  `(team_id, on_date desc)`.
- The checks cover:
  - a member upsert twice on one day and kind leaves one row;
  - a non-member reads 0 rows;
  - `marks = '[]'` is refused;
  - anon is refused.

- [ ] **Step 1:** write the SQL and the checks.
- [ ] **Step 2:** the orchestrator runs `apply_migration` with name `attendance_sessions`, then
  `checks/attendance.sql` through `execute_sql` (in a transaction, rolled back), then `get_advisors` (security).
- [ ] **Step 3:** commit `feat(db): attendance sessions table`.

**Verify:**
- Every expected outcome in the check script matches.
- The schema runs twice.
- No new advisor warning.

### Task 0e.2: Store, sync and derive sessions

**Files:** Modify `src/app.html` (`CONFIG.attendance`, both backends, a new "Attendance" block, the sign-out wait, the
`online` listener). Test: `tests/inject.js`.

**Interfaces:**
- **Consumes:** `cachedRead`, `localMatches`, `syncMatches` (the pattern), `home.season`.
- **Produces:**
  - `CONFIG.attendance = { warnPct: 75, excludeFromRate: ['L'], noteMax: 60, syncDelayMs: 2000 }`.
  - `const ATTENDANCE = { P: 'Presente', F: 'Falta', J: 'Justificada', L: 'Lesionado', NC: 'No convocado' }`.
  - Session: `{ id, date, kind: 'ENTRENO' | 'PARTIDO', matchId, marks, note }`.
  - Backend:
    - `listSessions(teamId) → Session[]`;
    - `saveSession(teamId, s) → Session`: upsert on `team_id,on_date,kind`;
    - `deleteSession(id)`.
  - Device copy under `attendance:<teamId>`: `storeLocalSession(s, dirty)`, `localSessions()`,
    `withLocalSessions(list)`, `async syncAttendance()`, `scheduleAttendanceSync()`. The sync runs on `online`, and
    sign-out awaits it.
  - `home.sessions`; `async function loadAttendance() → { offline }`.
  - `function nextStatus(code, onMatchDay) → code`: P→F→J→L→P, or NC→F→J→L→NC on a match day for a non-convocado.
  - `function setMark(session, playerId, code, note) → Session` (pure). P and NC delete the key.
  - `function sessionStatus(session, playerId, match) → 'P' | 'F' | 'J' | 'L' | 'NC'`.

- [ ] **Step 1: Write the failing tests.**
  - `attendance: tapping cycles Presente, Falta, Justificada, Lesionado`.
  - `attendance: Presente stores nothing`: `marks` has no key for the player.
  - `attendance: a session saved offline is uploaded when back online`: the stub backend fails, then succeeds;
    `dirty` is cleared and `saveSession` was called once.
  - `attendance: the same day and kind upsert one session`.
  - `attendance: sign-out waits for pending sessions`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(attendance): store and sync sessions`.

**Goal checks:**
- [ ] V-suite.

### Task 0e.3: Quick entry by faces

**Files:** Modify `src/app.html` (`HOME_VIEWS.attendance`, a new `attendanceHtml`, team page buttons, the click and
input handlers, CSS). Modify `tools/scenes/season.js` (8 sessions, scene `attendance`).

**Interfaces:**
- **Consumes:** 0e.2, the squad grouping by position used by `squadCardHtml`, `discHtml`, `linkFixtures`
  (when M0d is present), `home.teamMatches`.
- **Produces:**
  - `home.attendanceDate` (default `todayIso()`) and `home.attendanceKind`. The kind is `PARTIDO` when a match or a
    fixture kickoff falls on that date, else `ENTRENO`.
  - `attendanceHtml()`:
    - a date input and kind chips (`aria-pressed`);
    - a counter line «14 presentes · 2 faltas · 1 justificada · 1 lesionado»;
    - faces by position as `<button data-att="<id>">`, with a status badge holding text and a letter, not colour
      only;
    - a «Nota» button (`data-att-note`) opening an inline input of up to `noteMax` characters;
    - «Borrar sesión» as an armed button.
  - On a match day: convocados are disabled and read «Convocado»; others start at «No convocado».
  - Every change goes to `storeLocalSession(s, true)` and `scheduleAttendanceSync()`. The status reads «Guardado en
    la tablet» or «Subido».
  - The team page gets «Asistencia» (`data-home-view="attendance"`) next to «Editar equipo».

- [ ] **Step 1: Write the failing tests.**
  - `attendance view: today by default, faces by position, every one Presente`.
  - `attendance view: tapping a face cycles its badge text and saves the session`.
  - `attendance view: on a match day, convocados are locked and others read No convocado`.
  - `attendance view: a note is saved and escaped`.
  - `attendance view: changing the date opens that day's session`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(attendance): quick entry by faces`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-matrix: `attendance`, with targets at 0.

### Task 0e.4: Rates on the player card, the team page and the squad

**Files:** Modify `src/app.html` (`playerSeasonHtml`, `teamPageHtml`, `squadCardHtml`, CSS). `docs/`.

**Interfaces:**
- **Consumes:** `home.sessions`, `home.season`, `home.roster`, `sessionStatus`.
- **Produces:**
  - `function attendanceRows(sessions, matches, roster) → [{ player, P, F, J, L, counted, pct, byKind: { ENTRENO,
    PARTIDO } }]`. `pct` is null when `counted` is 0.
  - Player card tile «Asistencia · 92 %», with «23 de 25 · 2 faltas · 1 justificada · 0 lesionado» and an «Entrenos
    · Partidos» split line.
  - Team page «Asistencia» card: the team rate, «18 entrenos · 3 partidos», and «Más faltas» (top 3 by F, then J,
    with faces). It is hidden when there are no sessions.
  - Squad: a small % under each name when sessions exist. Below `warnPct` it gets the warn style and a «!» with
    `aria-label`.

- [ ] **Step 1: Write the failing tests.**
  - `attendance: match convocados count present, non-convocados are not counted`.
  - `attendance: injured sessions leave the rate, absences and justified lower it`.
  - `attendance: a player with no counted session reads – and no NaN`.
  - `player card: attendance tile with percent and counts`.
  - `team page: most absences ranked by faltas, then justificadas`.
  - `squad: low attendance is marked with text, not colour only`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(attendance): rates on card and team`, with `docs/`.

**Goal checks:**
- [ ] V-suite.
- [ ] V-matrix: `team player keeper attendance`.
- [ ] V-live.

---

## M1 — Substitution log, minutes and +/−

### Task 1.1: Exclusion helpers over any events

**Files:**
- Modify: `src/app.html` ("Derived data").
- Test: `tests/inject.js`.

**Interfaces:**
- `sendOffsOf(kind, events = state.events)`;
- `exclusionsOf(kind, events = state.events)`;
- `earlyEndOf(e, events = state.events)`;
- `exclusionEnd(e, events = state.events)`.

Every existing call stays as it is. No behaviour change.

- [ ] **Step 1: Write the test.** `exclusions: pure over a saved state equals the live result`: it compares the sample
  with a copy of it whose global `state` was swapped out.
- [ ] **Step 2:** run it; implement; run the suite.
- [ ] **Step 3:** commit `refactor(match): exclusions over any event list`.

**Goal checks:**
- [ ] The suite is green with no existing test edited.

### Task 1.2: Court log and on-court stamps

**Files:**
- Modify: `src/app.html`: `freshMatch`, `restartedMatch`, `commit`, `startPeriod`, `addEvent`/`makeEvent`, and a new
  "Court log" block after "History".
- Test: `tests/inject.js`.

**Interfaces:**
- `function onCourtIds(s = state) → string[]`: the keys of `s.lineups[s.phase]` plus `s.gkId`, sorted.
- `function noteCourt()`
  - Called first in `commit()`.
  - It is a no-op unless `Array.isArray(state.court) && state.setupDone && !state.sample && !state.finished`.
  - It appends `{ abs: absSeconds(), on: onCourtIds() }` when `on` differs from the last entry.
  - The same `abs` as the last entry replaces it; a lower `abs` is clamped to the last one.
- `startPeriod(n)`: when the log exists, it appends a break `{ abs: absSeconds(), on: [] }` before resetting the
  clock.
- `freshMatch` and `restartedMatch` set `court: []`. `restoreState` adds no `court`.
- `const ON_COURT_STAMPED = ['SHOT', 'RIVAL_SHOT']`, plus team `ACTION`s (`playerId == null`).
  - `addEvent` sets `e.on` for these, taken from the lineup **after** the event's own `benchSwapFor` swap.
  - Stamping happens only for matches that have a `court` log.

- [ ] **Step 1: Write the failing tests.**
  - `court: a bench substitution logs a new entry`.
  - `court: switching to defence with specialists logs the defence lineup`.
  - `court: a goalkeeper change logs`.
  - `court: undoing a bench swap logs the restored lineup`.
  - `court: the same second replaces, a clock moved back clamps`.
  - `court: half-time writes a break entry`.
  - `court: old matches and the sample get no log`.
  - `court: a shot by a bench player stamps him on court`.
  - `court: team fault stamps the players on court`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Every existing live test passes unchanged.
- [ ] **Step 5:** commit `feat(match): log who is on court`.

**Goal checks:**
- [ ] The nine tests pass.
- [ ] The `defence`, `attack-picker` and `dark` README scenes are pixel-identical to M0's (compare the files with
  `cmp`).
- [ ] The sample match state grows by less than 15 %, measured in a test with `JSON.stringify` length after 40
  stamped events.

### Task 1.3: Minutes and +/− in the «Hoja» and on the player card

**Files:**
- Modify: `src/app.html`: a new "Minutes" block, `sheetStatsHtml`, `playerMatchRow`, `playerSeason`, the player card
  tables.
- Test: `tests/inject.js`.

**Interfaces:**
- `function matchEndAbs(s) → number`: `(s.clock.period − 1) × CONFIG.halfSeconds` plus the elapsed seconds, without
  running time.
- `function minutesOnCourt(s) → Map<id, seconds> | null`
  - It integrates the log entries up to `matchEndAbs(s)`. Break entries count nothing.
  - It subtracts the 2′ windows (`exclusionsOf('SANCTION', s.events)` with `exclusionEnd(e, s.events)`) and all time
    after a send-off.
  - It returns null with no log or when the end is 0.
- `function plusMinus(s) → Map<id, number> | null`
  - `SHOT` `GOL` is +1 and `RIVAL_SHOT` `GOL` is −1 for each id in `e.on`.
  - It returns null when no goal of the match has `on`.
- `const minutesText = (sec) → '47' | '–'`, in whole minutes, rounded down.
- `playerMatchRow` gains `seconds: number | null` and `plusMinus: number | null`.
- `playerSeason.totals` gains `seconds` (the known ones only) and `plusMinus`.
- Screen table: the «Tablas» player table (`sheetStatsHtml`) gains «Min» and «+/−» after «Jugador», through a
  screen-only head. `PLAYER_HEAD` and the PDF stay unchanged until M6.3.
- Player card per-match table:
  - field players: Fecha, Rival, Res., Min, Goles, %, Pases, Pérd., +/−;
  - goalkeepers: Fecha, Rival, Res., Min, Paradas, %, 7 m, Goles.

- [ ] **Step 1: Write the failing tests.**
  - `minutes: one substitution splits the time`.
  - `minutes: a defence specialist counts defence time only`.
  - `minutes: a 2′ is not on court and a red card ends the time`.
  - `minutes: half-time and an early-ended first half are not counted`.
  - `minutes: no log gives null and the tables show –`.
  - `plus-minus: goals for and against while on court`.
  - `plus-minus: a bench player who scores counts the goal`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(match): minutes and plus-minus per player`, with `docs/`.

**Goal checks:**
- [ ] The seven tests pass.
- [ ] The `sheet-stats`, `player` and `keeper` matrix passes. At 1280×800 the per-match table does not scroll
  sideways (`.match-table` `scrollWidth ≤ clientWidth`, checked in a test).

---

## M2 — Rating engine

### Task 2.1: Features and the rating (pure)

**Files:**
- Modify: `src/app.html`: `CONFIG.rating` and a new "Rating" block after "Minutes".
- Test: `tests/inject.js`.

**Interfaces:**
- `CONFIG.rating` holds the design's proposal:
  - `{ base: 6.5, min: 3, max: 10, decimals: 1, minMinutes: 10, fullWeightMinutes: 20 }`;
  - `weights: { shot: 0.8, save: 0.35, turnover: -0.40, forcedTurnover: -0.30, ruleTurnover: -0.15, ruleFault: -0.15,
    oneOnOne: 0.30, tactical: -0.15, assist: 0.25, recovery: 0.30, block: 0.20, teamFaultField: -0.10,
    teamFaultKeeper: -0.05, yellow: -0.10, twoMin: -0.30, red: -1.00, blue: -0.50 }`;
  - `expectedSave: { '6M': .25, '9M': .40, '11M': .45, CONTRA: .20, '7M': .25 }`;
  - `vote: { max: 0.5 }`;
  - `bands: [[8, 'rt-top'], [7, 'rt-good'], [6.5, 'rt-mid'], [6, 'rt-low'], [-Infinity, 'rt-bad']]`.
- `function expectedGoal(zone) → number`: the midpoint of `CONFIG.targets[zone]` over 100.
- `function ratingFeatures(s, player) → { shotValue, saveValue, turnovers, forcedTurnovers, ruleTurnovers, ruleFaults,
  prov7, beaten, pen7c, tactical, assists, recoveries, blocks, teamFaults, yellow, twoMin, red, blue }`.
  - It reads only `s.events`. The turnover groups come from `CONFIG.turnoverGroups`.
  - `teamFaults` counts NOATK events whose `on` includes the player, or whose legacy `playerId` is the player.
- `function ratingFromFeatures(f, { keeper, weights = CONFIG.rating.weights, confidence = 1, voteShare = 0 }) →
  { value, raw }`.
  - `oneOnOne` is applied as +PROV7, −BEATEN, −PEN7C.
  - `teamFaults` uses `teamFaultKeeper` for goalkeepers.
  - The value is clamped and rounded half up to `decimals`.
- `function playerRating(s, player, { seconds, voteShare = 0, weights } = {}) → { value: number | null, raw,
  features, confidence, rated }`.
  - `rated` is false (and `value` null) when `seconds` is known and under `minMinutes`.
  - `confidence = seconds == null ? 1 : min(1, seconds / 60 / fullWeightMinutes)`.
- `function matchRatings(s, players = s.players) → Map<id, rating>`. It uses `minutesOnCourt(s)` and, from M4a,
  `s.votes`.
- `const ratingText = (r) → '7,4' | 'S/C'`; `function ratingBand(value) → 'rt-top' | … | 'rt-bad'`.
- CSS: `.rating-chip` on the M0b `--rating-*` and `--rating-ink-*` tokens, `tabular-nums`, `white-space: nowrap`,
  always holding the number or «S/C».

- [ ] **Step 1: Write the failing tests.**
  - `rating: a player who does nothing gets the base`.
  - `rating: shot value follows the zone expectation`: a miss from 6 m costs more than one from 9 m.
  - `rating: turnovers cost a lot, rule turnovers and faults a little`.
  - `rating: provoking a 7 m adds what being beaten subtracts, and 7 m committed subtracts the same`.
  - `rating: a team fault costs everyone on court, the goalkeeper less`.
  - `rating: a legacy NOATK with a player counts for that player only`.
  - `rating: goalkeeper save value`.
  - `rating: under the minimum minutes is S/C; a short spell is pulled to the base`.
  - `rating: clamped to 3–10 and rounded to one decimal`.
  - `rating: the design's three sanity examples`: 7.7, 4.4 and 7.8.
  - `rating: rating a match changes no statistic` (`liveStats`, `score` and `history` are the same).
  - `rating: every chip shows its number and meets contrast in both themes`: the text is non-empty and
    `contrastRatio(ink, fill)` is 4.5 or more for the five bands, under light and dark.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(rating): rate every player of a match`.

**Goal checks:**
- [ ] The twelve tests pass.
- [ ] `grep -n "state\." ` over the body of `ratingFeatures` and `ratingFromFeatures` finds nothing. The reviewer
  checks this.

### Task 2.2: Ratings in the season, the player card and the leaders

**Files:**
- Modify: `src/app.html`: `playerMatchRow`, `playerSeason`, `fieldCard`/`keeperCard`, `posterHtml`, `LEADER_METRICS`
  and `leaderFigure`.
- Test: `tests/inject.js`.

**Interfaces:**
- `playerMatchRow` gains `rating: number | null`, through `matchRatings(m.state)` for the row's player.
- `playerSeason` gains `rating: number | null`: the minutes-weighted mean of the rated rows, or the plain mean when
  any row has unknown minutes.
- Player card:
  - a «Nota» column with a `.rating-chip` in the per-match table;
  - the season rating chip on the poster;
  - the evolution chart keeps its bars, and its line stays the rate.
- Leaders: a new `{ key: 'rating', label: 'Nota' }` chip. It ranks by season rating and needs
  `CONFIG.leaders.minRated` rated matches (proposal 2). Its detail reads «#N · k partidos con nota».

- [ ] **Step 1: Write the failing tests.**
  - `season: rows carry the match rating, S/C under the minutes`.
  - `season: season rating is minutes-weighted`.
  - `team page: Nota leaders need the minimum rated matches`.
  - `player card: rating chips in the table and on the poster`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(rating): show ratings on cards and leaders`.

**Goal checks:**
- [ ] The four tests pass.
- [ ] The `team`, `player` and `keeper` matrix passes.

### Task 2.3: Ratings on the final screen and the provisional MVP

**Files:**
- Modify: `src/app.html`: `openFinal`, `mvpPickHtml`, `setMvp`, a new `matchMvp`, CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- `function matchMvp(s, ratings) → { id: string | null, source: 'coach' | 'votes' | 'rating' }`.
  - First `s.mvpId` with `mvpSource` `'coach'`, or missing.
  - Then (from M4a) the most votes.
  - Else the highest rated value, with ties broken by `raw`, then by dorsal.
- `setMvp(id)` sets `mvpSource = 'coach'` and clears it together with `mvpId`.
- `openFinal` gains a «Puntuaciones» section, `ratingsListHtml(s, ratings)`, before the MVP pick.
  - One row per convocado, sorted by rating with «S/C» last.
  - Each row shows the face, the name, the `.rating-chip`, Min, and two KPIs (goals/shots, or saves/on target).
  - A `<details>` per row lists the non-zero features as «Pérdidas ×2 −0,8».
- The MVP pick shows the crown on `matchMvp(...).id`, and the label «MVP provisional» when the source is `'rating'`.

- [ ] **Step 1: Write the failing tests.**
  - `final: ratings list sorted with S/C last and no NaN`.
  - `final: the provisional MVP is the top rating`.
  - `final: the coach's pick overrides and clears`.
  - `final: the breakdown lists only non-zero features`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(rating): ratings and provisional MVP at the end`, with
  `docs/`.

**Goal checks:**
- [ ] The four tests pass.
- [ ] The `final` matrix passes. At 1024×640 the final card scrolls vertically only.

---

## M3 — MVP image

### Task 3.1: Shared crown geometry

**Files:**
- Modify: `src/app.html` (`crownSvg`).
- Test: `tests/inject.js`.

**Interfaces:**
- `const CROWN = { viewBox, body: 'M10 70 L4 22 …', band, pearls: [[cx, cy]…], jewels: [[cx, cy, token]…] }`.
- `crownSvg` builds its markup from `CROWN`. Its output is byte-identical apart from ids.
- `--crown-edge` gets a dark-theme value.

- [ ] **Step 1:** write the test `crown: markup unchanged after the refactor`. It compares against a string captured
  before the change, with ids normalised.
- [ ] **Step 2:** implement; run the suite; commit `refactor(mvp): share the crown geometry`.

**Goal checks:**
- [ ] The test passes.
- [ ] The `team` and `player` dark screenshots show the crown edge.

### Task 3.2: MVP card renderer

**Files:**
- Modify: `src/app.html`, a new "Share images" block.
- Test: `tests/inject.js`.

**Interfaces:**
- `const MVP_CARD = { w: 1080, h: 1350, faceR, crownAngleDeg: -34, … }`. Every size is named here.
- `function mvpCardData(s, playerId, ratings) → { name, num, pos, photo, rating, band, kpis: [[label, value]…],
  title, score, date, venue, crest, brand, brand2, brandInk }`.
  - Field KPIs: Goles «g/t», % tiro, Pases de gol, Nota.
  - Goalkeeper KPIs: Paradas «s/o», % paradas, 7 m parados, Nota.
- `function loadImage(src) → Promise<HTMLImageElement>`. It rejects with a clear `Error`.
- `function fitText(ctx, text, maxWidth) → string`: ellipsis.
- `function drawMvpCard(canvas, data, images)`.
  - Canvas 2D: a brand gradient background; the face clipped to a circle, or initials on `--por` when there is no
    photo; the crown from `new Path2D(CROWN.body)` rotated −34°; the rating badge in its band colour; the KPI tiles;
    the score line and the crest.
  - Theme-independent colours come from the team brand and a fixed palette constant.
- `async function mvpCardBlob(data) → Blob` (`image/png`).

- [ ] **Step 1: Write the failing tests.**
  - `mvp image: field and keeper KPIs`.
  - `mvp image: a PNG of 1080×1350` (`createImageBitmap(blob)` gives the size).
  - `mvp image: no photo draws initials`.
  - `mvp image: a long name is fitted`.
  - `mvp image: a broken photo still gives an image`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(mvp): draw the MVP card`.

**Goal checks:**
- [ ] The five tests pass.
- [ ] The new `mvp-image` scene saves the PNG itself to `<out>/mvp-field.png` and `mvp-keeper.png`. The reviewer
  compares them with the goalkeeper mockup's crown and with the Sofascore look (face circle, rating badge, KPI row).

### Task 3.3: Always generated at the end; share sheet

**Files:**
- Modify: `src/app.html`: `openFinal`, `finishMatch`, `shareReports`, the `$('final')` click handler.
- Test: `tests/inject.js`.

**Interfaces:**
- `async function shareFiles(files, title, text) → 'shared' | 'cancelled' | 'unsupported'`, extracted from
  `shareReports`, which now uses it.
- `ui.mvpCardUrl`: the object URL of the preview, revoked when the final screen re-renders or closes.
- `async function renderMvpPreview()`: after `openFinal`, it builds the card for `matchMvp` and fills `#mvp-preview`.
  It runs on every `openFinal`, so the card is always generated.
- `async function shareMvpCard()`: `shareFiles([png])`, falling back to `offerFile`.
- Buttons `data-final-mvp-share` («Compartir MVP»), and `data-final-ratings-share` («Compartir puntuaciones»,
  Task 3.4).

- [ ] **Step 1: Write the failing tests.**
  - `final: finishing a match shows the MVP preview`.
  - `final: re-rendering revokes the old preview URL`.
  - `final: share falls back to a download when files cannot be shared`.
  - `final: shareReports still shares through shareFiles`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(mvp): generate and share the MVP card`.

**Goal checks:**
- [ ] The four tests pass.
- [ ] The `final` matrix shows the preview.

### Task 3.4: Ratings card for the group

**Files:**
- Modify: `src/app.html` ("Share images").
- Test: `tests/inject.js`.

**Interfaces:**
- `function ratingsCardData(s, ratings) → { title, score, rows: [{ num, name, rating, band, line }] }`, sorted like
  the final list.
- `function drawRatingsCard(canvas, data)`: 1080 wide, height `RATINGS_CARD.head + rows × RATINGS_CARD.row`.
- `async function ratingsCardBlob(data) → Blob`.

- [ ] **Step 1: Write the failing tests.**
  - `ratings image: one row per convocado, S/C last`.
  - `ratings image: height grows with the squad`.
- [ ] **Step 2:** implement; run the suite; run `build_site.py`.
- [ ] **Step 3:** commit `feat(mvp): share every rating as an image`, with `docs/`.

**Goal checks:**
- [ ] The two tests pass.
- [ ] The scene PNG is readable at phone width: names ≥ 36 px tall in the image.

---

## M4a — MVP vote, counted by the coach

### Task 4a.1: Vote counts, bonus and the MVP from votes

**Files:**
- Modify: `src/app.html`: `matchRatings`, `matchMvp`, `openFinal`, a new "Votes" block, `restoreState` defaults
  (none; `votes` stays optional).
- Test: `tests/inject.js`.

**Interfaces:**
- `state.votes = { tally: { [id]: n }, voters: n, updatedAt }`, created on the first edit. It is not an event and is
  saved with `save()`.
- `function setVoteCount(playerId, n)` and `function setVoters(n)`. Integers from 0 to `CONFIG.votes.maxVoters`
  (proposal 12). The tally total can never exceed `voters`; an attempt is refused through `finalStatus`.
- `voteShare(s, id) = voters ? tally[id] / voters : 0`, passed by `matchRatings` to `playerRating`.
- `matchMvp`, source `'votes'`: the most votes, with ties broken by rating. A coach override still wins.
- «Votación MVP» on the final screen:
  - a voters stepper;
  - a −/+ stepper per candidate;
  - the text «Comparte las puntuaciones en el grupo de capitanes, crea una encuesta de WhatsApp y apunta aquí los
    votos.»
  - Re-rendering keeps the typed e-mail, as `setMvp` does today.

- [ ] **Step 1: Write the failing tests.**
  - `votes: counts add a bonus proportional to the share`.
  - `votes: the most-voted player becomes MVP, ties by rating`.
  - `votes: votes can never exceed the voters`.
  - `votes: the coach's pick overrides the votes`.
  - `votes: votes change no statistic and no history`.
  - `votes: old matches without votes rate as before`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(mvp): count the MVP votes`, with `docs/`.

**Goal checks:**
- [ ] The six tests pass.
- [ ] The `final` matrix passes.
- [ ] The MVP preview updates after a vote change: a test checks that the preview URL changed.

---

## M5 — Visual pages

### Task 5.1: «Hoja» Resumen

**Files:**
- Modify: `src/app.html`: `SHEET_TABS`, `SHEET_RENDERERS`, a new `sheetSummaryHtml`, `ui.sheetTab` default, the
  «Ver Hoja» handlers, CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- `SHEET_TABS`: «Resumen» · «Tablas» (today's `stats`) · «Análisis» · «Portero» · «Acta y plantilla» · «Informes
  PDF». The default and «Ver Hoja» open `summary`.
- `function matchFigures(s) → { goals, shots, shooting, miss6, miss9, turnovers, recoveries, saves, onTarget,
  savePct }`.
  - Pure.
  - `miss9` counts the 9M and 11M zones.
  - The summary and M6 both use it. Its numbers equal `liveStats()` for the live state; a test checks this.
- `sheetSummaryHtml()`:
  - KPI tiles: Goles, % tiro, Fallos 6 m, Fallos 9 m, Pérdidas, Recuperaciones, % paradas, coloured through `rate()`
    and the `CONFIG.targets` keys;
  - two `zoneMapSvg` cards (our shots; rival shots on our goalkeepers);
  - two `goalRateSvg` cards;
  - a player strip of face cards with the rating chip, Min, +/− and the key figure. Tapping a card opens the existing
    player PDF pick on the «Informes» tab.

- [ ] **Step 1: Write the failing tests.**
  - `sheet: Resumen is the first tab and shows the seven KPIs`.
  - `sheet: matchFigures equals liveStats for the sample`.
  - `sheet: failed shots split 6 m and 9 m (+11 m counts as 9 m)`.
  - `sheet: summary with no events shows dashes, no NaN`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(sheet): open the Hoja on a visual summary`.

**Goal checks:**
- [ ] The four tests pass.
- [ ] The `sheet-summary` matrix passes. At 1024×640 the KPI tiles fit in one or two rows, with no sideways scroll.

### Task 5.2: Half-time and final layout

**Files:**
- Modify: `src/app.html`: `openHalftime`, `openFinal`, `kpiTilesHtml`, CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- A shared `finalHeadHtml()`: both crests, the score, and the period or «Final».
- Half-time: the KPI tiles plus Fallos 6 m and 9 m, the three players with the most turnovers, and the key points.
- Final order: head → KPI tiles → MVP preview and share → Puntuaciones → Votación → MVP pick → detail → reports.
- Card sections use `.sheet-card` and the team-page spacing.

- [ ] **Step 1: Write the failing tests.**
  - `halftime: shows failed shots 6 m and 9 m and the top turnovers`.
  - `final: sections in order`.
- [ ] **Step 2:** implement; run the suite.
- [ ] **Step 3:** commit `style(final): lay out half-time and final`.

**Goal checks:**
- [ ] The tests pass.
- [ ] The `final` and `halftime` matrix passes. The reviewer compares them with the team-page look.

### Task 5.3: Match list cards and profile

**Files:**
- Modify: `src/app.html`: `matchesHtml`, `profileHtml`, CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- `function matchCardHtml(m)`: a result chip (G/E/P, or the status for setup and live), the score, the rival, the
  date and venue, «sin subir», and the MVP face with the crown when `home.season` holds that match.
  - It keeps every `data-open-match`, `data-restart-match` and `data-delete-match` attribute and the armed buttons.
- The match list is a responsive grid: three columns at 1280 and two at 1024.
- The profile shows team cards with crest and brand colours, a template list and an account card in the same grid.

- [ ] **Step 1: Write the failing tests.**
  - `matches: one card per match with its actions`.
  - `matches: MVP face when the season knows it`.
  - Every existing match-list test passes unchanged.
- [ ] **Step 2:** implement; run the suite.
- [ ] **Step 3:** commit `style(home): match cards and profile layout`.

**Goal checks:**
- [ ] The tests pass.
- [ ] The `matches` and `profile` matrix passes.

### Task 5.4: Layout minors and release

**Files:**
- Modify: `src/app.html` (CSS, chart builders); `docs/`.
- Test: `tests/inject.js`.

**Interfaces:** none new. The work:
- radar and evolution font sizes, radii and opacities become named constants;
- `NEAR_LABEL_RADIUS` gets a comment;
- far-wing labels stop being clamped into the near band;
- (keeper ring contrast: done in M0b.4)
- the duplicated `.leaders .chip` CSS is removed;
- the style-leak test checks the pressed chip;
- the per-match table fits at 1280 with the new columns.

- [ ] **Step 1: Write the failing tests.**
  - `layout: every home page and sheet tab has no horizontal overflow`, over all views.
  - `layout: pressed leader chip keeps the global chip look`.
- [ ] **Step 2:** implement.
- [ ] **Step 3:** run the full matrix for all scenes.
- [ ] **Step 4:** run `build_site.py`, then commit `style(app): layout pass for the visual pages`, with `docs/`.

**Goal checks:**
- [ ] The full matrix probe passes.
- [ ] The milestone gate's reviewer signs off each scene.

---

## M4b — MVP vote by links (after coach decisions 1–2)

### Task 4b.1: Schema and RPCs

**Files:**
- Modify: `supabase/schema.sql`, `supabase/README.md`.
- Create: `supabase/checks/votes.sql`, a manual check script: it creates a poll and ballots, then tries anon table
  reads, a closed poll, a wrong candidate and a double vote, and states the expected outcomes.

**Interfaces:**
- Tables `mvp_polls` and `mvp_ballots`, the helper `private.is_poll_member(uuid)`, and the RPCs
  `public.get_ballot(p_token text) → json` and `public.cast_vote(p_token text, p_player uuid) → json`, exactly as in
  the design (RLS, grants, the token hash, the window and candidate checks).
- `teams.voters jsonb` with its check.
- `cast_vote` errors: `poll_closed`, `not_a_candidate`, `unknown_ballot`, and `already_voted` when decision 2 forbids
  changes.

- [ ] **Step 1:** write the SQL and the check script.
- [ ] **Step 2:** the orchestrator, **with the coach's approval**, runs it on a Supabase branch (`create_branch`),
  runs `checks/votes.sql`, and reads `get_advisors` for security.
- [ ] **Step 3:** commit `feat(db): MVP polls and ballots`.

**Goal checks:**
- [ ] Every expected outcome in `checks/votes.sql` matches on the branch.
- [ ] The security advisors report no new warning.
- [ ] The schema still runs twice without error.

### Task 4b.2: Ballot links and the vote page

**Files:**
- Modify: `src/app.html`: both backends, the boot, a new "Vote" block, the final screen.
- Test: `tests/inject.js`.

**Interfaces:**
- Backend:
  - `createPoll({ matchId, candidates, voters, closesAt }) → [{ label, role, url }]`. Supabase only. The local
    backend throws «la votación por enlace necesita una cuenta y conexión».
  - `getBallot(token) → { title, closesAt, candidates, voted }`.
  - `castVote(token, playerId) → { voted }`.
  - `listPollTallies(teamId) → [{ matchId, tally, voters, closesAt }]`.
- `function newBallotToken() → string`: 16 bytes from `crypto.getRandomValues`, base64url.
  `async function tokenHash(token) → Uint8Array`, through `crypto.subtle.digest('SHA-256')`.
- Boot: a `#vote=<token>` fragment runs `startVote(token)` instead of `startHome()`. It needs no login. It clears the
  fragment from the history after reading it (`history.replaceState`).
- `voteHtml(ballot)`:
  - the match title;
  - candidate buttons with dorsal, court name and rating chip;
  - a confirmation;
  - the closed and already-voted states;
  - every string escaped.
- Final screen «Enviar votación»:
  - pick the voters from `team.voters` (editable, saved through `updateTeam`) and the closing time
    (`CONFIG.votes.closeHours`, proposal 48);
  - create the poll;
  - share each link with `navigator.share({ title, text, url })`, falling back to copying it to the clipboard.
- Tallies: `openFinal` and `loadSeason` merge `listPollTallies` into `state.votes` / `m.state.votes`. The open match
  is saved when its tally changed.

- [ ] **Step 1: Write the failing tests** (async, with a stub backend that implements the four calls in memory).
  - `vote: a link opens the ballot without login and votes once`.
  - `vote: closed poll and unknown link show their messages`.
  - `vote: candidate names are escaped`.
  - `vote: the token is in the fragment and never in the backend call except hashed on create`.
  - `vote: tallies merge into the match and move the MVP`.
  - `vote: the local backend explains that links need an account`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(mvp): vote by personal link`, with `docs/`.

**Goal checks:**
- [ ] The six tests pass.
- [ ] The new `vote` scene (stub ballot) passes the matrix at phone-ish width too (390×844, added for this scene
  only).
- [ ] A manual end-to-end run on the Supabase branch: the coach creates a poll, votes from a second browser profile,
  and the tally appears.

---

## M6 — Team dashboards and coaches' feedback

### Task 6.1: Attack types and goals after our turnover

**Files:**
- Modify: `src/app.html`: `CONFIG.attackTypes` and a new "Attack types" block.
- Test: `tests/inject.js`.

**Interfaces:**
- `CONFIG.attackTypes = { quickRestartSeconds: 15 }`; `const ATTACK_TYPES = { POS: 'Posicional', CONTRA:
  'Contraataque', SAQUE: 'Saque rápido' }`.
- `function attackType(e, events) → 'POS' | 'CONTRA' | 'SAQUE'`, for `SHOT` and `RIVAL_SHOT`, following the design's
  rules.
- `function afterOurTurnover(e, events) → boolean`, for `RIVAL_SHOT`: the previous possession-ending event is our
  `TURNOVER`.
- `function attackTypeRows(events, side: 'us' | 'them') → [{ type, shots, goals, pct }]`.

- [ ] **Step 1: Write the failing tests.**
  - `attack types: contra flags win`.
  - `attack types: a shot within the restart window after a rival goal is a quick restart`.
  - `attack types: a turnover in between makes it positional`.
  - `attack types: rival goal after our turnover counts, after our shot does not`.
  - `attack types: works on the sample and an old match without new fields`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(stats): attack types and goals after turnovers`.

**Goal checks:**
- [ ] The five tests pass.

### Task 6.2: «Estadísticas» team dashboard

**Files:**
- Modify: `src/app.html`: `homeHeadHtml` (a third tab, «Estadísticas»), `HOME_VIEWS`, a new "Team dashboard" block,
  CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- Home view `stats`: `teamStatsHtml()`. It loads like the team page, through `showTeamPage`'s season.
- `function teamMatchRow(m) → { id, date, them, result, scoreUs, scoreThem, ...matchFigures(m.state),
  attack: attackTypeRows(m.state.events, 'us'), against: attackTypeRows(…, 'them'), afterTurnoverGoals,
  keepers: [{ id, saves, onTarget }] }`.
- `function turnoversByPlayer(matches, roster) → [{ player, total, byType: { [subtype]: n } }]`, sorted by total.
- `function seasonPlayerTable(matches, roster) → [{ player, played, seconds, plusMinus, rating, goals, shots,
  turnovers }]`.
- `function trendSvg(rows, series: [{ key, label, token }], kind: 'bars' | 'line')`, generalised from `evolutionSvg`,
  which keeps its signature by calling it.
- Cards:
  - Tendencia (goles a favor y en contra);
  - Tiro (% per match, and failed shots 6 m and 9 m);
  - Tipos de ataque (ours and theirs);
  - Goles tras pérdida;
  - Portería (save % per keeper per match, plus the season `zoneMapSvg`);
  - Pérdidas por jugador (bars split by type);
  - Jugadores (a table sortable by `data-sort`).

- [ ] **Step 1: Write the failing tests.**
  - `stats: tab opens the dashboard`.
  - `stats: per-match rows add up to the season totals of teamSeason`.
  - `stats: turnovers belong to the player who lost the ball`.
  - `stats: player table shows – for unknown minutes and plus-minus`.
  - `stats: no matches shows the empty text and no NaN`.
  - `stats: evolutionSvg output unchanged through trendSvg`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(stats): season dashboard for the team`.

**Goal checks:**
- [ ] The six tests pass.
- [ ] The new `stats` scene passes the matrix.

### Task 6.3: PDF audit and fixes

**Files:**
- Modify: `src/app.html` (PDF builders, `PLAYER_HEAD`, `playerRow`).
- Test: `tests/inject.js`.
- Tool: `pdftoppm`, for review images only. Nothing is committed under `tools/`.

**Interfaces:**
- Audit first. The implementer renders `buildPdf('match')` and `buildPdf('players')` for the sample and for the
  fixture's largest match, with jsPDF online. It converts every page with `pdftoppm -png -r 110` and lists the
  defects. Known candidates:
  - the player table shows «lanz./gol» (shots/goals) while the app shows goals/shots;
  - 20 or more columns squeeze the table;
  - headers wrap mid-word;
  - a table title is orphaned at the bottom of a page;
  - characters are dropped by `pdfText`.
  The coach's own examples, when provided, are added to the list.
- Fixes:
  - every «x/y» reads goals/shots;
  - explicit `columnStyles` widths;
  - `rowPageBreak: 'avoid'`, and a title kept with its table;
  - new columns Min, +/− and Nota in `PLAYER_HEAD` and `playerRow`;
  - an «Tipos de ataque» table and a «Pérdidas por jugador» table on the match report.

- [ ] **Step 1: Write the failing tests.**
  - `pdf: every player row has as many cells as PLAYER_HEAD`.
  - `pdf: zone cells read goals/shots`.
  - `pdf: attack-type and turnover-by-player rows add up`.
  These test the pure row builders, which run offline.
- [ ] **Step 2:** implement.
- [ ] **Step 3:** re-render the pages to PNG and attach them to the report.
- [ ] **Step 4:** run `build_site.py`, then commit `fix(pdf): table formats and new columns`, with `docs/`.

**Goal checks:**
- [ ] The tests pass.
- [ ] The reviewer inspects every page PNG: no truncated cell, no orphaned title, consistent goals/shots.

---

## M7 — Rating tuning

### Task 7.1: Weights per team

**Files:**
- Modify: `src/app.html` (backends, `toTeam`/`teamRow`, the "Rating" block); `supabase/schema.sql` (`teams.rating_weights`,
  with its check).
- Test: `tests/inject.js`.

**Interfaces:**
- `const RATING_KNOBS = [{ key, label, group, min, max, step }]`. Keys are `CONFIG.rating.weights` names, but
  `oneOnOne` is a single knob, and `teamFaultKeeper` is expressed as a share of `teamFaultField` (0–1). That way the
  coach's relations cannot be broken.
- `function ratingWeights(t = team) → weights`: `CONFIG.rating.weights` merged with the validated `t.ratingWeights`.
  Unknown keys are dropped and out-of-range values clamped, each with `console.warn`.
- `matchRatings` and `playerRating` use `ratingWeights()` by default.
- Backends: `updateTeam` carries `ratingWeights`. Supabase maps it to `rating_weights`. The local backend stores it
  on the team.

- [ ] **Step 1: Write the failing tests.**
  - `weights: defaults when the team has none`.
  - `weights: unknown keys dropped, values clamped`.
  - `weights: keeper team fault stays below the field one`.
  - `weights: saved weights reload through the local backend`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** commit `feat(rating): weights per team`.

**Goal checks:**
- [ ] The four tests pass.
- [ ] The schema runs twice.

### Task 7.2: Tuning view with a live preview

**Files:**
- Modify: `src/app.html`: a new home view `rating-tune`, a team-page button «Ajustar puntuación», CSS.
- Test: `tests/inject.js`.

**Interfaces:**
- `home.weightsDraft`. `function rosterRatingPreview(matches, roster, weights) → [{ player, current, next, delta,
  last }]`.
  - It computes `ratingFeatures` once per player and match, caching them in `home.ratingFeatureCache`, which is
    cleared with `home.season`.
  - Every knob change only recombines through `ratingFromFeatures`.
- `ratingTuneHtml()`:
  - knobs grouped Tiro/Portería, Pérdidas, Faltas, 1x1/7 m, Acciones, Equipo, Sanciones, each a range plus a number
    input;
  - the preview table sorted by `next`, with `delta` coloured;
  - «Guardar» (`updateTeam`), «Restablecer» (defaults) and «Cancelar».
- Re-rendering on `input` must not lose focus: update only the preview tbody and the knob's value.

- [ ] **Step 1: Write the failing tests.**
  - `tune: raising the turnover weight lowers a player with turnovers by the expected amount`.
  - `tune: preview recombines without recomputing features` (count the `ratingFeatures` calls).
  - `tune: save persists and the team page uses the new ratings`.
  - `tune: reset restores the defaults`.
  - `tune: input keeps focus`.
- [ ] **Step 2:** run them. Expected: FAIL.
- [ ] **Step 3:** implement.
- [ ] **Step 4:** run the suite. Expected: PASS.
- [ ] **Step 5:** run `build_site.py`, then commit `feat(rating): tune the weights with a preview`, with `docs/`.

**Goal checks:**
- [ ] The five tests pass.
- [ ] The new `tune` scene passes the matrix.
- [ ] The coach changes one knob in a session and sees the preview move. This is a milestone-gate acceptance check.
