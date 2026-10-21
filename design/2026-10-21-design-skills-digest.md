# Design skills digest for HBStats (tablet, vanilla JS/CSS, light+dark)

Source tags: [A]=dickwu/apple-design-skill  [U]=nextlevelbuilder/ui-ux-pro-max-skill  [J]=jakubkrehel/skills
Repos were cloned and read as data only; nothing from them was executed. "Judgment" = my adaptation, not a repo rule.

## 1. Repos
- [A] apple-design-skill. License: README has an "Origin and license" section (no LICENSE file at root; HIG text is Apple's, scraped by scripts/pull-hig.mjs).
  One SKILL.md = HIG-based reviewer (5 lenses: accessibility, platform, visual craft, interaction, writing) + 123 HIG pages in references/hig/*.md,
  hig-lookup.md, cross-platform.md, code-audit.md, liquid-glass.md. Mostly a review process; the usable values are in typography/color/dark-mode/motion/charting pages.
- [U] ui-ux-pro-max-skill. MIT (c) Next Level Builder. Skill lives in .claude/skills/ui-ux-pro-max (SKILL.md + Python search script over CSV data:
  styles, colors, typography, charts, ux-guidelines (119), motion, products, 22 stack files) plus references/quick-reference.md and pro-rules.md,
  and sibling skills design-system (token architecture), ui-styling, brand, banner-design, slides. Rest of repo is a CLI, gallery (Next.js), demo pages. Only data/references are useful; stack/GSAP/React parts are not.
- [J] jakubkrehel/skills. MIT (c) Jakub Krehel. 14 skills under skills/: better-ui, better-layout, better-typography, better-colors, better-accessibility,
  better-writing, better-interface/interface-review (orchestrators), break, variant, state-machine, explain-interface, build-design, technical-drawing.
  Each has SKILL.md + reference md files with exact values and a "Before you finish" detection table. By far the most precise source; the 5 "better-*" design skills are the relevant ones.

## 2. Actionable rules

### Typography
- System font stack with no download [J choosing-fonts, A typography]: `font-family: system-ui, sans-serif` (J's recommended native route). Judgment: prefix with `-apple-system, "Segoe UI", Roboto` is optional; `system-ui` covers iPadOS/Android/Windows. Monospace for IDs only; numeric columns use tabular-nums, not mono [J].
- Role scale, 1rem base [J spacing-and-sizing]: Display 2.25rem/1.1/600; Title 1.5rem/1.2/600; Heading 1.125rem/1.3/600; Body 1rem/1.5/400; Caption 0.8125rem/1.4/400. Emphasis = one weight step (400->500), not a size jump.
- Dense-UI floors [J]: inputs/menus 14px, captions 13px, rarely under 12px; body weight >=400 below 18px; weights 100-300 only >=28px. [A] iOS default 17pt, min 11pt; avoid Ultralight/Thin/Light for small text.
- Apple iOS/iPadOS "Large" text styles (size/leading pt) [A typography.md]: LargeTitle 34/41, T1 28/34, T2 22/28, T3 20/25, Headline 17/22 semibold, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption1 12/16, Caption2 11/13. Good model for a 1280x800 scale (e.g. KPI 28-34, card title 17-20, labels 13-15).
- Line-height unitless: display 1.1, headings 1.2-1.3, body 1.5-1.6; anything wrapping to 3+ lines >=1.4 [J]. Tracking: headings >=24px -0.01 to -0.02em; uppercase labels <=14px +0.05em; body 0; use em [J].
- `font-variant-numeric: tabular-nums` on timers, scores, counters, rating badges, numeric table columns [J]. Add `slashed-zero` only for IDs.
- `text-wrap: balance` on headings/short text, `pretty` on paragraphs; `overflow-wrap: break-word` for long names; `white-space: nowrap` for badges/labels [J]. Never `text-align: justify` in UI.
- Typographic characters: ellipsis, en dash for ranges (e.g. 3-5 goals, scores "24-21" use en dash), curly quotes [J].
- Root once: `-webkit-font-smoothing: antialiased` [J]. Font sizes in rem, letter-spacing in em [J].
- Few typefaces (<=3), hierarchy by weight/size/colour not by more fonts [A,J]. [U] pairing "Sports/Fitness" = Barlow Condensed + Barlow (needs a download, so only a reference; with system fonts, fake the condensed feel with heavy weight + tight tracking on the poster header).
- Canvas MVP image: canvas does not inherit CSS; set `ctx.font` with the same stack and `ctx.fontKerning`/tabular digits manually; wait for `document.fonts.ready`. Judgment.

### Spacing, layout
- Scale (4px base) [U design-system primitive-tokens]: 2,4,6,8,10,12,14,16,20,24,28,32,36,40,48,56,64,80,96. Rhythm rule: 4/8 grid; section tiers like 16/24/32/48 [U pro-rules].
- Gap between groups >= 2x gap inside a group (8 inside -> 16+ between) [J]. Group by space first, background second, divider lines last [J].
- Clearance: adjacent bordered/filled controls 12px; glyphs of borderless text/icon buttons 24px; unrelated groups 24px+ [J]. Touch gaps >=8px [U]. Judgment: on the live screen with colour-coded action buttons, keep >=12px gaps to avoid stylus mis-taps.
- One primary action per view; secondary behind a menu when >3 [J]. Fill colour exactly one action per view (colour on background, not label) [J]. [A] one or two prominent buttons per view. Tension: live screen has 5 colour-coded actions - they encode category, which J allows ("distinct states or categories").
- Order by importance: most important top/leading; identifying content leads, metadata/actions trail [A,J].
- Content bleeds, controls float: poster header/media full-bleed, text and controls inside margins [J]. Cap long text at 60-75ch [J,U].
- Fixed-height boxes holding text -> `min-height`; `minmax(0,1fr)` on grid tracks and `min-width:0` on flex children holding long names/tables [J]. Use `100dvh` not `100vh`; modal `max-height:100dvh` with scrolling body, action row outside scroll [J].
- Breakpoints from content, not device presets; prefer `@container` for components (cards, squad grid, KPI tiles) [J]. Layout follows available space, same functions at every size [A]. Test both 1280x800 and 1024x640 plus landscape/portrait [U].
- Hint hidden content: let next card peek 16-32px; collapsed sections get chevron/"Show 12 more" naming content [J]. Sticky headers: `scroll-padding-block-start` = header height [J].
- Left- and right-handed: do not put controls where the hand covers them; allow repositioning [A apple-pencil].

### Radii and elevation
- Concentric rule [J]: outer radius = inner radius + padding (+ border). Skip beyond 24px padding. Example 20 = 12 + 8. Applies to KPI tile containing a badge, squad card containing a photo.
- Radius scale [U primitive-tokens]: 2,4,6,8,12,16,24,full(9999). Judgment: pick 8 (controls), 12 (tiles), 16 (cards), 24 (poster/sheets), full (badges/avatars).
- Shadows are for elevation, borders for structure [J]. Light-mode ring+lift, 3 layers (exact):
  `--shadow-border: 0 0 0 1px oklch(0 0 0/.06), 0 1px 2px -1px oklch(0 0 0/.06), 0 2px 4px 0 oklch(0 0 0/.04)`; hover `.08/.08/.06`.
  Dark mode: depth shadows vanish, use single ring `0 0 0 1px oklch(1 0 0/.08)`; hover `.13` [J]. Keep `border:1px solid transparent` under ring (forced-colors) [J].
  oklch() needs a hex fallback for older tablet browsers (judgment; J declares sRGB first for wide-gamut values).
- Tailwind-style elevation set [U]: sm `0 1px 2px 0 rgb(0 0 0/.05)`, md `0 4px 6px -1px rgb(0 0 0/.1)`, lg `0 10px 15px -3px rgb(0 0 0/.1)`. Use one consistent elevation scale; no random values [U elevation-consistent].
- Content images (player photos): 1px outline, offset -1px, pure `oklch(0 0 0/.1)` light / `oklch(1 0 0/.1)` dark; never tinted/accent [J]. Use `outline` not `border` so size is unchanged. Skip for transparent cut-outs.
- Dark mode: "base" vs "elevated" backgrounds - higher layers slightly lighter, not shadowed [A dark-mode]. Soften white-background images in dark mode [A].
- Blur/glass only on floating control layer (toolbars), never in content cards [A]. Skip glass for the data screens: low-contrast risk and heavy on tablets [U lists Glassmorphism as poor for data-heavy/critical a11y].

### Colour tokens, light/dark, contrast
- Structure [J palette-structure, token-naming; U design-system]: primitives by hue (`--blue-600`) never used in components; semantic tokens by role (`--color-text-secondary`, `--color-accent-solid`, `--color-bg-surface`) are the only thing components reference; optional component tokens (`--button-bg`). Rename brand token `accent` (not `primary`) to avoid `text-primary` clash [J].
- Ramps: 1 neutral + 1 accent + only status ramps actually rendered (danger/warning/success/info). Neutral gets most steps. Pure gray default; tint chroma 0.005-0.02 toward accent is optional; hold one temperature across the ramp [J].
- Step roles (Radix 12) [J]: 1 page bg, 2 subtle bg, 3 component bg, 4 hover, 5 active/selected, 6 subtle border, 7 border/focus ring, 8 hover border, 9 solid fill, 10 solid hover, 11 low-contrast text, 12 high-contrast text. Solid fill sits at Tailwind 600 because white on most 500 fails 4.5:1.
- Dark = separate hand-tuned ramp, not reversed light; lower accent chroma and remeasure [J]. Desaturated/lighter tonal variants, not inversion [U]. One switching mechanism only (media query OR `[data-theme]`, not both) [J].
- Status hue at least 15deg OKLCH from accent; destructive gets distinct treatment if brand is red [J].
- Contrast [J,A,U agree]: text 4.5:1; large text (>=24px or >=18.67px bold) 3:1; UI boundaries/states/meaningful graphics 3:1; data bars/lines vs bg >=3:1, data labels >=4.5:1 [U]. Check dark independently. Measure on the surface actually rendered (card, not page); translucent surfaces vs lightest/darkest content; text on images needs scrim or worst-region check. White text on 500-level fills usually fails -> use 600.
- To fix a failing pair change lightness, keep hue [J]. Mid-lightness backgrounds (L~0.75) cap even black text at ~Lc 60, so change the background [J].
- One colour, one meaning (hues within 15deg count as same) [A,J]. Never colour alone: pair with icon/label/shape [A,J,U]. Colour-blind: avoid red/green-only pairs [U].
- Disabled/placeholder are exempt but keep >= Lc 30 [J]. `prefers-contrast: more`: separate overrides per appearance, widen gap by >=0.15 OKLCH L [J].
- Gradients: `linear-gradient(in oklab, ...)`; use `in oklch` if mid goes grey; keep text off gradients [J]. Avoid heavy gradients behind data [U trend-emphasis].
- Suppress transitions during theme switch: inject `*{transition:none!important}`, force reflow (`document.body.offsetHeight`), remove after 2 rAFs [J animations.md]. Relevant to the light/dark toggle.
- Sports palette cue [U colors.csv "Sports Team/Club"]: team red #DC2626 on #FFF, gold accent; "Fitness": #F97316 on #0F172A with #22C55E success. Use team colours as accent, status colours stay separate.

### Touch targets and input
- Targets [A,J,U]: 44x44 default on touch, 28x28 absolute minimum (A, mobile); WCAG 2.5.8 AA 24x24; Material 48. Visible element may be smaller; extend hit area via `::after` 44x44 centred, on wrapper/button not `<input>`; shrink extension where it would collide [J]. Judgment: for stylus+glove-less coach use, 48px for live-screen actions.
- Pressed feedback in 80-150ms [U], visible within 100ms [U]. Pressed state must not shift layout [U]; press = `scale: .96` over 150ms ease-out, never on `:disabled` [J]. `touch-action: manipulation` kills tap delay [U]; `touch-action:none` only on custom drawing/drag surface [J] (court heat-map / shot placement).
- Hover only under `@media (hover:hover)`; set `-webkit-tap-highlight-color: transparent` where custom pressed state exists [J]. Stylus: controls must respond to Pencil like a finger; never trigger actions on hover; hover is for previews only, near-middle values [A apple-pencil].
- Decorative overlays (glows, scrims, pseudo-elements) get `pointer-events:none` [J]. Every drag needs a single-pointer alternative [J,U]. `overscroll-behavior: contain` on modals/drawers/sheets [J].
- Inputs: visible `<label>`, 16px text on iOS to avoid zoom, right `inputmode`; errors inline near field with `aria-invalid`; do not disable submit until valid [J,U]. Never block paste.
- Focus: style `:focus-visible`, 2px ring with 3:1 contrast, never `outline:none` without replacement; focused element not hidden under sticky bar [J,U].

### Motion
- Easing [J exact]: `cubic-bezier(0.2, 0, 0, 1)` for icon cross-fades (not 0.4,0,0.2,1); `ease-out` for press/enter/exit. [U] decelerate on arrival, accelerate on leave, linear only for constant-rate/rotation.
- Durations [J,U,A]: press 150ms; hover colour <=100-150ms; state transitions 150-300ms; popover/sheet enter 300ms; exit ~60-70% of enter (J: 150ms vs 300ms); stagger entrance 100ms per chunk [J] (30-50ms per list item [U]); skeleton loop 800-1600ms [U motion.csv].
- Enter recipe [J]: opacity + 4px blur + translateY 12px, 300ms ease-out; exit: opacity + 4px blur + translateY -12px, 150ms. Icon swap: scale .25->1, opacity 0->1, blur 4px->0, 300ms.
- High-frequency interactions (tab switches, row taps, live-match button taps) get no animation or <=150ms on opacity/background only [J,A]. Expressive motion only on rare moments: first load, success, empty state, MVP reveal.
- Use CSS transitions (retargetable) for state, keyframes only for one-shot sequences [J]. Transition named properties, never `all`; animate transform/opacity, not width/height/top/left [J,U]. `will-change` only after seeing stutter [J].
- Reduced motion [J motion-and-zoom, animations]: base = opacity fade only; add translate/scale/blur inside `@media (prefers-reduced-motion: no-preference)`. Disable parallax, autoplay, large movement; keep spinners, instant colour changes, button press feedback. Chart entrance animation must respect it [U].
- Never block input during animation; animations interruptible/cancellable; do not depend on `transitionend` for state correctness [A,U].
- Toasts: persist if carrying action/error; min 5s and pause on hover/focus [J]. Auto-refreshing live data needs a pause control if it moves >5s [J].
- Opacity of fading elements should not linger below 0.2 [U].

### Data visualization and dashboards
- Chart choice [U charts.csv]: trend=line (4+ points; fewer -> stat card; max 6 series); category compare=bar sorted descending (<=15 cats); part-to-whole=pie/donut only <=5 slices, label with %; multi-variable=radar (single dataset 20% fill, border full opacity; multiple 30% fill); heatmap=cool->hot gradient with numeric legend, divergent scale for +/-; target vs actual=bullet chart (bands #FFCDD2/#FFF9C4/#C8E6C9, bar #1976D2, target 3px black marker); waterfall for cumulative change; >6 series or >15 categories -> table.
- Chart a11y [U]: direct labels, patterns/dash styles in addition to hue, text summary / aria-label with key insight, table alternative, tooltips reachable by keyboard/tap with exact values, interactive points >=44px hit area, subtle gridlines (gray-200 level), axis ticks not cramped, units on axes, empty and error states with retry, locale number formatting.
- [A charting-data] Keep a chart simple, details on demand; add title/subtitle/annotation stating the takeaway; same chart type, colours, layout for charts on the same dataset; consistency across similar charts; surface macro totals/averages as well as detail.
- Lists/tables [A]: short succinct row text; descriptive column headings (noun phrases, no end punctuation); sortable columns with `aria-sort` and re-click reverses [A,U]; alternating row colours in wide multi-column tables [A]; selection feedback on rows. Virtualize lists >50 items [U] (not needed for squad of ~15).
- KPI/stat tile: for fewer than 4 data points use a stat card not a chart [U]. Tabular nums + unit label + delta with icon (not colour only). Judgment: tile = label (caption) / value (Title-Display) / delta (caption with arrow).
- Cards/lists patterns [J,A]: image leading, then label, then trailing metadata/action; truncated text needs an expand path (not hover-only `title`); all card chrome must not remove essential info (names, scores); give status badges static markup, interactive chips real buttons with `aria-pressed` [U ux 114,117].
- Limit information density per chart; split rather than overload [U data-density]. Trend emphasis over decoration, no heavy shadows behind data [U].

### Apple HIG-style principles to apply
- Eight principles [A design-principles]: Purpose, Agency (explore/skip/recover; undo), Responsibility, Familiarity, Flexibility, Simplicity (every element earns its place), Craft, Delight (not decoration).
- Branding defers to content; brand colour reserved for primary action and status; boldness spent in one place (one signature element, e.g. the poster header/MVP image), everything else quiet [A].
- Feedback in the interface not alerts; destructive actions get Cancel + undo; confirm irreversible (finish match, delete event) [A]. Modals have an obvious exit and one short task. Action names stay consistent through a flow (Finalizar -> Finalizado) [A].
- Numbers, not adjectives in reviews; keep icon stroke matched to text weight (1.5px at 400 -> 2.5px at 700), one icon family, outline default and filled for active state, `currentColor` [J,A,U]. No emoji as structural icons [U].
- Progressive disclosure; same functions at all sizes; keep primary elements near top [A].

## 3. Sports / rating badges / calendars (what the repos actually offer)
- Very little. No repo contains a sports-dashboard, rating-badge or calendar pattern. Closest items:
  - [U products.csv] "Sports Team/Club": style Vibrant & Block-based + Motion-Driven, pattern "Hero-Centric + Feature-Rich", must-haves "Schedule. Roster. News..." and "Performance Analytics"; palette "team colours + energetic accents". [U typography.csv] "Sports/Fitness" pairing Barlow Condensed/Barlow.
  - [U colors.csv] Sports Team/Club palette (red #DC2626, light bg #FEF2F2, text #7F1D1D); Fitness/Gym (orange #F97316 on navy #0F172A + green #22C55E).
  - [U charts.csv] heat map, radar, bullet, waterfall, box plot entries; [U] chart colour specs: increase #4CAF50, decrease #F44336, anomaly marker #FF0000, forecast dashed #FF9500; candlestick bull #26A69A / bear #EF5350.
  - [A] `rating-indicators.md` exists (star rating control) and `ratings-and-reviews.md` (app store; irrelevant). Nothing about numeric 0-10 badges.
  - [U ux guidelines 114/117/118] badge vs chip semantics: badge = static state (`<span>`), chip/tag = value or action (`<button aria-pressed>`); announce changed counts as a full phrase via one live region.
  - No calendar/schedule guidance beyond generic lists/pickers pages [A pickers.md, lists-and-tables.md].
- Judgment for rating badges (not from repos): colour must not be the only cue -> always show the number (tabular-nums) inside; keep fills at 600-level so white numerals pass 4.5:1; ramp stops should differ in lightness (not hue only) for colour-blind users; the scale (red->orange->yellow->green->blue) needs a dark-mode variant checked separately [J,U apply].
- Judgment for calendar: lists with date as leading column, status as static badge, weekday abbreviations with nowrap + tabular-nums for dates; today highlighted by ring + label, not colour only.

## 4. Anti-patterns the repos call out
- Same radius on parent and padded child; borders used only to fake depth; `box-shadow` ring without transparent border [J].
- `transition: all`; keyframe animation toggled by state (cannot reverse); `scale` below 0.96; bounce != 0; animating width/height/top/left [J,U].
- `:hover` effects outside `@media (hover:hover)` (sticks after tap); hover-only information or hover-triggered actions [J,U,A].
- Motion as the only feedback; motion with no reduced-motion branch; animating high-frequency interactions; one duration copied to every transition [J,U,A].
- Tinted/accent image outlines; pure-hex literals in components; palette steps no role uses; separator token reused as text colour; reversed light ramp as dark theme; both `prefers-color-scheme` and `.dark` used together [J].
- Colour as sole carrier of meaning; red/green-only pairs; gray-on-gray; low-contrast placeholder text as label; white text on 500-level fills [J,U,A].
- Mixing filled and outline icons at one hierarchy level; mixed stroke widths; emoji as UI icons; arbitrary icon sizes (20/24/28 randomly) [U,J].
- Line-height in px; `leading-none` on wrapping text; weights 100-300 on small text; `justify`; `...`/`--` instead of typographic characters; `font-synthesis: none` globally; `user-select:none` on text containers [J].
- `100vh` on mobile panes; fixed-height text boxes; fixed px container widths; `100vw` (scrollbar overflow); critical action parked where zoom/scroll clips it [J,U].
- Truncating names/headings/actions just to equalise card height; hover-only `title` as the full-text path [J,U].
- Pie/donut with >5 slices or tiny differences; heavy gradients/shadows on data; chart with no legend/labels/empty state; 3D charts [U].
- Controls styled like static text; every action coloured so nothing is primary; packed borderless icon buttons at 4px [J].
- Glass/blur in the content layer; similar colours in control labels over colourful content; app-specific light/dark toggle in HIG context (judgment: HBStats has a theme setting; follow `prefers-color-scheme` as default) [A].
- Templated looks: warm cream + serif + terracotta; near-black + single acid accent; hairline broadsheet; big number over small label with gradient accent; 01/02/03 markers on non-sequences [A].
- Skipping staged-entrance via `initial={false}` wrongly; always `will-change: all` [J] (framework-specific; the CSS part applies).
- Pre-delivery checklist items worth adopting [U pro-rules]: test both themes independently; reduced motion; largest text size; no content hidden behind fixed bars; tap states in both themes; scrims measured against real background.
