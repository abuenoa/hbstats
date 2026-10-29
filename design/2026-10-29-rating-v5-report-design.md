# Rating v5 «goles aportados» and the dashboard match report

Date: 2026-10-29. Status: agreed with the coach over a prototype (versions v2–v11 of the Triana–BM Gades report).

## Why

The 0–10 rating was rejected after a real match: a red card plus 0/3 shooting still rated 5.1. Scorers also rated
well in heavy defeats, and defence without logged actions earned nothing. The PDF match report was mostly tables.
The coach asked for:

- KPIs;
- charts of the score;
- the 5' partials;
- the first half against the second;
- both teams' shots;
- the full table at the end.

## Rating v5

The rating comes from a review of rating systems in other sports and a debate between three experts: rules, game
situations and statistics. The sources include Dean Oliver's stops and BPM's team adjustment from basketball, xG,
VAEP and fantasy points from football, goals above replacement from hockey, and the HBL HPI and EHF expected saves
from handball.

- **One currency.** Values are in goals relative to an average possession (`possession` 0.43). They are shown as
  points: 1 goal = 3. The scale is open and can go clearly negative.
- **Every possession is a ledger worth `outcome − baseline`, split once.**
  - Owned events come first: the shot (goal − pre-shot xG of the zone, plus half the chance it created), the
    turnover (−b), the recovery (+b), the 7 m committed, provoked or 1x1 beaten (one knob), the block and minor
    faults.
  - The rest is shared by the field players on court (/n). It is shrunk toward the team mean (k = 15 possessions)
    and renormalised to the team total.
- **Field defence and the keeper are split.** The field answers for a rival shot reaching the keeper (b − pOn). The
  keeper answers for what happens next: goals saved above expected (pOn − goal), weighted 65%.
- **Numerical state.** A lineup with fewer than 6 field players, or a rival 2', changes the baselines. This catches
  2' that were never logged. A 2' costs the baseline shift over the possessions played short. A red card costs
  that, plus its conduct (direct / 3rd 2' / last 30 s with a 7 m), plus the rest of the match without the player.
- **Context.**
  - From 50' with a margin of ±2, every owned action is worth ×1.5; from 55' with ±1, ×2. This works both ways and
    shows as «Momento decisivo».
  - A second-half blowout (6+) weighs ×0.75.
  - A small result line is shared by possessions played.
  - A comeback factor was tried and rejected by the coach.
- **S/C** means fewer than 5 possessions on court and no owned event.
- **Priors are league values, never the rated match.** A keeper saving 40% of on-target 6 m shots is average; this
  was the coach's call. Every weight the coach can move is a knob of the tuning view, in points or as a share or a
  factor.
- **Calibration.** The keeper weight (65%) was set so that the Triana–Gades order matches the coach's MVP view:
  Diego, then Verdugo, then Jaime and Miguel close. Revisit it after 2–3 more matches.

## Match report

The report is a 5-page A4 dashboard: KPIs at half-time and full time, the running score, the goal difference, the
5' partials, a half-by-half table (6 m / 9 m / 7 m), head to head, a shooting radar, two goal drawings per team
(goals / not in), keepers, key moments, the v5 table with its breakdown, and the full statistics.

- It is built as HTML from the app's own figures and laid out in a hidden iframe, so no app CSS reaches it.
- Each page is rasterised with html2canvas 1.4.1 (cdnjs, precached by the service worker) into a JPEG page of a
  jsPDF A4 document, at scale 2 and about 0.4 MB a page.
- Colours: our brand and a fixed rival blue (#2f5d9e), checked for colour-blind separation. Map and band colours
  are read from the light theme tokens.
- The player PDFs (jsPDF tables) are unchanged.

## Known limits

- The report is an image PDF: its text cannot be selected or searched.
- The final screen builds the report as it opens, so a tablet may be busy for a few seconds there.
- The +/− column still counts defence-only specialists badly; v5 does not use it.
- Wanted logging, still to come: rival turnovers, offensive fouls drawn, who drew a rival 2', and subtypes for the
  7 m and the red card.
