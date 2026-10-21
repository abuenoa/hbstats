# Team page and player cards — design

Date: 2026-10-21 · Status: draft for the coach's approval. Mockups (built with real data):
`design/mockups/2026-10-21-team.png`, `design/mockups/2026-10-21-player.png` and
`design/mockups/2026-10-21-goalkeeper.png`. Where a mockup and this text disagree, the text wins. The mockups are
for the look.

## Why

The coach recognises players by face, not by dorsal. He wants:
- a team page with the team's details and season figures;
- a list of players with their position and photo;
- a card for each player with their photo and how they progress across the season.

Today, opening a team lands on the match list. The «Equipo» tab is a form plus an editable table, with no photos and
no figures. The coach could not even find where to import the roster file with the photos. The look takes its cues
from the Dribbble shots he picked: the «Profile / Leaders / Lineup» set (16410586) is the main reference, plus
poster-style player headers, KPI tiles, a radar and per-match rows.

## Goals

1. **The team page is the first view** after picking a team. Home tabs become «Equipo · Partidos», with «Equipo»
   selected; «+ Nuevo partido» stays in the header.
   - **Season card:**
     - won–drawn–lost and a form strip (one G/E/P chip per match, latest last);
     - six KPI tiles: goals for (per match), goals against, shooting %, save %, turnovers, recoveries. The first tile
       is highlighted in the brand colour;
     - the latest match: rival, date, venue and score.
   - **Leaders:** a ranking with face, court name, a detail line and the big value. Chips switch the metric: Goles,
     % tiro, Paradas, Recuperaciones, Pases de gol.
     - The top row's value is gold.
     - % tiro ranks only players with at least `CONFIG.leaders.minShots` shots (3); Paradas lists goalkeepers only.
   - **Squad:** every active player's face, grouped by position (POR, EXT, LAT, CEN, PIV), with the dorsal on a
     badge in the position colour and the court name under it. Tapping one opens their card.
   - An «Editar equipo» button opens today's team form and roster table, which keep import, export, add and retire.
2. **The player card**, opened from the squad or the leaders.
   - **Poster header:**
     - big face photo ringed in the position colour, with the dorsal as a huge faint watermark;
     - the court name in big display type;
     - under it, the card name, the position and the dorsal.
   - **Sentences with big numbers:** «7 goles en 8 lanzamientos», «1 partido jugado», «0 pérdidas», «3 goles al
     contraataque». Goalkeepers get «24 paradas de 36 a puerta», «67 % de paradas» and the like.
   - **Coloured radar** (the coach's request).
     - Each axis is drawn in the colour of its action group, using the live action palette:
       `--act-good` for attack, `--act-def` for defence, `--act-bad` for ball security, `--act-rule` for discipline.
     - Each axis carries its value at the tip.
     - Field players have 8 axes: % tiro, goles/partido, pases de gol/partido, 7 m provocados/partido,
       recuperaciones/partido, blocajes/partido, seguridad and disciplina.
     - **Seguridad:** 1 − turnovers per match ÷ the team's highest turnovers per match.
     - **Disciplina:** 1 − (regulation faults + 2' + cards) per match ÷ the team's highest.
     - Every axis is normalised against the team's best per-match value among players with at least one match. When
       the team best is 0, the axis shows 0, and the inverted axes show 100.
     - Goalkeepers have 6 axes: save % overall, at 6 m, at 9 m (9M and 11M), at 7 m and on the counter, plus pases de
       gol.
   - **Season zone map, not one dot per shot.** A season has hundreds of shots, so the court shows zones instead.
     - **Zones:** the 5 lanes of the attack analysis (`LANES` and `laneOf`: extremo izq., lateral izq., centro,
       lateral der., extremo der.), each split into near (under 9 m, the `CONFIG.zones.nineFromM` rule) and far
       (9 m or more).
     - **The map is a real handball court.** It reuses the app's court drawing (`courtFloorSvg`): goal, 6 m area, dashed
       9 m line and the 7 m mark. The zones follow those lines: near is the band between the 6 m area and the 9 m line;
       far is everything beyond the 9 m line. Lanes are wedges from the goal centre, split by faint dashed lines, with
       their names along the bottom edge.
     - Each zone is shaded from red (0 %) through amber to green (100 %) and labelled with its % and «n/total».
       Zones with no shots stay neutral.
     - Each shot's origin is drawn on top as a small, faint dot, so the coach sees where they shoot from:
       - goalkeepers: save in green, goal in red, miss or post in grey;
       - field players: goal in green, save in blue, miss in grey.
       The zone colour stays the main reading.
     - 7 m and counter-attack shots are left out of the court and shown as two tiles beside it, coloured the same way.
     - For field players the % is goals over shots. For goalkeepers it is saves over rival shots on target (goal or
       save).
   - **3×3 goal grid**, coloured and labelled the same way.
     - For field players: goals over their shots on target that ended in each cell.
     - For goalkeepers: saves over shots on target in each cell.
   - **Highlight tiles:**
     - field players: shooting % and goals per match;
     - goalkeepers: save % and saves per match.
     - The first tile adds «el mejor del equipo» when the player leads that metric among players with at least one
       match.
   - **Per-match rows:** date, rival, score, goals/shots, %, assists, turnovers. Goalkeepers get saves/on target and %.
   - **Evolution:** one bar per match for goals (saves for goalkeepers), with a line for the percentage.
   - **«Editar ficha»:**
     - court name, dorsal, position and card name;
     - a photo, uploaded from the device and square-cropped from the centre to 128 px JPEG;
     - removing the photo.
     - It saves through the existing `saveTeamPlayer`, so dorsal checks and the device copy keep working.
3. **Season data.**
   - **Matches counted:** every match of the team except setup ones (`status` live or finished), across all dates.
     A season filter is a later project.
   - **A player's matches** are the ones whose `state.players` lists their id; the app has no minutes yet. Player ids
     are the roster ids, so they hold across matches.
   - **Loading:** a new backend call `listMatchStates(teamId)` returns `[{ id, date, them, venue, scoreUs, scoreThem,
     status, state }]` for the team. The answer is kept as a device copy like the other reads, so the pages work
     offline.
   - **Calculation:** per-match figures come from pure functions over one match state, reusing the existing ones
     (`playerStats`, `countGroups`, `goalGrid`) with an explicit events or state argument where they read the global
     `state` today. They are never copied from code.
4. **MVP of the match** (the coach's request; for now the coach picks it).
   - **Stored as `state.mvpId`:** a roster player id, or null; `restoreState` defaults it to null. It is saved and
     synced with the match like any other field. It is not an event, so undo does not touch it, and it changes no
     statistic.
   - **Chosen on the end-of-match summary** (`openFinal`, also reached by opening a finished match from the list):
     a «MVP del partido» row with the convocados' faces, goalkeepers included. Tapping one picks them, tapping them
     again clears it, tapping another changes it.
     - That is how the coach marks Miguel for the CBMLEPE match.
     - The later voting project fills this same field.
   - **On the player card:**
     - a gold crown on the photo when they have at least one MVP;
     - a gold tile «N · MVP del partido · N de M partidos», which is not part of the radar;
     - a small crown next to the rival in the per-match rows where they were MVP.
   - **On the team page:**
     - the latest-match block shows the MVP's face with the crown;
     - Leaders gets an «MVPs» chip that ranks by MVP count.
   - **The crown is one inline SVG**, reused everywhere. Its look follows `design/mockups/2026-10-21-goalkeeper.png`:
     - a gold gradient body with three pearl-tipped points;
     - a darker band with three small jewels in the result colours (red, blue, green);
     - a dark gold outline and a soft drop shadow.
     - **On a face:** tilted about −34° and set high on the top-left of the head. It may stick out of the card's edge;
       the dorsal watermark stays clipped to the card.
     - **On a per-match row:** the same −34° tilt, on the row's top-left corner, and the row gets a faint gold
       gradient.
     - **In the MVP tile:** upright.
5. **Theme.** The pages use the app's existing tokens and follow its light or dark theme. The dark theme looks like
   the mockups. Faces use `discHtml` and the team photos (`setTeamPhotos`) everywhere. Charts are hand-made inline
   SVG, as elsewhere in the app.

## Builder's calls settled at review (decided without the coach; cheap to change)

1. **The player card is one scrolling page.** It has no sub-tabs (the mockup's «Temporada · Partidos» tabs are
   dropped), but it keeps the Evolution chart. «Editar ficha» is a button that opens an edit panel on the same page.
   The team mockup's «Estadísticas» tab is not built; the home tabs are «Equipo · Partidos».
2. **Won–drawn–lost, the form strip and «Último partido»** count finished matches only. Player and team totals count
   live and finished matches.
3. **A goalkeeper is a player whose current roster position is POR.** That decides the radar, the sentences and the
   Paradas leaders. A goalkeeper's goalkeeping figures come from the rival shots with their `gkId`, in every match.
4. **Only the roster's active players appear.** Players added during a match, with ids not in the roster, are left
   out of the leaders, the team best and the cards; so are the sample's and old imported matches' players. Retired
   players are left out too: no backend change.
5. **Matches saved on this device but not uploaded yet count.** `listMatchStates` merges the device copies the same
   way the match list does (`withLocalChanges`), so the season figures agree with the match list.

## Non-goals (later projects)

- The Sofascore-style rating, the captains' and coaches' MVP votes, and the MVP image for WhatsApp. The MVP is
  picked by hand in this project.
- Minutes and the substitution log.
- Rival season stats.
- A season selector.
- PDF changes and WhatsApp cards.
- Cropping the face in-app: the upload is a centre square crop.

## Anti-goals

- Nothing on the live match screen changes.
- Past matches must not change their numbers, and the CBMLEPE report must look the same.
- No new dependencies and no external charting library.
- No placeholder figures. A player with no matches shows «Sin partidos todavía» instead of empty charts.

## Constraints

- Single file `src/app.html`, vanilla JS, existing idioms: `home.view` and `renderHome`, `showHomeView`, `esc`,
  `discHtml`, `.sheet-card`, the CSS tokens, `CONFIG` for thresholds.
- Home pages may scroll vertically. They must lay out at 1280×800 (three columns) and 1024×640 (two columns, the
  third block wrapping under), in both themes.
- Tests go in `tests/inject.js` and run with `python3 tools/run_tests.py`. Release with `tools/build_site.py`, then
  commit `src` and `docs`.
- The Supabase read for `listMatchStates` selects only the team's matches, and RLS already scopes them.

## Left to the builder

- Exact spacing, sizes and chart styling within the mockups' look.
- How `listMatchStates` caches and refreshes. It may reuse the `matches:${team.id}` device-copy pattern under its own
  key.
- Whether the per-match functions take a state or an events list, as long as they stay pure and the match screen
  keeps calling them unchanged.
