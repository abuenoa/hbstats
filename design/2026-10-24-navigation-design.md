# Navigation — design

Date: 2026-10-24 · Status: draft for the coach's approval. Plan: `design/2026-10-24-navigation-plan.md`.

## Why

The coach, translated: «The buttons to go back or to move between screens are not clear and are positioned very
badly; it's confusing.» This document audits every way to move between screens, sets one navigation model for
the whole app from platform guidelines, and lists what changes on each screen.

The audit used screenshots of 23 scenes at 1280×800 and 1024×640, in the light theme. They were taken with
`tools/screenshots.py --matrix`, plus temporary scenes in a scratch copy of the tool that is not committed. The
screenshots are in `$TMPDIR/nav-audit/`. The audit also read every control in `src/app.html`
(`data-home-view`, `data-close-sheet`, `data-go-home`, `data-player-back`, `data-final-*`, `Cancelar`, `‹`).

## 1. Research summary

Rules used by the model, with sources. Apple HIG wording comes from the HIG pages behind
`design/2026-10-21-design-skills-digest.md`. The m3.material.io pages render only with JavaScript, so the Material
rules come from Android developer docs and faithful restatements, and are marked that way.

**Back, title and actions in a bar**
- Apple, toolbars / navigation bars (https://developer.apple.com/design/human-interface-guidelines/toolbars):
  - the leading edge holds «elements that let people return to the previous document», «followed by the view
    title»;
  - the trailing edge holds «a primary action like Done when one exists»;
  - «Only specify one primary action, and put it on the trailing side»;
  - navigation and critical actions belong in «dedicated, familiar, and visually distinct sections»;
  - keep titles short («under 15 characters»), and don't use the app name as the title.
- Material top app bar: the navigation icon is «displayed at the start of the top app bar». Actions are trailing,
  ordered by priority, at most four on a tablet.
  - https://kotlinlang.org/api/compose-multiplatform/material3/androidx.compose.material3/-top-app-bar.html
  - restated by SAP Fiori for Android:
    https://www.sap.com/design-system/fiori-design-android/v26-4/components/m3-standard-components/top-app-bar/usage
- NN/g: «in apps, the top left corner is often reserved for the Back button»
  (https://www.nngroup.com/articles/mobile-first-not-mobile-only/). On tablets Back is «the user's lifeline», all
  the more because of accidental touches (https://www.nngroup.com/articles/tablet-usability/).
- Baymard (https://baymard.com/blog/back-button-expectations):
  - Back must go to the screen users perceive as the previous one, and must close overlays and step back through
    multi-step flows (`history.pushState`);
  - 59 % of sites get at least one Back expectation wrong.

**Top-level sections**
- Apple, tab bars (https://developer.apple.com/design/human-interface-guidelines/tab-bars):
  - on iPadOS the tab bar sits «near the top of the screen»;
  - keep it visible in every section (only a modal may cover it);
  - tabs navigate and never act: «If you need to provide controls that act on elements in the current view, use a
    toolbar instead»;
  - single-word labels.
- Apple: a tab bar and a toolbar «can coexist in the same horizontal space at the top of the view». A segmented
  control switches «closely related subviews»; use a tab view, not a segmented control, for main view switching.
  - https://developer.apple.com/design/human-interface-guidelines/toolbars
  - https://developer.apple.com/design/human-interface-guidelines/segmented-controls
- Material 3, adaptive navigation: a navigation bar for compact widths and a navigation rail for medium and expanded
  widths (https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation).
  - Below three destinations, use tabs, not a rail (SAP restatement:
    https://www.sap.com/design-system/fiori-design-android/v26-4/components/m3-standard-components/navigation-rail/usage).
  - HBStats has three sections on a 1024–1280 px landscape screen. A rail would take about 80 px of width from
    every page and from the court's neighbours, so **the existing top segmented control stays**.
- NN/g, tabs (https://www.nngroup.com/articles/tabs-used-right/):
  - tabs go above the panel, in a single row, with 1–2 word labels;
  - highlight the selected tab with at least two cues;
  - never mix in-page tabs and navigation in one control.

**Sheets, modals and dismissal**
- Apple, sheets (https://developer.apple.com/design/human-interface-guidelines/sheets):
  - «the Cancel button belongs on the leading edge of the top toolbar. When present, the Done button belongs on the
    trailing edge»;
  - Back moves between the steps of a flow and «isn't intended to dismiss a sheet»;
  - avoid showing Cancel, Done and Back together.
- Apple, modality: «Always give people an obvious way to dismiss a modal view… people typically expect to find a
  button in the top toolbar»; confirm before discarding work
  (https://developer.apple.com/design/human-interface-guidelines/modality).
- Material dialogs:
  - «start-aligned icons and titles with end-aligned buttons»
    (https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md);
  - affirmative actions on the right, dismissive on the left; never a dismissive action to the right of a confirming
    one (archived spec: https://spot.pcc.edu/~mgoodman/developer.android.com/design/spec/components/dialogs.html).
- NN/g, overlays (https://www.nngroup.com/articles/accidental-overlay-dismissal/):
  - offer both a clear close button and the system Back gesture;
  - avoid overlays on top of overlays;
  - keep a single close button on screen.
- NN/g, button order (https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/): «Following platform conventions is
  more important than optimizing an individual dialog box.»

**Consistency, labels and destructive actions**
- WCAG 2.2:
  - 3.2.3 Consistent Navigation: repeated navigation must «occur in the same relative order each time»;
  - 3.2.4 Consistent Identification: the same function gets the same name everywhere.
  - https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html
  - https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html
- Jakob's law: users expect your app to work like the others they use (https://nngroup.com/videos/jakobs-law-internet-ux/).
- Apple: don't use a bare «Back» or «Close» text label. A custom back must look and behave the same everywhere
  (toolbars page).
  - HBStats keeps a text label, because a bare chevron is unfamiliar to this coach.
  - The label always names the destination, so it is never a bare «Volver» or «Cerrar». NN/g makes the same point:
    label a button with its outcome (https://www.nngroup.com/articles/confirmation-dialog/).
- NN/g: keep consequential actions away from benign ones, with space and visual cues
  (https://www.nngroup.com/articles/proximity-consequential-options/).

**Targets and reach**
- Targets:
  - Apple: hit regions of at least 44×44 pt (https://developer.apple.com/design/human-interface-guidelines/buttons);
  - Material: 48×48 dp (https://developer.android.com/guide/topics/ui/accessibility/apps);
  - WCAG 2.5.5 (AAA): 44×44 CSS px (https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html);
  - WCAG 2.5.8 (AA): 24×24 (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
  - HBStats already enforces 44 px (`--target`, matrix probe).
- Reach:
  - tablets are held halfway up the sides, and «the top and bottom edges of tablet screens are hostile zones»
    (Josh Clark, https://alistapart.com/article/how-we-hold-our-gadgets/);
  - accuracy is poor at the edges, so edge targets should be larger (Hoober,
    https://www.uxmatters.com/mt/archives/2013/03/common-misconceptions-about-touch.php);
  - 88 % of tablet use is seated, often propped (Hoober & Shank, secondary summary);
  - Apple, layout: put important items «near the top and leading side»
    (https://developer.apple.com/design/human-interface-guidelines/layout);
  - Apple Pencil: avoid controls the writing hand covers
    (https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble). For a right-handed
    coach the hand rests at the bottom-right, which is why the exit belongs top-left.

**Not verified against a primary source:** the exact current wording of the Material 3 dialog and top-app-bar
pages; Hoober's own landscape grip percentages; and the older HIG wording «label Back with the previous title»
(the current page says to use the standard symbol).

## 2. Audit

Position: **TL**, **TR**, **BL** and **BR** are the top-left, top-right, bottom-left and bottom-right corners;
«row 2» is a row of buttons under the header. Every control measured at least 44 px high (the matrix probe found
no small targets in `.home`, `#sheet` or `#final`). Size is therefore not the problem; position, labels and
duplication are.

| # | Screen (`home.view` / overlay) | Control (label) | Position | What it does | Problem |
|---|---|---|---|---|---|
| A1 | Profile (`profile`) | none | – | Root screen: team cards, rival templates, account | No title naming the screen. The team pages call it «Perfil», but it is really the team picker. |
| A2 | Profile → team card | `data-open-team` | content | Opens the team on «Equipo» | OK. |
| A3 | Profile → «+ Nuevo equipo» → `team-new` | «Cancelar» | TR of the card | Back to the profile | Dismiss sits top-right, where other screens put the primary action. «Crear equipo» is at the bottom of the form. |
| A4 | Profile → template editor (`template`) | «Cancelar» · «Guardar» | TR, side by side | Discard or save the template | Dismiss and confirm share one corner, 8 px apart. Elsewhere TR is the primary action and dismiss is TL. |
| A5 | Profile → «Cambiar contraseña» (`password`) | «Guardar contraseña» · «Cancelar» | bottom of the card, primary first | Save or back to the profile | Third arrangement of the same pair (primary left, dismiss right). |
| B1 | Team header (every team view) | «‹ Perfil» | TL of the header | `showProfile()` | **Shown on every team sub-view, so those views show two «‹» buttons stacked** (B4, B6, B7). It is the first «back» the eye finds, but it skips the real parent: on `attendance` and `rating-tune` it is the only «‹» and it leaves the team. Its label names a screen called «Perfil» that has no such title. |
| B2 | Team header | «Equipo · Partidos · Estadísticas» | centre of the header | Top-level sections | Good as a segmented control. But it stays on in sub-views with «Equipo» pressed, so tapping «Equipo» acts as a third back. |
| B3 | Team header, `team` only | «+ Nuevo partido» | header, after the tabs (not at the edge) | `openSquad` | Primary action in the header on «Equipo» but in the body on «Partidos» (C1), so it moves when the tab changes. It is not at the trailing edge either. |
| B4 | Team → face/leader → `player` | «‹ Triana» (team name) | TL, row 2 | `showHomeView('team')` | Second «‹» under B1. Labelled with the team name while the tab says «Equipo», so the same destination has two names. |
| B5 | `player` | «Editar ficha» (toggle) | TR, row 2 | Opens the inline edit form, which has its own «Guardar» | OK as a trailing action. No title: the player's name appears only on the poster. |
| B6 | `player` → match row → `player-match` | «‹ Ficha» | TL, row 2 | `showPlayer(id)` | «Ficha» is ambiguous (player card or match sheet?). It is a second «‹» under B1. |
| B7 | `player-match` | «Abrir el partido» (primary) | TR, row 2 | Enters the match with the «Hoja» on the player's tab | OK. |
| B8 | Team → «Editar equipo» → `team-edit` | «‹ Equipo» | TL, row 2 | `showTeamPage()` | Second «‹» under B1. Correct label. «Guardar cambios» is at the bottom of the identity card. The roster saves as you type. |
| B9 | Team → «Asistencia» → `attendance` | none | – | – | **No back to «Equipo»**: the only «‹» is «‹ Perfil», which leaves the team. |
| B10 | Team → «Ajustar puntuación» → `rating-tune` | «Guardar» · «Restablecer» · «Cancelar» (armed when dirty) | inside the right-hand card, about 160 px down | Save, reset, or leave for «Equipo» | **The exit is buried in a card mid-screen**, and «‹ Perfil» is the only control at TL. Dismiss sits right of the primary. |
| B11 | Team → «Editar equipo» / «Asistencia» / «Ajustar puntuación» | three buttons | bottom of the «Plantilla» card | Open the sub-views | Hard to find (the coach once could not find the roster import). They stay as content links; no change. |
| B12 | Team → «Fecha» on a round | «Guardar» · «Cancelar» | inline under the round | Edits the date and venue in place | OK (inline edit, primary first like the other inline forms). No change. |
| C1 | `matches` | «+ Nuevo partido» · «Ver partido de ejemplo» | row 2, left | New match; open the sample | The primary action is in the body at the left, unlike B3. |
| C2 | `matches` card | «Ver/Seguir» (primary) · «Reiniciar» · «Borrar» | card footer | Open, restart, delete (armed) | Destructive buttons right next to the primary. Both are armed (two taps), so this is acceptable. No change. |
| C3 | `matches` → `squad` | «Cancelar» · «Siguiente ›» | TR, side by side | Back to «Partidos»; create the match and open the setup | Dismiss and confirm in the same corner, as in A4. The title «Convocatoria» is below the header. «‹ Perfil» is still at TL. |
| D1 | Setup sheet (`#sheet`, `sheetMode = 'setup'`) | «‹ Partidos» · «Empezar partido ▶» | TR, side by side | `leaveMatch()`; start the match | **A «‹» back button at the top-right**, glued to the primary. |
| E1 | Live screen strip | «‹ Partidos» | BL, black filled | `leaveMatch()` (saves and pauses) | Clear and in reach. The coach is used to it. **Frozen** (see § 6). |
| E2 | Live screen strip | «↶ ↷ ⏸ Parar · Hoja · Finalizar · ☾» | BR | Undo, redo, clock, Hoja, finish (armed «¿Seguro?»), theme | «Finalizar» sits between «Hoja» and the theme toggle. It is armed, so this is acceptable. Frozen. |
| E3 | Live popups (`#pop`) | «✕», «Cancelar», «‹ Pérdida» | inside the popup | Close the popup or go back one step | Inside the frozen live screen. «‹ Pérdida» already follows the model (TL, says where it goes). No change. |
| F1 | «Hoja» (`#sheet`) | «Volver» | TR, **red primary** | `closeSheet()`: back to the live screen | **The exit is the most prominent button on the screen and sits where a primary action belongs.** The label «Volver» does not say where it goes. |
| F2 | «Hoja» opened from a player's match (`sheetReturn`) | «‹ Ficha» | TR, red primary | `backToPlayerMatch()`: leaves the match and opens `player-match` | **Same label as B6 for a different destination** (B6 goes to the player card; this goes to the player's match view). A «‹» at TR. |
| F3 | «Hoja» | 7 tabs | top, next to the title | Sections of the Hoja | Fine at 1280; at 1024 they wrap onto a second line and push the exit button to the far right of that line. |
| G1 | Half-time (`#final`) | «▶ 2ª parte» · «Ver Hoja» · «Cerrar» | sticky footer, left-aligned, primary first | Resume; open the Hoja; back to the live screen | The order is reversed from the platforms' (dismiss leading, primary trailing). **«Cerrar» is ambiguous**: closing the match, or this card? Escape does not close it. |
| G2 | Final (`#final`) | «Ver Hoja» · «Cerrar» | sticky footer, left | Open the Hoja; back to the live screen of the finished match | Same as G1. «Ver Hoja» → «Volver» lands on the live screen, not back on the final summary. |
| H1 | Whole app | Android system back / edge swipe | – | The PWA runs in `fullscreen` with no `history` entries, so back closes the app | **One swipe from the screen edge can close HBStats, even mid-match.** The app ignores the platform's own back. |
| H2 | Home views | Escape key | – | Nothing (it only closes popups and the Hoja) | Keyboard and stylus-button users have no back. |

### Top problems

1. **Two or zero backs.** Team sub-views show two stacked «‹» buttons (header «‹ Perfil» plus the page's own); see
   B1, B4, B6 and B8. «Asistencia» and «Ajustar puntuación» have no back to their parent at all (B9, B10).
2. **The exit moves around:** TL on team pages, TR on the setup sheet and the «Hoja» (D1, F1, F2), BL on the live
   screen, and a bottom row on half-time and the final. In the «Hoja» it is styled as the primary action.
3. **Labels that do not name the destination, or name two destinations:** «‹ Ficha» goes to two different screens
   (B6, F2); «Volver» and «Cerrar» do not say where they go (F1, G1, G2); one screen is called both «‹ Triana» and
   «Equipo» (B4).
4. **Dismiss and confirm are inconsistent:** «Cancelar» sits next to the primary in the same corner (A4, C3), on its
   right (B10, A5), or alone at TR (A3). The primary action moves between header and body (B3, C1).
5. **System back closes the app** (H1). In a fullscreen PWA the Android back swipe exits HBStats, including during a
   match.

## 3. The model

One rule for every surface: **the way out is at the leading (left) edge, and the one primary action is at the
trailing (right) edge.** The vertical position follows the type of surface, as the platforms do:
- **pages** (every `#home` screen, the setup sheet and the «Hoja»): top bar;
- **dialog cards** (half-time and the final, which float over the live screen on a scrim): footer;
- **the live screen**: the existing bottom strip.

**Pages: top bar.**
- Every page has one **top bar**. On `#home` it is sticky at the top, in two rows.
  - **Row 1, app bar.** Team screens: crest, team name and club, and the segmented control «Equipo · Partidos ·
    Estadísticas». The profile: the HB mark, «HBStats» and the account e-mail. Row 1 never holds a back button or a
    page action.
  - **Row 2, page bar.** Three slots:
    - **leading:** exactly one «leave» control;
    - **title:** an `h2` for the page;
    - **trailing:** the page's actions, with the one primary action last, at the trailing edge.
- The leading control is one of two kinds:
  - **«‹ Parent»**, a navigation back that keeps what was done (team pages, sub-pages). Its label is the parent's
    title. It is always the same button style (`.btn.back-nav`: outline, chevron, never filled, never primary).
  - **«Cancelar»**, which discards an edit task (template editor, call-up, rating tuning, new team, password change).
    When there are unsaved changes it is armed, as today: the first tap shows «⚠ ¿Seguro?».
- The top-level sections have no title: the pressed segment is the title. Their leading slot is «‹ Mis equipos»,
  which goes up to the profile. So «‹» at the top-left always means «up one level», on every management screen.
- Sub-views keep the segmented control visible, with the parent section pressed (iPad tab-bar rule). The back
  button, not a segment, is the way back.
- **The setup sheet and the «Hoja»** are full-screen pages over the live screen and use the same page bar, without
  row 1: leading back, title, trailing primary. The «Hoja» tabs move to their own row under the bar. With the exit
  button gone from that row, the seven tabs fit on one line at 1024 px; tabs on one line is an NN/g rule.

**Dialog cards: footer.** Half-time and the final keep their sticky footer, which is the Material dialog
convention: the dismissive action leads and the confirming action is last on the right. Only the order and the
labels change.

**Live screen: unchanged.** «‹ Partidos» stays at the bottom-left of the strip. It already follows the leading-edge
rule. Moving it to the top would change the layout the coach knows (see § 6).

**Why not one bottom bar for the whole match context.** This was considered: it would match the live strip and the
footers. It was rejected for three reasons:
- The tablet-grip research calls both the top and bottom edges «hostile zones» for thumbs (Clark). Apple says to
  avoid controls at the bottom of a window.
- Hoober & Shank: 88 % of tablet use is seated, often propped up. Pitch-side the coach sits on the bench with a
  stylus, so reach does not favour the bottom.
- Apple's modality guidance says people look for a modal's dismiss button «in the top toolbar», and Jakob's law
  favours the convention.

The top-left also matches every management screen the coach uses before and after a match.

**Labels.**
- A back button names its destination: the parent's title, or «Volver al partido» for the live screen.
- «Partidos» (the list) and «partido» (this match) are never shortened to the same word.
- No bare «Volver» or «Cerrar».
- One primary (filled) button per screen or bar. Destructive buttons (Borrar, Finalizar, Reiniciar) never sit in a
  navigation slot, and they stay armed.

**System back and Escape.** The Android back gesture and the Escape key do exactly what the visible leading control
does. They are not a separate path. On the live screen a system back does not leave the match: it shows the hint
«Para salir del partido, pulsa ‹ Partidos». A stray edge swipe must not end a match in progress.

## 4. Hierarchy

```
Mis equipos (profile, root)                         leading: none
├── Nuevo equipo (team-new)                         Cancelar · Crear equipo
├── Nueva/Editar plantilla (template)               Cancelar · Guardar
├── Cambiar contraseña (password, from profile)     Cancelar · Guardar
└── <Team>  [segmented: Equipo | Partidos | Estadísticas]
    ├── Equipo (team)                               ‹ Mis equipos · + Nuevo partido
    │   ├── <Jugador> (player)                      ‹ Equipo · Editar ficha
    │   │   └── <Jugador> · <Rival> (player-match)  ‹ <Jugador> · Abrir el partido
    │   │       └── Hoja (player tab)               ‹ <Jugador> · <Rival>
    │   ├── Editar equipo (team-edit)               ‹ Equipo
    │   ├── Asistencia (attendance)                 ‹ Equipo
    │   └── Ajustar puntuación (rating-tune)        Cancelar · Restablecer · Guardar
    ├── Partidos (matches)                          ‹ Mis equipos · Ver partido de ejemplo · + Nuevo partido
    │   └── Convocatoria (squad)                    Cancelar · Siguiente ›
    │       └── Preparar partido (setup sheet)      bottom: ‹ Partidos … Empezar partido ▶
    │           └── Live screen (frozen)            bottom: ‹ Partidos (unchanged)
    │               ├── Hoja                        bottom: ‹ Volver al partido
    │               ├── Descanso                    bottom: ‹ Volver al partido … Ver Hoja · ▶ 2ª parte
    │               └── Final                       bottom: ‹ Volver al partido … Ver Hoja
    └── Estadísticas (stats)                        ‹ Mis equipos
```

«Seguir» on the next-round card, and the result buttons of the calendar, open the live screen like «Ver/Seguir» does.
The live screen's parent stays «Partidos»: `leaveMatch()` always lands there. That is unchanged.

## 5. Per-screen changes (exact Spanish labels)

| Screen | Leading | Title (row 2) | Trailing (primary last) | Removed or moved |
|---|---|---|---|---|
| `profile` | – | – (row 1: HBStats + e-mail) | – | – |
| `team-new` (with teams) | «Cancelar» | «Nuevo equipo» | «Crear equipo» (primary, submits the form via `form=`) | the bottom «Crear equipo» and the TR «Cancelar». With no teams («Crea tu equipo»), there is no leading control. |
| `template` | «Cancelar» | «Nueva plantilla» / «Editar plantilla» | «Guardar» | the TR pair |
| `password` (change) | «Cancelar» | «Elige tu contraseña» | «Guardar» (primary, submit) | the bottom row. The first-time password and login screens are unchanged (they have nowhere to go back to). |
| `team` | «‹ Mis equipos» | – | «+ Nuevo partido» (`.btn.go`) | «‹ Perfil» and «+ Nuevo partido» from row 1 |
| `matches` | «‹ Mis equipos» | – | «Ver partido de ejemplo», «+ Nuevo partido» | the body row with both buttons |
| `stats` | «‹ Mis equipos» | – | – | – |
| `player` | «‹ Equipo» | player name (e.g. «Jenny») | «Editar ficha» (toggle, secondary) | `.player-bar` row with «‹ Triana» |
| `player-match` | «‹ <player name>» (e.g. «‹ Jenny») | «<player> · <rival>» | «Abrir el partido» | `.player-bar` row with «‹ Ficha» |
| `team-edit` | «‹ Equipo» | «Editar equipo» | – | the «‹ Equipo» row. «Guardar cambios» stays in the identity card (it saves only that form). |
| `attendance` | «‹ Equipo» | «Asistencia» | – | – (it gains a back) |
| `rating-tune` | «Cancelar» (armed when there are unsaved changes, today's `TUNE_LEAVE_ARM`) | «Ajustar puntuación» | «Restablecer», «Guardar» | the buttons inside the «Nota de la plantilla» card |
| `squad` | «Cancelar» | «Convocatoria» | «Siguiente ›» (`.btn.go`) | the `.sheet-head` with both buttons at TR |
| setup sheet | «‹ Partidos» | «Preparar partido» | «Empezar partido ▶» (`.btn.go`) | the TR pair |
| «Hoja» | «‹ Volver al partido»; «‹ <player> · <rival>» (the parent's title) when opened from a player's match; «‹ Descanso» / «‹ Final» when opened from a summary | «Triana 6–5 Rival»; tabs on their own row under the bar, one line | – | the red TR «Volver» / «‹ Ficha» |
| Half-time | footer leading: «‹ Volver al partido» | (unchanged head) | «Ver Hoja», «▶ 2ª parte» (`.btn.go`, last) | «Cerrar»; the order is reversed |
| Final | footer leading: «‹ Volver al partido» | (unchanged head) | «Ver Hoja» | «Cerrar» |
| Live screen | **unchanged** («‹ Partidos» BL) | – | – | – |

Behaviour that changes besides placement:
- **«Ver Hoja» from half-time or the final:** the Hoja's «‹ Volver al partido» returns to that summary, not to the
  bare live screen. The coach came from the summary; to reach the live screen he takes the summary's own «‹ Volver
  al partido». Implementation: remember the opener in `ui.sheetReturn = { summary: 'halftime' | 'final' }` and
  label the button «‹ Descanso» / «‹ Final» in that case.
- **Escape:**
  - closes the half-time and final cards (`hideFinal`), like their leading control;
  - on management screens, it clicks the leading control of the page bar;
  - a «Cancelar» armed by unsaved changes still needs its second tap, so Escape cannot discard changes silently.
- **System back** (Android gesture, browser back):
  - Every change of `home.view`, and every opening of the setup sheet, the Hoja or a summary, pushes one history
    entry.
  - `popstate` runs the visible leading control.
  - On the live screen with nothing open over it, `popstate` pushes the entry again and shows the hint.
  - At the root (the profile), back is left to the browser.

## 6. What must not change

- The live match screen: layout, the strip and its order, «‹ Partidos» at the bottom-left in its black style,
  «Finalizar» and its arming, popups and their «✕ / Cancelar / ‹ Pérdida».
- Inline editors (the round's «Fecha», the player's «Editar ficha» form, notes in Asistencia) and the armed
  destructive buttons on cards.
- The 44 px minimum target (`--target`) and both themes.

**Coach decisions (not decided here):**
1. **The live screen's exit.** It is the one exit not at the top-left. The model keeps it exactly as it is:
   «‹ Partidos», bottom-left, black. It is on the leading edge, it is where the coach looks for it, and the layout
   is frozen. The recommendation is **no change**. Options for the coach:
   - (a) keep it as it is (recommended);
   - (b) same place and style, label «‹ Salir del partido», if «Partidos» reads as «the list» too weakly mid-match.
   Moving it to the top-left would change the scoreboard row, so it is not offered.
2. **System back on the live screen.** Proposed: absorb it and show the hint. Alternative: ignore it silently.

## 7. Acceptance checks

Automated (in `tests/inject.js`, run at the suite's window size and, where a layout is involved, by the screenshot
matrix at 1280×800 and 1024×640):
1. `nav: every management view has one leading control`: for each of `team`, `matches`, `stats`, `player`,
   `player-match`, `team-edit`, `attendance`, `rating-tune`, `squad`, `template`, and `team-new` with teams:
   - `#home` holds exactly one `[data-nav-leading]`;
   - it is the first focusable element of `.page-bar`;
   - its left edge is within 1 px of the page bar's content box;
   - no other element in `#home` has text starting with «‹».
2. `nav: profile and first-run screens have no leading control`: `profile`, and `team-new` with no teams, have none.
3. `nav: back labels name the parent`: `team`, `matches` and `stats` show «‹ Mis equipos»; `player`, `team-edit`
   and `attendance` show «‹ Equipo»; `player-match` shows `‹ ${player.name}`. Clicking each lands on that parent's
   `home.view`.
4. `nav: edit tasks lead with Cancelar and end with the primary`: in `squad`, `template`, `rating-tune` and
   `team-new`, the leading control's text is «Cancelar». The page bar's last button is the only `.primary` or `.go`
   button in it.
5. `nav: one primary per page bar`: no `.page-bar` holds more than one `.btn.primary, .btn.go`. Row 1 (`.app-bar`)
   holds none.
6. `nav: titles present`: every sub-view and edit task has a non-empty `.page-bar h2`.
7. `nav: page bar stays in view`: on `player` scrolled to the bottom, `[data-nav-leading]` is inside the viewport.
   The top bar is at most 128 px tall at 1024×640.
8. `nav: match pages and cards lead with the exit`:
   - in the setup sheet and the Hoja, `#sheet` holds exactly one `[data-nav-leading]`, and it is the first
     focusable element of `#sheet .page-bar`, at the top-left;
   - in half-time and the final, the `.final-actions` footer's first button is `[data-nav-leading]` and its last
     button is the primary, if there is one («▶ 2ª parte»);
   - at 1024×640 the Hoja tabs sit on one line (every tab button has the same `offsetTop`).
9. `nav: hoja back names its destination`: «‹ Volver al partido» from the live screen; «‹ Jenny · Atlético Bormujos»
   from a player's match (returns to `player-match`; not «‹ Jenny», which on `player-match` itself means the card); «‹ Descanso» / «‹ Final» from a summary (returns to that summary).
10. `nav: no bare Volver or Cerrar`: no visible button in `#home`, `#sheet` or `#final` has the text «Volver» or
    «Cerrar».
11. `nav: Escape runs the leading control`: on `attendance` it lands on `team`; on the final it hides `#final`; on
    `rating-tune` with changes, the first Escape only arms.
12. `nav: system back`:
    - after `showPlayer` then `history.back()`, the view is `team`;
    - on the live screen, a `popstate` keeps `currentMatchId` and shows the hint.
13. `live strip unchanged`: the existing live-screen tests pass untouched, and `#btn-home` keeps the text
    «‹ Partidos» and the class `back`.

Screenshot checks (`python3 tools/build_site.py && python3 tools/screenshots.py --matrix --out $TMPDIR/nav <scenes>`
with `team player player-match matches stats profile attendance tuning team-edit sheet-summary sheet-player
halftime final`, all sizes and themes; the probe must pass):
- One «‹» per image, always at the far left: top bar for the `#home` and `#sheet` scenes, card footer for the
  `#final` scenes.
- No wrap of the page bar at 1024×640 (title truncates with an ellipsis instead).
- The README live scenes (`defence`, `attack-picker`, `dark`) are pixel-identical to `main` apart from the clock.
- Add matrix scenes `squad`, `template`, `setup` and `sheet-from-player` to `MATRIX_SCENES`. They are the scenes this
  audit had to add by hand.
