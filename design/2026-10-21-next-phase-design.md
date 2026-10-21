# Next phase — ratings, MVP vote, visual pages, team dashboards — design

Date: 2026-10-21 · Status: draft for the coach's approval. Builds on `feat/team-pages`
(`design/2026-10-21-team-and-player-pages-design.md`). Weights and thresholds below are **proposals to tune**
with the coach; the relations he fixed (memory: rating rules, 2026-10-20) are not.

## Intent

The coach wants, in this order:
1. A Sofascore-style **rating** per player and match, the **MVP vote** of captains and coaches feeding the match MVP,
   and an **MVP image** generated at the end of every match, ready for WhatsApp through the share sheet.
2. **Visual pages**: the «Hoja», half-time, final summary, match list and profile in the look of the new team page and
   player card. The «Hoja» leads with its main KPIs (failed shots from 6 m and 9 m, shooting %, turnovers,
   recoveries, save %) instead of tabs of tables.
3. **Team dashboards** for the season, plus the other coaches' feedback: PDF table format errors, +/− per player,
   positional attack vs. counter-attack vs. quick centre restart vs. goals after our turnover, and turnovers by the
   player who lost the ball (location does not matter).
4. **Rating tuning**: the coach adjusts the weights and sees the effect on the roster.

Added 2026-10-21, after approval (amendment):
5. A **design-system refresh**, so every later page is built on one set of tokens, type roles and checks.
6. A **match calendar** from the federation calendar: next match, all rounds, matches linked to their round.
7. **Attendance** (faltas de asistencia) per player and session, on the player card and the team page.
8. A **per-match drill-down** on the player card: that match's shots and goal placement, then the match itself,
   filtered to the player.

Everything rests on one missing fact: **who was on court, and when**. Lineup changes (`swapInLineup`,
`substituteFromBench`, `benchSwapFor`, the bench and token drag handlers, `state.gkId` changes, `setPhase`) mutate
`state.lineups` but leave no record. Minutes, +/− and the «Falta de contundencia» share all need it, so the
substitution log comes first.

## Milestones (each ships on its own, in this order)

| # | Milestone | Ships | Needs |
|---|---|---|---|
| M0 | Groundwork | Screenshot matrix tool and season fixture; the deferred minors worth doing | — |
| M0b | Design system | Semantic tokens, type roles, spacing, radii, rings, motion, focus, touch targets; contrast/touch/motion probe | M0 |
| M0c | Player match drill-down | Tap a match on the player card: shots and goal placement; open the match on a «Jugador» tab | M0b |
| M0d | Match calendar | `fixtures` table, calendar import, «Próximo partido» and «Calendario» cards, matches linked to rounds | M0b |
| M0e | Attendance | Sessions with Presente/Falta/Justificada/Lesionado, quick entry by faces, rates on card and team page | M0b (M0d for match days) |
| M1 | Substitution log, minutes, +/− | Min and +/− in the «Hoja» tables and on the player card | M0 |
| M2 | Rating engine | A rating per player and match: final screen, player card, leaders | M1 |
| M3 | MVP image | A 1080×1350 MVP card and a ratings card, generated at the end and shared from the share sheet | M2 |
| M4a | MVP vote, counted by the coach | Vote counts typed on the final screen; vote bonus; MVP from the votes | M2 (M3 for sharing) |
| M5 | Visual pages | «Hoja» Resumen, half-time, final, match list, profile; layout minors | M2 |
| M4b | MVP vote by links | One link per voter, opened from WhatsApp, with no account; tallies flow back | M4a + coach decisions 1–2 |
| M6 | Team dashboards and coaches' feedback | «Estadísticas» home tab, attack types, after-turnover goals, turnovers by player, PDF fixes | M1, M2 |
| M7 | Rating tuning | Weights editor with a live roster preview, saved per team | M2 |

M0b–M0e need no coach decision and run before the rating work. M1 stays right before M2. M4b waits for the coach's
answer on how votes travel. M5 may run before it.

### Goals per milestone

- **M0**
  - `tools/screenshots.py` takes any scene at 1280×800 and 1024×640, in light and dark.
  - A probe makes the tool fail when a page scrolls sideways or shows `NaN` or `undefined`.
  - A season fixture (4 matches, photos, an MVP) feeds every home scene.
  - The deferred minors listed in the plan are closed.
- **M0b**
  - Components on the home pages, the «Hoja» and the final screen use semantic tokens. The live screen keeps every
    token name and value it reads, and its README screenshots are byte-identical.
  - Text uses five type roles on `system-ui`. Every number is `tabular-nums`. Spacing follows a 4 px scale. Radii
    come from a scale and nested radii are concentric.
  - Light cards get a 3-layer ring shadow and dark cards a single ring. Photos get a neutral 1 px outline.
  - Motion has named durations and easings, and a `prefers-reduced-motion` branch. Hover effects sit inside
    `@media (hover: hover)`.
  - Every control outside the live screen is at least 44×44 px and shows a `:focus-visible` ring.
  - The matrix probe reports no contrast failure, no small target and no running motion under reduced motion, in
    both themes.
  - Rating-band tokens exist for M2: 600-level fills, numerals at 4.5:1 or better, adjacent bands differing in
    lightness, with separate dark values.
- **M0c**
  - Tapping a row in the player card's per-match table opens that match for the player.
  - Field players see every shot's origin and its path to the goal, plus goal grids. Goalkeepers see the rival shots
    they faced, saves against goals.
  - «Abrir el partido» opens the match's «Hoja» on a new «Jugador» tab filtered to that player. «Volver» returns to
    the card.
  - The season zone map is unchanged, and so are the PDF pages and the CBMLEPE report.
- **M0d**
  - The calendar file is imported from «Editar equipo» and stored in Supabase, with a device copy for offline use.
  - The team page shows «Próximo partido» (round, weekend or exact date and time, rival, home or away) and
    «Calendario» (all rounds; played ones with a result chip that opens the match; the current week ringed and
    labelled «Esta semana»).
  - The coach can set a fixture's exact date, time and venue. «+ Nuevo partido» from a fixture fills in the rival,
    date and venue, and links the match back to the fixture.
  - Existing matches link to their round automatically. CBMLEPE (17 Oct) links to round 1.
- **M0e**
  - Sessions are «Entreno» or «Partido». Each player is Presente by default, or Falta, Justificada or Lesionado, with
    an optional note.
  - The quick-entry view opens on today: tap a face to change its status. Sessions are stored in Supabase with an
    offline device copy.
  - On a match day the convocados are present. Other players read «No convocado» unless the coach marks them.
  - The player card shows the attendance % and the counts. The team page shows a summary and «Más faltas». The squad
    card shows each player's %.
- **M1**
  - Every new match keeps a court log.
  - Each shot, rival shot and team fault records who was on court.
  - Minutes and +/− are exact for new matches and «–» for old ones.
  - The live screen gains no tap and no visible change.
- **M2**
  - `playerRating` gives the same figure everywhere (final screen, player card, leaders, later the image and the
    ballots).
  - It is pure, explainable through its breakdown, and never changes a statistic.
  - Players under the minutes threshold read «S/C».
- **M3**
  - Finishing a match always produces the MVP card: face in a circle, the crown tilted −34°, the rating, 3–4 KPIs, the
    score and the crest.
  - «Compartir MVP» opens the share sheet, or downloads where sharing files is not supported.
  - A second image lists every player's rating, for the captains' group.
- **M4a**
  - The coach types the votes and the number of voters.
  - The vote bonus updates the ratings.
  - The MVP follows the votes, unless the coach overrides it.
- **M5**
  - The «Hoja» opens on «Resumen»: KPI tiles, zone maps, goal grids and a player strip (rating, min, +/−).
  - Half-time and final share that look.
  - The match list becomes cards.
  - No horizontal scroll and no NaN at either size or theme.
- **M4b**
  - The coach sends one link per voter from the final screen.
  - A voter opens it with no account, sees the candidates and their ratings, votes once and gets a confirmation.
  - The coach's app pulls the tallies into the match.
- **M6**
  - An «Estadísticas» tab shows per-match trends:
    - goals for and against;
    - shooting %, and failed shots from 6 m and 9 m;
    - save % per goalkeeper;
    - turnovers.
  - It also shows the attack-type split for both sides, rival goals after our turnover, turnovers by player and by
    type, and a season player table (matches, min, +/−, rating, goals/shots, turnovers).
  - The PDF tables are fixed and gain Min, +/− and Nota.
- **M7**
  - The coach moves a few grouped knobs and sees each player's season and last-match rating change, with the
    difference, before saving.
  - The coach's fixed relations cannot be broken from the editor.

## Data model changes

### Match state (the JSON stored in `matches.state`)

| Field | Shape | Rules |
|---|---|---|
| `courtSets` | `string[][]`, optional | **M1 (ruling at review).** Append-only table of distinct sorted lineups (field ids plus `gkId`). Log entries and event stamps point into it by index, which keeps the state small with UUID ids (about +16 % instead of +170 %). Undo never removes a set. |
| `court` | `[{ abs: number, set: number \| null }]`, optional | **M1.** Present only on matches created or restarted after M1 (`freshMatch`, `restartedMatch` set `[]`). `restoreState` never adds it, so old matches stay "minutes unknown". `set` indexes `courtSets` (the field ids in `lineups[phase]` plus `gkId`, sorted); `set: null` is a break (half-time). A player serving a 2′ stays in the log; minutes subtract the exclusion window. Appended by `noteCourt()` inside `commit()` when the set changes. An entry at the same `abs` replaces the last one. An `abs` lower than the last one (clock moved back) is clamped to it. Nothing is logged for the sample, during setup or after `finished`. |
| event `on` | `number` (index into `courtSets`), optional | **M1.** Added to `SHOT`, `RIVAL_SHOT` and team `ACTION` events (`playerId: null`) when they are created. It is taken **after** the event's own bench swap (`opts.bringOn`), so a bench player who shoots counts as on court. A player serving an exclusion is left out. Undo and redo keep it, because it is part of the event. |
| `mvpSource` | `'rating' \| 'votes' \| 'coach'`, optional | **M4a.** Why `mvpId` holds its value. A coach tap sets `'coach'` and wins over the votes until cleared. Missing means `'coach'` when `mvpId` is set (old matches). |
| `votes` | `{ tally: { [playerId]: number }, voters: number, updatedAt: string }`, optional | **M4a.** Typed by the coach, or (M4b) copied from the server's tallies. It is not an event, like `mvpId`. |

```markdown
### Design tokens (M0b, CSS only)

- **Kept as they are:** every existing custom property: `--bg`, `--surface`, `--soft`, `--line`, `--fg`, `--muted`,
  `--faint`, `--brand*`, `--gol`, `--parada`, `--fallo`, `--act-good`, `--act-def`, `--act-bad`, `--act-rule`,
  `--act-rival`, the position colours, `--radius` and `--tap`. The live screen keeps reading them, and their values
  do not change.
- **Semantic layer:** each token aliases an existing one, or is new where nothing fits.
  - Colour: `--color-bg-page`→`--bg`, `--color-bg-surface`→`--surface`, `--color-bg-subtle`→`--soft`,
    `--color-border`→`--line`, `--color-text`→`--fg`, `--color-text-secondary`→`--muted`,
    `--color-accent`→`--brand`, `--color-on-accent`→`--brand-ink`.
  - `--color-text-tertiary` is new: it passes 4.5:1 on `--surface` in both themes. `--faint` stays for the live
    screen and for non-text marks.
- **Type roles:** body roles use `--font-body` (system-ui); numbers keep `--font-display`.

  | Role | Size / line height / weight |
  |---|---|
  | `--type-display` | 2.25rem / 1.1 / 600 |
  | `--type-title` | 1.5rem / 1.2 / 600 |
  | `--type-heading` | 1.125rem / 1.3 / 600 |
  | `--type-body` | 1rem / 1.5 / 400 |
  | `--type-caption` | 0.8125rem / 1.4 / 400 |
  | `--type-kpi` | 2.125rem / 1.05 / 800, display font |

- **Spacing:** `--space-1`…`--space-12` = 4, 8, 12, 16, 20, 24, 32, 40, 48 px (only these steps).
- **Radii:** `--radius-sm` 8, `--radius-md` 12, `--radius-lg` 16, `--radius-xl` 24, `--radius-full` 9999px.
  Concentric rule: outer = inner + padding (+ border). It is skipped beyond 24 px padding.
- **Elevation:**
  - Light `--ring`: `0 0 0 1px rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06), 0 2px 4px 0 rgba(0,0,0,.04)`.
    `--ring-hover` uses .08/.08/.06.
  - Dark `--ring`: `0 0 0 1px rgba(255,255,255,.08)`. `--ring-hover` uses .13.
  - Ringed cards keep `border: 1px solid transparent` for forced-colours mode.
- **Photo outline:** `--photo-outline` is `rgba(0,0,0,.1)` light and `rgba(255,255,255,.1)` dark. It is drawn as an
  `outline` with `-1px` offset, outside the live screen.
- **Motion:** `--dur-press` 150ms, `--dur-state` 200ms, `--dur-enter` 300ms, `--dur-exit` 150ms;
  `--ease-out: cubic-bezier(0.2, 0, 0, 1)`.
  - Transitions name their properties (never `all`) and animate only `opacity`, `transform` and colours.
  - Translate and scale effects live inside `@media (prefers-reduced-motion: no-preference)`. The existing
    reduced-motion block stays.
- **Focus:** `--focus-ring: 2px solid var(--parada)`, offset 2px, on `:focus-visible` for buttons, links, inputs,
  selects, summaries and `[tabindex]`. The live screen's existing 3px button ring stays.
- **Rating bands:** `--rating-{top,good,mid,low,bad}` with `--rating-ink-{…}`, and separate dark values.
  - Light proposal: top `#1d4ed8` with white numerals, good `#15803d` white, mid `#ca8a04` dark ink, low `#ea580c`
    dark ink, bad `#dc2626` white. Fills are at the 600 step, 700 where white numerals need it.
  - The test is the contract: numerals at 4.5:1 or better; each fill at 3:1 or better against `--surface`; adjacent
    bands at a luminance contrast of 1.3 or more; checked in both themes.

### Fixtures (M0d), table `public.fixtures`

| Column | Rules |
|---|---|
| `id uuid pk default gen_random_uuid()` | |
| `team_id uuid not null → teams on delete cascade` | RLS `fixtures_all`: `private.is_team_member(team_id)`, using and with check |
| `season text not null` | 4–9 chars, e.g. `2026/2027` |
| `competition text not null default ''` | ≤ 120 chars |
| `round int not null` | 1–60; `unique (team_id, season, competition, round)` |
| `weekend date not null` | The round's reference Sunday |
| `home boolean not null` | |
| `opponent text not null` | 1–60 chars, as written by the federation |
| `kickoff timestamptz null` | Set during the match week; entered as device local time |
| `venue text null` | ≤ 80 chars |
| `match_id uuid null → matches on delete set null` | The with check also requires the match to belong to `team_id` |
| `updated_at timestamptz default now()` | Uses `touch_updated_at` (trigger needs `updated_by`, so the column is added too) |

- Index on `(team_id, weekend)`. No anon access.
- JS shape: `{ id, season, competition, round, weekend, home, opponent, kickoff, venue, matchId }`. The device copy is
  `cachedRead('fixtures:<teamId>')`.
- **Link rule** (`fixtureMatch`): an explicit `matchId` wins. Otherwise a match links when both hold:
  - its date falls in the Monday–Sunday week of `weekend`, or equals the kickoff date;
  - `sameOpponent(match.them, opponent)`: after removing accents and keeping only A–Z and 0–9, one name contains the
    other (the shorter has at least 4 characters), or they share a word of 4 or more letters other than BM, CBM, CB,
    CD, CLUB, BALONMANO, EL, LA, LOS, DE.
- A match links to one fixture only. Links found this way are written back to `match_id` when online.

### Attendance (M0e), table `public.attendance_sessions`

| Column | Rules |
|---|---|
| `id uuid pk` | Made by the app, as for matches, so sessions can be created offline |
| `team_id uuid not null → teams on delete cascade` | RLS `attendance_all` as for matches; `match_id`, when set, belongs to the team |
| `on_date date not null`, `kind text check (kind in ('ENTRENO','PARTIDO'))` | `unique (team_id, on_date, kind)`; the app upserts on it, last writer wins |
| `match_id uuid null → matches on delete set null` | Match-day sessions |
| `marks jsonb not null default '{}'` | `{ [playerId]: { s: 'F'│'J'│'L', n?: text ≤ 60 } }`. Presente is stored as no key. Check: an object, `pg_column_size` ≤ 20000 |
| `note text null` | ≤ 120 chars |
| `updated_at`, `updated_by` | `touch_updated_at` trigger |

- **Match days:** each season match is a «Partido» session derived from its convocatoria. Convocados are Presente
  and cannot be changed. The others are «No convocado» and are not counted, unless a stored «Partido» session for
  that match marks them F, J or L.
- **Rate:** `pct = presentes ÷ contadas`.
  - Contadas are the sessions where the player is not «No convocado» and whose status is not listed in
    `CONFIG.attendance.excludeFromRate` (`['L']`).
  - Justificada counts as not present, but is shown on its own line.

Derived, never stored: minutes, +/−, ratings, attack types, after-turnover goals. Pure functions over a state keep
past matches reproducible, and the tuning preview cheap.

### Team

| Field | Where | Rules |
|---|---|---|
| `ratingWeights` | `teams.rating_weights jsonb` (nullable), local backend team object | **M7.** Only the knobs that differ from `CONFIG.rating`. Validated on read: unknown keys are dropped and values are clamped to the knob range, with a `console.warn`. `null` means the defaults. Check: `jsonb_typeof = 'object'` and at most 4 kB. |
| `voters` | `teams.voters jsonb` (nullable) | **M4b.** The remembered voter list `[{ label, role: 'captain' \| 'coach' }]`, so the coach does not retype it every match. Check: an array, at most 12 items. |

### Supabase tables for the vote (M4b only)

- **`mvp_polls`**
  - Columns: `id uuid pk`, `team_id uuid → teams on delete cascade`, `match_id uuid → matches on delete cascade`,
    `created_by uuid default auth.uid()`, `created_at timestamptz`, `closes_at timestamptz not null`,
    `title text` (e.g. «Triana 28–23 CBMLEPE»).
  - `candidates jsonb`: a snapshot `[{ id, num, name, pos, rating, kpis: [[label, value]] }]` taken when the poll is
    created. It has no photo and no full name unless the coach decides otherwise (decision 8).
- **`mvp_ballots`**
  - Columns: `id uuid pk`, `poll_id uuid → mvp_polls on delete cascade`, `label text` («Capitán · Miguel»),
    `role text check (role in ('captain','coach'))`, `voted_player uuid null`, `voted_at timestamptz null`.
  - `token_hash bytea unique not null`: SHA-256 of the token, which is never stored in clear.
- **RLS**
  - Enable RLS on both tables.
  - `mvp_polls`: `for all to authenticated using (private.is_team_member(team_id))`, `with check` the same, plus the
    match belonging to that team.
  - `mvp_ballots`: through a new `private.is_poll_member(poll uuid)` security-definer helper. It lives in the
    non-exposed schema, like `is_team_member`, so there is no policy recursion.
  - There are **no anon policies**.
- **RPCs:** `public.get_ballot(p_token text) → json` and `public.cast_vote(p_token text, p_player uuid) → json`.
  - Both are `security definer` with `set search_path = public`.
  - Execute is revoked from `public` and granted to `anon` and `authenticated`.
  - They hash the token (pgcrypto `digest`) and check that the poll is open and that the player is in the candidates
    snapshot.
  - They return only that poll's title, candidates, closing time and this ballot's own vote; never other ballots or
    team data.
- **Links**
  - The link is `<app>/#vote=<token>`. The token is 128 random bits, base64url. It sits in the **fragment**, so it
    never reaches GitHub Pages logs or `Referer`.
  - The coach's app makes the token, sends only its hash on insert, and shares the clear link once.
- **Tallies:** the coach's app reads its team's ballots under RLS and builds
  `votes = { tally, voters: ballots.length }`.
- **Docs:** `supabase/schema.sql` stays idempotent, and `supabase/README.md` documents the two tables.

## Minutes, +/−, attack types

- **Minutes:** `minutesOnCourt(s)` integrates the court log from each entry to the next.
  - The last entry ends at `matchEndAbs(s)`. Break entries count nothing.
  - It subtracts each player's 2′ windows (`exclusionEnd`) and all time after a send-off.
  - The exclusion helpers gain an `events` argument (default `state.events`), as `playerStats` did.
  - It returns `null` when there is no log, or when the match clock never ran (`matchEndAbs` is 0).
- **On court means the lineup of the phase being played.** An attack or defence specialist only adds the phases they
  play in (decision 3).
- **+/−:** each goal (`SHOT` `GOL`) is +1 for every id in its `on`; each rival goal (`RIVAL_SHOT` `GOL`) is −1.
  `SCORE_FIX` is ignored. The result is `null` when no goal of the match carries `on`.
- **Attack type** of a shot, `'POS' | 'CONTRA' | 'SAQUE'`:
  - `CONTRA` comes from the existing flags (ours `zone === 'CONTRA'`, theirs `contra`).
  - `SAQUE` is our shot within `CONFIG.attackTypes.quickRestartSeconds` (proposal 15 s) of a rival goal, with no
    turnover or rival shot between them. The rival's quick restart is the mirror case.
  - Otherwise `POS`.
- **After our turnover:** a rival shot whose previous possession-ending event (our `SHOT`, our `TURNOVER`, `RECUP`,
  a `RIVAL_SHOT`) is our `TURNOVER`. Inferred, so past matches get it too (decision 10).
- **Turnovers by player** use the `TURNOVER.playerId` the app already records. There is no turnover zone.

## Rating formula (proposal; every number is a starting point to tune)

The rating is linear in a feature vector, then clamped:

```
rating = clamp(base + confidence × Σ weight_k × feature_k + voteBonus, min, max), rounded to 1 decimal
```

`ratingFeatures(s, player)` counts the match. `ratingFromFeatures(features, weights, confidence, voteShare)` combines
them. The tuning preview only recombines, so it stays instant.

| Feature (per match) | Weight (proposal) | Coach rule it encodes |
|---|---|---|
| `shotValue` = Σ over the player's shots of (goal ? 1 : 0) − `expectedGoal(zone)` | **0.8** | Shooting % weighs most, adjusted by zone. `expectedGoal` is the midpoint of `CONFIG.targets` for the zone (6 m 0.625, 9 m 0.40, +11 m 0.40, contra 0.725, 7 m 0.675), so a miss from 6 m costs more than one from 9 m. A `BLOCADO` result is a miss. |
| `saveValue` = Σ over rival shots **on target** faced of (save ? 1 : 0) − `expectedSave(zone)` | **0.35** | Save % weighs most for goalkeepers. `CONFIG.rating.expectedSave`: 6 m 0.25, 9 m 0.40, +11 m 0.45, contra 0.20, 7 m 0.25 (proposal; average keeper ≈ 29 %, from `CONFIG.targets.gk`). |
| `turnovers` (Balón: pase, recepción, bote) | **−0.40** | Turnovers subtract a lot. |
| `forcedTurnovers` (Rival: falta en ataque, bloqueado) | **−0.30** | Proposal (decision 6). |
| `ruleTurnovers` (Regla: pasos, dobles, área, pasivo) | **−0.15** | The coach lists these among the regulation faults: a little. |
| `ruleFaults` (FALTA, GOLPE) | **−0.15** | Regulation faults: a little. |
| `prov7` | **+0.30** = `oneOnOne` | «Provoca 7 m» adds what «Superado 1x1» subtracts. |
| `beaten` (BEATEN) | **−0.30** = −`oneOnOne` | |
| `pen7c` (PEN7C) | **−0.30** = −`oneOnOne` | «7 m cometido» subtracts the same as «Superado 1x1». |
| `tacticalFaults` (BADEXIT, LATE, HELP) | **−0.15** | Proposal (decision 6). |
| `assists` | **+0.25** | Proposal. |
| `recoveries` | **+0.30** | Proposal. |
| `blocks` | **+0.20** | Proposal. |
| `teamFaults`: NOATK events whose `on` includes the player | **−0.10** field, **−0.05** goalkeeper | «Falta de contundencia»: a little from everyone on court, less from the goalkeeper. A legacy NOATK with a `playerId` counts for that player only. A legacy one with neither counts for nobody. |
| `yellow`, `twoMin`, `red`, `blue` | **−0.10**, **−0.30**, **−1.00**, **−0.50** | Proposal (decision 6). |

- **Base and scale:** `base` 6.5 (a player on court who does nothing of note), `min` 3.0, `max` 10.0, one decimal,
  half up. Bands, Sofascore-like, on the M0b `--rating-*` tokens:
  ≥ 8.0 `top`, 7.0–7.9 `good`, 6.5–6.9 `mid`, 6.0–6.4 `low`, < 6.0 `bad`.
  The chip always shows the number (or «S/C») in `tabular-nums`; colour is never the only cue.
- **Minutes scaling:** `confidence = min(1, minutes / CONFIG.rating.fullWeightMinutes)`, with `fullWeightMinutes`
  20.
  - A short spell is pulled toward the base, both up and down, because there is little evidence.
  - Under `CONFIG.rating.minMinutes` (10) the player reads «S/C» (sin calificar).
  - With minutes unknown (old matches, or the clock never ran), `confidence` is 1 and nobody is «S/C» for minutes.
  - A convocado who never entered reads «S/C».
  - The alternative for the coach is a per-60-minute rate (decision 3).
- **Vote bonus:** `voteBonus = CONFIG.rating.vote.max × votes / voters`, with `max` 0.5. It is not scaled by
  confidence and is 0 without votes.
- **Match MVP (`matchMvp`):**
  - the coach's override first;
  - else the most votes, with ties broken by rating;
  - else the highest rating, shown as «MVP provisional».
- **Season rating:** the minutes-weighted mean of the rated matches, or the plain mean when minutes are unknown.
  `null` with no rated match.
- **Sanity examples** (base 6.5, full minutes, no votes):
  - a wing 6/7 from 6 m with 1 assist and 1 turnover: 6×0.375 − 0.625 = 1.625 → +1.30 + 0.25 − 0.40 = **7.65 → 7.7**;
  - a back 2/9 from 9 m with 2 turnovers: 2×0.6 − 7×0.4 = −1.6 → −1.28 − 0.80 = **4.42 → 4.4**;
  - a keeper with 14 saves of 34 on target, mixed zones (expected ≈ 10.2): +3.8 × 0.35 = **7.83 → 7.8**.

## Non-goals

- Rival player ratings or rival season figures.
- A season selector.
- In-app accounts for captains.
- Push notifications.
- The paid WhatsApp API.
- Editing the court log afterwards (a manual minutes correction is a later project).
- Machine-learned weights.
- The Resend e-mail (its own project).
- Turnover location maps.
- Syncing with the federation's site, rival rosters from the calendar, reminders or notifications.
- Editing rounds, opponents or weekends in the app. That is done by re-importing the file; the app edits only date,
  time and venue.
- Lateness, partial attendance, training plans, or attendance per minute.
- Changing the live screen's layout, sizes or colours as part of the design pass.

## Anti-goals

- The live screen gains no tap, popup or visible element. The log and the stamps are invisible.
- Past matches keep every existing number. A rating is a new figure; old matches simply have no minutes and no +/−.
- A rating, a vote or the MVP never changes a statistic, the score or the undo history.
- No new dependencies: no chart library and no html2canvas. Images are drawn with the Canvas 2D API.
- Ballot tokens are never stored in clear, logged or put in a query string. The `service_role` key is never used.
- There is no public ranking page. A ballot shows only its own poll.

## Constraints

- One file, `src/app.html`, in vanilla JS. Tests go in `tests/inject.js`, run with `python3 tools/run_tests.py` (`libs`
  may fail offline only).
- Existing idioms:
  - `CONFIG` for thresholds and weights;
  - `esc` for every user string in HTML and SVG;
  - `discHtml` and `photoOf` for faces;
  - the CSS tokens in both themes;
  - `home.view` with `renderHome` and `HOME_VIEWS`;
  - pure functions over a state, with an `events` argument defaulting to `state.events`.
- UI text is in Spanish; code, tests and docs are in English.
- UI acceptance: screenshots at 1280×800 and 1024×640, in light and dark. No horizontal scroll, and no `NaN` or
  `undefined` on screen.
- PDFs are always printed light, with the fixed `PDF_RGB` colours.
- Supabase: `schema.sql` stays idempotent. RLS is on every table. Anon reaches data only through the two vote RPCs.
  - The `fixtures` and `attendance_sessions` migrations are applied by the orchestrator through the Supabase MCP, as
    the coach asked on 2026-10-21. The Triana calendar is seeded once for team `03e3ca0d-c425-416c-98fa-db8d91cbd49f`.
  - The other migrations stay the coach's call.
- Design acceptance (from M0b): the matrix probe passes contrast (4.5:1 text, 3:1 large text and marks), touch
  (≥ 44×44 outside the live screen) and reduced motion, in both themes.
- The live screen's layout and behaviour do not change. Its README scenes are compared byte for byte, and a geometry
  test pins its boxes.
- MVP image: 1080×1350 PNG drawn with Canvas 2D, using system fonts and the crown path reused through `Path2D`. Shared
  with `navigator.share({ files })`, or downloaded through `offerFile`.

## Builder's calls for the 2026-10-21 amendment (decided without the coach; cheap to change)

1. **Fonts:** every text role is `system-ui`. Barlow Condensed (`--font-display`) stays for big numbers, because the
   live screen reads it.
2. **Live screen:** the semantic tokens only alias it. `.rex-chip:hover` stays ungated, because on a tablet the
   sticky hover is how the × appears. Hover gating applies to home, «Hoja» and final.
3. **Calendar linking:** the Monday–Sunday week, plus a loose match on the rival's name (see Data model). The link
   lives on `fixtures.match_id`, and auto links are written back.
4. **New match from a fixture:** the rival is cut to 24 characters at a word boundary, and the coach can edit it at
   setup. The date is the kickoff date, else the Sunday. The venue is the fixture's venue, if set.
5. **Re-import** upserts by (season, competition, round) and keeps the kickoff, venue and match link.
6. **Attendance storage:** one row per session, with the marks in jsonb. Presente is the absence of a mark. Two
   devices on the same day: last writer wins, as for matches.
7. **Match attendance** comes from the convocatoria, and non-convocados are not counted (see Data model).
   Lesionado is left out of the rate; Justificada lowers it but is listed apart.
8. **Drill-down:**
   - field players get one map with every shot, coloured goal green, save blue, miss grey;
   - goalkeepers get two maps (Detenidos, Encajados), coloured save green, goal red, miss grey, as the card's zone
     dots;
   - the «Jugador» tab is always in the «Hoja», with a player picker.
9. **Kickoff time** is entered in device local time (Europe/Madrid) and stored as `timestamptz`.

## Decisions only the coach can make (most important first)

1. **How votes travel.** The choices:
   - (a) a native WhatsApp poll in the captains' group, with the coach typing the counts in the app (M4a, no
     infrastructure);
   - (b) one personal link per voter, sent by WhatsApp, voting with no account (M4b, Supabase);
   - (c) in-app accounts for captains (heavy; a non-goal).

   Recommendation: (a) now, (b) when he wants it.
2. **Who votes, and how much each vote counts.**
   - How many captains and which staff.
   - Does a coach's vote weigh the same as a captain's (proposal: yes)?
   - Can a voter vote for himself?
   - Can a vote be changed before the close?
   - When does the poll close (proposal: 48 h)?
3. **How minutes scale the rating.**
   - The proposal: a confidence ramp to full weight at 20 min, and «S/C» under 10 min. The alternative is a
     per-60-minute rate.
   - Does an attack or defence specialist's time count only in the phases they play (proposal: yes)?
4. **Scale, base and rounding.**
   - 3.0–10.0, one decimal, base 6.5.
   - The colour bands.
   - The season rating as a minutes-weighted mean.
5. **The weights he has not set yet.**
   - Assists, recoveries, blocks.
   - Yellow, 2′, red and blue cards.
   - The tactical faults (salida fallida, llega tarde, ayuda innecesaria).
   - Forced turnovers (falta en ataque, bloqueado).
   - Whether pasos and dobles are "turnover, a lot" or "regulation fault, a little" (proposal: a little).
6. **Vote bonus and MVP rule.**
   - Up to +0.5 by share of votes.
   - MVP = most votes, ties by rating, provisional by rating with no votes.
   - The coach's override always wins.
7. **The MVP image.**
   - Which KPIs it shows (proposal: field players goals/shots, %, assists, rating; goalkeepers saves/on target, %,
     7 m saved, rating).
   - Its format (1080×1350 post or 1080×1920 story).
   - Whether it shows the rival's name and the score.
8. **Ballot privacy.** Faces or full names on the vote page (proposal: no; court name, dorsal and rating only). Some
   players may be minors.
9. **PDF errors.** Which tables he saw wrong (photos or the PDF itself). The audit fixes the defects it finds, such as
   the player table showing shots/goals while every other figure shows goals/shots.
10. **Quick restart and after-turnover rules.**
    - Infer the quick centre restart from timing (≤ 15 s after a rival goal), or add a tap to the shot popup (that
      would change the live screen).
    - Count goals after our turnover by possession (proposal) or within N seconds.
11. **Dashboard priorities:** which cards come first on «Estadísticas».
